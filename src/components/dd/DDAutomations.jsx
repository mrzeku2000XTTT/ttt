import React, { useState, useEffect } from "react";
import { Plus, Trash2, Workflow, Loader2, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DD_STORE_APPS } from "@/components/dd/ddStoreCatalog";

export default function DDAutomations() {
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [triggerApp, setTriggerApp] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("");
  const [actionApp, setActionApp] = useState("");
  const [actionText, setActionText] = useState("");
  const [busy, setBusy] = useState(false);

  const appNames = DD_STORE_APPS.map((a) => a.name);

  const load = async () => {
    setLoading(true);
    try {
      const u = await base44.auth.me();
      if (!u?.email) { setLoading(false); return; }
      const list = await base44.entities.DDAutomation.filter({ user_email: u.email }, "-created_date", 100);
      setAutos(list);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const u = await base44.auth.me();
      if (!u?.email) { setBusy(false); return; }
      const a = await base44.entities.DDAutomation.create({
        user_email: u.email,
        name: name.trim(),
        trigger_app: triggerApp,
        trigger_event: triggerEvent.trim(),
        action_app: actionApp,
        action_text: actionText.trim(),
        enabled: true,
      });
      setAutos((p) => [a, ...p]);
      setName(""); setTriggerEvent(""); setActionText("");
      await base44.entities.DDActivity.create({ user_email: u.email, text: `Automation created: ${a.name}`, icon: "⚙️" });
    } catch { }
    setBusy(false);
  };

  const toggle = async (a) => {
    try { const u = await base44.entities.DDAutomation.update(a.id, { enabled: !a.enabled }); setAutos((p) => p.map((x) => x.id === a.id ? u : x)); } catch { }
  };

  const del = async (id) => {
    try { await base44.entities.DDAutomation.delete(id); setAutos((p) => p.filter((x) => x.id !== id)); } catch { }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Automations</h1>
      <p className="text-sm text-neutral-500 mt-1">Let DD run the busywork — connect apps to trigger actions.</p>

      <div className="mt-5 bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Automation name (e.g. Email to Slack)"
          className="w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-neutral-400"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-500">When (trigger app)</label>
            <select value={triggerApp} onChange={(e) => setTriggerApp(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none">
              <option value="">Select app…</option>
              {appNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500">Event</label>
            <input value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)} placeholder="e.g. New email" className="mt-1 w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-neutral-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500">Then (action app)</label>
            <select value={actionApp} onChange={(e) => setActionApp(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none">
              <option value="">Select app…</option>
              {appNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500">Action</label>
            <input value={actionText} onChange={(e) => setActionText(e.target.value)} placeholder="e.g. Send message" className="mt-1 w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-neutral-400" />
          </div>
        </div>
        <button onClick={add} disabled={busy || !name.trim()} className="h-10 px-4 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 flex items-center gap-1.5">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create automation
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
        ) : autos.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400 bg-white border border-neutral-200 rounded-2xl">No automations yet. Create one above.</div>
        ) : autos.map((a) => (
          <div key={a.id} className="bg-white border border-neutral-200 rounded-2xl p-4 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center"><Workflow className="w-5 h-5 text-neutral-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 text-sm truncate">{a.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5 truncate">
                  {a.trigger_app && `When ${a.trigger_app}${a.trigger_event ? `: ${a.trigger_event}` : ""}`}
                  {a.action_app && ` → ${a.action_app}${a.action_text ? `: ${a.action_text}` : ""}`}
                </p>
              </div>
              <button onClick={() => toggle(a)} className={`w-9 h-5 rounded-full flex items-center transition ${a.enabled ? "bg-neutral-900" : "bg-neutral-200"}`}>
                <span className={`w-4 h-4 rounded-full bg-white transition ${a.enabled ? "ml-auto mr-0.5" : "ml-0.5"}`} />
              </button>
              <button onClick={() => del(a.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}