import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RegisterBusinessPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black/50 backdrop-blur-sm z-10">
        <Button
          onClick={() => navigate(createPageUrl('Singularity'))}
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-white font-bold text-lg">Register Business</h1>
      </div>

      {/* Fullscreen Iframe */}
      <div className="flex-1 relative">
        <iframe
          src="https://kaspattt.base44.app/RegisterBusiness"
          className="absolute inset-0 w-full h-full border-0"
          title="Register Business"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}