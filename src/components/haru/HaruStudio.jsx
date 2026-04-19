import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Wand2, Type, Image as ImageIcon, Download, Sparkles, Loader2,
  Upload, Palette, Settings2, RefreshCw, Search, Eye, SlidersHorizontal, ChevronDown
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const FONT_STYLES = [
  { id: "serif-elegant", label: "Elegant Serif", family: "'Playfair Display', Georgia, serif", weight: 900, italic: true },
  { id: "serif-modern", label: "Modern Serif", family: "Georgia, 'Times New Roman', serif", weight: 700, italic: false },
  { id: "sans-bold", label: "Bold Sans", family: "'Helvetica Neue', Arial, sans-serif", weight: 900, italic: false },
  { id: "sans-condensed", label: "Condensed", family: "'Arial Narrow', sans-serif", weight: 800, italic: false },
  { id: "mono-retro", label: "Mono Retro", family: "'Courier New', monospace", weight: 700, italic: false },
  { id: "display-italic", label: "Display Italic", family: "Georgia, serif", weight: 900, italic: true },
  { id: "script-flowy", label: "Script Flow", family: "'Brush Script MT', cursive", weight: 400, italic: true },
  { id: "modern-light", label: "Modern Light", family: "-apple-system, 'SF Pro Display', sans-serif", weight: 200, italic: false },
];

const GRADIENTS = [
  { id: "sakura", label: "Sakura", value: "linear-gradient(135deg, #ec4899, #f59e0b)" },
  { id: "sunset", label: "Sunset", value: "linear-gradient(135deg, #f43f5e, #fb923c)" },
  { id: "ocean", label: "Ocean", value: "linear-gradient(135deg, #06b6d4, #8b5cf6)" },
  { id: "mono", label: "Mono", value: "linear-gradient(135deg, #18181b, #52525b)" },
  { id: "gold", label: "Gold", value: "linear-gradient(135deg, #fbbf24, #d97706)" },
  { id: "rose", label: "Rose", value: "linear-gradient(135deg, #be185d, #ec4899)" },
  { id: "emerald", label: "Emerald", value: "linear-gradient(135deg, #059669, #10b981)" },
  { id: "violet", label: "Violet", value: "linear-gradient(135deg, #7c3aed, #a78bfa)" },
];

const BACKGROUNDS = [
  { id: "cream", label: "Cream", value: "#faf7f5" },
  { id: "blush", label: "Blush", value: "#fce7f3" },
  { id: "night", label: "Night", value: "#18181b" },
  { id: "sand", label: "Sand", value: "#fef3c7" },
  { id: "mint", label: "Mint", value: "#d1fae5" },
  { id: "ink", label: "Ink", value: "#0c0a1e" },
];

export default function HaruStudio({ onClose, kaspaAddress }) {
  const [text, setText] = useState("Haru");
  const [fontStyle, setFontStyle] = useState(FONT_STYLES[0]);
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [background, setBackground] = useState(BACKGROUNDS[0]);
  const [fontSize, setFontSize] = useState(180);
  const [letterSpacing, setLetterSpacing] = useState(-2);
  const [generating, setGenerating] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [uploadedImg, setUploadedImg] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [variants, setVariants] = useState([]);
  const [detectedText, setDetectedText] = useState(null);
  // Custom image-derived styles
  const [customStyles, setCustomStyles] = useState([]);
  // Use the uploaded image as a texture/fill for the text
  const [useImageFill, setUseImageFill] = useState(false);
  // AI-rendered lettering (the word drawn AS custom letters by image gen)
  const [renderedLetterform, setRenderedLetterform] = useState(null);
  const [renderingLetters, setRenderingLetters] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const imgElementRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Keep canvas rendered live
  useEffect(() => {
    renderCanvas();
  }, [text, fontStyle, gradient, background, fontSize, letterSpacing, useImageFill, uploadedImg]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = background.value;
    ctx.fillRect(0, 0, W, H);

    ctx.font = `${fontStyle.italic ? "italic " : ""}${fontStyle.weight} ${fontSize}px ${fontStyle.family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Build fill: image texture OR gradient
    let fill;
    if (useImageFill && imgElementRef.current && imgElementRef.current.complete) {
      const pattern = ctx.createPattern(imgElementRef.current, "no-repeat");
      // Scale pattern to canvas using matrix
      if (pattern && pattern.setTransform) {
        const img = imgElementRef.current;
        const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        pattern.setTransform(new DOMMatrix().scale(scale, scale));
      }
      fill = pattern || background.value;
    } else {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      const parseGradient = gradient.value.match(/#[0-9a-f]+/gi) || ["#ec4899", "#f59e0b"];
      grad.addColorStop(0, parseGradient[0]);
      grad.addColorStop(1, parseGradient[1] || parseGradient[0]);
      fill = grad;
    }
    ctx.fillStyle = fill;

    // Letter spacing manual
    if (letterSpacing !== 0 && text.length > 1) {
      const chars = text.split("");
      const widths = chars.map((c) => ctx.measureText(c).width);
      const totalWidth = widths.reduce((a, b) => a + b, 0) + letterSpacing * (chars.length - 1);
      let x = W / 2 - totalWidth / 2;
      chars.forEach((c, i) => {
        ctx.fillText(c, x + widths[i] / 2, H / 2);
        x += widths[i] + letterSpacing;
      });
    } else {
      ctx.fillText(text, W / 2, H / 2);
    }
  };

  // Extract dominant colors directly from the image pixels (K-means-lite / bucket quantize)
  const extractImagePalette = (imgEl) => {
    return new Promise((resolve) => {
      const c = document.createElement("canvas");
      const size = 80;
      c.width = size; c.height = size;
      const cx = c.getContext("2d");
      cx.drawImage(imgEl, 0, 0, size, size);
      const data = cx.getImageData(0, 0, size, size).data;
      const buckets = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] >> 5, g = data[i + 1] >> 5, b = data[i + 2] >> 5;
        const key = `${r}-${g}-${b}`;
        if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, n: 0 };
        buckets[key].r += data[i];
        buckets[key].g += data[i + 1];
        buckets[key].b += data[i + 2];
        buckets[key].n += 1;
      }
      const sorted = Object.values(buckets).sort((a, b) => b.n - a.n).slice(0, 5);
      const colors = sorted.map((b) => {
        const r = Math.round(b.r / b.n);
        const g = Math.round(b.g / b.n);
        const bl = Math.round(b.b / b.n);
        return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      });
      resolve(colors);
    });
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `haru-${text.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const generateWithAI = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a typography director. Generate 4 distinct font style variations for the word "${text}" based on this brief: "${prompt}".
For each variation, choose: font family style (serif-elegant, serif-modern, sans-bold, sans-condensed, mono-retro, display-italic, script-flowy, modern-light), gradient (sakura, sunset, ocean, mono, gold, rose, emerald, violet), background (cream, blush, night, sand, mint, ink), letter_spacing (-5 to 10), and italic (true/false).
Return a JSON object with a "variants" array.`,
        response_json_schema: {
          type: "object",
          properties: {
            variants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  font_style: { type: "string" },
                  gradient: { type: "string" },
                  background: { type: "string" },
                  letter_spacing: { type: "number" },
                  italic: { type: "boolean" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
      });

      const mapped = (res.variants || []).map((v) => ({
        fontStyle: FONT_STYLES.find((f) => f.id === v.font_style) || FONT_STYLES[0],
        gradient: GRADIENTS.find((g) => g.id === v.gradient) || GRADIENTS[0],
        background: BACKGROUNDS.find((b) => b.id === v.background) || BACKGROUNDS[0],
        letterSpacing: v.letter_spacing || 0,
        description: v.description,
      }));
      setVariants(mapped);
      if (mapped[0]) {
        setFontStyle(mapped[0].fontStyle);
        setGradient(mapped[0].gradient);
        setBackground(mapped[0].background);
        setLetterSpacing(mapped[0].letterSpacing);
      }
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDetecting(true);
    setDetectedText(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImg(file_url);

      // Load image into an HTMLImageElement so we can (a) use as fill pattern
      // (b) extract real pixel colors for the new custom font style
      const imgEl = new Image();
      imgEl.crossOrigin = "anonymous";
      imgEl.src = file_url;
      await new Promise((res) => { imgEl.onload = res; imgEl.onerror = res; });
      imgElementRef.current = imgEl;

      const palette = await extractImagePalette(imgEl);

      // Ask AI vision to classify the mood/style of the image → font recipe
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are analyzing this image to create a NEW font style inspired by the image itself.
1. Read any prominent text/wordmark (return empty if none).
2. Classify the best matching base font family from: serif-elegant, serif-modern, sans-bold, sans-condensed, mono-retro, display-italic, script-flowy, modern-light.
3. Describe the visual mood in 5-8 words (e.g. "soft, romantic, floral, editorial, warm").
4. Suggest a short custom style name (2-3 words, e.g. "Sakura Editorial", "Neon Dusk").
5. Recommend italic (true/false), letter_spacing (-5 to 15), and weight (200-900).`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            detected_text: { type: "string" },
            font_style: { type: "string" },
            mood: { type: "string" },
            style_name: { type: "string" },
            italic: { type: "boolean" },
            letter_spacing: { type: "number" },
            weight: { type: "number" },
          },
        },
      });

      setDetectedText({ ...res, palette });

      if (res.detected_text) setText(res.detected_text.slice(0, 40));

      // Build a NEW custom font style from the image itself
      const baseFont = FONT_STYLES.find((f) => f.id === res.font_style) || FONT_STYLES[0];
      const newStyle = {
        id: `custom-${Date.now()}`,
        label: res.style_name || "From Image",
        family: baseFont.family,
        weight: res.weight || baseFont.weight,
        italic: typeof res.italic === "boolean" ? res.italic : baseFont.italic,
        isCustom: true,
        imageUrl: file_url,
        mood: res.mood,
      };

      // Build a gradient derived from the image's actual palette
      const c1 = palette[0] || "#ec4899";
      const c2 = palette[1] || palette[0] || "#f59e0b";
      const newGradient = {
        id: `custom-grad-${Date.now()}`,
        label: res.style_name || "Image Palette",
        value: `linear-gradient(135deg, ${c1}, ${c2})`,
        isCustom: true,
      };
      // Background from the darkest/lightest palette color
      const bgColor = palette[palette.length - 1] || "#faf7f5";
      const newBackground = {
        id: `custom-bg-${Date.now()}`,
        label: "Image BG",
        value: bgColor,
        isCustom: true,
      };

      setCustomStyles((prev) => [{ style: newStyle, gradient: newGradient, background: newBackground, letterSpacing: res.letter_spacing || 0 }, ...prev].slice(0, 6));

      // Auto-apply the new image-derived style to the canvas
      setFontStyle(newStyle);
      setGradient(newGradient);
      setBackground(newBackground);
      if (typeof res.letter_spacing === "number") setLetterSpacing(res.letter_spacing);
      setUseImageFill(false);
    } catch (err) {
      console.error(err);
    }
    setDetecting(false);
  };

  const generateAIImage = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `Premium typography poster featuring the word "${text}". ${prompt}. Editorial design, magazine quality, beautiful lettering, ${fontStyle.label} style, cinematic lighting, high-end brand aesthetic.`,
      });
      setUploadedImg(url);
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  // Render the WORD ITSELF as custom lettering using image-gen.
  // This is the "Lovart-style" transformation — not a font swap, but a
  // fully re-drawn wordmark where each letter is custom-shaped.
  const renderLetterformFromImage = async () => {
    if (!text.trim()) return;
    setRenderingLetters(true);
    try {
      const moodDesc = detectedText?.mood || prompt || fontStyle.label;
      const paletteDesc = detectedText?.palette
        ? `using exactly these colors: ${detectedText.palette.slice(0, 3).join(", ")}`
        : "";
      const styleName = detectedText?.style_name || fontStyle.label;

      const refs = uploadedImg ? [uploadedImg] : [];
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `A single custom wordmark that reads exactly "${text}" — nothing else, no other text, no extra words. The letters themselves are reshaped, redrawn, and stylized as ORIGINAL LETTERFORMS (not a system font). Style: ${styleName}. Mood: ${moodDesc}. ${paletteDesc}. ${refs.length ? "Match the visual style, texture, and feeling of the reference image. Let the reference image dictate the letter construction, strokes, ornaments, and overall aesthetic." : ""} Clean flat background (solid or minimal), the word is the hero, centered, perfectly legible, spelled correctly, high resolution, editorial quality, professional custom lettering / hand-drawn display type. The letterforms should feel invented and specific — unique ligatures, bespoke terminals, custom proportions — as if crafted by a type designer for this exact word.`,
        existing_image_urls: refs,
      });
      setRenderedLetterform(url);
    } catch (err) {
      console.error(err);
    }
    setRenderingLetters(false);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-[#faf7f5] flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-pink-200/40 bg-white/90 backdrop-blur-xl flex items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">
            <X className="w-4 h-4 text-zinc-600" />
          </button>
          <div className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ade3b1795_generated_image.png" alt="Haru" className="w-7 h-7 rounded-lg" />
            <div>
              <div className="font-[900] text-zinc-900 text-sm">Haru Studio</div>
              <div className="text-[9px] text-zinc-400 font-mono">{kaspaAddress?.slice(0, 14)}…{kaspaAddress?.slice(-6)}</div>
            </div>
          </div>
        </div>
        <button onClick={downloadCanvas} className="h-9 px-4 rounded-full bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-700 transition-colors flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export PNG
        </button>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop */}
        {mobilePanelOpen && (
          <div
            onClick={() => setMobilePanelOpen(false)}
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          />
        )}

        {/* Left panel: controls — sidebar on desktop, bottom sheet on mobile */}
        <aside className={`
          md:w-80 md:flex-shrink-0 md:static md:translate-y-0 md:h-auto md:max-h-none md:rounded-none md:border-r md:border-t-0
          fixed bottom-0 left-0 right-0 z-40 max-h-[85vh] h-[85vh] rounded-t-3xl border-t
          border-pink-200/40 bg-white overflow-y-auto shadow-2xl md:shadow-none
          transition-transform duration-300 ease-out
          ${mobilePanelOpen ? "translate-y-0" : "translate-y-full"} md:translate-y-0
        `}>
          {/* Mobile drag handle + close */}
          <div className="md:hidden sticky top-0 z-10 bg-white border-b border-pink-200/40 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-1 bg-zinc-300 rounded-full absolute left-1/2 -translate-x-1/2 top-1.5" />
              <SlidersHorizontal className="w-4 h-4 text-pink-500" />
              <span className="text-[13px] font-[900] text-zinc-900">Controls</span>
            </div>
            <button
              onClick={() => setMobilePanelOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center"
            >
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Text input */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block">Your Word</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={40}
                className="w-full h-11 px-4 rounded-xl bg-zinc-50 ring-1 ring-zinc-200 text-[14px] font-semibold outline-none focus:ring-pink-400"
              />
            </div>

            {/* AI prompt */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block">AI Direction</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="e.g. 'luxurious, feminine, with serif elegance'"
                className="w-full p-3 rounded-xl bg-zinc-50 ring-1 ring-zinc-200 text-[12px] outline-none focus:ring-pink-400 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={generateWithAI}
                  disabled={generating || !prompt.trim()}
                  className="flex-1 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Generate Styles
                </button>
                <button
                  onClick={generateAIImage}
                  disabled={generating || !prompt.trim()}
                  className="h-9 px-3 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-semibold flex items-center gap-1 hover:bg-zinc-200 disabled:opacity-50"
                  title="Generate reference image"
                >
                  <ImageIcon className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Image detector */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block flex items-center gap-1.5">
                <Eye className="w-3 h-3" /> Image → Font
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={detecting}
                className="w-full h-16 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-pink-300 hover:bg-pink-50/50 text-[11px] text-zinc-500 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
              >
                {detecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-pink-500" /> Detecting…</>
                ) : uploadedImg ? (
                  <><Search className="w-3.5 h-3.5 text-pink-500" /> Re-detect from image</>
                ) : (
                  <><Upload className="w-3.5 h-3.5" /> Upload image to detect</>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {detectedText && (
                <div className="mt-2 p-2.5 rounded-lg bg-pink-50 ring-1 ring-pink-200/60 text-[10px] space-y-1.5">
                  <div className="font-bold text-pink-700">{detectedText.style_name || "Detected"}</div>
                  {detectedText.mood && <div className="text-zinc-600 italic">"{detectedText.mood}"</div>}
                  {detectedText.palette && (
                    <div className="flex gap-1 pt-1">
                      {detectedText.palette.map((c, i) => (
                        <div key={i} className="flex-1 h-4 rounded" style={{ background: c }} title={c} />
                      ))}
                    </div>
                  )}
                  {uploadedImg && (
                    <button
                      onClick={() => setUseImageFill(!useImageFill)}
                      className={`w-full mt-1 h-7 rounded-md text-[10px] font-bold transition-all ${
                        useImageFill
                          ? "bg-pink-600 text-white"
                          : "bg-white text-pink-700 ring-1 ring-pink-300 hover:bg-pink-100"
                      }`}
                    >
                      {useImageFill ? "✓ Image fills letters" : "Use image as letter fill"}
                    </button>
                  )}
                </div>
              )}

              {/* DRAW MY LETTERS — the real Lovart-style letterform generation */}
              <button
                onClick={renderLetterformFromImage}
                disabled={renderingLetters || !text.trim()}
                className="w-full mt-2 h-11 rounded-xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 text-white text-[12px] font-[900] tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all disabled:opacity-50"
              >
                {renderingLetters ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Drawing letterforms…</>
                ) : (
                  <><Type className="w-4 h-4" /> Redraw "{text}" as custom letters</>
                )}
              </button>
              <p className="text-[9px] text-zinc-400 mt-1 leading-tight">
                Each letter is re-drawn from scratch by AI — bespoke shapes, custom strokes, inspired by your image.
              </p>
              {renderedLetterform && (
                <button
                  onClick={() => setRenderedLetterform(null)}
                  className="w-full mt-1 h-6 rounded-md bg-zinc-100 text-zinc-600 text-[9px] font-bold hover:bg-zinc-200"
                >
                  ← Back to canvas mode
                </button>
              )}
            </div>

            {/* Custom Image-Derived Styles */}
            {customStyles.length > 0 && (
              <div>
                <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-pink-500" /> From Your Images
                </label>
                <div className="space-y-1.5">
                  {customStyles.map((c, i) => (
                    <button
                      key={c.style.id}
                      onClick={() => {
                        setFontStyle(c.style);
                        setGradient(c.gradient);
                        setBackground(c.background);
                        setLetterSpacing(c.letterSpacing);
                        // Re-attach image ref so image-fill works for this style
                        if (c.style.imageUrl) {
                          const imgEl = new Image();
                          imgEl.crossOrigin = "anonymous";
                          imgEl.src = c.style.imageUrl;
                          imgEl.onload = () => {
                            imgElementRef.current = imgEl;
                            setUploadedImg(c.style.imageUrl);
                            renderCanvas();
                          };
                        }
                      }}
                      className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all ${
                        fontStyle.id === c.style.id
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-50 ring-1 ring-zinc-200 hover:ring-pink-300"
                      }`}
                    >
                      <img src={c.style.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <div
                          className="text-[13px] font-[900] truncate"
                          style={{
                            fontFamily: c.style.family,
                            fontStyle: c.style.italic ? "italic" : "normal",
                            fontWeight: c.style.weight,
                            background: c.gradient.value,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {text || c.style.label}
                        </div>
                        <div className={`text-[9px] truncate ${fontStyle.id === c.style.id ? "text-zinc-400" : "text-zinc-500"}`}>
                          {c.style.label}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Font picker */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block">Font Style</label>
              <div className="grid grid-cols-2 gap-1.5">
                {FONT_STYLES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFontStyle(f)}
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                      fontStyle.id === f.id
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200 hover:ring-zinc-300"
                    }`}
                    style={{ fontFamily: f.family, fontStyle: f.italic ? "italic" : "normal" }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block">Color</label>
              <div className="grid grid-cols-4 gap-1.5">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGradient(g)}
                    className={`h-9 rounded-lg transition-all ${gradient.id === g.id ? "ring-2 ring-zinc-900 ring-offset-2" : ""}`}
                    style={{ background: g.value }}
                    title={g.label}
                  />
                ))}
              </div>
            </div>

            {/* Background */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block">Background</label>
              <div className="grid grid-cols-6 gap-1.5">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBackground(b)}
                    className={`h-9 rounded-lg ring-1 ring-zinc-200 transition-all ${background.id === b.id ? "ring-2 ring-zinc-900" : ""}`}
                    style={{ background: b.value }}
                    title={b.label}
                  />
                ))}
              </div>
            </div>

            {/* Size & spacing */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block flex justify-between">
                Size <span className="text-zinc-500">{fontSize}px</span>
              </label>
              <input
                type="range"
                min="40"
                max="300"
                value={fontSize}
                onChange={(e) => setFontSize(+e.target.value)}
                className="w-full accent-pink-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block flex justify-between">
                Letter Spacing <span className="text-zinc-500">{letterSpacing}px</span>
              </label>
              <input
                type="range"
                min="-10"
                max="30"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(+e.target.value)}
                className="w-full accent-pink-500"
              />
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 bg-gradient-to-br from-pink-50/40 via-[#faf7f5] to-amber-50/30 overflow-auto pb-24 md:pb-6">
          <div className="relative max-w-full">
            {renderedLetterform ? (
              <div className="relative">
                <img
                  src={renderedLetterform}
                  alt={text}
                  className="max-w-full h-auto rounded-2xl shadow-2xl shadow-pink-400/30 ring-1 ring-pink-200/40"
                  style={{ maxHeight: "70vh" }}
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-2.5 h-2.5" /> AI Letterform
                </div>
                <a
                  href={renderedLetterform}
                  download={`haru-letterform-${text}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 h-8 px-3 rounded-full bg-white/95 backdrop-blur text-zinc-900 text-[10px] font-bold flex items-center gap-1 shadow-lg hover:bg-white"
                >
                  <Download className="w-3 h-3" /> PNG
                </a>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={1200}
                height={800}
                className="max-w-full h-auto rounded-2xl shadow-2xl shadow-pink-400/20 ring-1 ring-pink-200/40"
                style={{ maxHeight: "70vh" }}
              />
            )}
            {uploadedImg && !renderedLetterform && (
              <div className="absolute top-4 right-4 w-24 h-24 rounded-xl overflow-hidden ring-2 ring-white shadow-lg">
                <img src={uploadedImg} alt="Reference" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {renderingLetters && (
            <div className="mt-4 flex items-center gap-2 text-pink-600 text-[11px] font-semibold">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI is crafting original letterforms for "{text}"…
            </div>
          )}

          {/* AI Variants */}
          {variants.length > 0 && (
            <div className="mt-6 w-full max-w-4xl">
              <div className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase mb-3 text-center">AI Variants — Tap to apply</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFontStyle(v.fontStyle);
                      setGradient(v.gradient);
                      setBackground(v.background);
                      setLetterSpacing(v.letterSpacing);
                    }}
                    className="group p-4 rounded-xl ring-1 ring-zinc-200 bg-white hover:ring-pink-400 hover:shadow-lg transition-all text-center"
                    style={{ background: v.background.value }}
                  >
                    <div
                      className="text-3xl font-[900] mb-1"
                      style={{
                        fontFamily: v.fontStyle.family,
                        fontWeight: v.fontStyle.weight,
                        fontStyle: v.fontStyle.italic ? "italic" : "normal",
                        letterSpacing: `${v.letterSpacing}px`,
                        background: v.gradient.value,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {text}
                    </div>
                    <div className="text-[9px] text-zinc-500 group-hover:text-pink-500">{v.fontStyle.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Mobile floating "Controls" button */}
        {!mobilePanelOpen && (
          <button
            onClick={() => setMobilePanelOpen(true)}
            className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-30 h-12 px-6 rounded-full bg-zinc-900 text-white text-[12px] font-[900] flex items-center gap-2 shadow-2xl shadow-pink-500/30"
          >
            <SlidersHorizontal className="w-4 h-4" /> Controls
          </button>
        )}
      </div>
    </div>
  );
}