import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Film, Loader2, Lock, ScanLine, Sparkles, Wand2, Zap } from "lucide-react";
import html2canvas from "html2canvas";
import { base44 } from "@/api/base44Client";
import SingleVideoPicker from "@/components/beatcut/SingleVideoPicker";
import VideoEffectPreview from "@/components/beatcut/VideoEffectPreview";
import AnalysisLogPanel from "@/components/beatcut/AnalysisLogPanel";
import PresetTemplatePicker from "@/components/beatcut/PresetTemplatePicker";
import { analyzeVideoFrames } from "@/components/beatcut/videoFrameAnalyzer";
import { applyAnimationTemplate, buildStaticImagePlan, DEFAULT_TEMPLATE_ID, getAnimationTemplate } from "@/components/beatcut/animationTemplates";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/80ea7b3ed_generated_image.png";

export default function BeatCutPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [video, setVideo] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [rawAnalysis, setRawAnalysis] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [analysisLogs, setAnalysisLogs] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null)).finally(() => setAuthLoading(false));
  }, []);

  const isAdmin = user?.role === "admin";

  const handleVideoSet = async (nextVideo) => {
    setVideo(nextVideo);
    setAnalysis(null);
    setRawAnalysis(null);
    setAnalysisLogs([{ text: `${nextVideo.type === "image" ? "Image" : "Video"} received. Preparing template scan…` }]);
    setAnalyzing(true);
    const result = nextVideo.type === "image"
      ? buildStaticImagePlan(10)
      : await analyzeVideoFrames(nextVideo.file, 10, (entry) => {
          setAnalysisLogs((prev) => [...prev, entry]);
        });
    setRawAnalysis(result);
    setAnalysis(applyAnimationTemplate(result, getAnimationTemplate(selectedTemplateId)));
    setAnalysisLogs((prev) => [...prev, { text: `Template applied: ${getAnimationTemplate(selectedTemplateId).name}`, done: true }]);
    setAnalyzing(false);
  };

  const clearVideo = () => {
    setVideo(null);
    setAnalysis(null);
    setRawAnalysis(null);
    setAnalysisLogs([]);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    if (rawAnalysis) {
      const template = getAnimationTemplate(templateId);
      setAnalysis(applyAnimationTemplate(rawAnalysis, template));
      setAnalysisLogs((prev) => [...prev, { text: `Template switched to ${template.name}`, done: true }]);
    }
  };

  const handleExport = async () => {
    const stage = previewRef.current?.getStage?.();
    if (!stage || !analysis || rendering) return;
    setRendering(true);
    const canvas = await html2canvas(stage, { backgroundColor: null, scale: 2, useCORS: true, logging: false });
    const link = document.createElement("a");
    link.download = `beatcut-frame-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setRendering(false);
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
          <div className="w-20" />
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-fuchsia-200 mb-4">
            <Sparkles className="w-3 h-3" /> Plug MP4/images into reusable animation templates
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.92] max-w-4xl">
            Pick a template. Plug in MP4 or image. Auto-animate.
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-2xl mt-4 leading-relaxed">
            Choose a preset animation template, upload an MP4 or image, and BeatCut places it inside a 10-second animated video style with pre-built punch, shake, flash, neon, and zoom effects.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 lg:gap-8">
          <section className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Panel>
              <PresetTemplatePicker selectedId={selectedTemplateId} onSelect={handleTemplateSelect} />
            </Panel>
            <Panel>
              <SingleVideoPicker video={video} onSet={handleVideoSet} onClear={clearVideo} />
            </Panel>
            <Panel>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">Frame analysis</div>
                {analyzing && <Loader2 className="w-4 h-4 text-fuchsia-300 animate-spin" />}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Stat icon={ScanLine} label="Frames" value={analysis?.samples?.length || "—"} />
                <Stat icon={Zap} label="Effects" value={analysis?.effects?.length || "—"} />
                <Stat icon={Film} label="Length" value={analysis ? `${analysis.duration.toFixed(1)}s` : "10s"} />
              </div>
              <AnalysisLogPanel logs={analysisLogs} active={analyzing} />
            </Panel>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[minmax(260px,420px)_1fr] gap-4 items-start">
            <div className="mx-auto w-full max-w-[420px]">
              <VideoEffectPreview ref={previewRef} video={video} analysis={analysis} rendering={rendering} onExport={handleExport} />
            </div>
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 sm:p-6 overflow-hidden">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-lg">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Auto effect plan</h2>
                  <p className="text-white/45 text-xs">Generated from frame motion + brightness</p>
                </div>
              </div>

              {!analysis ? (
                <div className="rounded-2xl bg-black/25 border border-white/10 p-5 text-sm text-white/45">
                  {analyzing ? "Analyzing every sampled frame…" : "Upload one video to generate the effect timeline."}
                </div>
              ) : (
                <div className="space-y-2">
                  {analysis.effects.map((effect, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-2xl bg-black/25 border border-white/10 p-3">
                      <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-black">{index + 1}</div>
                      <div className="flex-1">
                        <div className="text-sm font-black capitalize">{effect.effect}</div>
                        <div className="text-[10px] text-white/40 font-mono">{effect.start.toFixed(1)}s – {effect.end.toFixed(1)}s · motion {effect.motion.toFixed(1)} · light {effect.brightness.toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
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