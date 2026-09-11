import React, { useEffect, useState } from "react";
import { Clock, FileCode2 } from "lucide-react";
import { loadProjects } from "@/components/tttbuilder/ProjectsPanel";
import BuilderOrb from "@/components/tttbuilder/BuilderOrb";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function thumbOf(p) {
  const idx = p.files?.find((f) => f.path === "index.html");
  return idx?.content || null;
}

export default function RecentProjects({ onOpen, onSeeAll }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setProjects(loadProjects().slice(0, 6));
  }, []);

  if (!projects.length) {
    return (
      <div className="mt-10 text-center">
        <div className="inline-flex flex-col items-center gap-2 px-6 py-5 rounded-2xl bg-[#121212]/70 backdrop-blur-sm border border-[#00ff99]/15">
          <BuilderOrb size={36} />
          <div className="text-sm font-semibold text-white">No builds yet</div>
          <div className="text-xs text-white/40">Pick a template below to start your first project.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 text-left">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Recent projects</h3>
        <button onClick={onSeeAll} className="text-xs font-semibold text-[#00ff99] hover:text-[#33ffb0]">
          See all
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#121212]/70 backdrop-blur-sm border border-[#00ff99]/15 hover:border-[#00ff99]/50 text-left transition-colors"
          >
            <div className="w-14 h-11 rounded-lg bg-black overflow-hidden flex items-center justify-center flex-shrink-0 relative">
              {thumbOf(p) ? (
                <iframe
                  srcDoc={thumbOf(p)}
                  title={p.name}
                  sandbox=""
                  scrolling="no"
                  className="w-[400px] h-[300px] origin-top-left border-0 pointer-events-none"
                  style={{ transform: "scale(0.14)", position: "absolute", top: 0, left: 0 }}
                />
              ) : (
                <FileCode2 className="w-4 h-4 text-[#00ff99]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{p.name}</div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                {timeAgo(p.savedAt)} · {p.files?.length || 0} files
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}