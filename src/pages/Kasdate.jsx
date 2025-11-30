import React from "react";

export default function KasdatePage() {
  return (
    <div className="fixed bg-black" style={{ top: 'calc(8rem + var(--sat, 0px))', left: 0, right: 0, bottom: 0 }}>
      <iframe
        src="https://krypton-connect-2b48661d.base44.app"
        className="w-full h-full border-0"
        title="Kasdate App"
        allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
      />
    </div>
  );
}