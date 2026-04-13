import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, ZoomIn, Loader2, Download, Image as ImageIcon, RotateCcw, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { downloadImage } from "@/components/hikaru/hikaruDownload";

const SCALE_OPTIONS = [
  { label: "2x", value: 2 },
  { label: "3x", value: 3 },
  { label: "4x", value: 4 },
];

const ENHANCE_OPTIONS = [
  { key: "sharpen", label: "Sharpen", default: 50 },
  { key: "contrast", label: "Contrast", default: 10 },
  { key: "brightness", label: "Brightness", default: 5 },
  { key: "denoise", label: "Denoise", default: 30 },
];

// Canvas-based image upscaling with sharpening
function upscaleWithCanvas(img, scale, settings) {
  return new Promise((resolve) => {
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    const dw = sw * scale;
    const dh = sh * scale;

    // Step 1: Scale up with smooth interpolation
    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, dw, dh);

    // Step 2: Apply contrast & brightness
    const contrastAmt = 1 + (settings.contrast / 100);
    const brightnessAmt = 1 + (settings.brightness / 100);
    ctx.filter = `contrast(${contrastAmt}) brightness(${brightnessAmt})`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";

    // Step 3: Unsharp mask (sharpen) via convolution
    if (settings.sharpen > 0) {
      const imageData = ctx.getImageData(0, 0, dw, dh);
      const sharpened = applySharpen(imageData, settings.sharpen / 100);
      ctx.putImageData(sharpened, 0, 0);
    }

    // Step 4: Simple denoise (slight blur then blend)
    if (settings.denoise > 15) {
      const original = ctx.getImageData(0, 0, dw, dh);
      ctx.filter = `blur(${Math.round(settings.denoise / 50)}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = "none";
      const blurred = ctx.getImageData(0, 0, dw, dh);
      // Blend original with blurred (keep edges from original)
      const blendAmt = Math.min(settings.denoise / 200, 0.35);
      for (let i = 0; i < original.data.length; i += 4) {
        original.data[i] = Math.round(original.data[i] * (1 - blendAmt) + blurred.data[i] * blendAmt);
        original.data[i + 1] = Math.round(original.data[i + 1] * (1 - blendAmt) + blurred.data[i + 1] * blendAmt);
        original.data[i + 2] = Math.round(original.data[i + 2] * (1 - blendAmt) + blurred.data[i + 2] * blendAmt);
      }
      ctx.putImageData(original, 0, 0);
    }

    canvas.toBlob((blob) => {
      resolve({ blob, width: dw, height: dh });
    }, "image/png");
  });
}

// Unsharp mask sharpening
function applySharpen(imageData, amount) {
  const w = imageData.width;
  const h = imageData.height;
  const src = imageData.data;
  const output = new ImageData(new Uint8ClampedArray(src), w, h);
  const dst = output.data;
  const strength = amount * 2;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        // 3x3 Laplacian kernel
        const center = src[idx + c] * 5;
        const neighbors =
          src[((y - 1) * w + x) * 4 + c] +
          src[((y + 1) * w + x) * 4 + c] +
          src[(y * w + (x - 1)) * 4 + c] +
          src[(y * w + (x + 1)) * 4 + c];
        const sharpVal = center - neighbors;
        dst[idx + c] = Math.max(0, Math.min(255, src[idx + c] + sharpVal * strength));
      }
      dst[idx + 3] = src[idx + 3]; // alpha
    }
  }
  return output;
}

export default function HikaruUpscaler() {
  const [originalUrl, setOriginalUrl] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [resultSize, setResultSize] = useState(null);
  const [scale, setScale] = useState(2);
  const [settings, setSettings] = useState({
    sharpen: 50,
    contrast: 10,
    brightness: 5,
    denoise: 30,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const fileRef = useRef(null);
  const imgRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResultUrl(null);
    setResultSize(null);
    try {
      const localUrl = URL.createObjectURL(file);
      setOriginalFile(file);
      setOriginalUrl(localUrl);
      // Get original dimensions
      const img = new Image();
      img.onload = () => setOriginalSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = localUrl;
      toast.success("Image loaded!");
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const upscale = useCallback(async () => {
    if (!imgRef.current) return;
    setLoading(true);
    setResultUrl(null);
    try {
      const { blob, width, height } = await upscaleWithCanvas(imgRef.current, scale, settings);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize({ w: width, h: height });
      toast.success(`Upscaled to ${width}×${height}!`);
    } catch (err) {
      toast.error("Upscale failed: " + err.message);
    }
    setLoading(false);
  }, [scale, settings]);

  // AI-enhanced upscale: describe image → regenerate at higher quality
  const aiUpscale = async () => {
    if (!originalFile) return;
    setAiEnhancing(true);
    try {
      // Upload original to get a URL for the AI
      const { file_url } = await base44.integrations.Core.UploadFile({ file: originalFile });
      // Use AI to recreate at higher quality
      const res = await base44.integrations.Core.GenerateImage({
        prompt: "Recreate this exact image at maximum quality and resolution. Preserve every detail, color, composition, and subject exactly as-is. Enhance sharpness, clarity, and fine details. Do not change anything about the content.",
        existing_image_urls: [file_url],
      });
      if (res.url) {
        setResultUrl(res.url);
        setResultSize({ w: "AI", h: "Enhanced" });
        toast.success("AI enhancement complete!");
      }
    } catch (err) {
      toast.error("AI enhance failed: " + err.message);
    }
    setAiEnhancing(false);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    if (resultUrl.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `hikaru-upscaled-${scale}x.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      downloadImage(resultUrl, `hikaru-upscaled-${scale}x.png`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-white font-bold text-lg mb-1">Upscaler</h2>
        <p className="text-white/30 text-xs">Increase resolution with real pixel-level upscaling + AI enhancement</p>
      </motion.div>

      {!originalUrl ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => fileRef.current?.click()}
          className="relative border-2 border-dashed border-white/[0.1] hover:border-cyan-500/30 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all group"
        >
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          {uploading ? (
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <Upload className="w-7 h-7 text-cyan-400" />
            </div>
          )}
          <p className="text-white/50 text-sm font-medium mb-1">Upload an image to upscale</p>
          <p className="text-white/20 text-xs">PNG, JPG, WebP supported</p>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Preview area */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Original */}
              <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
                <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Original</span>
                  {originalSize && (
                    <span className="text-white/25 text-[9px] font-mono">{originalSize.w}×{originalSize.h}</span>
                  )}
                </div>
                <img ref={imgRef} src={originalUrl} alt="Original" className="w-full" crossOrigin="anonymous" />
              </div>

              {/* Result */}
              <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]">
                <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-cyan-400/60 text-[10px] uppercase tracking-widest font-semibold">Upscaled</span>
                  {resultSize && (
                    <span className="text-cyan-400/40 text-[9px] font-mono">
                      {resultSize.w === "AI" ? "AI Enhanced" : `${resultSize.w}×${resultSize.h}`}
                    </span>
                  )}
                </div>
                {resultUrl ? (
                  <img src={resultUrl} alt="Upscaled" className="w-full" />
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center bg-white/[0.01] gap-2">
                    <ImageIcon className="w-10 h-10 text-white/10" />
                    <span className="text-white/15 text-[10px]">Click Upscale to process</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={upscale}
                disabled={loading || aiEnhancing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-lg shadow-cyan-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ZoomIn className="w-4 h-4" />}
                {loading ? "Upscaling..." : `Upscale ${scale}x`}
              </button>
              {resultUrl && (
                <button
                  onClick={handleDownload}
                  className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => { setOriginalUrl(null); setOriginalFile(null); setResultUrl(null); setOriginalSize(null); setResultSize(null); }}
                className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 text-sm font-medium transition-colors"
              >
                New
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
            {/* Scale selector */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
              <h3 className="text-white/70 text-xs font-bold uppercase tracking-widest">Scale Factor</h3>
              <div className="flex gap-2">
                {SCALE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setScale(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      scale === opt.value
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/15"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {originalSize && (
                <p className="text-white/20 text-[9px] text-center">
                  Output: {originalSize.w * scale}×{originalSize.h * scale} px
                </p>
              )}
            </div>

            {/* Enhancement sliders */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white/70 text-xs font-bold uppercase tracking-widest">Enhancement</h3>
                <button
                  onClick={() => setSettings({ sharpen: 50, contrast: 10, brightness: 5, denoise: 30 })}
                  className="text-white/20 hover:text-white/50 transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              {ENHANCE_OPTIONS.map(opt => (
                <div key={opt.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/40 text-[10px] font-medium">{opt.label}</span>
                    <span className="text-white/50 text-[10px] font-mono">{settings[opt.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings[opt.key]}
                    onChange={e => updateSetting(opt.key, e.target.value)}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-cyan-500"
                  />
                </div>
              ))}
            </div>

            {/* AI Enhance */}
            <div className="rounded-2xl border border-purple-500/15 bg-purple-500/[0.04] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-purple-300 text-xs font-bold uppercase tracking-widest">AI Enhance</h3>
              </div>
              <p className="text-white/25 text-[10px] leading-relaxed">
                Uses AI to recreate your image at maximum quality. Best for photos and artwork.
              </p>
              <button
                onClick={aiUpscale}
                disabled={aiEnhancing || loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-lg shadow-purple-500/20"
              >
                {aiEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {aiEnhancing ? "Enhancing..." : "AI Enhance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}