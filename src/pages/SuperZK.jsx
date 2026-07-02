import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import SZKLogo from "@/components/superzk/SZKLogo";

const SUPER_ZK_URL = "https://super-zk-vault.base44.app";

export default function SuperZKPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-black flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-3 sm:px-5 py-2.5 flex-shrink-0 z-10"
        style={{
          background: "linear-gradient(180deg, #1c1c1c 0%, #111 100%)",
          borderBottom: "3px solid #d97706",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all flex-shrink-0"
          style={{
            color: "#f59e0b",
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            border: "2px solid rgba(217,119,6,0.4)",
            background: "rgba(217,119,6,0.06)",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[12px] font-black uppercase tracking-wider hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <SZKLogo size={28} />
          <div className="min-w-0">
            <div className="text-[15px] font-black tracking-[0.15em] uppercase truncate" style={{ color: "#fbbf24", fontFamily: "'Impact', 'Arial Black', sans-serif" }}>
              SuperZK
            </div>
            <div className="text-[9px] tracking-[0.3em] uppercase truncate" style={{ color: "rgba(217,119,6,0.5)" }}>
              ZK VAULT
            </div>
          </div>
        </div>

        <a
          href={SUPER_ZK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all flex-shrink-0"
          style={{
            color: "#f59e0b",
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            border: "2px solid rgba(217,119,6,0.3)",
          }}
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-[11px] font-black uppercase tracking-wider hidden sm:inline">Open</span>
        </a>
      </header>

      {/* Iframe container */}
      <div className="relative flex-1 bg-black">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
            <SZKLogo size={56} />
            <div className="mt-6 flex items-center gap-2" style={{ color: "rgba(217,119,6,0.6)" }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}>
                Loading Vault…
              </span>
            </div>
          </div>
        )}
        <motion.iframe
          initial={{ opacity: 0 }}
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 0.4 }}
          src={SUPER_ZK_URL}
          title="SuperZK Vault"
          onLoad={() => setLoading(false)}
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 60px)", background: "#000" }}
          allow="clipboard-read; clipboard-write; publickey-credentials-get; publickey-credentials-create"
        />
      </div>
    </div>
  );
}