import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { FileText, Download } from "lucide-react";

export default function ResumePreview({ resumeMarkdown }) {
  const handleDownload = () => {
    const blob = new Blob([resumeMarkdown || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "slob-resume.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-7 md:p-8"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#7C5CFC]" />
          <h3 className="font-heading text-xl font-semibold text-[#1F1B2E]">Ghost-Writer CV Engine</h3>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-xs text-white font-display font-extrabold shadow-[0_4px_12px_rgba(124,92,252,0.35)] transition-colors">
          <Download className="w-3.5 h-3.5" /> DOWNLOAD
        </button>
      </div>
      <div className="bg-[#F4F1FB] rounded-[20px] p-6">
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h1 className="font-heading text-xl font-bold text-[#1F1B2E] mb-3 border-b border-[#E0DAF0] pb-2" {...props} />,
            h2: ({node, ...props}) => <h2 className="font-display text-xs font-extrabold text-[#7C5CFC] mt-5 mb-2 uppercase tracking-[0.15em]" {...props} />,
            h3: ({node, ...props}) => <h3 className="font-display text-sm font-bold text-[#1F1B2E] mt-3 mb-1" {...props} />,
            p: ({node, ...props}) => <p className="text-sm text-[#3A3450] leading-relaxed mb-2" {...props} />,
            ul: ({node, ...props}) => <ul className="text-sm text-[#3A3450] list-disc pl-5 mb-2 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="text-sm text-[#3A3450] list-decimal pl-5 mb-2 space-y-1" {...props} />,
            li: ({node, ...props}) => <li className="text-sm text-[#3A3450]" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-[#1F1B2E]" {...props} />,
            hr: ({node, ...props}) => <hr className="border-[#E0DAF0] my-3" {...props} />,
          }}
        >
          {resumeMarkdown || ""}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}