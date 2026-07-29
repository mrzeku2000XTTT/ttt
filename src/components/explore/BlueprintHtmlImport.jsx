import React, { useState } from "react";
import { X, Code2, FileCode } from "lucide-react";
import { COLORS } from "./blueprintConstants";

export default function BlueprintHtmlImport({ onImport, onClose }) {
  const [html, setHtml] = useState("");
  const [name, setName] = useState("");

  const sampleHtml = `<div style="font-family: 'Inter', sans-serif; padding: 24px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; color: white;">
  <h2 style="margin: 0 0 8px;">✨ Custom Component</h2>
  <p style="margin: 0; opacity: 0.9;">Paste your HTML, CSS, or embed code here.</p>
  <button style="margin-top: 12px; padding: 8px 16px; background: white; color: #667eea; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Click me</button>
</div>`;

  const handleImport = () => {
    if (!html.trim()) return;
    onImport(html.trim(), name.trim() || "HTML Component");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#fff', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: COLORS.BORDER }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#eef2ff' }}>
              <FileCode className="w-4 h-4" style={{ color: COLORS.BLUE }} />
            </div>
            <span className="text-[15px] font-bold" style={{ color: COLORS.TEXT_DARK }}>Import HTML</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" style={{ color: COLORS.TEXT_MED }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-[12px] font-semibold block mb-1.5" style={{ color: COLORS.TEXT_DARK }}>Component name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pricing Card"
              className="w-full h-10 px-3 rounded-lg text-[13px] outline-none"
              style={{ border: `1px solid ${COLORS.BORDER}`, color: COLORS.TEXT_DARK }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-semibold" style={{ color: COLORS.TEXT_DARK }}>HTML code</label>
              <button
                onClick={() => setHtml(sampleHtml)}
                className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md hover:bg-gray-100"
                style={{ color: COLORS.BLUE }}
              >
                <Code2 className="w-3 h-3" /> Load sample
              </button>
            </div>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="<div>Your HTML here...</div>"
              className="w-full h-48 p-3 rounded-lg text-[12px] outline-none resize-none"
              style={{ border: `1px solid ${COLORS.BORDER}`, background: '#1e1e1e', color: '#a5d6ff', fontFamily: "monospace" }}
              spellCheck={false}
            />
          </div>

          {html.trim() && (
            <div>
              <label className="text-[12px] font-semibold block mb-1.5" style={{ color: COLORS.TEXT_DARK }}>Preview</label>
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: COLORS.BORDER, background: '#f9fafb' }}>
                <iframe
                  srcDoc={html}
                  title="HTML Preview"
                  className="w-full"
                  style={{ height: 200, border: 0 }}
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: COLORS.BORDER }}>
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-[13px] font-medium"
            style={{ color: COLORS.TEXT_MED }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!html.trim()}
            className="h-9 px-5 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-40"
            style={{ background: COLORS.BLUE, color: '#fff' }}
          >
            <Code2 className="w-3.5 h-3.5" /> Add to canvas
          </button>
        </div>
      </div>
    </div>
  );
}