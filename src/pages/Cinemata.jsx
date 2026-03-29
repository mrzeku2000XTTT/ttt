import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CinekasPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        navigate(-1);
        return;
      }
      setIsAdmin(true);
    } catch {
      navigate(-1);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <h3 className="text-white font-bold text-lg">Cinekas</h3>
          <button
            onClick={() => navigate(-1)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 w-full">
          <iframe
            src="https://cinekas.xyz"
            className="w-full h-full border-0"
            title="Cinekas"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
}