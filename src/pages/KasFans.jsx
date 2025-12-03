import React from "react";

export default function KasFansPage() {
  return (
    <div className="fixed inset-0 w-full overflow-auto" style={{ 
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      bottom: 0,
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain'
    }}>
      <iframe
        src="https://kaspa-fans-hub-427b38c4.base44.app/dashboard"
        className="w-full border-0"
        style={{ 
          height: '150vh',
          minHeight: 'calc(100vh + 300px)'
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}