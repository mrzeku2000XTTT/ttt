import React from "react";

export default function HworkPage() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ paddingTop: 'var(--sat, 0px)' }}>
      <iframe
        src="https://homeworknowbitch.base44.app"
        className="w-full flex-1 border-0"
        title="Hwork"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; camera; microphone"
        allowFullScreen
      />
    </div>
  );
}