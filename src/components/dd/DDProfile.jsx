import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Wallet, Loader2, User, LogOut, Download, Copy, Eye, EyeOff, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DDWalletButton from "@/components/dd/DDWalletButton";
import { getWallet } from "@/lib/localKaspaWallet";

const NAME_KEY = "dd_profile_name";
const PLAN_KEY = "dd_profile_plan";

function getConnectedAddr() {
  try {
    return localStorage.getItem("dd_kcc20_connected")
      || sessionStorage.getItem("dd_wallet_connected")
      || localStorage.getItem("ttt_wallet_address")
      || null;
  } catch { return null; }
}
function initials(name) {
  const n = (name || "").trim();
  if (!n) return "DD";
  const parts = n.split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || n.slice(0, 2).toUpperCase();
}

export default function DDProfile() {
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [plan, setPlan] = useState("Free");
  const [addr, setAddr] = useState(getConnectedAddr());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [exportedKey, setExportedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const exportKeys = () => {
    const w = getWallet();
    if (!w?.privateKey) return;
    setExportedKey({ address: w.address, privateKey: w.privateKey });
    setShowKeys(true);
  };
  const copyKey = () => {
    if (!exportedKey?.privateKey) return;
    try { navigator.clipboard.writeText(exportedKey.privateKey); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  useEffect(() => {
    try { setName(localStorage.getItem(NAME_KEY) || ""); setSavedName(localStorage.getItem(NAME_KEY) || ""); } catch {}
    try { setPlan(localStorage.getItem(PLAN_KEY) || "Free"); } catch {}
    base44.auth.isAuthenticated().then(setLoggedIn).catch(() => setLoggedIn(false));
    base44.auth.me().then((u) => {
      if (u?.full_name) { setName(u.full_name); setSavedName(u.full_name); try { localStorage.setItem(NAME_KEY, u.full_name); } catch {} }
    }).catch(() => {});
    // Refresh wallet address periodically — DDWalletButton writes to localStorage async
    const tick = () => setAddr(getConnectedAddr());
    tick();
    const iv = setInterval(tick, 1500);
    return () => clearInterval(iv);
  }, []);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      try { localStorage.setItem(NAME_KEY, name.trim()); } catch {}
      setSavedName(name.trim());
      if (loggedIn) { try { await base44.auth.updateMe({ full_name: name.trim() }); } catch {} }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 w-full overflow-x-hidden">
      {/* Identity card */}
      <div className="mt-5 bg-white border border-neutral-200 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-900 text-white text-lg font-semibold flex items-center justify-center">
            {initials(savedName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900 truncate">{savedName || "Set your name below"}</p>
            <p className="text-sm text-neutral-500">{plan} plan</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-neutral-500">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full h-11 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="h-11 px-5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
            {saving ? "Saving…" : saved ? "Saved" : "Save profile"}
          </button>
        </div>
      </div>

      {/* Wallet card */}
      <div className="mt-4 bg-white border border-neutral-200 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-semibold text-neutral-900">TTT Wallet</h3>
          </div>
          <DDWalletButton />
        </div>
        {addr ? (
          <>
            <p className="mt-3 text-xs text-neutral-400 break-all">{addr}</p>
            <button onClick={exportKeys} className="mt-3 w-full h-10 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Export private key
            </button>
            {showKeys && exportedKey && (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-amber-700 font-medium">Store this key safely — anyone with it controls your funds. You'll need it to recover this wallet on another device.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowKeys(!showKeys)} className="text-[11px] text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
                    {showKeys ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
                  </button>
                  <button onClick={copyKey} className="text-[11px] text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
                    {copied ? <><Check className="w-3 h-3 text-emerald-600" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                {showKeys && (
                  <p className="text-[10px] font-mono text-neutral-800 break-all bg-white border border-neutral-200 rounded-lg p-2 select-all">{exportedKey.privateKey}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-xs text-neutral-400">Create a TTT wallet to get started. Keys stay on this device — export them anytime so you never lose access.</p>
        )}
      </div>

      {/* Exit to App Store */}
      <Link to="/AppStoreV2" className="mt-4 w-full h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Exit to App Store
      </Link>
    </div>
  );
}