import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Wand2, Download, Palette, Eraser, Paintbrush, FlipHorizontal, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";

export default function XunhuaPage() {
  const canvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState("brush");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [lastPoint, setLastPoint] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoRender, setAutoRender] = useState(false);
  const [drawingBounds, setDrawingBounds] = useState(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [error, setError] = useState("");
  const autoGenerateTimeoutRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resultCanvas = resultCanvasRef.current;
    if (!canvas || !resultCanvas) return;

    const ctx = canvas.getContext("2d");
    const resultCtx = resultCanvas.getContext("2d");
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    resultCanvas.width = rect.width;
    resultCanvas.height = rect.height;
    
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resultCtx.fillStyle = "#1a1a1a";
    resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
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
      
      // Update drawing bounds
      setDrawingBounds(prev => {
        const minX = prev ? Math.min(prev.minX, lastPoint.x, x) : Math.min(lastPoint.x, x);
        const minY = prev ? Math.min(prev.minY, lastPoint.y, y) : Math.min(lastPoint.y, y);
        const maxX = prev ? Math.max(prev.maxX, lastPoint.x, x) : Math.max(lastPoint.x, x);
        const maxY = prev ? Math.max(prev.maxY, lastPoint.y, y) : Math.max(lastPoint.y, y);
        return { minX, minY, maxX, maxY };
      });
    }

    setLastPoint({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
    
    // Trigger auto-generation after drawing stops
    if (autoRender && prompt.trim() && drawingBounds) {
      if (autoGenerateTimeoutRef.current) {
        clearTimeout(autoGenerateTimeoutRef.current);
      }
      autoGenerateTimeoutRef.current = setTimeout(() => {
        handleAutoGenerate();
      }, 1000);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const resultCanvas = resultCanvasRef.current;
    
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if (resultCanvas) {
      const resultCtx = resultCanvas.getContext("2d");
      resultCtx.fillStyle = "#1a1a1a";
      resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
    }
    
    setDrawingBounds(null);
    setGeneratedImage(null);
    setIsDrawing(false);
    setLastPoint(null);
    setIsFlipped(false);
  };

  const handleAutoGenerate = async () => {
    if (isAutoGenerating || isGenerating || !prompt.trim() || !drawingBounds) return;
    
    setIsAutoGenerating(true);
    setError("");
    
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1.0));
      
      if (!blob || blob.size === 0) {
        throw new Error("Invalid canvas data");
      }
      
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: new File([blob], "sketch.png", { type: "image/png" })
      });

      const result = await base44.integrations.Core.GenerateImage({
        prompt: `${prompt}. IMPORTANT: Follow the sketch EXACTLY - same number of objects, same positions, same composition. Only enhance the artistic quality. Do not add extra objects.`,
        existing_image_urls: [file_url]
      });

      if (!result?.url) {
        throw new Error("No image URL returned");
      }

      setGeneratedImage(result.url);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const resultCanvas = resultCanvasRef.current;
        if (!resultCanvas) return;
        
        const resultCtx = resultCanvas.getContext("2d");
        resultCanvas.width = canvas.width;
        resultCanvas.height = canvas.height;
        resultCtx.fillStyle = "#1a1a1a";
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        const scale = Math.min(resultCanvas.width / img.width, resultCanvas.height / img.height);
        const x = (resultCanvas.width - img.width * scale) / 2;
        const y = (resultCanvas.height - img.height * scale) / 2;
        resultCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.onerror = () => {
        setError("Failed to load generated image");
      };
      img.src = result.url;
    } catch (err) {
      console.error("Auto-generation failed:", err);
      setError(err.message || "Generation failed. Try again.");
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe what you're drawing");
      return;
    }

    if (!drawingBounds) {
      setError("Please draw something first");
      return;
    }

    setIsGenerating(true);
    setError("");
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: new File([blob], "sketch.png", { type: "image/png" })
      });

      const result = await base44.integrations.Core.GenerateImage({
        prompt: `${prompt}. IMPORTANT: Follow the sketch EXACTLY - same number of objects, same positions, same composition. Only enhance the artistic quality. Do not add extra objects.`,
        existing_image_urls: [file_url]
      });

      setGeneratedImage(result.url);
      
      // Show generated image on result canvas
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const resultCanvas = resultCanvasRef.current;
        const resultCtx = resultCanvas.getContext("2d");
        
        resultCanvas.width = canvas.width;
        resultCanvas.height = canvas.height;
        resultCtx.fillStyle = "#1a1a1a";
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        // Center and fit the generated image
        const scale = Math.min(resultCanvas.width / img.width, resultCanvas.height / img.height);
        const x = (resultCanvas.width - img.width * scale) / 2;
        const y = (resultCanvas.height - img.height * scale) / 2;
        resultCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.src = result.url;
      
      if (autoRender) {
        setIsFlipped(true);
      }
    } catch (err) {
      console.error("Generation failed:", err);
      setError(err.message || "Failed to generate image. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!resultCanvasRef.current) return;
    resultCanvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "xunhua-generated.png";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col touch-none overscroll-none" style={{
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)',
      overflow: 'hidden',
      position: 'fixed'
    }}>
      <div className="flex-1 flex flex-col p-3" style={{ overflow: 'hidden', touchAction: 'none' }}>
        {/* Top Controls */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-white font-bold text-lg">Xùnhuà</h1>
            <p className="text-white/40 text-xs hidden sm:block">AI Sketch Studio</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAutoRender(!autoRender)}
              size="sm"
              className={`h-8 px-3 ${autoRender ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}
              title={autoRender ? "Auto-render ON - generates as you draw" : "Auto-render OFF"}
            >
              {autoRender ? <ToggleRight className="w-4 h-4 mr-1" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
              <span className="hidden sm:inline">Auto</span>
            </Button>
            
            <Button
              onClick={handleFlip}
              size="sm"
              disabled={isGenerating}
              className="h-8 px-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
            >
              <FlipHorizontal className="w-4 h-4 mr-1" />
              Flip
            </Button>
            
            {generatedImage && (
              <Button
                onClick={downloadImage}
                size="sm"
                className="h-8 px-3 bg-white/5 text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Button
            onClick={() => setTool("brush")}
            size="sm"
            className={`h-8 px-3 ${tool === "brush" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}
          >
            <Paintbrush className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Brush</span>
          </Button>
          <Button
            onClick={() => setTool("eraser")}
            size="sm"
            className={`h-8 px-3 ${tool === "eraser" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}
          >
            <Eraser className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Eraser</span>
          </Button>
          
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
          />
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20"
          />
          <Button
            onClick={clearCanvas}
            size="sm"
            className="h-8 px-3 bg-red-500/20 text-red-400 border border-red-500/30 ml-auto"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Canvas Container with Flip Animation */}
        <div className="flex-1 relative overflow-hidden perspective-1000">
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full relative preserve-3d"
          >
            {/* Front - Drawing Canvas */}
            <div className="absolute inset-0 backface-hidden">
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

            {/* Back - Generated Result */}
            <div className="absolute inset-0 backface-hidden rotate-y-180">
              <canvas
                ref={resultCanvasRef}
                className="w-full h-full rounded-lg border border-white/10"
              />
              {(isGenerating || isAutoGenerating) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-white/60 text-sm">
                      {isAutoGenerating ? "Auto-generating..." : "Generating..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Live Status Indicator */}
            {isAutoGenerating && !isFlipped && (
              <div className="absolute top-4 right-4 bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-cyan-400 text-sm">Live rendering...</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2 flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Bottom Input */}
        <div className="flex gap-2 mt-3">
          <Input
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setError("");
            }}
            onKeyPress={(e) => e.key === "Enter" && !autoRender && handleGenerate()}
            placeholder="Describe your drawing..."
            className="flex-1 bg-black border-white/20 text-white h-11"
            disabled={isGenerating}
          />
          {!autoRender && (
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
                  <span className="hidden sm:inline">Generate</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        body { overflow: hidden !important; position: fixed; width: 100%; }
        html { overflow: hidden !important; }
      `}</style>
    </div>
  );
}