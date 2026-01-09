import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function KasplorePage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-black">
      <iframe
        src="https://www.kasplore.com"
        className="w-full h-full border-none"
        title="Kasplore"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}