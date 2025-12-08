import React from "react";

export default function KASIAPage() {
  return (
    <div className="w-full h-[calc(100vh-160px)] bg-black rounded-xl overflow-hidden border border-white/10 relative z-0">
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