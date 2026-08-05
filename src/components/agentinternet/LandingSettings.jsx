import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, X, Cpu, Zap, Shield, Wallet, Bot, Radio, Layers, Lock, Activity } from "lucide-react";

/**
 * Agent Internet settings — 50 real configuration knobs for the unified superagent.
 * Persisted in localStorage. Consumed by PowerConsole to shape the router prompt.
 */

export const SETTINGS = [
  // Autonomy
  { key: "auto_execute", group: "Autonomy", label: "Autonomous execution", desc: "Run apps without asking" },
  { key: "self_route", group: "Autonomy", label: "KAI self-routing", desc: "Router picks the apps" },
  { key: "parallel", group: "Autonomy", label: "Parallel agents", desc: "Run many at once" },
  { key: "chain_depth", group: "Autonomy", label: "Deep chaining", desc: "Multi-step plans" },
  { key: "max_10", group: "Autonomy", label: "Cap 10 agents", desc: "Light swarm" },
  { key: "max_50", group: "Autonomy", label: "Cap 50 agents", desc: "Medium swarm" },
  { key: "max_100", group: "Autonomy", label: "Full 100 swarm", desc: "Maximum agents" },
  { key: "confirm_money", group: "Autonomy", label: "Confirm payments", desc: "Ask before KAS moves" },

  // Agents
  { key: "agent_kai", group: "Agents", label: "KAI · router brain", desc: "Orchestrates everything" },
  { key: "agent_ying", group: "Agents", label: "Ying · research", desc: "Grounded web search" },
  { key: "agent_zk", group: "Agents", label: "ZK · identity", desc: "Signs on-chain" },
  { key: "agent_slobz", group: "Agents", label: "Slobz · labor", desc: "Escrow + micro-gigs" },
  { key: "agent_tree", group: "Agents", label: "Tree · ads", desc: "Campaign generation" },
  { key: "agent_igra", group: "Agents", label: "Igra · L2", desc: "iKAS execution" },
  { key: "agent_tele", group: "Agents", label: "Tele · broadcast", desc: "Encrypted channels" },
  { key: "agent_klipz", group: "Agents", label: "Klipz · clipping", desc: "Live stream clips" },
  { key: "agent_xunhua", group: "Agents", label: "Xùnhuà · sketch", desc: "Sketch→AI image" },
  { key: "agent_kutt", group: "Agents", label: "KUTT · render", desc: "URL→viral video" },

  // Apps
  { key: "app_bridge", group: "Apps", label: "Bridge · send KAS", desc: "Real payments" },
  { key: "app_wallet", group: "Apps", label: "Wallet ops", desc: "Balance & UTXOs" },
  { key: "app_signer", group: "Apps", label: "KasSigner", desc: "Tx signing" },
  { key: "app_escrow", group: "Apps", label: "Slobz escrow", desc: "Lock KAS" },
  { key: "app_kcc", group: "Apps", label: "KCC NFT mint", desc: "On-chain NFTs" },
  { key: "app_awa", group: "Apps", label: "AWA x402", desc: "Paid AI services" },
  { key: "app_builder", group: "Apps", label: "TTT Builder", desc: "Live websites" },
  { key: "app_youtube", group: "Apps", label: "YouTube search", desc: "Video discovery" },
  { key: "app_news", group: "Apps", label: "News aggregation", desc: "Live feeds" },
  { key: "app_dex", group: "Apps", label: "Aporia DEX", desc: "Swap" },
  { key: "app_price", group: "Apps", label: "Kaspa price", desc: "Live oracle" },
  { key: "app_explorer", group: "Apps", label: "On-chain explorer", desc: "Tx lookup" },

  // Money
  { key: "money_mainnet", group: "Money", label: "Mainnet", desc: "Real KAS" },
  { key: "money_testnet", group: "Money", label: "Testnet only", desc: "Safe mode" },
  { key: "money_x402", group: "Money", label: "x402 agent pay", desc: "Agent settlement" },
  { key: "money_usd", group: "Money", label: "KAS Dollar", desc: "Stablecoin" },
  { key: "money_tips", group: "Money", label: "Tipping", desc: "Send tips" },
  { key: "money_escrow", group: "Money", label: "Escrow locking", desc: "Covenant wallets" },

  // Identity
  { key: "id_zk", group: "Identity", label: "ZK proofs", desc: "Zero-knowledge" },
  { key: "id_civic", group: "Identity", label: "Civic verify", desc: "Civic auth" },
  { key: "id_signature", group: "Identity", label: "Message signing", desc: "Verify identity" },
  { key: "id_passport", group: "Identity", label: "Agent passports", desc: "Agent identity" },
  { key: "id_tttid", group: "Identity", label: "TTT ID", desc: "User identity" },
  { key: "id_biometric", group: "Identity", label: "Biometric", desc: "Device auth" },

  // Safety
  { key: "safe_moderate", group: "Safety", label: "Content moderation", desc: "AI filter" },
  { key: "safe_profanity", group: "Safety", label: "Block profanity", desc: "Clean output" },
  { key: "safe_wallet_guard", group: "Safety", label: "Wallet guardrails", desc: "Spend limits" },
  { key: "safe_rate_limit", group: "Safety", label: "Rate limiting", desc: "Anti-spam" },
  { key: "safe_audit", group: "Safety", label: "Audit logging", desc: "Record all calls" },
  { key: "safe_sandbox", group: "Safety", label: "Sandbox mode", desc: "Isolated exec" },

  // Output
  { key: "out_markdown", group: "Output", label: "Markdown", desc: "Rich text" },
  { key: "out_images", group: "Output", label: "Image generation", desc: "Visuals" },
  { key: "out_voice", group: "Output", label: "Voice narration", desc: "TTS" },
  { key: "out_live_site", group: "Output", label: "Live site preview", desc: "Deployed page" },
];

const GROUP_ICON = {
  Autonomy: Zap, Agents: Bot, Apps: Layers, Money: Wallet,
  Identity: Shield, Safety: Lock, Output: Activity,
};

const DEFAULTS = SETTINGS.reduce((acc, s) => {
  // a few defaults off for safety
  const off = ["max_10", "max_50", "money_mainnet", "auto_execute", "out_voice", "out_live_site", "id_biometric"];
  acc[s.key] = !off.includes(s.key);
  return acc;
}, {});

export function useLandingSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("ai_landing_settings");
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });
  useEffect(() => {
    try { localStorage.setItem("ai_landing_settings", JSON.stringify(settings)); } catch {}
  }, [settings]);
  const update = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }));
  const reset = () => setSettings(DEFAULTS);
  return { settings, update, reset };
}

function Toggle({ on, onClick, label, desc }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 transition-colors text-left"
    >
      <div className="min-w-0">
        <div className="text-white text-[11px] font-medium truncate">{label}</div>
        <div className="text-white/40 text-[9px] truncate">{desc}</div>
      </div>
      <div className={`w-8 h-4 rounded-full shrink-0 relative transition-colors ${on ? "bg-cyan-400" : "bg-white/15"}`}>
        <motion.div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white"
          style={{ left: on ? "calc(100% - 0.875rem)" : "0.125rem" }}
        />
      </div>
    </button>
  );
}

export default function LandingSettings({ open, onClose, settings, update, reset }) {
  const groups = [...new Set(SETTINGS.map((s) => s.group))];
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute top-0 right-0 bottom-0 z-50 w-[300px] max-w-[88vw] bg-zinc-950 border-l border-white/10 overflow-y-auto"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          >
            <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10 z-10">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-bold text-sm tracking-wide">Configure Agent Internet</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={reset} className="px-2 h-8 rounded-lg text-[9px] font-mono uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10">Reset</button>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 space-y-5">
              <div className="text-[9px] font-mono tracking-widest uppercase text-white/30">
                {SETTINGS.filter((s) => settings[s.key]).length}/{SETTINGS.length} active · unified superagent
              </div>
              {groups.map((g) => {
                const Icon = GROUP_ICON[g] || Cpu;
                const items = SETTINGS.filter((s) => s.group === g);
                return (
                  <div key={g}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-3 h-3 text-cyan-400" />
                      <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/50">{g}</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((s) => (
                        <Toggle key={s.key} on={!!settings[s.key]} onClick={() => update(s.key)} label={s.label} desc={s.desc} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}