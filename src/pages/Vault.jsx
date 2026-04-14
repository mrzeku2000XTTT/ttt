import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VaultPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const user = await base44.auth.me();
        setIsAdmin(user?.role === "admin");
      } catch {}
      setLoading(false);
    };
    check();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] bg-black flex flex-col items-center justify-center gap-4 px-4">
        <Lock className="w-12 h-12 text-red-400" />
        <h2 className="text-white text-xl font-bold">Admin Only</h2>
        <p className="text-white/50 text-sm text-center">This page is restricted to administrators.</p>
        <Link to={createPageUrl("AppStore")} className="text-cyan-400 text-sm hover:underline">← Back to App Store</Link>
      </div>
    );
  }

  return (
    <div className="bg-black flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
        <Link to={createPageUrl("AppStore")}>
          <button className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-white font-semibold text-lg">VAULT</h1>
      </div>
      
      <iframe
        src="https://crypto-vault-copy-62ccec54.base44.app"
        className="w-full border-0 flex-1"
        title="VAULT"
        allow="clipboard-write; payment; camera; microphone"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}