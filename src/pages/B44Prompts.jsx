import React from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function B44PromptsPage() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative z-10 flex-shrink-0 bg-black backdrop-blur-sm border-b border-white/10 p-3 md:p-4 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="cursor-pointer">
          <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors active:scale-95">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-xs md:text-sm font-medium">Back</span>
          </button>
        </Link>
        <a
          href="https://b44-prompts.base44.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer active:scale-95"
        >
          <span className="text-xs md:text-sm font-medium">Open in New Tab</span>
          <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
        </a>
      </div>
      <iframe
        src="https://b44-prompts.base44.app"
        className="flex-1 w-full border-0"
        title="B44 Prompts"
      />
    </div>
  );
}