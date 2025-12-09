import React from "react";

export default function KaspaNodeMapPage() {
  return (
    <div className="fixed inset-0 lg:left-12 lg:bottom-0 bg-black overflow-hidden" style={{ top: 'calc(var(--sat, 0px) + 8.5rem)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}>
      <div className="w-[125%] h-[125%] origin-top-left transform scale-80">
        <iframe
          src="https://kaspa.stream/nodes"
          className="w-full h-full border-0"
          title="Kaspa Node Map"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}