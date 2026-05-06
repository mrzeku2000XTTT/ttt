import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Loader2, Lock, Sparkles, Wand2, Zap, Smartphone, Monitor, Square, Music2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MediaPicker from "@/components/beatcut/MediaPicker";
import TemplateGallery from "@/components/beatcut/TemplateGallery";
import MusicPicker from "@/components/beatcut/MusicPicker";
import AutoCutPreview from "@/components/beatcut/AutoCutPreview";
import BeatTimeline from "@/components/beatcut/BeatTimeline";
import { ASPECTS, getTemplate } from "@/components/beatcut/beatcutTemplates";
import { buildCutPlan, detectBeats } from "@/components/beatcut/beatDetect";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/80ea7b3ed_generated_image.png";

export default function BeatCutPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clips, setClips] = useState([]);
  const [track, setTrack] = useState(null);
  const [beatsData, setBeatsData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [templateId, setTemplateId] = useState("punchy");
  const [aspectId, setAspectId] = useState("9:16");
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const previewRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null)).finally(() => setAuthLoading(false));
  }, []);

  const isAdmin = user?.role === "admin";
  const template = useMemo(() => getTemplate(templateId), [templateId]);

  useEffect(() => {
    if (track?.beatsData) {
      setBeatsData(track.beatsData);
      setAnalyzing(false);
      return;
    }
    if (!track?.file) {
      setBeatsData(null);
      return;
    }
    let cancelled = false;
    setAnalyzing(true);
    detectBeats(track.file, { threshold: templateId === "dreamy" ? 1.2 : 1.35 })
      .then((data) => { if (!cancelled) setBeatsData(data); })
      .catch(() => { if (!cancelled) setBeatsData(null); })
      .finally(() => { if (!cancelled) setAnalyzing(false); });
    return () => { cancelled = true; };
  }, [track, templateId]);

  const duration = beatsData?.duration || 12;
  const cutPlan = useMemo(() => {
    if (!beatsData?.beats?.length) return clips.length ? buildEvenCutPlan(duration, Math.max(4, clips.length * 2)) : [];
    const minClip = templateId === "cinematic" || templateId === "dreamy" ? 0.9 : 0.42;
    return buildCutPlan(beatsData.beats, beatsData.duration, minClip);
  }, [beatsData, clips.length, duration, templateId]);

  const addClip = (clip) => setClips((prev) => [...prev, clip]);
  const removeClip = (id) => setClips((prev) => prev.filter((c) => c.id !== id));

  const handleExport = async () => {
    if (!previewRef.current || rendering || clips.length === 0 || cutPlan.length < 2) return;
    setRendering(true);
    setProgress(0);
    const ticker = setInterval(() => setProgress((p) => Math.min(0.95, p + 0.03)), 600);
    try {
      const result = await previewRef.current.startRecording();
      if (result?.blob?.size) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `beatcut-autoedit-${Date.now()}.${result.ext || "webm"}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
      }
      setProgress(1);
    } finally {
      clearInterval(ticker);
      setRendering(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-sm text-center rounded-3xl bg-white/5 border border-white/10 p-8">
          <Lock className="w-10 h-10 mx-auto mb-4 text-fuchsia-300" />
          <h1 className="text-2xl font-black mb-2">Admin only</h1>
          <p className="text-white/50 text-sm mb-5">BeatCut is currently limited to admin users while it is being polished.</p>
          <Link to="/AppStoreV2" className="inline-flex h-10 px-5 rounded-full bg-white text-black items-center justify-center text-sm font-bold">Back to App Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05030A] text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-fuchsia-500/30 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-500/20 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-20 sticky top-0 bg-black/40 backdrop-blur-2xl border-b border-white/10" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/AppStoreV2" className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> App Store
          </Link>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="BeatCut" className="w-8 h-8 rounded-xl shadow-lg shadow-fuchsia-500/30" />
            <span className="font-black tracking-tight">BeatCut</span>
          </div>
          <button
            onClick={handleExport}
            disabled={rendering || clips.length === 0 || cutPlan.length < 2}
            className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-full bg-white text-black hover:opacity-90 disabled:opacity-30 text-sm font-black"
          >
            {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-fuchsia-200 mb-4">
            <Sparkles className="w-3 h-3" /> CapCut-style AutoCut B · admin beta
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.92] max-w-4xl">
            Drop clips. Add a beat. Get an auto-edit.
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-2xl mt-4 leading-relaxed">
            BeatCut auto-merges your photos and videos, detects music beats, applies a vibe template, and previews a polished short-form edit for mobile or desktop.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 lg:gap-8">
          <section className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Panel>
              <MediaPicker clips={clips} onAdd={addClip} onRemove={removeClip} />
            </Panel>
            <Panel>
              <MusicPicker
                track={track}
                onSet={setTrack}
                onClear={() => { setTrack(null); setBeatsData(null); }}
                analyzing={analyzing}
                beatsData={beatsData}
              />
            </Panel>
            <Panel>
              <TemplateGallery selectedId={templateId} onSelect={setTemplateId} />
            </Panel>
            <Panel>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">Format</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ASPECTS.map((a) => {
                  const Icon = a.id === "9:16" ? Smartphone : a.id === "16:9" ? Monitor : Square;
                  const active = aspectId === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAspectId(a.id)}
                      className={`rounded-xl p-3 text-left border transition-all ${active ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"}`}
                    >
                      <Icon className="w-4 h-4 mb-2" />
                      <div className="text-xs font-black">{a.label}</div>
                      <div className="text-[10px] opacity-60">{a.id}</div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </section>

          <section className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,420px)_1fr] gap-4 items-start">
              <div className="mx-auto w-full max-w-[420px]">
                <AutoCutPreview
                  ref={previewRef}
                  clips={clips}
                  cutPlan={cutPlan}
                  audioUrl={track?.url}
                  template={template}
                  aspectId={aspectId}
                  duration={duration}
                />
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 sm:p-6 overflow-hidden">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${template.accent} flex items-center justify-center text-2xl shadow-lg`}>
                      {template.emoji}
                    </div>
                    <div>
                      <h2 className="text-xl font-black">{template.label} AutoEdit</h2>
                      <p className="text-white/45 text-xs">{template.vibe}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                    <Stat icon={Zap} label="Cuts" value={cutPlan.length > 1 ? cutPlan.length - 1 : 0} />
                    <Stat icon={Music2} label="BPM" value={beatsData?.bpm || "—"} />
                    <Stat icon={Wand2} label="Template" value={template.label} />
                    <Stat icon={Sparkles} label="Format" value={aspectId} />
                  </div>

                  <BeatTimeline clips={clips} cutPlan={cutPlan} beats={beatsData?.beats || []} duration={duration} />

                  <div className="mt-5 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleExport}
                      disabled={rendering || clips.length === 0 || cutPlan.length < 2}
                      className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 hover:opacity-90 disabled:opacity-30 text-white text-sm font-black shadow-lg shadow-fuchsia-500/25"
                    >
                      {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {rendering ? "Rendering…" : "Export AutoEdit"}
                    </button>
                  </div>

                  {rendering && (
                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-300 transition-all" style={{ width: `${progress * 100}%` }} />
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-white/[0.035] border border-white/10 p-5">
                  <h3 className="text-sm font-black mb-3">How it works</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Step n="01" title="Pick media" text="Add photos and videos from your device." />
                    <Step n="02" title="Add music" text="BeatCut detects bass hits and builds cut points." />
                    <Step n="03" title="Choose vibe" text="Templates add motion, color grade, and pacing." />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function buildEvenCutPlan(duration, segments) {
  const count = Math.max(2, segments);
  return Array.from({ length: count + 1 }, (_, i) => (duration / count) * i);
}

function Panel({ children }) {
  return <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 shadow-2xl shadow-black/20">{children}</div>;
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-black/30 border border-white/10 p-3">
      <Icon className="w-4 h-4 text-fuchsia-300 mb-2" />
      <div className="text-[9px] uppercase tracking-wider text-white/35 font-bold">{label}</div>
      <div className="text-sm font-black truncate">{value}</div>
    </div>
  );
}

function Step({ n, title, text }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/10 p-3">
      <div className="text-[10px] font-mono text-fuchsia-300 mb-1">{n}</div>
      <div className="text-sm font-black">{title}</div>
      <div className="text-xs text-white/45 mt-1 leading-relaxed">{text}</div>
    </div>
  );
}