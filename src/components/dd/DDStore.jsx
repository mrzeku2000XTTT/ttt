import React, { useState, useEffect } from "react";
import { Search, Plus, Plug, ExternalLink, Check, Loader2, AlertCircle, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DD_STORE_CATEGORIES, DD_STORE_APPS } from "@/components/dd/ddStoreCatalog";
import DDAppLogo from "@/components/dd/DDAppLogo";
import { isInWalletIframe } from "@/lib/kcc20Pwa";

const STATUS = { add: "Add", connect: "Connect", open: "Open" };

function appStatus(name) {
  const external = ["Uber","DoorDash","Airbnb","Spotify","YouTube","TikTok","Instagram","X","Reddit","LinkedIn","Temu","Vinted","Depop"];
  const google = ["Gmail","Google Calendar","Google Drive","Google Docs","Google Sheets","Google Slides","Google Meet"];
  if (google.includes(name)) return "connect";
  if (external.includes(name)) return "open";
  return "add";
}

export default function DDStore() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [added, setAdded] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [authed, setAuthed] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    (async () => {
      let isAuthed = false;
      try {
        const u = await base44.auth.me();
        if (u?.email) {
          isAuthed = true;
          setAuthed(true);
          const list = await base44.entities.DDConnectedApp.filter({ user_email: u.email }, "-created_date", 200);
          const map = {};
          list.forEach((a) => { map[a.app_name] = a; });
          setAdded(map);
        }
      } catch { }
      // Check wallet connection (KCC20 iframe or local TTT wallet)
      try {
        const inIframe = isInWalletIframe();
        const localWallet = localStorage.getItem("dd_wallet_connected") || sessionStorage.getItem("dd_wallet_connected");
        const tttWallet = localStorage.getItem("ttt_wallet_address");
        setWalletConnected(inIframe || !!localWallet || !!tttWallet);
      } catch {}
      if (!isAuthed) setAuthed(false);
      setLoading(false);
    })();
  }, []);

  const addApp = async (a) => {
    // Google/ChatGPT apps require a Base44 account for OAuth — wallet alone isn't enough
    if (!authed) {
      setShowAuthPrompt(true);
      return;
    }
    setBusy((b) => ({ ...b, [a.name]: true }));
    try {
      const u = await base44.auth.me();
      if (!u?.email) { setBusy((b) => ({ ...b, [a.name]: false })); setShowAuthPrompt(true); return; }
      if (added[a.name]) {
        await base44.entities.DDConnectedApp.delete(added[a.name].id);
        setAdded((s) => { const n = { ...s }; delete n[a.name]; return n; });
      } else {
        const rec = await base44.entities.DDConnectedApp.create({
          user_email: u.email,
          app_name: a.name,
          app_category: a.category,
          app_icon: a.icon,
          status: appStatus(a.name) === "connect" ? "connected" : "added",
        });
        setAdded((s) => ({ ...s, [a.name]: rec }));
        await base44.entities.DDActivity.create({ user_email: u.email, text: `Added app: ${a.name}`, icon: a.icon || "📦" });
      }
    } catch { }
    setBusy((b) => ({ ...b, [a.name]: false }));
  };

  const cats = ["All", ...DD_STORE_CATEGORIES];
  const filtered = DD_STORE_APPS.filter((a) => (cat === "All" || a.category === cat) && a.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">DD Store</h1>
      <p className="text-sm text-neutral-500 mt-1">Everything you need. One workspace.</p>

      {/* Auth required banner for wallet-only users (e.g. KCC20 iframe) */}
      {!loading && !authed && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Sign up to add Google & ChatGPT apps</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              {walletConnected
                ? "Your wallet is connected, but Google and ChatGPT need a free account to store the connection. Sign up with your email — it takes 10 seconds."
                : "Google and ChatGPT integrations need a free account. Sign up with your email to connect them."}
            </p>
            <button
              onClick={() => base44.auth.redirectToLogin("/DD")}
              className="mt-2.5 h-8 px-3 rounded-lg bg-amber-600 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-amber-700"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign up / Log in
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 h-10">
        <Search className="w-4 h-4 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps…" className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400" />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap border transition ${cat === c ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"}`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
      ) : (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((a) => {
            const st = appStatus(a.name);
            const isAdded = !!added[a.name];
            const isBusy = busy[a.name];
            return (
              <div key={a.name} className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0"><DDAppLogo name={a.name} className="w-6 h-6" /></div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm truncate">{a.name}</p>
                    <p className="text-[11px] text-neutral-400">{a.category}</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-3 leading-relaxed flex-1">{a.desc}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">{isAdded ? "In your workspace" : st === "connect" ? "Not connected" : "Available"}</span>
                  <button
                    onClick={() => addApp(a)}
                    disabled={isBusy}
                    className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-40 ${isAdded ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : st === "open" ? "bg-white text-neutral-900 border border-neutral-200 hover:border-neutral-300" : "bg-neutral-900 text-white"}`}
                  >
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isAdded ? <><Check className="w-3.5 h-3.5" /> Added</> : st === "open" ? <><ExternalLink className="w-3.5 h-3.5" /> Open</> : st === "connect" ? <><Plug className="w-3.5 h-3.5" /> Connect</> : <><Plus className="w-3.5 h-3.5" /> Add</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {filtered.length === 0 && <p className="text-center text-sm text-neutral-400 mt-10">No apps found.</p>}

      {/* Auth prompt modal when trying to add/connect without an account */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAuthPrompt(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Account needed</h3>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {walletConnected
                ? "Your Kaspa wallet is connected, but Google and ChatGPT need a free account to store the OAuth connection. Sign up with your email — your wallet stays linked."
                : "Google and ChatGPT integrations need a free account to store your connection securely. Sign up with your email to get started."}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setShowAuthPrompt(false); base44.auth.redirectToLogin("/DD"); }}
                className="flex-1 h-10 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" /> Sign up / Log in
              </button>
              <button onClick={() => setShowAuthPrompt(false)} className="h-10 px-4 rounded-xl text-sm text-neutral-500 hover:bg-neutral-100">
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}