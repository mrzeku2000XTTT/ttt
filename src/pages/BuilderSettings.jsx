import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SettingsPanel } from "@/components/tttbuilder/DashboardPanels";
import { getLocalProviders, LOCAL_MODEL_PREFIX } from "@/components/tttbuilder/localLlm";
import { isStandalone } from "@/components/tttbuilder/OnboardingModal";

const STANDALONE = isStandalone();

export default function BuilderSettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthLoading(false); }).catch(() => setAuthLoading(false));
  }, []);

  const [model, setModel] = useState(() => {
    try {
      const saved = localStorage.getItem("ttt_builder_model");
      if (STANDALONE) {
        const locals = getLocalProviders();
        if (locals.length > 0) {
          if (!saved || (!saved.startsWith(LOCAL_MODEL_PREFIX) && saved !== "automatic")) {
            return `${LOCAL_MODEL_PREFIX}${locals[0].id}`;
          }
        }
      }
      return saved || "ttt_agent_1";
    } catch { return "ttt_agent_1"; }
  });
  const [buildMode, setBuildMode] = useState(() => {
    try { return localStorage.getItem("ttt_builder_mode") || "react"; } catch { return "react"; }
  });
  const [walletKit, setWalletKit] = useState(() => {
    try { return localStorage.getItem("ttt_builder_wallet") !== "off"; } catch { return true; }
  });

  const changeModel = (m) => { setModel(m); try { localStorage.setItem("ttt_builder_model", m); } catch {} };
  const changeBuildMode = (m) => { setBuildMode(m); try { localStorage.setItem("ttt_builder_mode", m); } catch {} };
  const changeWalletKit = (w) => { setWalletKit(w); try { localStorage.setItem("ttt_builder_wallet", w ? "on" : "off"); } catch {} };

  if (authLoading) {
    return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#70C7BA]/40 border-t-[#70C7BA] rounded-full animate-spin" /></div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-center px-5">
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Admin Only</h2>
          <p className="text-white/40 text-sm">Builder settings are restricted to admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-3 sm:px-5 backdrop-blur-xl bg-[#0d1117]/80 border-b border-white/5"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", minHeight: "calc(3rem + env(safe-area-inset-top, 0px))" }}
      >
        <button
          onClick={() => navigate("/TTTBuilder")}
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors px-2.5 py-2 min-h-[44px] -ml-1 rounded-lg active:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Builder</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-black text-lg tracking-tight text-white">TTT</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#70C7BA] text-black">SETTINGS</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pb-16" style={{ paddingTop: "calc(3rem + env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-[#70C7BA]" />
          <h1 className="text-xl font-bold">Builder Settings</h1>
        </div>
        <SettingsPanel
          buildMode={buildMode}
          onChangeBuildMode={changeBuildMode}
          model={model}
          onChangeModel={changeModel}
          walletKit={walletKit}
          onChangeWalletKit={changeWalletKit}
          loading={false}
        />
      </div>
    </div>
  );
}