import React from "react";

export default function OlatomiwaPage() {
  return (
    <div className="fixed inset-0 bg-black" style={{ paddingTop: 'calc(var(--sat, 0px) + 7.5rem)' }}>
      <iframe
        src="https://kas-connect-ca83bd9d.base44.app/"
        className="w-full h-full border-0"
        title="Olatomiwa"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}