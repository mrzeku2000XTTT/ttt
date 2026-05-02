import React, { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Download, ImageIcon, Sparkles, Loader2, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas";
import DeviceFrame from "@/components/ultramock/DeviceFrame";
import MockBackground from "@/components/ultramock/MockBackground";
import MockControls from "@/components/ultramock/MockControls";

export default function UltraMockPage() {
  const [screenshot, setScreenshot] = useState(null);
  const [device, setDevice] = useState("iphone");
  const [background, setBackground] = useState("sunset");
  const [padding, setPadding] = useState(80);
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const onUpload = useCallback((file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setScreenshot(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const onFileChange = (e) => onUpload(e.target.files?.[0]);
  const onDrop = (e) => {
    e.preventDefault();
    onUpload(e.dataTransfer?.files?.[0]);
  };

  const handleExport = async () => {
    if (!canvasRef.current || !screenshot) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `ultramock-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Try a different image.");
    }
    setExporting(false);
  };

  const reset = () => {
    setScreenshot(null);
    setDevice("iphone");
    setBackground("sunset");
    setPadding(80);
    setScale(1);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 overflow-y-auto">
      {/* Top bar */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <Link to="/AppStoreV2" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-black text-base tracking-tight">UltraMock</span>
          <span className="hidden sm:inline-flex px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-[9px] font-bold tracking-widest uppercase">
            Cinematic Mockups
          </span>
        </div>
        <div className="flex items-center gap-2">
          {screenshot && (
            <button
              onClick={reset}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={!screenshot || exporting}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-pink-500/30"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? "Exporting…" : "Export PNG"}
          </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0">
        {/* Canvas */}
        <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
          {!screenshot ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className="w-full max-w-2xl aspect-[16/10] rounded-3xl border-2 border-dashed border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer flex flex-col items-center justify-center gap-3 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-pink-500/30">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="text-white font-black text-lg mb-1">Drop a screenshot</div>
                <div className="text-white/50 text-xs">or click to upload · PNG, JPG, WebP</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </motion.div>
          ) : (
            <div className="w-full max-w-4xl">
              <div className="rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                <MockBackground ref={canvasRef} background={background} padding={padding}>
                  <DeviceFrame device={device} screenshot={screenshot} scale={scale} />
                </MockBackground>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-white/30 text-[10px] font-medium mt-3">
                <ImageIcon className="w-3 h-3" />
                Preview · exports at 2× resolution
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="border-t lg:border-t-0 lg:border-l border-white/10 bg-black/40 backdrop-blur-xl p-5 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-y-auto">
          {!screenshot ? (
            <div className="text-white/40 text-xs text-center py-12">
              Upload a screenshot to start customizing.
            </div>
          ) : (
            <MockControls
              device={device} setDevice={setDevice}
              background={background} setBackground={setBackground}
              padding={padding} setPadding={setPadding}
              scale={scale} setScale={setScale}
            />
          )}
        </aside>
      </div>
    </div>
  );
}