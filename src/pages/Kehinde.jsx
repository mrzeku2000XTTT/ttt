import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function KehindePage() {
  return (
    <div className="fixed inset-0 lg:left-12 bg-black flex flex-col" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)' }}>
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
        <Link to={createPageUrl("AppStore")}>
          <button className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-white font-semibold text-lg">kehinde</h1>
      </div>

      <iframe
        src="https://ttt-kaspa-earn-137c2f5c.base44.app"
        className="w-full border-0 flex-1"
        title="kehinde"
        allow="clipboard-write; payment"
      />
    </div>
  );
}