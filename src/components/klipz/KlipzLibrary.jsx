import React, { useEffect, useState } from "react";
import { Loader2, Download, Library } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KlipzClipCard from "@/components/klipz/KlipzClipCard";

export default function KlipzLibrary() {
  const [jobs, setJobs] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [dlError, setDlError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const list = await base44.entities.KlipzJob.filter({ user_email: user.email }, "-created_date", 100);
        setJobs(list);
      } catch (_e) {
        setJobs([]);
      }
    })();
  }, []);

  const downloadMp4 = async (job) => {
    setDownloading(job.id);
    setDlError(null);
    try {
      const res = await base44.functions.invoke("klipzClipMp4", { videoId: job.video_id });
      window.open(res.data.url, "_blank");
    } catch (err) {
      setDlError(err.response?.data?.error || "MP4 download unavailable right now");
    }
    setDownloading(null);
  };

  if (jobs === null) {
    return (
      <div className="text-center py-16" style={{ fontFamily: "monospace" }}>
        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 px-4" style={{ fontFamily: "monospace" }}>
        <Library className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500 text-xs tracking-widest">YOUR LIBRARY IS EMPTY</p>
        <p className="text-zinc-600 text-[10px] mt-2">Scan a stream and hire Agent Klip to deliver clips here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6" style={{ fontFamily: "monospace" }}>
      {dlError && <p className="text-amber-400 text-[11px] border border-amber-500/40 p-3 mb-4">{dlError}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job, i) => (
          <div key={job.id}>
            <KlipzClipCard
              clip={{ title: job.clip_title, reason: job.reason, start_s: job.start_s, end_s: job.end_s, score: job.score }}
              videoId={job.video_id}
              index={i}
            />
            <div className="border border-t-0 border-zinc-800 bg-zinc-950 px-4 py-2.5 flex items-center justify-between text-[10px]">
              <span className="text-emerald-400 tracking-widest">✓ DELIVERED · TX {job.tx_hash?.slice(0, 8)}…</span>
              <button
                onClick={() => downloadMp4(job)}
                disabled={downloading === job.id}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 transition-colors tracking-widest"
              >
                {downloading === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                MP4
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}