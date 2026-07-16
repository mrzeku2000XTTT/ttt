import React from "react";

const KASSIGNER_APP_URL = "https://base44.app/api/apps/6a444b036408e68ec8d6f2a6/functions/kassignerApp";

export default function KasSigner() {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <iframe
        src={KASSIGNER_APP_URL}
        title="KasSigner"
        allow="camera; clipboard-write; clipboard-read"
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}