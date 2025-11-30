import React from "react";

export default function KASariPage() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <iframe
        src="https://kaspa-emergency-response-097a9b19.base44.app"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="KASari App"
        allow="clipboard-read; clipboard-write; camera"
      />
    </div>
  );
}