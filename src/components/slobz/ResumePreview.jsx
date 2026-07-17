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
      className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-[#EDE9E1] p-8"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0D5B3A]" />
          <h3 className="font-heading text-lg font-semibold text-[#1A1A1A]">Ghost-Writer CV Engine</h3>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs text-[#0D5B3A] hover:text-[#0A4A30] font-bold">
          <Download className="w-3.5 h-3.5" /> DOWNLOAD
        </button>
      </div>
      <div className="bg-[#FBF7F0] rounded-xl border border-[#F0EDE5] p-6">
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h1 className="font-heading text-xl font-bold text-[#1A1A1A] mb-3 border-b border-[#E8E4DD] pb-2" {...props} />,
            h2: ({node, ...props}) => <h2 className="font-heading text-xs font-bold text-[#0D5B3A] mt-5 mb-2 uppercase tracking-[0.15em]" {...props} />,
            h3: ({node, ...props}) => <h3 className="font-heading text-sm font-bold text-[#1A1A1A] mt-3 mb-1" {...props} />,
            p: ({node, ...props}) => <p className="text-sm text-[#3A3A37] leading-relaxed mb-2" {...props} />,
            ul: ({node, ...props}) => <ul className="text-sm text-[#3A3A37] list-disc pl-5 mb-2 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="text-sm text-[#3A3A37] list-decimal pl-5 mb-2 space-y-1" {...props} />,
            li: ({node, ...props}) => <li className="text-sm text-[#3A3A37]" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-[#1A1A1A]" {...props} />,
            hr: ({node, ...props}) => <hr className="border-[#E8E4DD] my-3" {...props} />,
          }}
        >
          {resumeMarkdown || ""}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}