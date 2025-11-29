import React from "react";

export default function PeculiarPage() {
  return (
    <div
      className="lg:ml-12"
      style={{
        position: "fixed",
        top: "calc(var(--sat, 0px) + 8rem)",
        bottom: 0,
        left: 0,
        right: 0,
        overflow: "hidden",
      }}
    >
      <iframe
        src="https://zyphora-ai-chat-copy-4e8cda5a.base44.app"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="Peculiar"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}