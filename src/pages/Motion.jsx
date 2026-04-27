import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ImageOff, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MotionScene from "@/components/motion/MotionScene";
import MotionControls from "@/components/motion/MotionControls";

const DEFAULT_SETTINGS = {
  tiltX: -8,
  tiltY: 18,
  roll: 0,
  zoom: 1.1,
  panX: 0,
  panY: 0,
  blur: 0,
  shadow: 24,
};

const DEFAULT_BG = "linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 100%)";

export default function MotionPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [bg, setBg] = useState(DEFAULT_BG);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef(null);
  const playRafRef = useRef(null);

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  // Auto-orbit motion when "Play" is on
  useEffect(() => {
    if (!isPlaying) {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
      return;
    }
    let t = 0;
    const tick = () => {
      t += 0.01;
      setSettings(s => ({
        ...s,
        tiltY: Math.sin(t) * 22,
        tiltX: Math.cos(t * 0.7) * 10 - 4,
        roll: Math.sin(t * 0.5) * 3,
      }));
      playRafRef.current = requestAnimationFrame(tick);
    };
    playRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (playRafRef.current) cancelAnimationFrame(playRafRef.current);
    };
  }, [isPlaying]);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setBg(DEFAULT_BG);
    setIsPlaying(false);
  };

  const handleExport = () => {
    const canvas = document.querySelector(".motion-canvas-wrap canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `motion-mockup-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Loading
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  // Admin gate
  if (!user || user.role !== "admin") {
    return (
      <div className="fixed inset-0 bg-[#F5F5F7] flex items-center justify-center px-5">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 mx-auto mb-5 flex items-center justify-center">
            <ImageOff className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-[900] text-zinc-900 mb-2">Motion</h1>
          <p className="text-[13px] text-zinc-500 mb-6">
            This tool is currently in private beta — admin access only.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-zinc-700 bg-white ring-1 ring-zinc-200 hover:ring-zinc-300 px-4 py-2 rounded-full transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>
      </div>
    );
  }

  // Combine bg + blur shadow as inline style for the wrap (so blur applies to background, not the canvas DOM)
  const previewStyle = {
    background: bg,
    filter: settings.blur > 0 ? `blur(${0}px)` : "none", // canvas sharp; blur applies via DOM filter on wrapper bg layer
    boxShadow: settings.shadow > 0 ? `0 ${settings.shadow}px ${settings.shadow * 2}px rgba(0,0,0,0.25)` : "none",
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900">
      {/* Top bar */}
      <nav className="h-14 flex items-center justify-between px-5 bg-white/70 backdrop-blur-xl border-b border-zinc-200/60 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 text-[13px] font-semibold text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-[900] tracking-tight">Motion</span>
          <span className="text-[9px] font-bold bg-cyan-500 text-white px-1.5 py-[1px] rounded">BETA</span>
        </div>
        <span className="text-[11px] text-zinc-400 font-medium hidden sm:block">Admin only</span>
      </nav>

      <div className="p-5 lg:p-6 flex flex-col lg:flex-row gap-5">
        {/* Preview */}
        <div className="flex-1">
          <div
            className="motion-canvas-wrap relative rounded-2xl overflow-hidden ring-1 ring-zinc-200/60"
            style={{ ...previewStyle, height: "calc(100vh - 7rem)", minHeight: 480 }}
          >
            {/* Background blur layer (separate from canvas so canvas stays sharp) */}
            {settings.blur > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: bg,
                  filter: `blur(${settings.blur}px)`,
                  transform: "scale(1.1)",
                }}
              />
            )}
            <div className="absolute inset-0">
              <MotionScene
                imageUrl={imageUrl}
                settings={settings}
                canvasRef={canvasRef}
                bgGradient="transparent"
              />
            </div>

            {!imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-zinc-200 mx-auto mb-3 flex items-center justify-center">
                    <ImageOff className="w-6 h-6 text-zinc-400" />
                  </div>
                  <p className="text-[13px] font-semibold text-zinc-700">Upload a screenshot to begin</p>
                  <p className="text-[11px] text-zinc-500 mt-1">PNG, JPG, or WEBP</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <MotionControls
          settings={settings}
          setSettings={setSettings}
          onUpload={handleUpload}
          onReset={handleReset}
          onExport={handleExport}
          onTogglePlay={() => setIsPlaying(p => !p)}
          isPlaying={isPlaying}
          hasImage={!!imageUrl}
          bg={bg}
          setBg={setBg}
        />
      </div>
    </div>
  );
}