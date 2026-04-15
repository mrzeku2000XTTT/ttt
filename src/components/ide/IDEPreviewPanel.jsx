import React, { useMemo } from "react";
import { Eye, ExternalLink } from "lucide-react";

export default function IDEPreviewPanel({ files }) {
  // Build a simple live preview from the generated page code
  const previewHtml = useMemo(() => {
    const pages = files.filter(f => f.type === "page");
    if (pages.length === 0) return null;

    const mainPage = pages[0];
    const code = mainPage.code || "";

    // Build a standalone HTML preview that renders the JSX concept
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview - ${mainPage.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #111827; color: #e5e7eb; font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
    .preview-card { background: #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.1); }
    .preview-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(6,182,212,0.2); color: #22d3ee; }
    h1 { color: white; font-size: 24px; font-weight: 800; }
    h2 { color: #d1d5db; font-size: 18px; font-weight: 700; }
    p { color: #9ca3af; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; background: linear-gradient(135deg, rgba(6,182,212,0.5), rgba(168,85,247,0.5)); color: white; }
  </style>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <div class="preview-card">
      <span class="preview-badge">Preview</span>
      <h1 style="margin-top: 12px;">${mainPage.name}</h1>
      <p>This is a static preview of the generated page component. Deploy to Base44 for the full interactive version with live data.</p>
    </div>
    <div class="preview-card">
      <h2>Component Structure</h2>
      <p style="font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; white-space: pre-wrap; overflow-x: auto;">${code.slice(0, 1500).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>
    <div style="text-align: center; padding: 20px;">
      <button class="btn">Deploy to Base44 for Live Preview</button>
    </div>
  </div>
</body>
</html>`;
  }, [files]);

  if (!previewHtml) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "rgba(8,8,14,0.98)" }}>
        <div className="text-center text-white/20">
          <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="text-sm font-medium">Preview will appear here</div>
          <div className="text-[11px] text-white/15 mt-1">Generate code to see a preview</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "rgba(8,8,14,0.98)" }}>
      {/* Preview header */}
      <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0" style={{ background: "rgba(20,20,30,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[12px] font-bold text-white/50">Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500/60 animate-pulse" />
          <span className="text-[10px] text-green-400/60">Live</span>
        </div>
      </div>

      {/* Iframe preview */}
      <div className="flex-1 overflow-hidden">
        <iframe
          srcDoc={previewHtml}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          title="Preview"
        />
      </div>
    </div>
  );
}