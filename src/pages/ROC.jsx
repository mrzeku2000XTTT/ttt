import React from "react";

export default function ROCPage() {
  return (
    <div className="fixed inset-0 bg-black" style={{ top: 'var(--sat, 0px)' }}>
      <iframe
        src="https://am0.riseofcultures.com"
        className="w-full h-full border-0"
        title="Rise of Cultures"
        allow="fullscreen; autoplay; clipboard-write; payment"
      />
    </div>
  );
}