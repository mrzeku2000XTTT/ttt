import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { GRADE_FILTERS, getAspect } from "./beatcutTemplates";

const AutoCutPreview = forwardRef(function AutoCutPreview({
  clips = [],
  cutPlan = [],
  audioUrl,
  template,
  aspectId = "9:16",
  duration = 12,
}, ref) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const previewRef = useRef(null);

  const aspect = getAspect(aspectId);
  const grade = GRADE_FILTERS[template?.grade] || "";
  const currentClip = clips[currentIdx % Math.max(1, clips.length)];

  const getSegmentIndex = (time) => {
    if (cutPlan.length < 2) return 0;
    for (let i = 0; i < cutPlan.length - 1; i++) {
      if (time >= cutPlan[i] && time < cutPlan[i + 1]) return i;
    }
    return Math.max(0, cutPlan.length - 2);
  };

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      const time = audioRef.current?.currentTime || 0;
      if (time >= duration) {
        reset();
        return;
      }
      setCurrentIdx(getSegmentIndex(time));
      setProgress(duration ? time / duration : 0);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [playing, cutPlan, duration]);

  const play = () => {
    if (!currentClip || cutPlan.length < 2) return;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.muted = muted;
      audioRef.current.play().catch(() => {});
    }
    setCurrentIdx(0);
    setProgress(0);
    setPlaying(true);
  };

  const pause = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  const reset = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlaying(false);
    setCurrentIdx(0);
    setProgress(0);
  };

  const togglePlay = () => {
    if (playing) pause();
    else play();
  };

  const motionClass = () => {
    const motions = template?.perClipMotion || ["zoom-in"];
    return motions[currentIdx % motions.length] || "zoom-in";
  };

  useImperativeHandle(ref, () => ({
    startRecording: async () => {
      const html2canvas = (await import("html2canvas")).default;
      const target = previewRef.current;
      if (!target) return null;

      const canvas = document.createElement("canvas");
      canvas.width = aspect.w;
      canvas.height = aspect.h;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
      const chunks = [];
      recorder.ondataavailable = (event) => event.data?.size && chunks.push(event.data);

      const done = new Promise((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
      });

      recorder.start(100);
      play();

      let stopped = false;
      const drawFrame = async () => {
        if (stopped) return;
        const frame = await html2canvas(target, { backgroundColor: null, scale: 1, useCORS: true, logging: false });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
        setTimeout(drawFrame, 34);
      };
      drawFrame();

      await new Promise((resolve) => setTimeout(resolve, duration * 1000 + 300));
      stopped = true;
      reset();
      recorder.stop();
      const blob = await done;
      return { blob, ext: mime.includes("mp4") ? "mp4" : "webm", mime };
    },
  }));

  if (!currentClip || cutPlan.length < 2) {
    return (
      <div
        className="w-full rounded-3xl bg-black/50 border border-white/10 flex items-center justify-center text-white/40 text-sm"
        style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
      >
        Add media and music to preview
      </div>
    );
  }

  const mediaMotion = motionClass();

  return (
    <div className="space-y-3">
      <div
        ref={previewRef}
        className="relative w-full rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl"
        style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
      >
        <div key={currentIdx} className={`absolute inset-0 beatcut-${mediaMotion}`} style={{ filter: grade }}>
          {currentClip.type === "video" ? (
            <video src={currentClip.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
          ) : (
            <img src={currentClip.url} alt="BeatCut preview" className="w-full h-full object-cover" />
          )}
        </div>

        {template?.letterbox && (
          <>
            <div className="absolute top-0 left-0 right-0 h-[8%] bg-black" />
            <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-black" />
          </>
        )}

        <div key={`flash-${currentIdx}`} className="absolute inset-0 beatcut-flash pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-fuchsia-400" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-[10px] font-black text-white backdrop-blur">
          {currentIdx + 1}/{cutPlan.length - 1}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={togglePlay} className="flex items-center gap-2 h-10 px-4 rounded-full bg-white text-black text-xs font-black">
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? "Pause" : "Play"}
        </button>
        <button onClick={reset} className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (audioRef.current) audioRef.current.muted = next;
          }}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <div className="ml-auto text-[10px] font-mono text-white/40">{(progress * duration).toFixed(1)}s / {duration.toFixed(1)}s</div>
      </div>

      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      <style>{`
        @keyframes bcZoomIn { from { transform: scale(1); } to { transform: scale(1.16); } }
        @keyframes bcPunch { 0% { transform: scale(1.3); } 35% { transform: scale(1); } 100% { transform: scale(1.08); } }
        @keyframes bcDrift { from { transform: translateX(-2%) scale(1.06); } to { transform: translateX(2%) scale(1.06); } }
        @keyframes bcShake { 0%,100% { transform: translate(0,0) scale(1.05); } 25% { transform: translate(2%,-1%) scale(1.05); } 50% { transform: translate(-2%,1%) scale(1.05); } 75% { transform: translate(1%,1%) scale(1.05); } }
        @keyframes bcFlash { from { background: rgba(255,255,255,.45); } to { background: rgba(255,255,255,0); } }
        .beatcut-zoom-in, .beatcut-slow-zoom, .beatcut-snap-zoom { animation: bcZoomIn 1.4s ease-out forwards; }
        .beatcut-punch { animation: bcPunch .6s ease-out forwards; }
        .beatcut-drift, .beatcut-float, .beatcut-pan, .beatcut-tilt { animation: bcDrift 2.5s ease-in-out forwards; }
        .beatcut-shake, .beatcut-glitch { animation: bcShake .45s ease-in-out forwards; }
        .beatcut-flash { animation: bcFlash .2s ease-out forwards; }
      `}</style>
    </div>
  );
});

export default AutoCutPreview;