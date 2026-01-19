import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Download, Trash2, Undo, Redo, Circle, Square, Minus, Droplet, Eraser, Pencil, Image as ImageIcon, Upload, Grid3x3, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function KPaintPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [canvasState, setCanvasState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [showComicTemplates, setShowComicTemplates] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = history[historyStep - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = history[historyStep + 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "kpaint-drawing.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const getTouchPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = e.touches ? getTouchPos(e) : getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);

    if (tool === "pencil" || tool === "eraser") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    if (["circle", "square", "line"].includes(tool)) {
      const canvas = canvasRef.current;
      setCanvasState(canvas.toDataURL());
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = e.touches ? getTouchPos(e) : getMousePos(e);

    if (tool === "pencil") {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "eraser") {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = lineWidth * 3;
      ctx.lineCap = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "fill") {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (["circle", "square", "line"].includes(tool)) {
      const img = new Image();
      img.src = canvasState;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        if (tool === "circle") {
          const radius = Math.sqrt(
            Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
          );
          ctx.beginPath();
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (tool === "square") {
          const width = pos.x - startPos.x;
          const height = pos.y - startPos.y;
          ctx.strokeRect(startPos.x, startPos.y, width, height);
        } else if (tool === "line") {
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
      };
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const tools = [
    { name: "pencil", icon: Pencil, label: "Pencil" },
    { name: "eraser", icon: Eraser, label: "Eraser" },
    { name: "line", icon: Minus, label: "Line" },
    { name: "circle", icon: Circle, label: "Circle" },
    { name: "square", icon: Square, label: "Rectangle" },
    { name: "fill", icon: Droplet, label: "Fill" },
  ];

  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveToHistory();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const applyComicTemplate = (template) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const margin = 20;
    
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;

    if (template === "2-horizontal") {
      ctx.strokeRect(margin, margin, w - 2 * margin, h / 2 - 1.5 * margin);
      ctx.strokeRect(margin, h / 2 + 0.5 * margin, w - 2 * margin, h / 2 - 1.5 * margin);
    } else if (template === "2-vertical") {
      ctx.strokeRect(margin, margin, w / 2 - 1.5 * margin, h - 2 * margin);
      ctx.strokeRect(w / 2 + 0.5 * margin, margin, w / 2 - 1.5 * margin, h - 2 * margin);
    } else if (template === "3-horizontal") {
      const panelH = (h - 4 * margin) / 3;
      ctx.strokeRect(margin, margin, w - 2 * margin, panelH);
      ctx.strokeRect(margin, panelH + 2 * margin, w - 2 * margin, panelH);
      ctx.strokeRect(margin, 2 * panelH + 3 * margin, w - 2 * margin, panelH);
    } else if (template === "4-grid") {
      const panelW = (w - 3 * margin) / 2;
      const panelH = (h - 3 * margin) / 2;
      ctx.strokeRect(margin, margin, panelW, panelH);
      ctx.strokeRect(panelW + 2 * margin, margin, panelW, panelH);
      ctx.strokeRect(margin, panelH + 2 * margin, panelW, panelH);
      ctx.strokeRect(panelW + 2 * margin, panelH + 2 * margin, panelW, panelH);
    } else if (template === "6-grid") {
      const panelW = (w - 4 * margin) / 3;
      const panelH = (h - 3 * margin) / 2;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.strokeRect(
            margin + col * (panelW + margin),
            margin + row * (panelH + margin),
            panelW,
            panelH
          );
        }
      }
    } else if (template === "manga-right") {
      const leftW = w * 0.6;
      ctx.strokeRect(margin, margin, leftW - 1.5 * margin, h - 2 * margin);
      const rightW = w - leftW - 0.5 * margin;
      const topH = h * 0.4;
      ctx.strokeRect(leftW + 0.5 * margin, margin, rightW - 1.5 * margin, topH - 1.5 * margin);
      ctx.strokeRect(leftW + 0.5 * margin, topH + 0.5 * margin, rightW - 1.5 * margin, h - topH - 1.5 * margin);
    }

    saveToHistory();
    setShowComicTemplates(false);
  };

  const comicTemplates = [
    { id: "2-horizontal", name: "2 Panels (Horizontal)", preview: "━━\n━━" },
    { id: "2-vertical", name: "2 Panels (Vertical)", preview: "┃┃" },
    { id: "3-horizontal", name: "3 Panels (Horizontal)", preview: "━━\n━━\n━━" },
    { id: "4-grid", name: "4 Panel Grid", preview: "┏┓\n┗┛" },
    { id: "6-grid", name: "6 Panel Grid", preview: "┏┳┓\n┗┻┛" },
    { id: "manga-right", name: "Manga Style", preview: "┏━┓\n┃ ┃\n┗━┛" },
  ];

  const colorPalette = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-white font-bold text-lg">KPaint</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={undo}
                disabled={historyStep <= 0}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                <Redo className="w-4 h-4" />
              </Button>
              <Button
                onClick={clearCanvas}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={downloadImage}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-4 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Compact Top Toolbar */}
          <div className="flex items-center gap-3 mb-3 bg-black/40 border border-white/10 rounded-lg p-2">
            {/* Tools */}
            <div className="flex items-center gap-1">
              {tools.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.name}
                    onClick={() => setTool(t.name)}
                    className={`w-8 h-8 flex items-center justify-center rounded transition-all ${
                      tool === t.name
                        ? "bg-cyan-500/30 text-cyan-400"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                    title={t.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Comics Templates */}
            <button
              onClick={() => setShowComicTemplates(true)}
              className="w-8 h-8 flex items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white transition-all"
              title="Comic Templates"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>

            {/* Upload Image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 flex items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white transition-all"
              title="Upload Image"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0])}
              className="hidden"
            />

            <div className="w-px h-8 bg-white/10" />

            {/* Color Palette */}
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-white/20"
              />
              {colorPalette.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded border transition-all ${
                    color === c ? "border-cyan-400 scale-110" : "border-white/30"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{lineWidth}px</span>
              <input
                type="range"
                min="1"
                max="50"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>

          {/* Canvas */}
          <div className="relative">
            <div 
              className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all ${
                isDragging ? "ring-4 ring-cyan-400" : ""
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <canvas
                ref={canvasRef}
                width={1200}
                height={650}
                className="w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/10 backdrop-blur-sm rounded-lg pointer-events-none">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">Drop image here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comic Templates Modal */}
      <AnimatePresence>
        {showComicTemplates && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-zinc-900 to-black border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-cyan-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Grid3x3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-bold text-white">Comic Panel Templates</h3>
                </div>
                <button
                  onClick={() => setShowComicTemplates(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">
                {comicTemplates.map((template) => (
                  <motion.button
                    key={template.id}
                    onClick={() => applyComicTemplate(template.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-400 rounded-lg p-6 transition-all group"
                  >
                    <div className="text-4xl font-mono text-white/80 group-hover:text-cyan-400 mb-2 whitespace-pre-line">
                      {template.preview}
                    </div>
                    <div className="text-sm text-white/60 group-hover:text-white font-medium">
                      {template.name}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}