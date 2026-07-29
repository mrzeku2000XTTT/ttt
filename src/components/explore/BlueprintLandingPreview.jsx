import React, { useState, useRef, useEffect } from "react";
import { Monitor, Smartphone, Code, Eye, Copy, Check, Download } from "lucide-react";
import { COLORS } from "./blueprintConstants";

export default function BlueprintLandingPreview({ html, onUpdateHtml, loading }) {
  const [device, setDevice] = useState('desktop');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);

  const fullHtml = React.useMemo(() => {
    if (!html) return '';
    if (html.includes('<html') || html.includes('<!DOCTYPE')) return html;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { -webkit-font-smoothing: antialiased; }
  body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }
</style>
</head>
<body>
${html}
</body>
</html>`;
  }, [html]);

  useEffect(() => {
    if (iframeRef.current && fullHtml) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();
      }
    }
  }, [fullHtml, device, showCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(html || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: COLORS.CANVAS_BG }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-[13px] font-medium" style={{ color: COLORS.TEXT_MED }}>Generating your landing page…</p>
          <p className="text-[11px]" style={{ color: COLORS.TEXT_LIGHT }}>Crafting sections, copy, and styling</p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: COLORS.CANVAS_BG }}>
        <p className="text-[13px] text-center" style={{ color: COLORS.TEXT_MED }}>
          Open the <span className="font-semibold" style={{ color: COLORS.BLUE }}>Ask to Edit</span> panel and describe the site you want to generate.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: COLORS.CANVAS_BG }}>
      {/* Device toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: '#fff', borderColor: COLORS.BORDER }}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDevice('desktop')}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${device === 'desktop' ? '' : 'hover:bg-gray-100'}`}
            style={device === 'desktop' ? { background: COLORS.BLUE, color: '#fff' } : { color: COLORS.TEXT_MED }}
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${device === 'mobile' ? '' : 'hover:bg-gray-100'}`}
            style={device === 'mobile' ? { background: COLORS.BLUE, color: '#fff' } : { color: COLORS.TEXT_MED }}
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[11px] font-medium transition-colors hover:bg-gray-100"
            style={{ color: showCode ? COLORS.BLUE : COLORS.TEXT_MED }}
            title="Edit code"
          >
            {showCode ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            {showCode ? 'Preview' : 'Code'}
          </button>
          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: copied ? '#16a34a' : COLORS.TEXT_MED }}
            title="Copy HTML"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: COLORS.TEXT_MED }}
            title="Download HTML"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content area */}
      {showCode ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <textarea
            value={html}
            onChange={e => onUpdateHtml(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-3 text-[11px] font-mono outline-none resize-none"
            style={{ background: '#1e1e1e', color: '#e0e0e0', lineHeight: 1.6 }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto flex justify-center p-4">
          <div
            className="bg-white rounded-lg overflow-hidden shadow-lg transition-all"
            style={{
              width: device === 'mobile' ? 390 : '100%',
              maxWidth: device === 'mobile' ? 390 : 1200,
              height: '100%',
              minHeight: 600,
            }}
          >
            <iframe
              ref={iframeRef}
              title="Landing Page Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}