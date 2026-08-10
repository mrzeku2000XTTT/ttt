import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Menu, X } from "lucide-react";
import { COLORS, ELEMENT_TYPES, createElement, createPage } from "./blueprintConstants";
import BlueprintCanvas from "./BlueprintCanvas";
import BlueprintSidebar from "./BlueprintSidebar";
import BlueprintToolbar from "./BlueprintToolbar";
import BlueprintRightPanel from "./BlueprintRightPanel";
import BlueprintAgent from "./BlueprintAgent";
import BlueprintHtmlImport from "./BlueprintHtmlImport";
import BlueprintLandingPreview from "./BlueprintLandingPreview";
import { PREMIUM_DESIGN_SPEC } from "./designSystem";
import { enhancePrompt } from "./promptEnhancer";
import { FileCode } from "lucide-react";

export default function BlueprintBuilder({ idea, concept }) {
  const [pages, setPages] = useState(() => {
    const page = createPage('Page 1');
    if (concept?.name) {
      page.elements.push(
        createElement('heading', ELEMENT_TYPES[0], { x: 20, y: 20, content: concept.name, width: 320, fontSize: 30, fontWeight: 700 }),
        createElement('text', ELEMENT_TYPES[1], { x: 20, y: 70, content: concept.one_liner || idea || '', width: 320, fontSize: 14, color: `${COLORS.CHARCOAL}aa` }),
      );
      if (concept.features) {
        page.elements.push(createElement('text', ELEMENT_TYPES[1], { x: 20, y: 130, content: concept.features.map(f => `• ${f}`).join('\n'), width: 320, fontSize: 13, color: `${COLORS.CHARCOAL}cc` }));
      }
    } else if (idea) {
      page.elements.push(createElement('heading', ELEMENT_TYPES[0], { x: 20, y: 20, content: idea.slice(0, 60), width: 320, fontSize: 26, fontWeight: 700 }));
    }
    return [page];
  });
  const [currentPageId, setCurrentPageId] = useState(pages[0].id);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [tool, setTool] = useState('select');
  const [previewMode, setPreviewMode] = useState(false);
  const [agentMode, setAgentMode] = useState(true);
  const [codeMode, setCodeMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [htmlImportOpen, setHtmlImportOpen] = useState(false);
  const [landingMode, setLandingMode] = useState(false);
  const [landingHtml, setLandingHtml] = useState('');
  const [landingLoading, setLandingLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);
  const [autoStarted, setAutoStarted] = useState(false);

  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];
  const elements = currentPage?.elements || [];
  const selected = elements.find(e => e.id === selectedId);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const updatePageElements = (pageId, updater) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, elements: updater(p.elements) } : p));
  };

  const handleAddElement = (type) => {
    const typeDef = ELEMENT_TYPES.find(t => t.type === type) || ELEMENT_TYPES[0];
    const el = createElement(type, typeDef);
    updatePageElements(currentPageId, els => [...els, el]);
    setSelectedId(el.id);
  };

  const handleImportHtml = (htmlCode, label) => {
    const typeDef = ELEMENT_TYPES.find(t => t.type === 'html');
    const el = createElement('html', typeDef, {
      content: htmlCode,
      width: 400,
      height: 250,
      label,
    });
    updatePageElements(currentPageId, els => [...els, el]);
    setSelectedId(el.id);
  };

  const handleUploadFile = async (file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const isVideo = file.type.startsWith('video/');
      const type = isVideo ? 'video' : 'image';
      const typeDef = ELEMENT_TYPES.find(t => t.type === type);
      const el = createElement(type, typeDef, { content: file_url, mediaType: isVideo ? 'video' : 'image', width: isVideo ? 320 : 300 });
      updatePageElements(currentPageId, els => [...els, el]);
      setSelectedId(el.id);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleUpdateElement = (id, updates) => {
    updatePageElements(currentPageId, els => els.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleDeleteElement = (id) => {
    updatePageElements(currentPageId, els => els.filter(el => el.id !== id));
    setSelectedId(null);
  };

  const handleAddPage = () => {
    const page = createPage(`Page ${pages.length + 1}`);
    setPages(prev => [...prev, page]);
    setCurrentPageId(page.id);
    setSelectedId(null);
  };

  const handleDeletePage = (pageId) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter(p => p.id !== pageId));
    if (currentPageId === pageId) {
      const remaining = pages.filter(p => p.id !== pageId);
      setCurrentPageId(remaining[0].id);
    }
  };

  const handleRenamePage = (pageId, name) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, name } : p));
  };

  const handleSelectPage = (pageId) => {
    setCurrentPageId(pageId);
    setSelectedId(null);
    setSidebarOpen(false);
  };

  // Build a prompt from the Explore concept so the agent starts working immediately
  const conceptToPrompt = (c) => {
    if (!c) return '';
    const parts = [];
    if (c.name) parts.push(`Product name: ${c.name}`);
    if (c.one_liner) parts.push(`Tagline: ${c.one_liner}`);
    if (c.problem) parts.push(`Problem: ${c.problem}`);
    if (c.solution) parts.push(`Solution: ${c.solution}`);
    if (c.features?.length) parts.push(`Key features:\n${c.features.map(f => `- ${f}`).join('\n')}`);
    if (c.why_kaspa) parts.push(`Why Kaspa: ${c.why_kaspa}`);
    if (c.kaspa_dev) parts.push(`Latest Kaspa dev: ${c.kaspa_dev}`);
    if (c.market_research) parts.push(`Market research: ${c.market_research}`);
    if (c.competitors?.length) parts.push(`Competitors: ${c.competitors.join(', ')}`);
    if (c.next_step) parts.push(`Next step: ${c.next_step}`);
    return `Build a premium, world-class landing page for this product concept:\n\n${parts.join('\n\n')}`;
  };

  // Auto-start the agent when a concept is available and nothing has been generated yet
  React.useEffect(() => {
    if (concept && !autoStarted && !landingHtml && !landingLoading) {
      setAutoStarted(true);
      handleAgentGenerate({ prompt: conceptToPrompt(concept) });
    }
  }, [concept, autoStarted, landingHtml, landingLoading]);

  const handleAgentGenerate = async ({ prompt, imageUrl, selectedContext: ctx }) => {
    setLandingLoading(true);
    setLandingMode(true);
    try {
      // SURGICAL EDIT — an element is selected: edit ONLY that element in the
      // existing landing HTML, leaving every other section byte-for-byte intact.
      if (ctx && landingHtml) {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `${PREMIUM_DESIGN_SPEC}

You are editing ONE element in an existing landing page. Edit ONLY that element; every other part of the page MUST stay byte-for-byte identical.

CURRENT LANDING PAGE HTML (the body content):
${landingHtml}

SELECTED ELEMENT — the only element you may change:
Tag: ${ctx.tag}
Current text: ${ctx.text || ''}
Current HTML:
${ctx.html || ''}

${imageUrl ? 'A reference image is attached — use it to guide the edit of the selected element.' : ''}
User's edit request: ${prompt}

Return the COMPLETE updated landing page HTML (inside <body> only; no <html>, <head>, <body>, or <script> tags) with ONLY the selected element changed to satisfy the request. Keep all other sections, classes, copy, and structure identical. Do not add or remove other elements. Return ONLY the HTML.`,
          file_urls: imageUrl ? [imageUrl] : undefined,
          model: 'gemini_3_flash',
        });
        const htmlContent = typeof res === 'string' ? res : (res.html || res.content || JSON.stringify(res));
        setLandingHtml(htmlContent);
        return;
      }

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${PREMIUM_DESIGN_SPEC}

You are an elite front-end engineer and motion-design specialist. Generate a complete, world-class premium landing page as a single HTML document using Tailwind CSS classes (loaded via CDN).

${enhancePrompt(prompt, { concept })}

${imageUrl ? 'Analyze the uploaded reference image and recreate its layout, sections, and visual style faithfully.' : 'Create a modern, visually stunning landing page.'}
${prompt ? `The user wants: ${prompt}` : 'Create a complete SaaS landing page.'}
${concept?.name ? `Product/brand context: ${concept.name}${concept.one_liner ? ` — ${concept.one_liner}` : ''}` : ''}

REQUIREMENTS:
1. Output ONLY the inner HTML (everything inside <body>). Do NOT include <html>, <head>, <body>, or <script> tags — those are provided by the host.
2. Use Tailwind CSS utility classes ONLY. No <style> tags.
3. Use Google Fonts classes: font-light, font-normal, font-medium, font-semibold, font-bold, font-extrabold.
4. Include these sections (skip any that don't fit):
   - Sticky/fixed navbar with logo text, nav links, and a CTA button
   - Hero section (full viewport): bold headline, subheadline, 2 CTA buttons, background gradient or image
   - Logos/social proof strip (trusted by...)
   - Features grid (3-4 cards with lucide-style SVG icons)
   - How it works (3 steps)
   - Testimonial / quote section
   - Pricing (2-3 tiers) if applicable
   - Final CTA section with gradient background
   - Footer with columns of links
5. Use real, compelling marketing copy — no lorem ipsum.
6. Modern aesthetics: generous spacing, rounded-xl/2xl corners, subtle shadows, hover transitions, gradient accents.
7. Inline SVG icons (lucide-style) directly in the HTML — do not reference external icon libraries.
8. For images, use https://images.unsplash.com/photo-XXXX URLs that actually exist (use well-known photo IDs).
9. Make it fully responsive: mobile-first, with sm:/md:/lg: breakpoints.
10. Add subtle hover effects with transition classes.

Return ONLY the HTML. No markdown, no backticks, no explanation.`,
        file_urls: imageUrl ? [imageUrl] : undefined,
        model: 'gemini_3_flash',
      });

      const htmlContent = typeof res === 'string' ? res : (res.html || res.content || JSON.stringify(res));
      setLandingHtml(htmlContent);
    } catch (err) {
      console.error('Landing generation failed:', err);
      setLandingHtml(`<div class="p-8 text-center text-red-500">Generation failed: ${err.message || 'unknown error'}</div>`);
    } finally {
      setLandingLoading(false);
    }
  };

  const codeOutput = React.useMemo(() => {
    const allHtml = pages.flatMap(p => p.elements).filter(e => e.type === 'html');
    const hasHtml = allHtml.length > 0;
    const json = JSON.stringify(pages, null, 2);
    if (!hasHtml) return json;
    const htmlExport = allHtml.map((el, i) => `<!-- ${el.label || `HTML Component ${i + 1}`} -->\n${el.content}`).join('\n\n');
    return `// === Saved Blueprint (JSON) ===\n${json}\n\n// === HTML Components ===\n${htmlExport}`;
  }, [pages]);

  return (
    <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100dvh - 5rem)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden absolute top-2 left-2 z-40 w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: '#fff', border: `1px solid ${COLORS.BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Sidebar — desktop: static, mobile: drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`${sidebarOpen ? 'fixed lg:static z-30 h-full' : 'hidden lg:flex'} `}>
        <BlueprintSidebar
          pages={pages}
          currentPageId={currentPageId}
          elements={elements}
          selectedId={selectedId}
          onSelectPage={handleSelectPage}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
          onRenamePage={handleRenamePage}
          onSelectElement={(id) => { setSelectedId(id); setSidebarOpen(false); }}
        />
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {agentMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full px-4 max-w-md">
            <BlueprintAgent onGenerate={handleAgentGenerate} loading={landingLoading} onClose={() => setAgentMode(false)} selectedContext={selectedContext} />
          </div>
        )}

        {codeMode ? (
          <div className="absolute inset-0 overflow-auto p-4" style={{ background: '#1e1e1e' }}>
            <pre className="text-[11px] text-green-400 font-mono whitespace-pre-wrap">{codeOutput}</pre>
          </div>
        ) : landingMode ? (
          <BlueprintLandingPreview
            html={landingHtml}
            onUpdateHtml={setLandingHtml}
            loading={landingLoading}
            onSelectContext={setSelectedContext}
            onClearContext={() => setSelectedContext(null)}
          />
        ) : (
          <BlueprintCanvas
            elements={elements}
            selectedId={selectedId}
            zoom={zoom}
            pan={pan}
            tool={tool}
            previewMode={previewMode}
            onSelectElement={setSelectedId}
            onUpdateElement={handleUpdateElement}
            onCanvasClick={() => setSelectedId(null)}
            onPanChange={setPan}
            onZoomChange={setZoom}
          />
        )}

        <BlueprintToolbar
          tool={tool}
          setTool={setTool}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          agentMode={agentMode}
          setAgentMode={setAgentMode}
          zoom={zoom}
          onZoomChange={setZoom}
          onAddElement={handleAddElement}
          onUploadFile={handleUploadFile}
          codeMode={codeMode}
          setCodeMode={setCodeMode}
          onImportHtml={() => setHtmlImportOpen(true)}
          landingMode={landingMode}
          setLandingMode={setLandingMode}
        />
      </div>

      {htmlImportOpen && (
        <BlueprintHtmlImport
          onImport={handleImportHtml}
          onClose={() => setHtmlImportOpen(false)}
        />
      )}

      {/* Right panel — desktop: static, mobile: bottom sheet */}
      {selected && !previewMode && (
        <BlueprintRightPanel
          selected={selected}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onClose={() => setSelectedId(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}