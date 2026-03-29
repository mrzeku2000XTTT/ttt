import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function CinematPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <h3 className="text-white font-bold text-lg">Cinemata</h3>
          <button
            onClick={() => navigate(-1)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 w-full">
          <iframe
            src="https://cinematakas.base44.app"
            className="w-full h-full border-0"
            title="Cinemata"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
}