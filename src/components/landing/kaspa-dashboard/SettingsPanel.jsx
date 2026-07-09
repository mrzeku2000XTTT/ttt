import React, { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Globe, Check, Save, ChevronDown, Wallet, Bell, Eye, Zap } from "lucide-react";
import { IOS_FONT, KRC_OPTIONS, PREFS_KEY } from "./shared";

export default function SettingsPanel({ preferences, onUpdate }) {
  const [prefs, setPrefs] = useState(preferences || { krcType: null, site: "" });
  const [saved, setSaved] = useState(false);
  const [showKrcDropdown, setShowKrcDropdown] = useState(false);

  // Local preference toggles (dashboard-only settings)
  const [toggles, setToggles] = useState(() => {
    try {
      const saved = localStorage.getItem("kaspa_dash_toggles");
      return saved ? JSON.parse(saved) : { showUsd: true, autoRefresh: false, notifications: false };
    } catch {
      return { showUsd: true, autoRefresh: false, notifications: false };
    }
  });

  const updatePref = (key, value) => setPrefs({ ...prefs, [key]: value });

  const toggleSetting = (key) => {
    const newToggles = { ...toggles, [key]: !toggles[key] };
    setToggles(newToggles);
    try { localStorage.setItem("kaspa_dash_toggles", JSON.stringify(newToggles)); } catch {}
  };

  const handleSave = () => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
    onUpdate?.(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedKrc = KRC_OPTIONS.find(o => o.value === prefs.krcType);

  return (
    <div className="px-5 space-y-4" style={{ fontFamily: IOS_FONT }}>
      {/* KRC Type */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 flex items-center gap-1.5">
          <Coins className="w-3 h-3" /> What do you represent?
        </div>
        <button onClick={() => setShowKrcDropdown(!showKrcDropdown)}
          className="w-full flex items-center justify-between rounded-xl px-3.5 py-3"
          style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span className={`text-sm ${selectedKrc ? "text-white" : "text-white/30"}`}>
            {selectedKrc ? selectedKrc.label : "Select your type…"}
          </span>
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showKrcDropdown ? "rotate-180" : ""}`} />
        </button>
        {showKrcDropdown && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-1 rounded-xl overflow-hidden" style={{ background: "rgba(28,28,30,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {KRC_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => { updatePref("krcType", opt.value); setShowKrcDropdown(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left ${prefs.krcType === opt.value ? "bg-[#0A84FF]/10" : "hover:bg-white/5"}`}>
                <div>
                  <div className="text-sm text-white">{opt.label}</div>
                  <div className="text-[10px] text-white/40">{opt.desc}</div>
                </div>
                {prefs.krcType === opt.value && <Check className="w-3.5 h-3.5 text-[#0A84FF]" />}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Website URL */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 flex items-center gap-1.5">
          <Globe className="w-3 h-3" /> Website / Project URL
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-3" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <input type="url" inputMode="url" value={prefs.site || ""} onChange={(e) => updatePref("site", e.target.value)}
            placeholder="https://yoursite.com"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none" />
        </div>
      </div>

      {/* Dashboard Preferences */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2">Dashboard Preferences</div>
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { key: "showUsd", label: "Show USD equivalent", icon: Eye },
            { key: "autoRefresh", label: "Auto-refresh balance", icon: Zap },
            { key: "notifications", label: "Transaction notifications", icon: Bell },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className={`flex items-center gap-3 px-3.5 py-3 ${i > 0 ? "border-t border-white/5" : ""}`}>
                <Icon className="w-3.5 h-3.5 text-white/40" />
                <span className="text-xs text-white/70 flex-1">{item.label}</span>
                <button onClick={() => toggleSetting(item.key)}
                  className="w-9 h-5 rounded-full transition-colors flex items-center"
                  style={{ background: toggles[item.key] ? "#0A84FF" : "rgba(255,255,255,0.1)" }}>
                  <div className="w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: toggles[item.key] ? "translateX(18px)" : "translateX(2px)" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave}
        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        style={{ background: "#0A84FF", color: "#fff" }}>
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Preferences"}
      </button>
    </div>
  );
}