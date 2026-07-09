import React, { useEffect, useState, useRef } from "react";
import { jsPDF } from "jspdf";
import manifestoMarkdown from "@/docs/TTT3_Manifesto.md?raw";

function cleanInline(text) {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1");
}

function parseMarkdown(md) {
  const lines = md.split("\n");
  const blocks = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "---") {
      blocks.push({ type: "pagebreak" });
    } else if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: cleanInline(trimmed.slice(4)) });
    } else if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: cleanInline(trimmed.slice(3)) });
    } else if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: cleanInline(trimmed.slice(2)) });
    } else if (trimmed.startsWith("- ")) {
      blocks.push({ type: "list", text: cleanInline(trimmed.slice(2)) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({ type: "list", text: cleanInline(trimmed) });
    } else if (trimmed === "") {
      blocks.push({ type: "spacing" });
    } else {
      blocks.push({ type: "body", text: cleanInline(trimmed) });
    }
  }
  return blocks;
}

export default function TTT3ManifestoPDF() {
  const [status, setStatus] = useState("generating");
  const docRef = useRef(null);

  useEffect(() => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 56;
      const maxWidth = pageWidth - margin * 2;
      let y = margin;
      let pageNum = 1;

      const addPageNumber = () => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(String(pageNum), pageWidth / 2, pageHeight - 24, { align: "center" });
        doc.setTextColor(0);
      };

      const checkPageBreak = (needed) => {
        if (y + needed > pageHeight - margin - 20) {
          addPageNumber();
          doc.addPage();
          pageNum++;
          y = margin;
          return true;
        }
        return false;
      };

      const blocks = parseMarkdown(manifestoMarkdown);

      for (const block of blocks) {
        switch (block.type) {
          case "pagebreak":
            addPageNumber();
            doc.addPage();
            pageNum++;
            y = margin;
            break;
          case "h1":
            checkPageBreak(50);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(10, 60, 120);
            {
              const lines = doc.splitTextToSize(block.text, maxWidth);
              doc.text(lines, margin, y + 8);
              y += lines.length * 26 + 12;
            }
            doc.setTextColor(0);
            break;
          case "h2":
            checkPageBreak(36);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(20, 20, 20);
            {
              const lines = doc.splitTextToSize(block.text, maxWidth);
              doc.text(lines, margin, y + 6);
              y += lines.length * 18 + 10;
            }
            break;
          case "h3":
            checkPageBreak(30);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(40, 40, 40);
            {
              const lines = doc.splitTextToSize(block.text, maxWidth);
              doc.text(lines, margin, y + 5);
              y += lines.length * 15 + 8;
            }
            break;
          case "list":
            checkPageBreak(16);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10.5);
            doc.setTextColor(50, 50, 50);
            {
              const prefix = block.text.match(/^\d+\./) ? "" : "  •  ";
              const lines = doc.splitTextToSize(prefix + block.text, maxWidth - 16);
              for (const ln of lines) {
                checkPageBreak(14);
                doc.text(ln, margin + 8, y + 4);
                y += 14;
              }
              y += 4;
            }
            break;
          case "body":
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10.5);
            doc.setTextColor(35, 35, 35);
            {
              const lines = doc.splitTextToSize(block.text, maxWidth);
              for (const ln of lines) {
                checkPageBreak(14);
                doc.text(ln, margin, y + 4);
                y += 14;
              }
              y += 6;
            }
            break;
          case "spacing":
            y += 4;
            break;
        }
      }
      addPageNumber();
      docRef.current = doc;
      doc.save("TTT3_Manifesto.pdf");
      setStatus("done");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setStatus("error");
    }
  }, []);

  const handleDownload = () => {
    if (docRef.current) {
      docRef.current.save("TTT3_Manifesto.pdf");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
        {status === "generating" && (
          <>
            <div className="w-10 h-10 border-2 border-white/20 border-t-[#0A84FF] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-white/60">Generating TTT 3.0 Manifesto PDF…</p>
          </>
        )}
        {status === "done" && (
          <>
            <div className="w-12 h-12 rounded-full bg-[#30D158]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#30D158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white mb-1">PDF Downloaded</h1>
            <p className="text-xs text-white/40 mb-5">TTT3_Manifesto.pdf has been saved to your device.</p>
            <button onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#0A84FF" }}>
              Download Again
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-[#FF453A]/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl text-[#FF453A]">!</span>
            </div>
            <h1 className="text-lg font-bold text-white mb-1">Generation Failed</h1>
            <p className="text-xs text-white/40">Something went wrong. Please try again.</p>
          </>
        )}
      </div>
    </div>
  );
}