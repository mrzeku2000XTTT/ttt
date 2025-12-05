import React from "react";

export default function AYOMUIZ2Page() {
  return (
    <div className="fixed inset-0 lg:left-12" style={{ top: "calc(var(--sat, 0px) + 7.5rem)" }}>
      <iframe
        src="https://kaspa-ng-62ab4fc0.base44.app"
        className="w-full h-full border-0"
        title="Ayomuiz2"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}