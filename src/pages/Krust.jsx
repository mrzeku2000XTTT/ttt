import React from "react";

export default function KrustPage() {
  return (
    <div
      className="fixed inset-0 bg-black"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <iframe
        src="https://react-weave-web.base44.app"
        title="Krust"
        className="w-full h-full border-0"
        allow="camera; microphone; clipboard-read; clipboard-write; fullscreen; autoplay; payment"
        allowFullScreen
      />
    </div>
  );
}