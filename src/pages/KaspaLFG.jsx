import React from "react";

export default function KaspaLFGPage() {
  return (
    <div className="fixed inset-0 w-full overflow-y-auto overflow-x-hidden bg-white" style={{ 
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      bottom: 0,
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'none',
      paddingBottom: 'max(100px, env(safe-area-inset-bottom, 0px))'
    }}>
      <iframe
        src="https://lfg.kaspa.com/app"
        className="w-full border-0 block"
        style={{ 
          height: 'max(150vh, 1500px)',
          minHeight: 'calc(100vh + 500px)'
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}