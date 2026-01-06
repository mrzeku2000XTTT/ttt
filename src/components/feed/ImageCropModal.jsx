import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Crop, Scissors, Move, RotateCw, Check, Undo } from "lucide-react";

export default function ImageCropModal({ imageUrl, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('crop'); // 'crop', 'draw', 'move'
  const [isDrawing, setIsDrawing] = useState(false);
  const [cropArea, setCropArea] = useState(null);
  const [drawPaths, setDrawPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;
        
        // Calculate scale to fit
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        const fitScale = Math.min(scaleX, scaleY, 1);
        setScale(fitScale);
        
        // Center image
        const x = (canvas.width - img.width * fitScale) / 2;
        const y = (canvas.height - img.height * fitScale) / 2;
        setPosition({ x, y });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (image && canvasRef.current) {
      redraw();
    }
  }, [image, scale, position, cropArea, drawPaths, currentPath]);

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.save();
    ctx.drawImage(image, position.x, position.y, image.width * scale, image.height * scale);
    ctx.restore();
    
    // Draw crop area
    if (cropArea && tool === 'crop') {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      
      // Draw corner handles
      const handleSize = 8;
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
      ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
      ctx.setLineDash([]);
    }
    
    // Draw paths
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    [...drawPaths, currentPath].forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'crop') {
      setCropArea({ x, y, width: 0, height: 0 });
      setIsDrawing(true);
    } else if (tool === 'draw') {
      setCurrentPath([{ x, y }]);
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'crop' && cropArea) {
      setCropArea({
        ...cropArea,
        width: x - cropArea.x,
        height: y - cropArea.y
      });
    } else if (tool === 'draw') {
      setCurrentPath([...currentPath, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (tool === 'draw' && currentPath.length > 0) {
      setDrawPaths([...drawPaths, currentPath]);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  const handleCrop = async () => {
    if (!cropArea || !image) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Normalize crop area
    const x = Math.max(0, Math.min(cropArea.x, cropArea.x + cropArea.width));
    const y = Math.max(0, Math.min(cropArea.y, cropArea.y + cropArea.height));
    const width = Math.abs(cropArea.width);
    const height = Math.abs(cropArea.height);
    
    // Convert to image coordinates
    const imgX = (x - position.x) / scale;
    const imgY = (y - position.y) / scale;
    const imgWidth = width / scale;
    const imgHeight = height / scale;
    
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    
    ctx.drawImage(
      image,
      imgX, imgY, imgWidth, imgHeight,
      0, 0, imgWidth, imgHeight
    );
    
    canvas.toBlob((blob) => {
      onSave(blob);
      onClose();
    }, 'image/png');
  };

  const handleAutoStraighten = () => {
    if (!cropArea) return;
    
    // Auto-straighten by snapping to nearest rectangular bounds
    const snappedArea = {
      x: Math.round(cropArea.x / 10) * 10,
      y: Math.round(cropArea.y / 10) * 10,
      width: Math.round(cropArea.width / 10) * 10,
      height: Math.round(cropArea.height / 10) * 10
    };
    setCropArea(snappedArea);
  };

  const handleUndo = () => {
    if (drawPaths.length > 0) {
      setDrawPaths(drawPaths.slice(0, -1));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-white/20 rounded-2xl w-full max-w-5xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-bold text-lg">Edit Image</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setTool('crop')}
                size="sm"
                variant={tool === 'crop' ? 'default' : 'ghost'}
                className={tool === 'crop' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
              >
                <Crop className="w-4 h-4 mr-2" />
                Crop
              </Button>
              <Button
                onClick={() => setTool('draw')}
                size="sm"
                variant={tool === 'draw' ? 'default' : 'ghost'}
                className={tool === 'draw' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
              >
                <Scissors className="w-4 h-4 mr-2" />
                Draw Cut
              </Button>
              <Button
                onClick={() => setTool('move')}
                size="sm"
                variant={tool === 'move' ? 'default' : 'ghost'}
                className={tool === 'move' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
              >
                <Move className="w-4 h-4 mr-2" />
                Move
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {tool === 'crop' && cropArea && (
              <Button
                onClick={handleAutoStraighten}
                size="sm"
                variant="outline"
                className="border-cyan-500/30 text-cyan-400"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Auto-Straighten
              </Button>
            )}
            {tool === 'draw' && drawPaths.length > 0 && (
              <Button
                onClick={handleUndo}
                size="sm"
                variant="outline"
                className="border-red-500/30 text-red-400"
              >
                <Undo className="w-4 h-4 mr-2" />
                Undo
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black/50">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="border border-white/10 rounded-lg cursor-crosshair"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 flex justify-between items-center">
          <div className="text-white/60 text-sm">
            {tool === 'crop' && "Drag to select crop area"}
            {tool === 'draw' && "Draw lines to mark areas to cut out"}
            {tool === 'move' && "Drag to reposition image"}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-white/20 text-white/80"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              disabled={!cropArea}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}