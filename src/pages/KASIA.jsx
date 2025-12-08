import React from "react";

export default function KASIAPage() {
  return (
    <div className="w-full min-h-screen bg-black flex flex-col">
      <div className="flex-1 w-full max-w-[2000px] mx-auto">
        <iframe
          src="https://kasia.fyi"
          className="w-full h-[calc(100vh-8rem)] border-0 rounded-lg"
          title="KASIA"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}