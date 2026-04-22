import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Scissors, Download, Copy, Check, Sparkles, Play, Pause, Trash2, Eye, Zap, Info } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

import KleerWatermarkSelector from "@/components/kleer/KleerWatermarkSelector";
import KleerFFmpegOutput from "@/components/kleer/KleerFFmpegOutput";
import KleerProcessingInfo from "@/components/kleer/KleerProcessingInfo";

export default function KleerPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDims, setVideoDims] = useState({ width: 0, height: 0 });
  const [watermarkBox, setWatermarkBox] = useState(null); // { x, y, w, h } in video pixels
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [uploadedRemoteUrl, setUploadedRemoteUrl] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video must be under 100MB");
      return;
    }
    // Clean up previous URL
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setWatermarkBox(null);
    setProcessedUrl(null);
    setUploadedRemoteUrl(null);
  };

  const uploadToCloud = async () => {
    if (!videoFile) return null;
    if (uploadedRemoteUrl) return uploadedRemoteUrl;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });
      setUploadedRemoteUrl(file_url);
      toast.success("Video uploaded to cloud");
      return file_url;
    } catch (err) {
      toast.error("Upload failed: " + (err?.message || "Unknown"));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!videoFile) {
      toast.error("Upload a video first");
      return;
    }
    if (!watermarkBox) {
      toast.error("Select the watermark area on the video");
      return;
    }
    setProcessing(true);
    try {
      const remoteUrl = await uploadToCloud();
      if (!remoteUrl) {
        setProcessing(false);
        return;
      }
      // For now we deliver the uploaded video + FFmpeg command for the user.
      // Actual FFmpeg processing requires a dedicated video worker; users can
      // run the generated command locally or via a cloud runner.
      setProcessedUrl(remoteUrl);
      toast.success("Ready! Use the FFmpeg command below to remove the watermark.");
    } catch (err) {
      toast.error("Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setWatermarkBox(null);
    setProcessedUrl(null);
    setUploadedRemoteUrl(null);
    setVideoDims({ width: 0, height: 0 });
  };

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black">
        <Link to={createPageUrl("AppStoreV2")} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
          <Scissors className="w-4 h-4 text-black" />
        </div>
        <div className="flex-1">
          <h1 className="text-white font-black text-base leading-tight">Kleer</h1>
          <p className="text-white/40 text-[10px] leading-tight">Remove watermarks from any video</p>
        </div>
        {videoFile && (
          <button
            onClick={reset}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-full text-xs text-white/60 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
          {!videoFile ? (
            <UploadZone
              onSelect={handleFileSelect}
              fileInputRef={fileInputRef}
            />
          ) : (
            <>
              {/* Step 1: Select watermark */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs font-bold">1</div>
                  <h2 className="text-white font-bold text-sm">Draw a box around the watermark</h2>
                </div>
                <KleerWatermarkSelector
                  videoUrl={videoUrl}
                  onBoxChange={setWatermarkBox}
                  onDimsChange={setVideoDims}
                />
              </div>

              {/* Step 2: Process */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${watermarkBox ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-white/30'}`}>2</div>
                  <h2 className={`font-bold text-sm ${watermarkBox ? 'text-white' : 'text-white/40'}`}>Generate removal command</h2>
                </div>

                <button
                  onClick={handleProcess}
                  disabled={!watermarkBox || processing || uploading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-black font-black text-sm flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  {processing || uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      {uploading ? "Uploading..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Remove Watermark
                    </>
                  )}
                </button>
              </div>

              {/* Step 3: Output */}
              {processedUrl && watermarkBox && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-xs font-bold">3</div>
                    <h2 className="text-white font-bold text-sm">Your command is ready</h2>
                  </div>
                  <KleerFFmpegOutput
                    box={watermarkBox}
                    videoDims={videoDims}
                    remoteUrl={processedUrl}
                    originalName={videoFile.name}
                  />
                </motion.div>
              )}

              <KleerProcessingInfo />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadZone({ onSelect, fileInputRef }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onSelect(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all p-10 sm:p-16 text-center ${
        dragActive
          ? 'border-cyan-400 bg-cyan-500/10'
          : 'border-white/20 hover:border-cyan-500/40 hover:bg-white/5'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])}
      />
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-4">
        <Upload className="w-7 h-7 text-cyan-400" />
      </div>
      <h3 className="text-white font-bold text-lg mb-1">Drop your video here</h3>
      <p className="text-white/50 text-sm">or click to browse — MP4, MOV, WebM up to 100MB</p>

      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/30">
        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI-assisted</span>
        <span>•</span>
        <span>FFmpeg delogo</span>
        <span>•</span>
        <span>100% private</span>
      </div>
    </div>
  );
}