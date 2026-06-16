import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FolderClosed, ImageIcon, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StoryboardProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.StoryboardProject.list("-created_date", 100)
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id, e) => {
    e.stopPropagation();
    await base44.entities.StoryboardProject.delete(id);
    setProjects((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <button onClick={() => navigate("/QuickStoryboard")} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Studio
        </button>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500"><FolderClosed className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">My Projects</h1>
            <p className="text-sm text-white/50">All your generated storyboards.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/40">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm font-semibold">No storyboards yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {projects.map((p) => (
              <div key={p.id} onClick={() => navigate(`/StoryboardBRoll?id=${p.id}`)} className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/40 cursor-pointer">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.idea} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-white/20" /></div>
                )}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-transparent p-2.5">
                  <p className="truncate text-xs font-bold text-white/90">{p.idea || "Untitled"}</p>
                  <p className="text-[10px] text-white/50">{p.style || "Custom"}</p>
                </div>
                <button onClick={(e) => remove(p.id, e)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/60 opacity-0 transition hover:bg-red-500/80 hover:text-white group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}