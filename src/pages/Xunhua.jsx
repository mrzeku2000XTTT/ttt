import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Wand2, Download, Palette, Eraser, Paintbrush } from "lucide-react";

export default function XunhuaPage() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState("brush"); // brush or eraser
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [lastPoint, setLastPoint] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const updateCanvasSize = () => {
      const isMobile = window.innerWidth < 768;
      const rect = canvas.getBoundingClientRect();
      
      // Set actual canvas dimensions
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      // Scale context to match device pixel ratio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      // Set canvas background
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    setLastPoint({ x, y });
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    if (lastPoint) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = tool === "eraser" ? "#1a1a1a" : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    setLastPoint({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please describe what you're drawing");
      return;
    }

    setIsGenerating(true);
    try {
      // Convert canvas to blob
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      
      // Upload sketch
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: new File([blob], "sketch.png", { type: "image/png" })
      });

      // Generate image from sketch
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `${prompt}. Artist sketch provided as reference. Create a detailed, artistic interpretation.`,
        existing_image_urls: [file_url]
      });

      setGeneratedImage(result.url);
    } catch (err) {
      console.error("Generation failed:", err);
      alert("Failed to generate image. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = "xunhua-generated.png";
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col" style={{
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)'
    }}>
      {/* Desktop Split View / Mobile Full Width */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Drawing Canvas - Left on Desktop, Full on Mobile */}
        <div className="flex-1 flex flex-col bg-zinc-900 border-r border-white/10">
          {/* Canvas Tools */}
          <div className="p-3 border-b border-white/10 flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setTool("brush")}
              size="sm"
              className={`h-8 px-3 ${tool === "brush" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}
            >
              <Paintbrush className="w-4 h-4 mr-1" />
              Brush
            </Button>
            <Button
              onClick={() => setTool("eraser")}
              size="sm"
              className={`h-8 px-3 ${tool === "eraser" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}
            >
              <Eraser className="w-4 h-4 mr-1" />
              Eraser
            </Button>
            
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                title="Pick color"
              />
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-20"
                title="Brush size"
              />
              <Button
                onClick={clearCanvas}
                size="sm"
                className="h-8 px-3 bg-red-500/20 text-red-400 border border-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full rounded-lg border border-white/10 cursor-crosshair touch-none"
              style={{ touchAction: "none" }}
            />
          </div>
        </div>

        {/* Generated Image - Right on Desktop, Hidden on Mobile until generated */}
        <AnimatePresence>
          {(generatedImage || window.innerWidth >= 768) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex-1 bg-black border-l border-white/10 flex flex-col ${!generatedImage && window.innerWidth < 768 ? "hidden" : ""}`}
            >
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-bold text-sm">AI Generated</h2>
                {generatedImage && (
                  <Button
                    onClick={downloadImage}
                    size="sm"
                    className="h-8 px-3 bg-white/5 text-white"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                )}
              </div>
              
              <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
                {isGenerating ? (
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-white/60 text-sm">Generating your artwork...</p>
                  </div>
                ) : generatedImage ? (
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="max-w-full max-h-full rounded-lg object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Palette className="w-16 h-16 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Your AI artwork will appear here</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Input Bar - Always Visible */}
      <div className="bg-zinc-900 border-t border-white/10 p-3">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Describe what you're drawing... (e.g., 'a majestic dragon breathing fire')"
            className="flex-1 bg-black border-white/20 text-white h-11"
            disabled={isGenerating}
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="h-11 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Branding */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2">
        <h1 className="text-white font-bold text-lg">Xùnhuà</h1>
        <p className="text-white/60 text-xs">AI Sketch Studio</p>
      </div>
    </div>
  );
}