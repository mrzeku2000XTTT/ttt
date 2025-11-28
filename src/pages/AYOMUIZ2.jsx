import React from "react";

export default function AYOMUIZ2Page() {
  return (
    <div
      style={{
        position: "fixed",
        top: "calc(var(--sat, 0px) + 7.5rem)",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: "auto",
        overflow: "hidden",
      }}
    >
      <iframe
        src="https://kaspa-ng-62ab4fc0.base44.app"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="Ayomuiz2"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}