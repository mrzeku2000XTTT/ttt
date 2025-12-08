import React from "react";

export default function KASIAPage() {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}>
      <iframe
        src="https://kasia.fyi"
        className="w-full h-full border-0"
        title="KASIA"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}