import React from "react";
import { X } from "lucide-react";

// Fullscreen site preview modal — opens the built site edge-to-edge.
export default function FullscreenPreview({ html, onClose }) {
  if (!html) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
        <span className="text-xs font-bold text-white/60">Fullscreen Preview</span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <iframe
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        className="flex-1 w-full border-0 bg-white"
        title="Fullscreen Site Preview"
      />
    </div>
  );
}