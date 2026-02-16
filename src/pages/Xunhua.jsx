import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Wand2, Download, Palette, Eraser, Paintbrush, FlipHorizontal, ToggleLeft, ToggleRight, Undo, Redo, Circle, Square, Droplet, Sparkles, Pencil, Highlighter, Brush, Pipette, Stamp, Upload, Move, Maximize2, Layers, Eye, EyeOff, Trash, Type } from "lucide-react";

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
  const [advancedMode, setAdvancedMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [sketchMode, setSketchMode] = useState(false);
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [cropMode, setCropMode] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [textLayers, setTextLayers] = useState([]);
  const [editingText, setEditingText] = useState(null);
  const [draggingTextFromModal, setDraggingTextFromModal] = useState(false);
  
  // Kaspa logo reference
  const KASPA_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3f644abe6_IMG_0952.png";

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
    
    saveToHistory();
  }, []);

  useEffect(() => {
    redrawCanvas();
  }, [layers, textLayers, editingText]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep <= 0) return;
    const newStep = historyStep - 1;
    restoreFromHistory(newStep);
    setHistoryStep(newStep);
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    restoreFromHistory(newStep);
    setHistoryStep(newStep);
  };

  const restoreFromHistory = (step) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      redrawCanvas();
    };
    img.src = history[step];
  };

  const redrawCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw layers
    for (const layer of layers) {
      if (!layer.visible) continue;
      
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.globalAlpha = layer.opacity;
          
          if (layer.filter && layer.filter !== "none") {
            ctx.filter = layer.filter;
          }
          
          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = layer.imageData;
      });
    }
    
    // Draw selection handles for selected layer
    if (selectedLayer && (tool === "move" || cropMode)) {
      ctx.save();
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(selectedLayer.x, selectedLayer.y, selectedLayer.width, selectedLayer.height);
      
      // Draw resize handles
      const handleSize = 10;
      const handles = [
        { x: selectedLayer.x, y: selectedLayer.y },
        { x: selectedLayer.x + selectedLayer.width, y: selectedLayer.y },
        { x: selectedLayer.x, y: selectedLayer.y + selectedLayer.height },
        { x: selectedLayer.x + selectedLayer.width, y: selectedLayer.y + selectedLayer.height },
        { x: selectedLayer.x + selectedLayer.width / 2, y: selectedLayer.y },
        { x: selectedLayer.x + selectedLayer.width / 2, y: selectedLayer.y + selectedLayer.height },
        { x: selectedLayer.x, y: selectedLayer.y + selectedLayer.height / 2 },
        { x: selectedLayer.x + selectedLayer.width, y: selectedLayer.y + selectedLayer.height / 2 },
      ];
      
      ctx.fillStyle = "#06b6d4";
      handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      });
      ctx.restore();
    }
    
    // Draw text layers
    textLayers.forEach(textLayer => {
      if (!textLayer.visible) return;
      
      ctx.save();
      ctx.globalAlpha = textLayer.opacity || 1;
      ctx.font = `${textLayer.bold ? 'bold ' : ''}${textLayer.fontSize || 24}px ${textLayer.fontFamily || 'Arial'}`;
      ctx.fillStyle = textLayer.color || '#ffffff';
      ctx.textAlign = textLayer.align || 'left';
      ctx.textBaseline = 'top';
      
      if (textLayer.shadow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
      }
      
      if (textLayer.stroke) {
        ctx.strokeStyle = textLayer.strokeColor || '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(textLayer.text, textLayer.x, textLayer.y);
      }
      
      ctx.fillText(textLayer.text, textLayer.x, textLayer.y);
      ctx.restore();
      
      // Draw selection box for editing text with solid background
      if (editingText?.id === textLayer.id) {
        ctx.save();
        const textWidth = ctx.measureText(textLayer.text).width;
        const textHeight = textLayer.fontSize || 24;
        
        // Draw white background box
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillRect(textLayer.x - 8, textLayer.y - 6, textWidth + 16, textHeight + 12);
        
        // Draw cyan border
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.strokeRect(textLayer.x - 8, textLayer.y - 6, textWidth + 16, textHeight + 12);
        
        // Draw corner handles
        const handleSize = 8;
        ctx.fillStyle = "#06b6d4";
        const corners = [
          [textLayer.x - 8, textLayer.y - 6],
          [textLayer.x + textWidth + 8, textLayer.y - 6],
          [textLayer.x - 8, textLayer.y + textHeight + 6],
          [textLayer.x + textWidth + 8, textLayer.y + textHeight + 6]
        ];
        corners.forEach(([cx, cy]) => {
          ctx.fillRect(cx - handleSize/2, cy - handleSize/2, handleSize, handleSize);
        });
        
        ctx.restore();
      }
    });
  };
  
  const getResizeHandle = (x, y) => {
    if (!selectedLayer) return null;
    
    const handleSize = 10;
    const handles = [
      { pos: "nw", x: selectedLayer.x, y: selectedLayer.y },
      { pos: "ne", x: selectedLayer.x + selectedLayer.width, y: selectedLayer.y },
      { pos: "sw", x: selectedLayer.x, y: selectedLayer.y + selectedLayer.height },
      { pos: "se", x: selectedLayer.x + selectedLayer.width, y: selectedLayer.y + selectedLayer.height },
      { pos: "n", x: selectedLayer.x + selectedLayer.width / 2, y: selectedLayer.y },
      { pos: "s", x: selectedLayer.x + selectedLayer.width / 2, y: selectedLayer.y + selectedLayer.height },
      { pos: "w", x: selectedLayer.x, y: selectedLayer.y + selectedLayer.height / 2 },
      { pos: "e", x: selectedLayer.x + selectedLayer.width, y: selectedLayer.y + selectedLayer.height / 2 },
    ];
    
    for (const handle of handles) {
      if (Math.abs(x - handle.x) < handleSize && Math.abs(y - handle.y) < handleSize) {
        return handle.pos;
      }
    }
    return null;
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    // If dragging from modal, place text and stop (don't open modal)
    if (draggingTextFromModal && editingText) {
      const updatedTextLayers = textLayers.map(t =>
        t.id === editingText.id ? { ...t, x: x - (editingText.fontSize || 32) / 2, y: y - (editingText.fontSize || 32) / 2 } : t
      );
      setTextLayers(updatedTextLayers);
      setEditingText({ ...editingText, x: x - (editingText.fontSize || 32) / 2, y: y - (editingText.fontSize || 32) / 2 });
      setDraggingTextFromModal(false);
      saveToHistory();
      return;
    }

    // Check for text clicks (only if NOT in dragging mode)
    if (!draggingTextFromModal) {
      const ctx = canvas.getContext("2d");
      for (let i = textLayers.length - 1; i >= 0; i--) {
        const textLayer = textLayers[i];
        if (!textLayer.visible) continue;
        
        ctx.font = `${textLayer.bold ? 'bold ' : ''}${textLayer.fontSize}px ${textLayer.fontFamily}`;
        const textWidth = ctx.measureText(textLayer.text).width;
        const textHeight = textLayer.fontSize;
        
        if (x >= textLayer.x && x <= textLayer.x + textWidth &&
            y >= textLayer.y && y <= textLayer.y + textHeight) {
          setEditingText(textLayer);
          return;
        }
      }
    }

    if (textMode) {
      // Create new text layer at click position
      const newText = {
        id: Date.now(),
        text: "Type here",
        x,
        y,
        color: color,
        fontSize: 32,
        fontFamily: 'Arial',
        bold: false,
        align: 'left',
        opacity: 1,
        visible: true,
        shadow: false,
        stroke: false,
        strokeColor: '#000000'
      };
      const updated = [...textLayers, newText];
      setTextLayers(updated);
      setEditingText(newText);
      setTimeout(() => {
        redrawCanvas();
        saveToHistory();
      }, 0);
      return;
    }

    if (tool === "move" || cropMode) {
      // Check for text layer click first
      const ctx = canvas.getContext("2d");
      for (let i = textLayers.length - 1; i >= 0; i--) {
        const textLayer = textLayers[i];
        if (!textLayer.visible) continue;
        
        ctx.font = `${textLayer.bold ? 'bold ' : ''}${textLayer.fontSize}px ${textLayer.fontFamily}`;
        const textWidth = ctx.measureText(textLayer.text).width;
        const textHeight = textLayer.fontSize;
        
        if (x >= textLayer.x && x <= textLayer.x + textWidth &&
            y >= textLayer.y && y <= textLayer.y + textHeight) {
          setIsDragging(true);
          setDragStart({ 
            x: x - textLayer.x, 
            y: y - textLayer.y,
            isText: true,
            textLayer
          });
          return;
        }
      }
    }

    if (tool === "move" || cropMode) {
      // Check if clicking on a resize handle of selected layer
      if (selectedLayer) {
        const handle = getResizeHandle(x, y);
        if (handle) {
          setResizeHandle(handle);
          setDragStart({ x, y, startX: selectedLayer.x, startY: selectedLayer.y, startWidth: selectedLayer.width, startHeight: selectedLayer.height });
          return;
        }
        
        // Check if clicking inside selected layer
        if (x >= selectedLayer.x && x <= selectedLayer.x + selectedLayer.width &&
            y >= selectedLayer.y && y <= selectedLayer.y + selectedLayer.height) {
          setIsDragging(true);
          setDragStart({ x: x - selectedLayer.x, y: y - selectedLayer.y });
          return;
        }
      }
      
      // Check if clicking on any layer to select it
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (layer.visible && x >= layer.x && x <= layer.x + layer.width &&
            y >= layer.y && y <= layer.y + layer.height) {
          setSelectedLayer(layer);
          setIsDragging(true);
          setDragStart({ x: x - layer.x, y: y - layer.y });
          return;
        }
      }
      
      // Click outside any layer - deselect
      setSelectedLayer(null);
      return;
    }

    setIsDrawing(true);
    setLastPoint({ x, y });
  };

  const draw = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    // Handle text dragging
    if (isDragging && dragStart?.isText && dragStart?.textLayer) {
      e.preventDefault();
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;
      const updatedTextLayers = textLayers.map(t =>
        t.id === dragStart.textLayer.id ? { ...t, x: newX, y: newY } : t
      );
      setTextLayers(updatedTextLayers);
      return;
    }

    if (resizeHandle && selectedLayer && dragStart) {
      e.preventDefault();
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      let newX = dragStart.startX;
      let newY = dragStart.startY;
      let newWidth = dragStart.startWidth;
      let newHeight = dragStart.startHeight;
      
      const aspectRatio = dragStart.startWidth / dragStart.startHeight;
      
      if (resizeHandle.includes("e")) {
        newWidth = dragStart.startWidth + dx;
      }
      if (resizeHandle.includes("w")) {
        newWidth = dragStart.startWidth - dx;
        newX = dragStart.startX + dx;
      }
      if (resizeHandle.includes("s")) {
        newHeight = dragStart.startHeight + dy;
      }
      if (resizeHandle.includes("n")) {
        newHeight = dragStart.startHeight - dy;
        newY = dragStart.startY + dy;
      }
      
      if (resizeHandle === "se" || resizeHandle === "nw" || resizeHandle === "ne" || resizeHandle === "sw") {
        newHeight = newWidth / aspectRatio;
        if (resizeHandle === "nw" || resizeHandle === "ne") {
          newY = dragStart.startY + (dragStart.startHeight - newHeight);
        }
      }
      
      const updatedLayer = { ...selectedLayer, x: newX, y: newY, width: Math.max(20, newWidth), height: Math.max(20, newHeight) };
      const updatedLayers = layers.map(layer =>
        layer.id === selectedLayer.id ? updatedLayer : layer
      );
      setLayers(updatedLayers);
      setSelectedLayer(updatedLayer);
      return;
    }

    if (isDragging && selectedLayer && dragStart) {
      e.preventDefault();
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;
      const updatedLayer = { ...selectedLayer, x: newX, y: newY };
      const updatedLayers = layers.map(layer =>
        layer.id === selectedLayer.id ? updatedLayer : layer
      );
      setLayers(updatedLayers);
      setSelectedLayer(updatedLayer);
      return;
    }

    if (!isDrawing || isDragging || resizeHandle) return;
    
    const ctx = canvas.getContext("2d");

    if (lastPoint) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      
      // Tool-specific drawing
      if (tool === "eraser") {
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = brushSize * 2;
      } else if (tool === "pencil") {
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, brushSize / 2);
      } else if (tool === "marker") {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize * 2;
        ctx.globalAlpha = 0.7;
      } else if (tool === "spray") {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize * 3;
        ctx.globalAlpha = 0.3;
      } else if (tool === "glow") {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
      } else if (tool === "neon") {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.shadowBlur = 30;
        ctx.shadowColor = color;
        ctx.globalAlpha = 0.8;
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
      }
      
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      
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
    if (isDrawing || (isDragging && dragStart?.isText) || draggingTextFromModal) {
      saveToHistory();
    }
    setIsDrawing(false);
    setIsDragging(false);
    setResizeHandle(null);
    setLastPoint(null);
    setDragStart(null);
    setDraggingTextFromModal(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const maxSize = Math.min(canvas.width, canvas.height) * 0.5;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        
        const newLayer = {
          id: Date.now(),
          imageData: event.target.result,
          x: canvas.width / 4,
          y: canvas.height / 4,
          width: img.width * scale,
          height: img.height * scale,
          opacity: 1,
          visible: true,
          filter: "none"
        };
        
        setLayers([...layers, newLayer]);
        setSelectedLayer(newLayer);
        setTimeout(() => saveToHistory(), 0);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const updateSelectedLayer = (updates) => {
    if (!selectedLayer) return;
    const updatedLayers = layers.map(layer =>
      layer.id === selectedLayer.id ? { ...layer, ...updates } : layer
    );
    setLayers(updatedLayers);
    setSelectedLayer({ ...selectedLayer, ...updates });
  };

  const deleteSelectedLayer = () => {
    if (!selectedLayer) return;
    const newLayers = layers.filter(layer => layer.id !== selectedLayer.id);
    setLayers(newLayers);
    setSelectedLayer(null);
    
    // Redraw canvas after deletion
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }, 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const resultCanvas = resultCanvasRef.current;
    
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if (resultCanvas) {
      const resultCtx = resultCanvas.getContext("2d");
      resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
      resultCtx.fillStyle = "#1a1a1a";
      resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
    }
    
    setLayers([]);
    setSelectedLayer(null);
    setTextLayers([]);
    setEditingText(null);
    setDrawingBounds(null);
    setGeneratedImage(null);
    setIsDrawing(false);
    setLastPoint(null);
    setIsFlipped(false);
    saveToHistory();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please describe what you're drawing");
      return;
    }

    const hasContent = drawingBounds || layers.length > 0;
    if (!hasContent) {
      alert("Please draw something or add an image first");
      return;
    }

    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: new File([blob], "sketch.png", { type: "image/png" })
      });

      let aiPrompt;
      if (sketchMode) {
        aiPrompt = `${prompt}. Render this as a HIGHLY REALISTIC PENCIL SKETCH with fine details, shading, cross-hatching, and texture. Black and white only, photorealistic pencil drawing style. Convert any photos or images into detailed pencil sketch artwork.`;
      } else if (advancedMode) {
        aiPrompt = `${prompt}. Transform this sketch into a beautiful, detailed artistic image. Add creative details, textures, and enhancements.`;
      } else {
        aiPrompt = `${prompt}. CRITICAL: Match the sketch EXACTLY - same number of objects, same positions, same proportions. Only enhance colors and textures. Do NOT add any objects or elements that don't exist in the sketch.`;
      }
      
      // Check if prompt mentions Kaspa - if so, include Kaspa logo as reference
      const imageUrls = [file_url];
      if (/kaspa/i.test(prompt)) {
        imageUrls.push(KASPA_LOGO_URL);
      }
      
      const result = await base44.integrations.Core.GenerateImage({
        prompt: aiPrompt,
        existing_image_urls: imageUrls
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
      alert("Failed to generate image. Try again.");
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
      link.download = `xunhua-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, "image/png");
  };

  const handleFlip = () => {
    const hasContent = drawingBounds || layers.length > 0;
    if (!isFlipped && autoRender && prompt.trim() && hasContent && !generatedImage) {
      handleGenerate();
    } else {
      setIsFlipped(!isFlipped);
    }
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
                onClick={() => setSketchMode(!sketchMode)}
                size="sm"
                className={`h-8 px-3 ${sketchMode ? "bg-gray-700 text-white border-2 border-gray-400" : "bg-white/5 text-white"}`}
                title="Generate as realistic pencil sketch"
              >
                <Pencil className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Sketch</span>
              </Button>

              <Button
                onClick={() => setAdvancedMode(!advancedMode)}
                size="sm"
                style={{
                  backgroundColor: advancedMode ? '#a855f7' : 'rgba(255,255,255,0.05)',
                  color: advancedMode ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  border: advancedMode ? '2px solid #c084fc' : '2px solid transparent',
                  boxShadow: advancedMode ? '0 0 20px rgba(168,85,247,0.5)' : 'none'
                }}
                className="h-8 px-3 transition-all"
                title={advancedMode ? "Advanced: AI adds details" : "Exact: Only what you drew"}
              >
                <Wand2 className="w-4 h-4 mr-1" style={{ animation: advancedMode ? 'pulse 2s infinite' : 'none' }} />
                <span className="hidden sm:inline font-bold">{advancedMode ? "Advanced ✨" : "Exact"}</span>
              </Button>
            
            <Button
              onClick={() => setAutoRender(!autoRender)}
              size="sm"
              className={`h-8 px-3 ${autoRender ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}
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
          <Button onClick={undo} disabled={historyStep <= 0} size="sm" className="h-8 px-2 bg-white/5 text-white disabled:opacity-30">
            <Undo className="w-4 h-4" />
          </Button>
          <Button onClick={redo} disabled={historyStep >= history.length - 1} size="sm" className="h-8 px-2 bg-white/5 text-white disabled:opacity-30">
            <Redo className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-8 bg-white/10" />
          
          <Button onClick={() => { setTool("brush"); setCropMode(false); }} size="sm" className={`h-8 px-2 ${tool === "brush" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}>
            <Paintbrush className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setTool("pencil"); setCropMode(false); }} size="sm" className={`h-8 px-2 ${tool === "pencil" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setTool("marker"); setCropMode(false); }} size="sm" className={`h-8 px-2 ${tool === "marker" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}>
            <Highlighter className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setTool("spray"); setCropMode(false); }} size="sm" className={`h-8 px-2 ${tool === "spray" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}>
            <Pipette className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setTool("glow"); setCropMode(false); }} size="sm" className={`h-8 px-2 ${tool === "glow" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}>
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setTool("neon"); setCropMode(false); }} size="sm" className={`h-8 px-2 ${tool === "neon" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}>
            <Droplet className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setTool("eraser"); setCropMode(false); }} size="sm" className={`h-8 px-2 ${tool === "eraser" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}>
            <Eraser className="w-4 h-4" />
          </Button>

          <div className="w-px h-8 bg-white/10" />

          <Button 
            onClick={() => {
              const newMode = !textMode;
              setTextMode(newMode);
              if (newMode) {
                setTool("brush");
                setCropMode(false);
                setEditingText(null);
              } else {
                setEditingText(null);
              }
            }} 
            size="sm" 
            className={`h-8 px-2 transition-all ${textMode ? "bg-purple-500 text-white border-2 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-white/5 text-white border border-transparent"}`}
            title="Add Text - Click on canvas to place"
          >
            <Type className="w-4 h-4" />
          </Button>

          <div className="w-px h-8 bg-white/10" />
          
          <Button 
            onClick={() => {
              if (tool === "move") {
                setTool("brush");
              } else {
                setTool("move");
                setCropMode(false);
                setTextMode(false);
              }
            }} 
            size="sm" 
            className={`h-8 px-2 ${tool === "move" ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`} 
            title="Move/Resize - Click to toggle"
          >
            <Move className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => {
              const newMode = !cropMode;
              setCropMode(newMode);
              if (newMode) {
                setTool("move");
                setTextMode(false);
              }
            }} 
            size="sm" 
            className={`h-8 px-2 ${cropMode ? "bg-orange-500 text-black" : "bg-white/5 text-white"}`} 
            title="Crop Mode - Click to toggle"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button as="span" size="sm" className="h-8 px-2 bg-white/5 text-white pointer-events-none">
              <Upload className="w-4 h-4" />
            </Button>
          </label>
          <Button onClick={() => setShowLayerPanel(!showLayerPanel)} size="sm" className={`h-8 px-2 ${showLayerPanel ? "bg-cyan-500 text-black" : "bg-white/5 text-white"}`}>
            <Layers className="w-4 h-4" />
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

        {/* Text Editor Modal */}
        <AnimatePresence>
          {editingText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setEditingText(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-4 w-80 space-y-3"
              >
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Edit Text
                </h3>

                <Input
                  value={editingText.text}
                  onChange={(e) => {
                    const updated = textLayers.map(t => 
                      t.id === editingText.id ? { ...t, text: e.target.value } : t
                    );
                    setTextLayers(updated);
                    setEditingText({ ...editingText, text: e.target.value });
                  }}
                  className="bg-white/10 text-white border-white/20"
                  placeholder="Enter text..."
                />

                <Button
                  onClick={() => setDraggingTextFromModal(!draggingTextFromModal)}
                  size="sm"
                  className={`w-full mb-3 ${draggingTextFromModal ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white'}`}
                >
                  <Move className="w-4 h-4 mr-2" />
                  {draggingTextFromModal ? 'Click Canvas to Place' : 'Move Text'}
                </Button>

                <div className="space-y-2">
                  <div>
                    <label className="text-white/60 text-xs">Font Family</label>
                    <select
                      value={editingText.fontFamily}
                      onChange={(e) => {
                        const updated = textLayers.map(t => 
                          t.id === editingText.id ? { ...t, fontFamily: e.target.value } : t
                        );
                        setTextLayers(updated);
                        setEditingText({ ...editingText, fontFamily: e.target.value });
                      }}
                      className="w-full bg-white/10 text-white rounded px-2 py-1 text-sm border border-white/20"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                      <option value="Impact">Impact</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-white/60 text-xs">Font Size</label>
                      <input
                        type="number"
                        value={editingText.fontSize}
                        onChange={(e) => {
                          const updated = textLayers.map(t => 
                            t.id === editingText.id ? { ...t, fontSize: parseInt(e.target.value) } : t
                          );
                          setTextLayers(updated);
                          setEditingText({ ...editingText, fontSize: parseInt(e.target.value) });
                        }}
                        className="w-full bg-white/10 text-white rounded px-2 py-1 text-sm border border-white/20"
                        min="8"
                        max="200"
                      />
                    </div>

                    <div>
                      <label className="text-white/60 text-xs">Color</label>
                      <input
                        type="color"
                        value={editingText.color}
                        onChange={(e) => {
                          const updated = textLayers.map(t => 
                            t.id === editingText.id ? { ...t, color: e.target.value } : t
                          );
                          setTextLayers(updated);
                          setEditingText({ ...editingText, color: e.target.value });
                        }}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const updated = textLayers.map(t => 
                        t.id === editingText.id ? { ...t, bold: !t.bold } : t
                      );
                      setTextLayers(updated);
                      setEditingText({ ...editingText, bold: !editingText.bold });
                    }}
                    size="sm"
                    className={`flex-1 ${editingText.bold ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white'}`}
                  >
                    Bold
                  </Button>

                  <Button
                    onClick={() => {
                      const updated = textLayers.map(t => 
                        t.id === editingText.id ? { ...t, shadow: !t.shadow } : t
                      );
                      setTextLayers(updated);
                      setEditingText({ ...editingText, shadow: !editingText.shadow });
                    }}
                    size="sm"
                    className={`flex-1 ${editingText.shadow ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white'}`}
                  >
                    Shadow
                  </Button>

                  <Button
                    onClick={() => {
                      const updated = textLayers.map(t => 
                        t.id === editingText.id ? { ...t, stroke: !t.stroke } : t
                      );
                      setTextLayers(updated);
                      setEditingText({ ...editingText, stroke: !editingText.stroke });
                    }}
                    size="sm"
                    className={`flex-1 ${editingText.stroke ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white'}`}
                  >
                    Outline
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setTextLayers(textLayers.filter(t => t.id !== editingText.id));
                    setEditingText(null);
                  }}
                  size="sm"
                  className="w-full bg-red-500/20 text-red-400 border border-red-500/30"
                >
                  <Trash className="w-3 h-3 mr-1" />
                  Delete Text
                </Button>

                <Button
                  onClick={() => {
                    setEditingText(null);
                    setDraggingTextFromModal(false);
                  }}
                  size="sm"
                  className="w-full bg-white/10 text-white"
                >
                  Done
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layer Panel */}
        <AnimatePresence>
          {showLayerPanel && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="absolute left-3 top-32 z-10 w-64 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-3"
            >
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Layers ({layers.length})
              </h3>
              
              {selectedLayer && (
                <div className="mb-3 p-2 bg-white/5 rounded border border-white/10">
                  <p className="text-white/60 text-xs mb-2">Selected Layer</p>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-white/60 text-xs">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedLayer.opacity}
                        onChange={(e) => updateSelectedLayer({ opacity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="text-white/60 text-xs">Size</label>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        value={selectedLayer.width}
                        onChange={(e) => {
                          const newWidth = parseInt(e.target.value);
                          const ratio = selectedLayer.height / selectedLayer.width;
                          updateSelectedLayer({ width: newWidth, height: newWidth * ratio });
                        }}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="text-white/60 text-xs">Filter</label>
                      <select
                        value={selectedLayer.filter}
                        onChange={(e) => updateSelectedLayer({ filter: e.target.value })}
                        className="w-full bg-white/10 text-white rounded px-2 py-1 text-xs"
                      >
                        <option value="none">None</option>
                        <option value="grayscale(1)">Grayscale</option>
                        <option value="sepia(1)">Sepia</option>
                        <option value="blur(2px)">Blur</option>
                        <option value="brightness(1.5)">Brighten</option>
                        <option value="contrast(1.5)">Contrast</option>
                        <option value="invert(1)">Invert</option>
                      </select>
                    </div>
                    
                    <Button
                      onClick={deleteSelectedLayer}
                      size="sm"
                      className="w-full h-7 bg-red-500/20 text-red-400 border border-red-500/30"
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      Delete Layer
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {layers.map((layer, idx) => (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayer(layer)}
                    className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                      selectedLayer?.id === layer.id ? "bg-cyan-500/20 border border-cyan-500/50" : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <img src={layer.imageData} className="w-8 h-8 object-cover rounded" />
                    <span className="text-white text-xs flex-1">Layer {layers.length - idx}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSelectedLayer({ visible: !layer.visible });
                      }}
                    >
                      {layer.visible ? <Eye className="w-4 h-4 text-white/60" /> : <EyeOff className="w-4 h-4 text-white/30" />}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-white/60 text-sm">Generating...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Input */}
        <div className="flex gap-2 mt-3">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
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