import React, { useState } from "react";

export default function KaspaNodeMapPage() {
  const [activeTab, setActiveTab] = useState("nodes");

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Kaspa Maps</h1>
          <p className="text-white/60 text-sm">Global Kaspa network nodes and merchants</p>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("nodes")}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === "nodes"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Node Map
          </button>
          <button
            onClick={() => setActiveTab("merchants")}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === "merchants"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Merchant Map
          </button>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 16rem)' }}>
          {activeTab === "nodes" && (
            <iframe
              src="https://nodes.kaspa.ws"
              className="w-full h-full border-0"
              title="Kaspa Node Map"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
          {activeTab === "merchants" && (
            <iframe
              src="https://kaspa.org/merchant-map/"
              className="w-full h-full border-0"
              title="Kaspa Merchant Map"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>
      </div>
    </div>
  );
}