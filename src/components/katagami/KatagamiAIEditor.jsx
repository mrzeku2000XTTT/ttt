import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, Sparkles, Film, Wand2, ExternalLink, CheckCircle2, X, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Katagami AI Editor
 * Drop an image or video → AI designs a motion edit → opens UltraMock
 * auto-render in a new tab which records and (optionally) emails the MP4.
 */
export default function KatagamiAIEditor() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [vibe, setVibe] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState("idle"); // idle | uploading | thinking | ready | error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { plan, render_url }
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Only images or videos are supported.");
      setStage("error");
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStage("idle");
    setResult(null);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setVibe("");
    setStage("idle");
    setResult(null);
    setError(null);
  };

  const generate = async () => {
    if (!file) return;
    setError(null);
    try {
      // 1) Upload the file
      setStage("uploading");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error("Upload failed");

      // 2) Ask the AI editor to design a plan
      setStage("thinking");
      const res = await base44.functions.invoke("katagamiAutoEdit", {
        media_url: file_url,
        media_type: file.type.startsWith("video/") ? "video" : "image",
        vibe,
        email: email.trim() || undefined,
      });
      const data = res?.data;
      if (!data?.success) throw new Error(data?.error || "AI editor failed");

      setResult(data);
      setStage("ready");
    } catch (e) {
      setError(e.message || "Something went wrong");
      setStage("error");
    }
  };

  const isVideo = file?.type?.startsWith("video/");
  const isWorking = stage === "uploading" || stage === "thinking";

  return (
    <div>
      <ChapterHeader />

      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        Drop an image or video. AI picks the perfect motion preset, tagline, background and timing,
        then renders a cinematic MP4 you can download or get emailed.
      </p>

      <div className="grid md:grid-cols-[1.2fr_1fr] gap-6">
        {/* LEFT — Drop zone & preview */}
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
              dragOver
                ? "border-fuchsia-400 bg-fuchsia-500/10"
                : file
                  ? "border-white/20 bg-black/40"
                  : "border-white/15 bg-white/[0.02] hover:border-fuchsia-400/50 hover:bg-white/5 cursor-pointer"
            }`}
            style={{ minHeight: 280 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {!file ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-fuchsia-500/30">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="text-white font-bold text-base mb-1">Drop image or video</div>
                <div className="text-white/40 text-xs">or click to browse</div>
              </div>
            ) : (
              <div className="relative">
                {isVideo ? (
                  <video src={previewUrl} className="w-full h-72 object-cover" controls muted />
                ) : (
                  <img src={previewUrl} alt="" className="w-full h-72 object-cover" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-black border border-white/20 flex items-center justify-center text-white/80 hover:text-white"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="px-3 py-2 text-[11px] text-white/60 bg-black/60 border-t border-white/10 truncate">
                  {file.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 block">
              Vibe (optional)
            </label>
            <textarea
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. dramatic launch trailer, playful product reveal, moody cinematic teaser…"
              className="w-full h-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-fuchsia-400/50 focus:bg-white/10 outline-none resize-none"
              disabled={isWorking}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email me the MP4 (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-fuchsia-400/50 focus:bg-white/10 outline-none"
              disabled={isWorking}
            />
          </div>

          <button
            onClick={generate}
            disabled={!file || isWorking}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-sm tracking-wide shadow-lg shadow-fuchsia-500/30 flex items-center justify-center gap-2"
          >
            {stage === "uploading" && <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>}
            {stage === "thinking" && <><Sparkles className="w-4 h-4 animate-pulse" /> AI is editing…</>}
            {!isWorking && <><Wand2 className="w-4 h-4" /> Auto-Edit with AI</>}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* RESULT */}
      <AnimatePresence>
        {stage === "ready" && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-fuchsia-900/30 border border-emerald-500/40"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div className="text-white font-bold text-sm">AI Edit Ready</div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4 text-xs">
              <PlanRow label="Tagline" value={result.plan.tagline || "—"} />
              <PlanRow label="Motion" value={result.plan.preset_id} />
              <PlanRow label="Device" value={result.plan.device} />
              <PlanRow label="Background" value={result.plan.background} />
              <PlanRow label="Duration" value={`${result.plan.duration}s`} />
            </div>

            {result.plan.reasoning && (
              <p className="text-white/60 text-xs italic mb-4">"{result.plan.reasoning}"</p>
            )}

            <a
              href={result.render_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white text-black font-black text-sm hover:bg-white/90"
            >
              <Film className="w-4 h-4" /> Render & Download MP4
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
            <p className="text-white/40 text-[10px] mt-2">
              Opens in a new tab. The MP4 will auto-download when rendering finishes
              {email ? ` and a copy will be emailed to ${email}.` : "."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanRow({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 uppercase tracking-wider text-[10px] font-bold w-20 flex-shrink-0">{label}</span>
      <span className="text-white font-mono text-xs truncate">{value}</span>
    </div>
  );
}

function ChapterHeader() {
  return (
    <div className="flex items-end gap-4 border-b border-white/10 pb-4">
      <div className="text-7xl md:text-8xl font-black text-white/10 leading-none tabular-nums">AI</div>
      <div className="flex-1">
        <div className="text-3xl md:text-4xl font-black text-fuchsia-300 mb-1">編集</div>
        <h2 className="text-xl md:text-2xl font-bold text-white">AI Auto-Editor</h2>
      </div>
      <Sparkles className="w-5 h-5 text-fuchsia-300 hidden md:block" />
    </div>
  );
}