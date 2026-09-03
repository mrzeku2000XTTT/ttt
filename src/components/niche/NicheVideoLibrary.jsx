import React, { useState, useEffect } from 'react';
import { Film, ChevronLeft, Play, ShieldCheck, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Minimal library of every explainer video the user made — video, script, narration.
export default function NicheVideoLibrary() {
  const [videos, setVideos] = useState(null); // null = loading
  const [open, setOpen] = useState(null);

  useEffect(() => {
    base44.entities.NicheVideo.list('-created_date', 100).then(setVideos).catch(() => setVideos([]));
  }, []);

  if (videos === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="max-w-md mx-auto px-4 text-center pt-16">
        <Film className="w-10 h-10 text-white/30 mx-auto mb-4" />
        <h2 className="text-2xl font-black">No videos yet</h2>
        <p className="text-white/50 text-sm mt-2">
          Every video you make in Automatic or Manual lands here — with its full script and narration.
        </p>
      </div>
    );
  }

  const date = (d) => new Date(d).toLocaleDateString();

  if (open) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => setOpen(null)}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium mb-5"
        >
          <ChevronLeft className="w-4 h-4" /> Library
        </button>

        <video src={open.video_url} controls className="w-full rounded-2xl border border-white/10 bg-black" />

        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-black break-words">{open.title}</h1>
            <p className="text-white/40 text-xs mt-1">
              {open.style_name || 'Neutral'} style · {open.scenes?.length || 0} scenes · {date(open.created_date)}
            </p>
          </div>
          <a
            href={open.video_url}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-sm font-medium transition-all shrink-0"
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download</span>
          </a>
        </div>

        {(open.description || open.tags?.length || open.fact_note) && (
          <div className="mt-5 rounded-2xl border border-white/10 p-4 space-y-3">
            {open.description && <p className="text-white/70 text-sm leading-relaxed">{open.description}</p>}
            {open.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {open.tags.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full border border-white/10 text-white/50 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {open.fact_note && (
              <p className="text-white/40 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Fact-checked: {open.fact_note}
              </p>
            )}
          </div>
        )}

        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mt-8 mb-3">Script &amp; narration</h2>
        <ol className="space-y-3">
          {(open.scenes || []).map((s, i) => (
            <li key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-white/40 text-xs mb-1">Scene {i + 1} · {s.caption}</p>
              <p className="text-white text-sm leading-relaxed">{s.voiceover}</p>
              <p className="text-white/30 text-xs mt-1.5">Visual: {s.action}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto px-4 sm:px-6">
      {videos.map((v) => (
        <button
          key={v.id}
          onClick={() => setOpen(v)}
          className="group text-left rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-white/30 transition-all"
        >
          <div className="relative">
            <video
              src={v.video_url}
              muted
              preload="metadata"
              className="w-full aspect-video object-cover bg-black pointer-events-none"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center">
                <Play className="w-5 h-5" />
              </span>
            </div>
          </div>
          <div className="p-4">
            <p className="font-bold text-sm truncate">{v.title}</p>
            <p className="text-white/40 text-xs mt-1">
              {v.style_name || 'Neutral'} · {v.scenes?.length || 0} scenes · {date(v.created_date)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}