import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Palette } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MoodToolbar from "@/components/igra/moodboard/MoodToolbar";
import MoodCanvas from "@/components/igra/moodboard/MoodCanvas";

const STORAGE_KEY = "igra_moodboard_items";
const spawn = () => ({ x: 40 + Math.random() * 160, y: 40 + Math.random() * 120, rotate: (Math.random() - 0.5) * 8 });

// Igra Mood Board — first app forged in the Igra Horizon sector
export default function IgraMoodBoard() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (partial) => setItems((prev) => [...prev, { id: Date.now() + Math.random(), ...spawn(), ...partial }]);

  const handleGenerate = async (prompt) => {
    setGenerating(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `Mood board aesthetic image: ${prompt}. Cinematic, rich atmosphere.`,
      });
      addItem({ type: "image", url });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      addItem({ type: "image", url: file_url });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #2a0f03 0%, #0a0302 55%, #050100 100%)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/IgraHorizon"
            className="flex items-center gap-2 px-4 py-2 text-[9px] tracking-[0.3em] uppercase rounded-full"
            style={{ border: "1px solid rgba(255,170,110,0.25)", background: "rgba(28,14,6,0.55)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              color: "rgba(255,200,160,0.85)", fontFamily: "monospace" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> IGRA HORIZON
          </Link>
          <span className="text-[9px] tracking-[0.35em] uppercase"
            style={{ color: "rgba(255,180,120,0.5)", fontFamily: "monospace" }}>
            APP 01 · SECTOR 04
          </span>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Palette className="w-6 h-6" style={{ color: "#fb923c" }} />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{ fontFamily: "'Georgia', serif",
                background: "linear-gradient(180deg, #fff7ed 0%, #fdba74 50%, #9a3412 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              IGRA MOOD BOARD
            </h1>
          </div>
          <p className="mt-2 text-[9px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(255,215,180,0.55)", fontFamily: "monospace" }}>
            FORGE YOUR VISION · DRAG · AUTO-SAVED
          </p>
        </motion.div>

        <div className="space-y-4">
          <MoodToolbar
            onGenerate={handleGenerate}
            onUpload={handleUpload}
            onAddNote={() => addItem({ type: "note", text: "" })}
            onAddColor={(color) => addItem({ type: "color", color })}
            onClear={() => setItems([])}
            generating={generating}
            uploading={uploading}
          />
          <MoodCanvas
            items={items}
            onMove={(id, dx, dy) => setItems((prev) => prev.map((it) => it.id === id ? { ...it, x: it.x + dx, y: it.y + dy } : it))}
            onEditNote={(id, text) => setItems((prev) => prev.map((it) => it.id === id ? { ...it, text } : it))}
            onRemove={(id) => setItems((prev) => prev.filter((it) => it.id !== id))}
          />
        </div>
      </div>
    </div>
  );
}