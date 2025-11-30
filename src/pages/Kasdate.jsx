import React from "react";

export default function KasdatePage() {
  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      <iframe
        src="https://krypton-connect-2b48661d.base44.app"
        className="w-full h-full border-0"
        title="Kasdate App"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}