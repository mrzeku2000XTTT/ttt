import React from "react";

export default function FluxKmailPage() {
  return (
    <div className="h-screen w-full bg-black">
      <iframe
        src="https://fluxkmail.base44.app"
        className="w-full h-full border-0"
        title="Flux Kmail"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}