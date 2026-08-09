import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Smartphone, Sparkles } from "lucide-react";
import UploadZone from "@/components/launchreel/UploadZone";
import Phone3DFrame from "@/components/launchreel/Phone3DFrame";
import OriginKitBackground from "@/components/launchreel/OriginKitBackground";
import CaptionOverlay from "@/components/launchreel/CaptionOverlay";
import EffectControls from "@/components/launchreel/EffectControls";
import ExportBar from "@/components/launchreel/ExportBar";

export default function LaunchReel() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotX, setRotX] = useState(-5);
  const [rotY, setRotY] = useState(0);
  const [zoom, setZoom] = useState(85);
  const [music, setMusic] = useState({ id: "none", name: "Silent", url: null });
  const [transition, setTransition] = useState("fade");
  const [brandColor, setBrandColor] = useState("#00e6a8");
  const [currentCaption, setCurrentCaption] = useState("");
  const videoRef = useRef(null);
  const stageRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <nav className="sticky top-0 z-40 h-14 flex items-center justify-between px-5 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> App Store
        </Link>
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span className="text-[15px] font-[900] tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Launch Reel
          </span>
        </div>
        <div className="w-20" />
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!videoUrl ? (
          /* Upload state */
          <div className="pt-16">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold text-white/80 tracking-wide">SCREEN RECORDING → LAUNCH VIDEO</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
                <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                  Turn any recording into a launch video
                </span>
              </h1>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Upload a screen recording. We wrap it in a 3D phone, add captions, music, and effects — export a polished launch video.
              </p>
            </div>
            <UploadZone onVideo={(url) => setVideoUrl(url)} />
          </div>
        ) : (
          /* Studio layout */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
            {/* Stage */}
            <div
              ref={stageRef}
              className="relative rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 h-[600px] lg:h-[700px] overflow-hidden"
            >
              <OriginKitBackground variant="particles" brandColor={brandColor} />
              <Phone3DFrame
                videoUrl={videoUrl}
                autoRotate={autoRotate}
                rotX={rotX}
                rotY={rotY}
                setRotX={setRotX}
                setRotY={setRotY}
                zoom={zoom}
                setZoom={setZoom}
                captionText={currentCaption}
              />
            </div>

            {/* Controls sidebar */}
            <div className="space-y-4">
              {/* Upload new */}
              <button
                onClick={() => { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10"
              >
                ↻ New Recording
              </button>

              {/* Captions */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <CaptionOverlay
                  videoUrl={videoUrl}
                  videoRef={videoRef}
                  onCurrentCaption={setCurrentCaption}
                />
              </div>

              {/* Effects */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <EffectControls
                  autoRotate={autoRotate}
                  setAutoRotate={setAutoRotate}
                  zoom={zoom}
                  setZoom={setZoom}
                  music={music}
                  setMusic={setMusic}
                  transition={transition}
                  setTransition={setTransition}
                  brandColor={brandColor}
                  setBrandColor={setBrandColor}
                />
              </div>

              {/* Export */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <ExportBar stageRef={stageRef} music={music} videoRef={videoRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}