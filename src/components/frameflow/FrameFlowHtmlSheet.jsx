import React, { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { buildSpriteSheetHtml } from "./frameFlowHtml";

/** The sprite sheet written out as HTML — previewed, copyable, downloadable. */
export default function FrameFlowHtmlSheet({ frames, fps }) {
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => buildSpriteSheetHtml(frames, { fps }), [frames, fps]);
  const count = frames.filter((frame) => frame?.image).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      setCopied(false);
    }
  };

  const download = () => {
    const blob = new Blob([html], { type: "text/html" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "frameflow-sprite-sheet.html";
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <section className="ff-panel">
      <div className="ff-panel-head">
        <span className="text-[13px] font-bold tracking-[0.06em]">HTML SHEET</span>
        <span className="ff-dim text-[11px]">
          {html ? `${count} frames written as HTML` : "generate a sequence first"}
        </span>
      </div>

      <div className="p-[18px]">
        {html ? (
          <>
            <iframe className="ff-html-preview" title="Sprite sheet preview" sandbox="allow-scripts" srcDoc={html} />

            <div className="ff-html-actions">
              <button type="button" className="ff-btn ff-btn-small" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy HTML"}
              </button>
              <button type="button" className="ff-btn ff-btn-small" onClick={download}>
                <Download className="h-3.5 w-3.5" />
                Download .html
              </button>
            </div>

            <pre className="ff-pre mt-[12px]">{html}</pre>
          </>
        ) : (
          <p className="ff-dim text-[11px]">
            Every frame of the sequence becomes one self-contained HTML file — the grid, the labels and the playback,
            all in the code.
          </p>
        )}
      </div>
    </section>
  );
}