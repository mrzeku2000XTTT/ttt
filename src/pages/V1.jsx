import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function V1Page() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data === 'close_app' || e.data?.type === 'close_app') {
        navigate('/AppStore');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[999] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10">
            <span className="text-white font-serif text-sm font-bold">v1</span>
          </div>
          <h3 className="text-white font-semibold text-lg">Velour</h3>
        </div>
        <button
          onClick={() => navigate('/appstore')}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 w-full">
        <iframe
          src="https://velour-1.base44.app"
          className="w-full h-full border-0"
          title="Velour"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; camera"
        />
      </div>
    </div>
  );
}