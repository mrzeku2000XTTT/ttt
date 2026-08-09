import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Maximize2, Minimize2, Rotate3D } from "lucide-react";
import UploadZone from "@/components/launchreel/UploadZone";
import Phone3DFrame from "@/components/launchreel/Phone3DFrame";
import OriginKitBackground from "@/components/launchreel/OriginKitBackground";
import TextTemplates from "@/components/launchreel/TextTemplates";
import DevicePicker, { DEVICES } from "@/components/launchreel/DevicePicker";
import Timeline from "@/components/launchreel/Timeline";
import ExportBar from "@/components/launchreel/ExportBar";

export default function LaunchReel() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [textTemplate, setTextTemplate] = useState(null);
  const [device, setDevice] = useState(DEVICES[0]);
  const [fullscreen, setFullscreen] = useState(false);
  const videoElRef = useRef(null);
  const stageRef = useRef(null);

  const handleNewRecording = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setTextTemplate(null);
  };

  const toggleFullscreen = () => setFullscreen((f) => !f);

  if (fullscreen && videoUrl) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <Phone3DFrame
          videoUrl={videoUrl}
          autoRotate={autoRotate}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying((p) => !p)}
          textTemplate={textTemplate}
          device={device}
          videoElRef={videoElRef}
        />
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 z-50"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="sticky top-0 z-40 h-14 flex items-center justify-between px-5 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> App Store
        </Link>
        <span className="text-[15px] font-[900] tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Launch Reel
        </span>
        {videoUrl ? (
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
          </button>
        ) : <div className="w-20" />}
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!videoUrl ? (
          <div className="pt-16">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
                <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                  Turn any recording into a launch video
                </span>
              </h1>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Upload a screen recording. Wrap it in a 3D device, add text templates, export.
              </p>
            </div>
            <UploadZone onVideo={(url) => setVideoUrl(url)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
            {/* Stage */}
            <div className="flex flex-col gap-3">
              <div
                ref={stageRef}
                className="relative rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 h-[560px] lg:h-[660px] overflow-hidden"
              >
                <OriginKitBackground variant="particles" />
                <Phone3DFrame
                  videoUrl={videoUrl}
                  autoRotate={autoRotate}
                  isPlaying={isPlaying}
                  onPlayPause={() => setIsPlaying((p) => !p)}
                  textTemplate={textTemplate}
                  device={device}
                  videoElRef={videoElRef}
                />
              </div>
              {/* Timeline below stage */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <Timeline
                  videoRef={videoElRef}
                  isPlaying={isPlaying}
                  onPlayPause={() => setIsPlaying((p) => !p)}
                />
              </div>
            </div>

            {/* Controls sidebar */}
            <div className="space-y-4">
              <button
                onClick={handleNewRecording}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10"
              >
                ↻ New Recording
              </button>

              {/* Quick toggles */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rotate3D className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-semibold text-sm">Auto-Rotate</span>
                  </div>
                  <button
                    onClick={() => setAutoRotate((a) => !a)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${autoRotate ? "bg-cyan-500" : "bg-white/10"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoRotate ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <p className="text-[10px] text-white/30 mt-2">Drag the phone to orbit · scroll to zoom</p>
              </div>

              {/* Device picker */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <DevicePicker selected={device} onSelect={setDevice} />
              </div>

              {/* Text templates */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <TextTemplates
                  selected={textTemplate}
                  onSelect={setTextTemplate}
                  onEditText={setTextTemplate}
                />
              </div>

              {/* Export */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <ExportBar stageRef={stageRef} videoRef={videoElRef} duration={15} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}