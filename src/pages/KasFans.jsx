import React from "react";

export default function KasFansPage() {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)' }}>
      <iframe
        src="https://kaspa-fans-hub-427b38c4.base44.app/dashboard"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}