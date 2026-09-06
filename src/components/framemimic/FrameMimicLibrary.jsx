import React, { useEffect, useState } from "react";
import { FolderOpen, Trash2 } from "lucide-react";
import { listProjects, deleteProject } from "./frameMimicStore";

// Library of saved FrameMimic projects (persisted in IndexedDB, survives refresh).
export default function FrameMimicLibrary({ refreshKey, onLoad }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    listProjects().then(setProjects).catch(() => setProjects([]));
  }, [refreshKey]);

  if (!projects.length) return null;

  const remove = async (id) => {
    await deleteProject(id).catch(() => {});
    setProjects((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-white/40">
        Library — saved projects
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
            <p className="text-xs font-bold truncate">{p.name}</p>
            <p className="text-[10px] text-white/40">
              {p.frameCount} frames · {p.fps} fps · {new Date(p.savedAt).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onLoad(p)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white text-black text-[11px] font-bold"
              >
                <FolderOpen className="w-3 h-3" /> Open
              </button>
              <button
                onClick={() => remove(p.id)}
                className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-red-400"
                title="Delete project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}