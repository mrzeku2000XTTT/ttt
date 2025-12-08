import React from "react";

export default function KASIAPage() {
  return (
    <div className="fixed inset-0 bg-black" style={{ top: 'var(--sat, 0px)' }}>
      <iframe
        src="https://kasia.fyi"
        className="w-full h-full border-0"
        title="KASIA"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}