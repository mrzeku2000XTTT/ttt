import React from "react";
import { Shield, ArrowRight } from "lucide-react";

const APP_LIST = [
  { name: "Arh'tuun", path: "Arhtuun" },
  { name: "SIMPLE", path: "SIMPLE" },
  { name: "K Learning Hub", path: "Learning" },
  { name: "BMT Univ", path: "BMTUniv" },
  { name: "TapToTip", path: "TapToTip" },
  { name: "BRAHIM", path: "BRAHIMHub" },
  { name: "AYOMUIZ", path: "AYOMUIZHub" },
  { name: "peculiar", path: "Peculiar" },
  { name: "kehinde", path: "Kehinde" },
  { name: "HAYPHASE", path: "HAYPHASE" },
  { name: "VAULT", path: "Vault" },
  { name: "Olatomiwa", path: "OlatomiwaHub" },
  { name: "Kolade", path: "Kolade" },
  { name: "MODZ", path: "MODZHub" },
  { name: "KFANS", path: "KasFans" },
  { name: "Duel", path: "DuelLobby" },
  { name: "Area 51", path: "Area51" },
  { name: "KASIA", path: "KASIA" },
  { name: "MMN", path: "MMN" },
  { name: "Kurve", path: "Kurve" },
  { name: "CoinSpace", path: "CoinSpace" },
  { name: "KaspaHub", path: "KaspaHub" },
  { name: "KFlow", path: "KFlow" },
  { name: "EXPLORER", path: "Explorer" },
  { name: "ShiLLz", path: "ShiLLz" },
  { name: "KasCompute", path: "KasCompute" },
  { name: "Kurncy", path: "Kurncy" },
  { name: "K gigZ", path: "KGigZ" },
  { name: "Poki", path: "Poki" },
  { name: "Ksocial", path: "Ksocial" },
  { name: "VALORANT", path: "Valorant" },
  { name: "KasPlay", path: "KasPlay" },
  { name: "ALPHA", path: "ALPHA" },
  { name: "OuTKasTT", path: "OuTKasTT" },
  { name: "Kasplore", path: "Kasplore" },
  { name: "OnChain POS", path: "OnChainPOS" },
  { name: "Vox Invicta", path: "VoxInvicta" },
  { name: "KaSkool", path: "KaSkool" },
  { name: "K-University", path: "KUniversity" },
  { name: "DGT", path: "DGT" },
  { name: "Olivia Apps", path: "OliviaApps" },
  { name: "KasLens", path: "KasLens" },
  { name: "Keystone", path: "Keystone" },
  { name: "KaShop", path: "KaShop" },
  { name: "KC Bridge", path: "KCbridge" },
  { name: "Flux Kmail", path: "FluxKmail" },
  { name: "TTT", path: "TTT" },
  { name: "Xùnhuà", path: "Xunhua" },
  { name: "Terra", path: "Terra" },
  { name: "RufzeitK", path: "RufzeitKHome" },
  { name: "KivR", path: "KivR" },
  { name: "SilverScript", path: "SilverScript" },
  { name: "Hwork", path: "Hwork" },
  { name: "DAG", path: "DAGVisualizer" },
  { name: "Voxa", path: "Voxa" },
  { name: "Freedom", path: "Freedom" },
  { name: "Prompto", path: "Prompto" },
  { name: "CineKas", path: "Cinekas" },
  { name: "Speed", path: "Speed" },
  { name: "Farlands", path: "Farlands" },
  { name: "Velour", path: "V1" },
  { name: "Klock", path: "Klock" },
  { name: "KaChing", path: "StakeDAG" },
];

export default function AppQuickScan({ onScanApp }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-cyan-400" />
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest">Quick Scan — TTT Apps</h2>
      </div>
      <p className="text-white/30 text-[11px]">One-click security scan for any app in the ecosystem.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {APP_LIST.map(app => (
          <button
            key={app.path}
            onClick={() => onScanApp(app.name)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-cyan-500/20 transition-all text-left group"
          >
            <span className="text-white/60 text-[11px] font-medium flex-1 truncate group-hover:text-white/80">{app.name}</span>
            <ArrowRight className="w-3 h-3 text-white/10 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}