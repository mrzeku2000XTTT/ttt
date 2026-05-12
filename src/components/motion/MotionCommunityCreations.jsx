import React, { useEffect, useState } from "react";
import { Download, Loader2, Users, Code2, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MotionCommunityCreations({ onLoadCreation }) {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    base44.entities.MotionCreation.filter({ is_public: true }, "-created_date", 50)
      .then(setCreations)
      .finally(() => setLoading(false));
  }, []);

  const downloadCode = (creation) => {
    const blob = new Blob([creation.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(creation.title || "motion-creation").replace(/[^a-z0-9]/gi, "-")}.jsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = async (creation) => {
    await navigator.clipboard.writeText(creation.code || "");
    setCopiedId(creation.id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold">Community Creations</h2>
            <p className="text-white/40 text-[10px]">Motion sites shared by creators</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {loading ? (
          <div className="h-full flex items-center justify-center text-white/40 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading creations…
          </div>
        ) : creations.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-sm">
              <Users className="w-10 h-10 mx-auto mb-3 text-white/20" />
              <h3 className="text-white font-bold text-sm mb-1">No community creations yet</h3>
              <p className="text-white/35 text-xs">Generate a Motion site, then save it to community.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {creations.map((creation) => (
              <div key={creation.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-white text-sm font-black truncate">{creation.title}</h3>
                    <p className="text-white/35 text-[10px] truncate">
                      by {creation.creator_name || creation.creator_email || "Motion creator"}
                    </p>
                  </div>
                  <Code2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                </div>

                <p className="text-white/45 text-xs leading-relaxed line-clamp-4 mb-4">{creation.prompt}</p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onLoadCreation?.(creation)}
                    className="flex-1 min-w-[110px] h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-200 text-[11px] font-bold hover:bg-cyan-500/25"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => copyCode(creation)}
                    className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white/70 text-[11px] font-bold hover:bg-white/10 flex items-center gap-1.5"
                  >
                    {copiedId === creation.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                  <button
                    onClick={() => downloadCode(creation)}
                    className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white/70 text-[11px] font-bold hover:bg-white/10 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> JSX
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}