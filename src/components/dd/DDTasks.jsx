import React, { useState, useEffect } from "react";
import { Plus, Check, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DDTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const u = await base44.auth.me();
      if (!u?.email) { setLoading(false); return; }
      const list = await base44.entities.DDTask.filter({ user_email: u.email }, "-created_date", 100);
      setTasks(list);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const u = await base44.auth.me();
      if (!u?.email) { setBusy(false); return; }
      const t = await base44.entities.DDTask.create({ user_email: u.email, title: title.trim(), priority });
      setTasks((p) => [t, ...p]);
      setTitle("");
      await base44.entities.DDActivity.create({ user_email: u.email, text: `Task created: ${t.title}`, icon: "✅" });
    } catch { }
    setBusy(false);
  };

  const toggle = async (t) => {
    try { const u = await base44.entities.DDTask.update(t.id, { done: !t.done }); setTasks((p) => p.map((x) => x.id === t.id ? u : x)); } catch { }
  };

  const del = async (id) => {
    try { await base44.entities.DDTask.delete(id); setTasks((p) => p.filter((x) => x.id !== id)); } catch { }
  };

  const prioColor = { high: "text-rose-600", medium: "text-amber-600", low: "text-neutral-400" };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Tasks</h1>
      <p className="text-sm text-neutral-500 mt-1">Your priorities, in focus.</p>

      <div className="mt-5 bg-white border border-neutral-200 rounded-2xl p-4">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a task…"
            className="flex-1 h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-neutral-400"
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-10 px-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button onClick={add} disabled={busy || !title.trim()} className="h-10 px-4 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 flex items-center gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </div>
      </div>

      <div className="mt-4 bg-white border border-neutral-200 rounded-2xl p-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">No tasks yet. Add one above.</div>
        ) : (
          <div className="space-y-1">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0 group">
                <button onClick={() => toggle(t)} className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${t.done ? "bg-neutral-900 border-neutral-900" : "border-neutral-300"}`}>
                  {t.done && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className={`flex-1 text-sm ${t.done ? "line-through text-neutral-400" : "text-neutral-700"}`}>{t.title}</span>
                <span className={`text-[11px] font-medium ${prioColor[t.priority] || "text-neutral-400"}`}>{t.priority}</span>
                {t.due_date && <span className="text-[11px] text-neutral-400">{t.due_date}</span>}
                <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}