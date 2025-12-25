import React from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function B44PromptsPage() {
  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/90 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
        <Link to={createPageUrl("Home")}>
          <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </Link>
        <a
          href="https://b44-prompts.base44.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span className="text-sm font-medium">Open in New Tab</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <iframe
        src="https://b44-prompts.base44.app"
        className="w-full h-full"
        title="B44 Prompts"
      />
    </div>
  );
}