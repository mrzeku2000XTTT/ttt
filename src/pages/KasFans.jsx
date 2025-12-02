import React from "react";

export default function KasFansPage() {
  return (
    <div className="w-full h-screen bg-black" style={{ paddingTop: 'calc(var(--sat, 0px) + 8rem)' }}>
      <iframe
        src="https://kaspa-fans-hub-427b38c4.base44.app/dashboard"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}