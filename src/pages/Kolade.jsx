import React from "react";

export default function KoladePage() {
  return (
    <div className="fixed bg-black lg:ml-12" style={{ top: 'calc(8rem + var(--sat, 0px))', left: 0, right: 0, bottom: 0 }}>
      <iframe
        src="https://arch-book-a1d75318.base44.app/"
        className="w-full h-full border-0"
        title="Kolade App"
        allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
      />
    </div>
  );
}