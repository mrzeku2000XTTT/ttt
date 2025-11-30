import React from "react";

export default function MODZPage() {
  return (
    <div className="fixed bg-black lg:ml-12" style={{ top: 'calc(8rem + var(--sat, 0px))', left: 0, right: 0, bottom: 0 }}>
      <iframe
        src="https://kaspa-store-copy-89e8d7c0.base44.app/"
        className="w-full h-full border-0"
        title="MODZ App"
        allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
      />
    </div>
  );
}