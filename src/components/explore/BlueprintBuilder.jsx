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
import {
  listProjects, saveProject, deleteProject, getActiveProjectId,
  setActiveProjectId, genProjectId, deriveProjectName,
} from "./blueprintProjects";

function buildInitialPages(concept, idea) {
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
}

export default function BlueprintBuilder({ idea, concept }) {
  // On mount, restore the most recent project from localStorage so sites survive refresh.
  const [restored] = useState(() => {
    if (typeof window === 'undefined') return null;
    const activeId = getActiveProjectId();
    const projects = listProjects();
    if (activeId) {
      const p = projects.find(pr => pr.id === activeId);
      if (p) return p;
    }
    return projects[0] || null;
  });

  const [projectId, setProjectId] = useState(() => restored?.id || genProjectId());
  const [projectName, setProjectName] = useState(() => restored?.name || deriveProjectName(concept, idea));
  const [pages, setPages] = useState(() => restored?.pages || buildInitialPages(concept, idea));
  const [currentPageId, setCurrentPageId] = useState(() => restored?.currentPageId || (restored?.pages && restored.pages[0]?.id) || pages[0].id);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [tool, setTool] = useState('select');
  const [previewMode, setPreviewMode] = useState(false);
  const [agentMode, setAgentMode] = useState(() => !restored?.landingHtml);
  const [codeMode, setCodeMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [htmlImportOpen, setHtmlImportOpen] = useState(false);
  const [landingMode, setLandingMode] = useState(() => !!restored?.landingMode);
  const [landingHtml, setLandingHtml] = useState(() => restored?.landingHtml || '');
  const [landingLoading, setLandingLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);
  const [autoStarted, setAutoStarted] = useState(() => !!restored?.landingHtml);
  const [projectsList, setProjectsList] = useState(() => listProjects());
  const [projectsOpen, setProjectsOpen] = useState(false);

  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];
  const elements = currentPage?.elements || [];
  const selected = elements.find(e => e.id === selectedId);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-save project to localStorage (debounced) so it survives refresh.
  const saveTimer = React.useRef(null);
  React.useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProject({
        id: projectId,
        name: projectName,
        pages,
        currentPageId,
        landingHtml,
        landingMode,
        concept,
        idea,
      });
      setActiveProjectId(projectId);
      setProjectsList(listProjects());
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [projectId, projectName, pages, currentPageId, landingHtml, landingMode, concept, idea]);

  const handleNewProject = () => {
    const id = genProjectId();
    setProjectId(id);
    setProjectName(deriveProjectName(concept, idea));
    const fresh = buildInitialPages(concept, idea);
    setPages(fresh);
    setCurrentPageId(fresh[0].id);
    setLandingHtml('');
    setLandingMode(false);
    setAutoStarted(false);
    setAgentMode(true);
    setSelectedId(null);
    setActiveProjectId(id);
    setProjectsOpen(false);
  };

  const handleOpenProject = (proj) => {
    setProjectId(proj.id);
    setProjectName(proj.name || 'Untitled site');
    setPages(proj.pages || buildInitialPages(proj.concept, proj.idea));
    const firstPage = (proj.pages || [])[0];
    setCurrentPageId(proj.currentPageId || (firstPage?.id) || (proj.pages || buildInitialPages(proj.concept, proj.idea))[0].id);
    setLandingHtml(proj.landingHtml || '');
    setLandingMode(!!proj.landingMode);
    setAutoStarted(!!proj.landingHtml);
    setAgentMode(!proj.landingHtml);
    setSelectedId(null);
    setActiveProjectId(proj.id);
    setProjectsOpen(false);
  };

  const handleDeleteProject = (id) => {
    deleteProject(id);
    setProjectsList(listProjects());
    if (id === projectId) {
      const remaining = listProjects();
      if (remaining.length) handleOpenProject(remaining[0]);
      else handleNewProject();
    }
  };

  const handleRenameProject = (name) => {
    setProjectName(name);
  };

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

  const handleAgentGenerate = async ({ prompt, imageUrl, selectedContext: ctx, addContextFromInternet }) => {
    setLandingLoading(true);
    setLandingMode(true);
    const useWeb = !!addContextFromInternet;
    try {
      // SURGICAL EDIT — an element is selected: edit ONLY that element in the
      // existing landing HTML, leaving every other section byte-for-byte intact.
      if (ctx && landingHtml) {
        // If the selected element is an image and the user wants a new image,
        // generate one with AI and inject it directly into that element's src.
        const wantsImage = /\b(image|img|picture|photo|logo|icon|graphic|illustration)\b/i.test(prompt);
        if (ctx.tag === 'IMG' && (imageUrl || wantsImage)) {
          const imgPrompt = imageUrl
            ? 'Recreate this uploaded image as a web-ready product visual: ' + prompt
            : 'Generate a high-quality image for this section. Context: ' + (ctx.text || prompt) + '. Style: premium, modern, on-brand.';
          try {
            const genRes = await base44.integrations.Core.GenerateImage({ prompt: imgPrompt });
            if (genRes?.url) {
              const escaped = ctx.html.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 120);
              const re = new RegExp(escaped, 'i');
              const updated = ctx.html.replace(/src="[^"]*"/i, 'src="' + genRes.url + '"').replace(/src='[^']*'/i, 'src="' + genRes.url + '"');
              setLandingHtml(landingHtml.replace(re, updated));
              return;
            }
          } catch (e) {
            console.error('Image gen for element failed:', e);
          }
        }

        const res = await base44.integrations.Core.InvokeLLM({
          prompt: PREMIUM_DESIGN_SPEC + '\n\n' +
            'You are an elite front-end engineer performing a SURGICAL edit on a landing page. Your job is to edit ONLY the selected element. Every other part of the page MUST stay byte-for-byte identical.\n\n' +
            'CURRENT LANDING PAGE HTML (the body content):\n' + landingHtml + '\n\n' +
            'SELECTED ELEMENT — the ONLY element you may change:\n' +
            'Tag: ' + ctx.tag + '\n' +
            (ctx.text ? 'Current text: "' + ctx.text + '"\n' : '') +
            (ctx.src ? 'Current image src: ' + ctx.src + '\n' : '') +
            'Current HTML:\n' + (ctx.html || '') + '\n\n' +
            (imageUrl ? 'A reference image is attached — use it to guide the edit of the selected element.\n' : '') +
            (useWeb ? 'Web search is enabled — research real data if the edit requires it.\n' : '') +
            'User edit request: ' + prompt + '\n\n' +
            'CRITICAL RULES:\n' +
            '1. Change ONLY the selected element. Do NOT touch any other element, section, class, or text.\n' +
            '2. If the user asks to change text, update ONLY the selected element text content.\n' +
            '3. If the user asks to change a color/style, update ONLY the selected element styles or classes.\n' +
            '4. If the user asks to replace an image, set the selected element src to a new Unsplash URL (https://images.unsplash.com/photo-XXXX) that matches the request.\n' +
            '5. Preserve the overall page structure, layout, and all other sections exactly as they are.\n\n' +
            'Return the COMPLETE updated landing page HTML (inside <body> only; no html, head, body, or script tags) with ONLY the selected element changed. Return ONLY the HTML.',
          file_urls: imageUrl ? [imageUrl] : undefined,
          model: 'gemini_3_flash',
          add_context_from_internet: useWeb,
        });
        const htmlContent = typeof res === 'string' ? res : (res.html || res.content || JSON.stringify(res));
        setLandingHtml(htmlContent);
        return;
      }

      // Full page generation — generate a hero image so the page has a real visual asset baked in.
      let generatedImageUrl = null;
      if (concept?.name) {
        try {
          const genRes = await base44.integrations.Core.GenerateImage({
            prompt: 'A premium, modern hero image for "' + concept.name + '": ' + (concept.one_liner || prompt) + '. Clean, professional, brand-ready.',
          });
          if (genRes?.url) generatedImageUrl = genRes.url;
        } catch (e) { /* non-fatal */ }
      }

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: PREMIUM_DESIGN_SPEC + '\n\n' +
          'You are an elite front-end engineer and motion-design specialist. Generate a complete, world-class premium landing page as a single HTML document using Tailwind CSS classes (loaded via CDN).\n\n' +
          enhancePrompt(prompt, { concept }) + '\n\n' +
          (imageUrl ? 'Analyze the uploaded reference image and recreate its layout, sections, and visual style faithfully.\n' : 'Create a modern, visually stunning landing page.\n') +
          (generatedImageUrl ? 'A hero image has been generated for this page — use this URL as the hero image src: ' + generatedImageUrl + '\n' : '') +
          (prompt ? 'The user wants: ' + prompt + '\n' : 'Create a complete SaaS landing page.\n') +
          (concept?.name ? 'Product/brand context: ' + concept.name + (concept.one_liner ? ' — ' + concept.one_liner : '') + '\n' : '') +
          (useWeb ? 'Web search is enabled — research real competitors, trends, and data to ground the copy and features in reality.\n' : '') +
          '\nREQUIREMENTS:\n' +
          '1. Output ONLY the inner HTML (everything inside <body>). No <html>, <head>, <body>, or <script> tags.\n' +
          '2. Use Tailwind CSS utility classes ONLY. No <style> tags.\n' +
          '3. Use Google Fonts classes: font-light, font-normal, font-medium, font-semibold, font-bold, font-extrabold.\n' +
          '4. Include these sections (skip any that do not fit): navbar with logo + nav links + CTA; hero (full viewport) with headline, subheadline, 2 CTA buttons, gradient/image background; logos/social proof strip; features grid (3-4 cards with inline SVG icons); how it works (3 steps); testimonial/quote; pricing (2-3 tiers) if applicable; final CTA with gradient; footer with link columns.\n' +
          '5. Use real, compelling marketing copy — no lorem ipsum.' + (useWeb ? ' Ground claims in real data from web search.' : '') + '\n' +
          '6. Modern aesthetics: generous spacing, rounded-xl/2xl corners, subtle shadows, hover transitions, gradient accents.\n' +
          '7. Inline SVG icons (lucide-style) directly in the HTML — do not reference external icon libraries.\n' +
          '8. For images, use https://images.unsplash.com/photo-XXXX URLs that actually exist (use well-known photo IDs)' + (generatedImageUrl ? ' or the generated hero image URL provided above' : '') + '.\n' +
          '9. Make it fully responsive: mobile-first, with sm:/md:/lg: breakpoints.\n' +
          '10. Add subtle hover effects with transition classes.\n\n' +
          'Return ONLY the HTML. No markdown, no backticks, no explanation.',
        file_urls: imageUrl ? [imageUrl] : undefined,
        model: 'gemini_3_flash',
        add_context_from_internet: useWeb,
      });

      const htmlContent = typeof res === 'string' ? res : (res.html || res.content || JSON.stringify(res));
      setLandingHtml(htmlContent);
    } catch (err) {
      console.error('Landing generation failed:', err);
      setLandingHtml('<div class="p-8 text-center text-red-500">Generation failed: ' + (err.message || 'unknown error') + '</div>');
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
          projectName={projectName}
          onRenameProject={handleRenameProject}
          projectsList={projectsList}
          currentProjectId={projectId}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleDeleteProject}
          onNewProject={handleNewProject}
          projectsOpen={projectsOpen}
          setProjectsOpen={setProjectsOpen}
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