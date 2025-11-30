import React from "react";

export default function OlatomiwaPage() {
  return (
    <div className="fixed inset-0 bg-black z-40" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)', bottom: 0 }}>
      <iframe
        src="https://kaswear-fashion-89db4060.base44.app"
        className="w-full h-full border-0"
        title="Olatomiwa"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}