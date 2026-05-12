import React, { useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, ZoomIn, Sun, Paintbrush, Sparkles, ArrowRight, Film } from "lucide-react";

const TOOLS = [
  { id: "generate", label: "Generate Image", desc: "Create stunning AI images from text prompts", icon: ImagePlus, color: "from-purple-500 to-indigo-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "motion", label: "Motion SaaS", desc: "Generate SaaS hero frames and open animated product demos", icon: Film, color: "from-fuchsia-500 to-cyan-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
  { id: "upscaler", label: "Upscaler", desc: "Enhance resolution and quality of any image", icon: ZoomIn, color: "from-cyan-500 to-blue-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: "relight", label: "Relight", desc: "Control lighting angle, warmth, and intensity", icon: Sun, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "edit", label: "Edit Image", desc: "Transform images with AI-powered editing", icon: Paintbrush, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
];

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
  "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
  "https://images.unsplash.com/photo-1633177317976-3f9bc45e1d1d?w=400&q=80",
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&q=80",
  "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400&q=80",
];

export default function HikaruGallery() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-indigo-500/20 to-cyan-500/30 blur-3xl" />
        <div className="relative bg-gradient-to-br from-purple-900/40 to-black/60 border border-white/[0.08] rounded-3xl p-8 sm:p-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 text-xs font-bold uppercase tracking-widest">AI Creative Studio</span>
          </div>
          <h2 className="text-white text-3xl sm:text-4xl font-black leading-tight mb-3">
            Create stunning visuals<br />with the power of AI
          </h2>
          <p className="text-white/40 text-sm max-w-md">
            Generate images, enhance quality, control lighting, and edit with AI — all in one studio.
          </p>
        </div>
      </motion.div>

      {/* Tools grid */}
      <div>
        <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Creative Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`group relative p-5 rounded-2xl ${tool.bg} border ${tool.border} hover:border-white/20 cursor-pointer transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{tool.label}</h4>
                <p className="text-white/35 text-xs leading-relaxed">{tool.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Gallery */}
      <div>
        <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Community Gallery</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GALLERY_IMAGES.map((url, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="aspect-square rounded-2xl overflow-hidden border border-white/[0.06] group cursor-pointer"
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}