import React from "react";

export default function KoladePage() {
  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      <iframe
        src="https://arch-book-a1d75318.base44.app/"
        className="w-full h-full border-0"
        title="Kolade App"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}