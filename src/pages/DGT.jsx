import React from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DGTPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10"
        style={{ paddingTop: "var(--sat, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-white font-bold text-lg">DGT - Digital Gold Talk</h1>
            </div>

            <a
              href="https://digitalgoldtalk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 rounded-lg transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-medium">Open in New Tab</span>
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-16" style={{ paddingTop: "calc(var(--sat, 0px) + 4rem)" }}>
        <iframe
          src="https://digitalgoldtalk.com"
          className="w-full h-full border-0"
          title="Digital Gold Talk"
          style={{ height: "calc(100vh - 4rem)" }}
        />
      </div>
    </div>
  );
}