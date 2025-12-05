import React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AYOMUIZ2Page() {
  return (
    <div className="fixed inset-0 lg:left-12" style={{ top: "calc(var(--sat, 0px) + 7.5rem)" }}>
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={() => window.open("https://kaspa-ng-62ab4fc0.base44.app", "_blank")}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold shadow-lg"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab (For Wallet)
        </Button>
      </div>
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