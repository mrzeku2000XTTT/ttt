import React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GridSplitPage() {
  return (
    <div className="fixed inset-0 bg-black">
      <Button
        onClick={() => window.open("https://grid-split.vercel.app", "_blank")}
        className="fixed top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl"
        size="sm"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Open in New Tab
      </Button>
      
      <iframe
        src="https://grid-split.vercel.app"
        className="w-full h-full border-0"
        title="GridSplit"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}