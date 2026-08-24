import React, { useState, useEffect } from "react";
import { Plus, Trash2, FolderKanban, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DDProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const u = await base44.auth.me();
      if (!u?.email) { setLoading(false); return; }
      const list = await base44.entities.DDProject.filter({ user_email: u.email }, "-created_date", 100);
      setProjects(list);
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
      const p = await base44.entities.DDProject.create({ user_email: u.email, name: name.trim(), description: desc.trim() });
      setProjects((prev) => [p, ...prev]);
      setName(""); setDesc("");
      await base44.entities.DDActivity.create({ user_email: u.email, text: `Project created: ${p.name}`, icon: "📁" });
    } catch { }
    setBusy(false);
  };

  const del = async (id) => {
    try { await base44.entities.DDProject.delete(id); setProjects((p) => p.filter((x) => x.id !== id)); } catch { }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Projects</h1>
      <p className="text-sm text-neutral-500 mt-1">Organize your work into projects.</p>

      <div className="mt-5 bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-neutral-400"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-neutral-400 resize-none"
        />
        <button onClick={add} disabled={busy || !name.trim()} className="h-10 px-4 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 flex items-center gap-1.5">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create project
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-10 text-center text-sm text-neutral-400">No projects yet. Create one above.</div>
        ) : projects.map((p) => (
          <div key={p.id} className="bg-white border border-neutral-200 rounded-2xl p-4 group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center"><FolderKanban className="w-5 h-5 text-neutral-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 text-sm truncate">{p.name}</p>
                {p.description && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{p.description}</p>}
              </div>
              <button onClick={() => del(p.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}