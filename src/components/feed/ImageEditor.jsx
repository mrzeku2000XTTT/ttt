import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { base44 } from "@/api/base44Client";
import {
  X,
  Pencil,
  Eraser,
  Type,
  Square,
  Circle,
  Minus,
  Undo2,
  Redo2,
  Trash2,
  Download,
  MousePointer,
  Droplet,
  Save,
  Pipette,
  Sparkles,
  Triangle,
  Sliders,
  Loader2
} from "lucide-react";

export default function ImageEditor({ imageUrl, onClose, onSave }) {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [overlayCtx, setOverlayCtx] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [opacity, setOpacity] = useState(100);
  const [brushType, setBrushType] = useState('round');
  const [fillShape, setFillShape] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(20);
  const [textPos, setTextPos] = useState(null);
  
  // Filters & Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  // Grok Sticker
  const [grokPrompt, setGrokPrompt] = useState('');
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const [stickers, setStickers] = useState([]);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [isResizingSticker, setIsResizingSticker] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStartState, setResizeStartState] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const context = canvas.getContext('2d');
    const overlayContext = overlayCanvas.getContext('2d');
    setCtx(context);
    setOverlayCtx(overlayContext);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = Math.min(img.width, 800);
      canvas.height = (img.height * canvas.width) / img.width;
      overlayCanvas.width = canvas.width;
      overlayCanvas.height = canvas.height;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveToHistory();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    applyFilters();
  }, [brightness, contrast, saturation, blur, selectedFilter]);

  useEffect(() => {
    redrawStickers();
  }, [stickers, selectedSticker]);

  const redrawStickers = () => {
    if (!overlayCtx || !overlayCanvasRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    overlayCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    stickers.forEach(sticker => {
      if (sticker.img && sticker.img.complete) {
        // Apply sticker opacity
        overlayCtx.globalAlpha = (sticker.opacity || 100) / 100;
        overlayCtx.drawImage(sticker.img, sticker.x, sticker.y, sticker.width, sticker.height);
        overlayCtx.globalAlpha = 1;
        
        // Draw selection border and handles
        if (selectedSticker?.id === sticker.id) {
          overlayCtx.strokeStyle = '#00ffff';
          overlayCtx.lineWidth = 2;
          overlayCtx.strokeRect(sticker.x, sticker.y, sticker.width, sticker.height);
          
          // Draw resize handles at corners
          const handleSize = 12;
          overlayCtx.fillStyle = '#00ffff';
          
          // Top-left
          overlayCtx.fillRect(sticker.x - handleSize/2, sticker.y - handleSize/2, handleSize, handleSize);
          // Top-right
          overlayCtx.fillRect(sticker.x + sticker.width - handleSize/2, sticker.y - handleSize/2, handleSize, handleSize);
          // Bottom-left
          overlayCtx.fillRect(sticker.x - handleSize/2, sticker.y + sticker.height - handleSize/2, handleSize, handleSize);
          // Bottom-right
          overlayCtx.fillRect(sticker.x + sticker.width - handleSize/2, sticker.y + sticker.height - handleSize/2, handleSize, handleSize);
        }
      }
    });
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyStep < 0) return;
    
    canvas.style.filter = `
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturation}%)
      blur(${blur}px)
    `;
  };

  const applyPresetFilter = (filter) => {
    setSelectedFilter(filter);
    
    const presets = {
      none: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
      grayscale: { brightness: 100, contrast: 110, saturation: 0, blur: 0 },
      vintage: { brightness: 110, contrast: 90, saturation: 80, blur: 0 },
      dramatic: { brightness: 90, contrast: 150, saturation: 120, blur: 0 },
      cool: { brightness: 105, contrast: 100, saturation: 110, blur: 0 },
      warm: { brightness: 110, contrast: 95, saturation: 130, blur: 0 },
      soft: { brightness: 110, contrast: 85, saturation: 90, blur: 1 },
      sharp: { brightness: 100, contrast: 130, saturation: 110, blur: 0 }
    };
    
    const preset = presets[filter] || presets.none;
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setBlur(preset.blur);
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
      img.src = history[historyStep - 1];
      setHistoryStep(historyStep - 1);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
      img.src = history[historyStep + 1];
      setHistoryStep(historyStep + 1);
    }
  };

  const clearCanvas = () => {
    if (!confirm('Clear all drawings?')) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveToHistory();
    };
    img.src = imageUrl;
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const getResizeHandle = (pos, sticker) => {
    const handleSize = 12;
    const handles = [
      { name: 'tl', x: sticker.x, y: sticker.y },
      { name: 'tr', x: sticker.x + sticker.width, y: sticker.y },
      { name: 'bl', x: sticker.x, y: sticker.y + sticker.height },
      { name: 'br', x: sticker.x + sticker.width, y: sticker.y + sticker.height }
    ];
    
    for (const handle of handles) {
      if (Math.abs(pos.x - handle.x) < handleSize && Math.abs(pos.y - handle.y) < handleSize) {
        return handle.name;
      }
    }
    return null;
  };

  const floodFill = (startX, startY, fillColor) => {
    const canvas = canvasRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const targetColor = getPixelColor(pixels, startX, startY, canvas.width);
    
    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);
    
    if (colorsMatch(targetColor, [fillR, fillG, fillB, 255])) return;
    
    const stack = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Set();
    
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      visited.add(key);
      
      const currentColor = getPixelColor(pixels, x, y, canvas.width);
      if (!colorsMatch(currentColor, targetColor)) continue;
      
      setPixelColor(pixels, x, y, fillR, fillG, fillB, 255, canvas.width);
      
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const getPixelColor = (pixels, x, y, width) => {
    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
  };

  const setPixelColor = (pixels, x, y, r, g, b, a, width) => {
    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    pixels[index] = r;
    pixels[index + 1] = g;
    pixels[index + 2] = b;
    pixels[index + 3] = a;
  };

  const colorsMatch = (a, b) => {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  };

  const pickColor = (e) => {
    const pos = getMousePos(e);
    const imageData = ctx.getImageData(pos.x, pos.y, 1, 1);
    const [r, g, b] = imageData.data;
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    setColor(hex);
  };

  const generateGrokSticker = async () => {
    if (!grokPrompt.trim()) {
      alert('Please enter a sticker description');
      return;
    }

    setIsGeneratingSticker(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `${grokPrompt}, sticker style, transparent background, high quality, digital art`
      });

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const newSticker = {
          id: Date.now(),
          url: response.url,
          img: img,
          x: 50,
          y: 50,
          width: 150,
          height: 150,
          opacity: 100
        };
        setStickers([...stickers, newSticker]);
        setSelectedSticker(newSticker);
        setTool('select');
      };
      img.src = response.url;

      setGrokPrompt('');
    } catch (err) {
      console.error('Failed to generate sticker:', err);
      alert('Failed to generate sticker');
    } finally {
      setIsGeneratingSticker(false);
    }
  };

  const startDrawing = (e) => {
    const pos = getMousePos(e);
    
    // Check if clicking on sticker or resize handle
    if (tool === 'select') {
      for (const sticker of stickers) {
        // Check resize handles first
        const handle = getResizeHandle(pos, sticker);
        if (handle && selectedSticker?.id === sticker.id) {
          setIsResizingSticker(true);
          setResizeHandle(handle);
          setResizeStartState({
            mouseX: pos.x,
            mouseY: pos.y,
            stickerX: sticker.x,
            stickerY: sticker.y,
            stickerWidth: sticker.width,
            stickerHeight: sticker.height
          });
          return;
        }
        
        // Check if clicking on sticker body
        if (pos.x >= sticker.x && pos.x <= sticker.x + sticker.width &&
            pos.y >= sticker.y && pos.y <= sticker.y + sticker.height) {
          setSelectedSticker(sticker);
          setIsDraggingSticker(true);
          setDragOffset({
            x: pos.x - sticker.x,
            y: pos.y - sticker.y
          });
          return;
        }
      }
      
      // Clicked on empty space - deselect
      setSelectedSticker(null);
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);

    if (tool === 'eyedropper') {
      pickColor(e);
      return;
    }

    if (tool === 'fill') {
      floodFill(pos.x, pos.y, color);
      saveToHistory();
      return;
    }

    if (tool === 'text') {
      setTextPos(pos);
      return;
    }

    ctx.globalAlpha = opacity / 100;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = brushType === 'round' ? 'round' : 'butt';
    ctx.lineJoin = brushType === 'round' ? 'round' : 'miter';
  };

  const draw = (e) => {
    const pos = getMousePos(e);

    // Handle sticker resizing
    if (isResizingSticker && selectedSticker && resizeStartState) {
      const dx = pos.x - resizeStartState.mouseX;
      const dy = pos.y - resizeStartState.mouseY;
      
      let newX = resizeStartState.stickerX;
      let newY = resizeStartState.stickerY;
      let newWidth = resizeStartState.stickerWidth;
      let newHeight = resizeStartState.stickerHeight;
      
      // Calculate new dimensions based on handle
      switch (resizeHandle) {
        case 'br': // Bottom-right
          newWidth = resizeStartState.stickerWidth + dx;
          newHeight = resizeStartState.stickerHeight + dy;
          break;
        case 'bl': // Bottom-left
          newX = resizeStartState.stickerX + dx;
          newWidth = resizeStartState.stickerWidth - dx;
          newHeight = resizeStartState.stickerHeight + dy;
          break;
        case 'tr': // Top-right
          newY = resizeStartState.stickerY + dy;
          newWidth = resizeStartState.stickerWidth + dx;
          newHeight = resizeStartState.stickerHeight - dy;
          break;
        case 'tl': // Top-left
          newX = resizeStartState.stickerX + dx;
          newY = resizeStartState.stickerY + dy;
          newWidth = resizeStartState.stickerWidth - dx;
          newHeight = resizeStartState.stickerHeight - dy;
          break;
      }
      
      // Enforce minimum size
      if (newWidth < 30) {
        newWidth = 30;
        if (resizeHandle === 'bl' || resizeHandle === 'tl') {
          newX = resizeStartState.stickerX + resizeStartState.stickerWidth - 30;
        }
      }
      if (newHeight < 30) {
        newHeight = 30;
        if (resizeHandle === 'tl' || resizeHandle === 'tr') {
          newY = resizeStartState.stickerY + resizeStartState.stickerHeight - 30;
        }
      }
      
      setStickers(stickers.map(s => 
        s.id === selectedSticker.id
          ? { ...s, x: newX, y: newY, width: newWidth, height: newHeight }
          : s
      ));
      return;
    }

    // Handle sticker dragging
    if (isDraggingSticker && selectedSticker) {
      setStickers(stickers.map(s => 
        s.id === selectedSticker.id
          ? { ...s, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
          : s
      ));
      return;
    }

    if (!isDrawing) return;
    if (['text', 'select', 'eyedropper', 'fill'].includes(tool)) return;

    if (tool === 'brush') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      
      if (brushType === 'spray') {
        for (let i = 0; i < 10; i++) {
          const offsetX = (Math.random() - 0.5) * brushSize;
          const offsetY = (Math.random() - 0.5) * brushSize;
          ctx.fillStyle = color;
          ctx.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
        }
      } else {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e) => {
    if (isResizingSticker) {
      setIsResizingSticker(false);
      setResizeHandle(null);
      setResizeStartState(null);
      return;
    }

    if (isDraggingSticker) {
      setIsDraggingSticker(false);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    const pos = getMousePos(e);
    ctx.globalAlpha = opacity / 100;

    if (tool === 'rectangle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      if (fillShape) {
        ctx.fillStyle = color;
        ctx.fillRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      }
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      if (fillShape) {
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.stroke();
      }
    } else if (tool === 'line') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'triangle') {
      const height = pos.y - startPos.y;
      const width = pos.x - startPos.x;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y + height);
      ctx.lineTo(startPos.x + width / 2, startPos.y);
      ctx.lineTo(startPos.x + width, startPos.y + height);
      ctx.closePath();
      if (fillShape) {
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    if (tool !== 'text' && tool !== 'eyedropper') {
      saveToHistory();
    }
  };

  const addText = () => {
    if (!text.trim() || !textPos) return;
    
    ctx.globalAlpha = opacity / 100;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(text, textPos.x, textPos.y);
    ctx.globalAlpha = 1;
    
    setText('');
    setTextPos(null);
    saveToHistory();
  };

  const updateStickerOpacity = (newOpacity) => {
    if (!selectedSticker) return;
    
    setStickers(stickers.map(s => 
      s.id === selectedSticker.id
        ? { ...s, opacity: newOpacity }
        : s
    ));
  };

  const deleteSticker = () => {
    if (!selectedSticker) return;
    setStickers(stickers.filter(s => s.id !== selectedSticker.id));
    setSelectedSticker(null);
  };

  const handleSave = async () => {
    const mainCanvas = canvasRef.current;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = mainCanvas.width;
    tempCanvas.height = mainCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.drawImage(mainCanvas, 0, 0);
    
    stickers.forEach(sticker => {
      if (sticker.img && sticker.img.complete) {
        tempCtx.globalAlpha = (sticker.opacity || 100) / 100;
        tempCtx.drawImage(sticker.img, sticker.x, sticker.y, sticker.width, sticker.height);
        tempCtx.globalAlpha = 1;
      }
    });
    
    tempCanvas.toBlob((blob) => {
      onSave(blob);
    }, 'image/png');
  };

  const downloadImage = () => {
    const mainCanvas = canvasRef.current;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = mainCanvas.width;
    tempCanvas.height = mainCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.drawImage(mainCanvas, 0, 0);
    
    stickers.forEach(sticker => {
      if (sticker.img && sticker.img.complete) {
        tempCtx.globalAlpha = (sticker.opacity || 100) / 100;
        tempCtx.drawImage(sticker.img, sticker.x, sticker.y, sticker.width, sticker.height);
        tempCtx.globalAlpha = 1;
      }
    });
    
    const url = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = url;
    link.click();
  };

  const getCursorStyle = () => {
    if (tool !== 'select') return 'crosshair';
    if (isDraggingSticker) return 'grabbing';
    if (isResizingSticker) {
      if (resizeHandle === 'tl' || resizeHandle === 'br') return 'nwse-resize';
      if (resizeHandle === 'tr' || resizeHandle === 'bl') return 'nesw-resize';
    }
    return 'move';
  };

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'brush', icon: Pencil, label: 'Brush' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'fill', icon: Droplet, label: 'Fill' },
    { id: 'eyedropper', icon: Pipette, label: 'Eyedropper' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'adjust', icon: Sliders, label: 'Adjust' },
    { id: 'grok', icon: Sparkles, label: 'AI Sticker' }
  ];

  const filters = [
    { id: 'none', label: 'None' },
    { id: 'grayscale', label: 'B&W' },
    { id: 'vintage', label: 'Vintage' },
    { id: 'dramatic', label: 'Drama' },
    { id: 'cool', label: 'Cool' },
    { id: 'warm', label: 'Warm' },
    { id: 'soft', label: 'Soft' },
    { id: 'sharp', label: 'Sharp' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-white/20 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Pencil className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-white font-bold text-lg">Photo Editor</h3>
              <p className="text-white/60 text-sm">Professional editing tools</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-16 border-r border-white/20 bg-black/30 p-2 flex flex-col gap-2 overflow-y-auto">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                    tool === t.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  title={t.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>

          <div className="flex-1 flex items-center justify-center p-4 bg-zinc-900/50 overflow-auto">
            <div className="relative">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border border-white/20 rounded-lg shadow-2xl max-w-full max-h-full"
                style={{ imageRendering: 'crisp-edges', cursor: getCursorStyle() }}
              />
              <canvas
                ref={overlayCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="absolute top-0 left-0"
                style={{ pointerEvents: tool === 'select' ? 'auto' : 'none', cursor: getCursorStyle() }}
              />
            </div>
          </div>

          <div className="w-64 border-l border-white/20 bg-black/30 p-4 space-y-4 overflow-y-auto">
            {selectedSticker && tool === 'select' && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                <h4 className="text-white font-semibold mb-3 text-sm">Sticker Controls</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/60 mb-2 block">
                      Opacity: {selectedSticker.opacity || 100}%
                    </label>
                    <Slider
                      value={[selectedSticker.opacity || 100]}
                      onValueChange={(v) => updateStickerOpacity(v[0])}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-white/60">
                    • Drag to move<br/>
                    • Drag corners to resize<br/>
                    • Click away to deselect
                  </p>
                  <Button
                    onClick={deleteSticker}
                    size="sm"
                    className="w-full bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
                  >
                    Delete Sticker
                  </Button>
                </div>
              </div>
            )}

            {tool === 'grok' && (
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  AI Sticker
                </h4>
                <Textarea
                  value={grokPrompt}
                  onChange={(e) => setGrokPrompt(e.target.value)}
                  placeholder="Describe the sticker... (e.g., cute cat, fire emoji, cool logo)"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 mb-3 h-20"
                />
                <Button
                  onClick={generateGrokSticker}
                  disabled={isGeneratingSticker || !grokPrompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {isGeneratingSticker ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
                <p className="text-xs text-white/40 mt-2">
                  Use Select tool to move/resize stickers
                </p>
              </div>
            )}

            {tool === 'adjust' && (
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Filters & Adjustments
                </h4>
                
                <div className="mb-4">
                  <label className="text-xs text-white/60 mb-2 block">Filters</label>
                  <div className="grid grid-cols-4 gap-2">
                    {filters.map(f => (
                      <button
                        key={f.id}
                        onClick={() => applyPresetFilter(f.id)}
                        className={`px-2 py-1.5 rounded text-xs ${
                          selectedFilter === f.id
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                            : 'bg-white/5 text-white/60 border border-white/10'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/60 mb-2 block">
                      Brightness: {brightness}%
                    </label>
                    <Slider
                      value={[brightness]}
                      onValueChange={(v) => setBrightness(v[0])}
                      min={50}
                      max={150}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 mb-2 block">
                      Contrast: {contrast}%
                    </label>
                    <Slider
                      value={[contrast]}
                      onValueChange={(v) => setContrast(v[0])}
                      min={50}
                      max={150}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 mb-2 block">
                      Saturation: {saturation}%
                    </label>
                    <Slider
                      value={[saturation]}
                      onValueChange={(v) => setSaturation(v[0])}
                      min={0}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 mb-2 block">
                      Blur: {blur}px
                    </label>
                    <Slider
                      value={[blur]}
                      onValueChange={(v) => setBlur(v[0])}
                      min={0}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {tool !== 'adjust' && tool !== 'grok' && (
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Tools</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/60 mb-2 block">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                      />
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 h-12 bg-white/5 border-white/20 text-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-6 gap-1 mt-2">
                      {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#00ff88', '#888888'].map(c => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className="w-8 h-8 rounded border border-white/20 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/60 mb-2 block">
                      Size: {brushSize}px
                    </label>
                    <Slider
                      value={[brushSize]}
                      onValueChange={(v) => setBrushSize(v[0])}
                      min={1}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60 mb-2 block">
                      Opacity: {opacity}%
                    </label>
                    <Slider
                      value={[opacity]}
                      onValueChange={(v) => setOpacity(v[0])}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {tool === 'brush' && (
                    <div>
                      <label className="text-xs text-white/60 mb-2 block">Brush Type</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['round', 'square', 'spray'].map(type => (
                          <button
                            key={type}
                            onClick={() => setBrushType(type)}
                            className={`px-2 py-1.5 rounded text-xs capitalize ${
                              brushType === type
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                : 'bg-white/5 text-white/60 border border-white/10'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {['rectangle', 'circle', 'triangle'].includes(tool) && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={fillShape}
                        onChange={(e) => setFillShape(e.target.checked)}
                        className="w-4 h-4"
                        id="fillShape"
                      />
                      <label htmlFor="fillShape" className="text-xs text-white/80">
                        Fill Shape
                      </label>
                    </div>
                  )}

                  {tool === 'text' && (
                    <div>
                      <label className="text-xs text-white/60 mb-2 block">Text</label>
                      <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter your text here..."
                        className="bg-white/5 border-white/20 text-white mb-2 h-20"
                      />
                      <label className="text-xs text-white/60 mb-2 block">
                        Font Size: {fontSize}px
                      </label>
                      <Slider
                        value={[fontSize]}
                        onValueChange={(v) => setFontSize(v[0])}
                        min={10}
                        max={100}
                        step={2}
                        className="w-full mb-2"
                      />
                      <Button
                        onClick={addText}
                        disabled={!text.trim() || !textPos}
                        size="sm"
                        className="w-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
                      >
                        Add Text
                      </Button>
                      <p className="text-xs text-white/40 mt-2">
                        Click on canvas to place text
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/20">
              <h4 className="text-white font-semibold mb-3 text-sm">History</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={undo}
                  disabled={historyStep <= 0}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white/80 hover:bg-white/10 bg-white/5"
                >
                  <Undo2 className="w-4 h-4 mr-1" />
                  Undo
                </Button>
                <Button
                  onClick={redo}
                  disabled={historyStep >= history.length - 1}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white/80 hover:bg-white/10 bg-white/5"
                >
                  <Redo2 className="w-4 h-4 mr-1" />
                  Redo
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20 space-y-2">
              <Button
                onClick={clearCanvas}
                variant="outline"
                size="sm"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 bg-black"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button
                onClick={downloadImage}
                variant="outline"
                size="sm"
                className="w-full border-white/20 text-white/80 hover:bg-white/10 bg-white/5"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                Save & Use
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}