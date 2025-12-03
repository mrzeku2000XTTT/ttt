import React from "react";

export default function KasFansPage() {
  return (
    <div className="fixed inset-0 w-full overflow-y-auto overflow-x-hidden" style={{ 
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      bottom: 0,
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'none',
      paddingBottom: '50vh'
    }}>
      <iframe
        src="https://kaspa-fans-hub-427b38c4.base44.app/dashboard"
        className="w-full border-0 block"
        style={{ 
          height: '200vh',
          minHeight: '2000px'
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}