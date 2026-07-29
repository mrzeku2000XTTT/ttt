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
  const [agentMode, setAgentMode] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [htmlImportOpen, setHtmlImportOpen] = useState(false);

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

  const handleAgentGenerate = async ({ prompt, imageUrl }) => {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert UI/UX designer. ${imageUrl ? 'Analyze the uploaded image and recreate its layout.' : 'Create a modern website.'} ${prompt ? `The user wants: ${prompt}` : 'Create a complete landing page.'}

Generate a JSON object with "pages" array. Each page: { "name": string, "elements": array }.
Each element: { "type": "heading"|"text"|"button"|"box"|"image", "x": number, "y": number, "content": string, "width": number, "fontSize": number, "fontWeight": number, "color": "#hex", "bg": "#hex or transparent" }.

Guidelines:
- Use 1-3 pages (e.g., "Landing", "About", "Pricing")
- x: 0-800, y: 0-1200 range
- heading: fontSize 24-36, fontWeight 700, color "#1f2937"
- text: fontSize 13-16, fontWeight 400, color "#4b5563"
- button: bg "#4F46E5", color "#ffffff", fontWeight 600, width 140-200
- box: bg "#f3f4f6"
- image: content = full URL (use unsplash.com URLs)
- Use realistic, professional content${concept?.name ? ` related to: ${concept.name}` : ''}

Return ONLY the JSON object.`,
      response_json_schema: {
        type: "object",
        properties: {
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                elements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      x: { type: "number" },
                      y: { type: "number" },
                      content: { type: "string" },
                      width: { type: "number" },
                      fontSize: { type: "number" },
                      fontWeight: { type: "number" },
                      color: { type: "string" },
                      bg: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      file_urls: imageUrl ? [imageUrl] : undefined,
      model: 'claude_sonnet_4_6',
    });

    const generated = res.pages || [];
    if (generated.length > 0) {
      const newPages = generated.map((p, i) => ({
        id: `page-${Date.now()}-${i}`,
        name: p.name || `Page ${i + 1}`,
        elements: (p.elements || []).map((el, j) => ({
          id: `el-${Date.now()}-${i}-${j}`,
          type: el.type || 'text',
          x: el.x || 20,
          y: el.y || 20 + j * 40,
          content: el.content || '',
          width: el.width || 280,
          fontSize: el.fontSize || 14,
          fontWeight: el.fontWeight || 400,
          color: el.color || COLORS.CHARCOAL,
          bg: el.bg || 'transparent',
          mediaType: el.type === 'video' ? 'video' : 'image',
        })),
      }));
      setPages(newPages);
      setCurrentPageId(newPages[0].id);
      setSelectedId(null);
      setPan({ x: 20, y: 20 });
      setZoom(0.5);
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
      <div className="flex-1 relative overflow-hidden">
        {agentMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full px-4 max-w-md">
            <BlueprintAgent onGenerate={handleAgentGenerate} />
          </div>
        )}

        {codeMode ? (
          <div className="absolute inset-0 overflow-auto p-4" style={{ background: '#1e1e1e' }}>
            <pre className="text-[11px] text-green-400 font-mono whitespace-pre-wrap">{codeOutput}</pre>
          </div>
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