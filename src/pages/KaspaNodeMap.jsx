import React from "react";

export default function KaspaNodeMapPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Kaspa Node Map</h1>
            <p className="text-white/60 text-sm">Global Kaspa network nodes</p>
          </div>
          <a
            href="https://kaspa.org/merchant-map/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            Merchant Map
          </a>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 14rem)' }}>
          <iframe
            src="https://nodes.kaspa.ws"
            className="w-full h-full border-0"
            title="Kaspa Node Map"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
}