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
      className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl shadow-gray-200/40"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-bold text-gray-900">GHOST-WRITER CV ENGINE</h3>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold">
          <Download className="w-3.5 h-3.5" /> DOWNLOAD
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h1 className="text-lg font-black text-gray-900 mb-2 border-b border-gray-200 pb-2" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-sm font-bold text-gray-800 mt-4 mb-1 uppercase tracking-wide" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-sm font-bold text-gray-800 mt-3 mb-1" {...props} />,
            p: ({node, ...props}) => <p className="text-sm text-gray-700 leading-relaxed mb-2" {...props} />,
            ul: ({node, ...props}) => <ul className="text-sm text-gray-700 list-disc pl-5 mb-2 space-y-0.5" {...props} />,
            ol: ({node, ...props}) => <ol className="text-sm text-gray-700 list-decimal pl-5 mb-2 space-y-0.5" {...props} />,
            li: ({node, ...props}) => <li className="text-sm text-gray-700" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
            hr: ({node, ...props}) => <hr className="border-gray-200 my-3" {...props} />,
          }}
        >
          {resumeMarkdown || ""}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}