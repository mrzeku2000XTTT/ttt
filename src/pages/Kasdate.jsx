import React from "react";

export default function KasdatePage() {
  return (
    <div className="fixed inset-0 w-full h-full bg-black" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <iframe
        src="https://krypton-connect-2b48661d.base44.app"
        className="w-full h-full border-0"
        title="Kasdate App"
        allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}