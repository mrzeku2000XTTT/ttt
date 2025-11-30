import React from "react";

export default function TaiwoPage() {
  return (
    <div className="fixed inset-0 bg-black z-40" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)', bottom: 0 }}>
      <iframe
        src="https://kasware-quest-69d8b5d2.base44.app/"
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}