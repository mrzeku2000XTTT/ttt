import React, { useState, useEffect } from "react";
import { Search, Plus, Plug, ExternalLink, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DD_STORE_CATEGORIES, DD_STORE_APPS } from "@/components/dd/ddStoreCatalog";

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

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        if (u?.email) {
          const list = await base44.entities.DDConnectedApp.filter({ user_email: u.email }, "-created_date", 200);
          const map = {};
          list.forEach((a) => { map[a.app_name] = a; });
          setAdded(map);
        }
      } catch { }
      setLoading(false);
    })();
  }, []);

  const addApp = async (a) => {
    setBusy((b) => ({ ...b, [a.name]: true }));
    try {
      const u = await base44.auth.me();
      if (!u?.email) { setBusy((b) => ({ ...b, [a.name]: false })); return; }
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
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-lg">{a.icon}</div>
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
    </div>
  );
}