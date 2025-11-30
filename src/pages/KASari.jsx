import React from "react";

export default function KASariPage() {
  return (
    <div className="fixed inset-0 bg-black" style={{ 
      top: 'calc(7.5rem + var(--sat, 0px))',
      bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))'
    }}>
      <iframe
        src="https://kaspa-emergency-response-097a9b19.base44.app"
        className="w-full h-full border-0"
        title="KASari App"
        allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
      />
    </div>
  );
}