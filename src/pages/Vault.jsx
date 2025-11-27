import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function VaultPage() {
  return (
    <div className="bg-black -mt-28 sm:-mt-32" style={{ minHeight: 'calc(100vh + 7rem)' }}>
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <Link to={createPageUrl("AppStore")}>
          <button className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-white font-semibold text-lg">VAULT</h1>
      </div>
      
      <iframe
        src="https://crypto-vault-copy-62ccec54.base44.app"
        className="w-full border-0"
        style={{ height: 'calc(100vh - 3.5rem - 7rem)', minHeight: '600px' }}
        title="VAULT"
        allow="clipboard-write; payment"
        allowFullScreen
      />
    </div>
  );
}