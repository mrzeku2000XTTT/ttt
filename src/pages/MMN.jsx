import React from "react";

export default function MMNPage() {
  return (
    <div className="fixed inset-0 bg-black" style={{ 
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      bottom: 0,
      left: 0,
      right: 0
    }}>
      <iframe
        src="https://www.modmedianow.com"
        className="w-full h-full border-0"
        title="Mod Media Now"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}