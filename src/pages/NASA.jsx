import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NASAPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b border-white/10">
        <Button
          onClick={() => navigate(createPageUrl('Singularity'))}
          variant="ghost"
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-white">NASA Eyes on the Solar System</h1>
      </div>

      <iframe
        src="https://eyes.nasa.gov/apps/solar-system/#/home?rate=2592000&time=2036-07-11T17:26:40.804+00:00"
        className="flex-1 w-full border-0"
        title="NASA Eyes"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      />
    </div>
  );
}