import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Eye, Palette, Type, Copy, Check, ExternalLink, Tag } from "lucide-react";
import { toast } from "sonner";

export default function TemplateDetailModal({ template, onClose }) {
  const [liked, setLiked] = useState(false);
  const [copiedColor, setCopiedColor] = useState(null);

  if (!template) return null;

  const copyColor = (color) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    toast.success(`Copied ${color}`);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  // Parse canvas_data if available
  let canvasData = null;
  try {
    if (template.canvas_data) canvasData = JSON.parse(template.canvas_data);
  } catch {}

  const PLACEHOLDER = {
    "Landing Page": "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1200&h=800&fit=crop",
    "Dashboard": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop",
    "E-Commerce": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop",
    "Portfolio": "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=1200&h=800&fit=crop",
    "Blog": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=800&fit=crop",
    "SaaS": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop",
    "Mobile App": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop",
    "Admin Panel": "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=800&fit=crop",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0d0d0f] border border-white/[0.08] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header image */}
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-white/[0.03]">
          <img
            src={template.preview_url || PLACEHOLDER[template.category] || PLACEHOLDER["Landing Page"]}
            alt={template.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 backdrop-blur-sm text-indigo-300 text-xs font-bold border border-indigo-500/20">
              {template.category}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 backdrop-blur-sm text-purple-300 text-xs font-bold border border-purple-500/20">
              {template.style}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-white text-xl font-black">{template.title}</h2>
              {template.description && (
                <p className="text-white/40 text-sm mt-1 leading-relaxed">{template.description}</p>
              )}
            </div>
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                liked ? 'bg-rose-500/15 border-rose-500/25 text-rose-400' : 'bg-white/[0.03] border-white/[0.08] text-white/30 hover:text-white/50'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span className="text-xs font-bold">{(template.likes || 0) + (liked ? 1 : 0)}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-white/25 text-xs">
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{template.views || 0} views</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" />{template.likes || 0} likes</span>
          </div>

          {/* Color Palette */}
          {template.color_palette?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Palette className="w-4 h-4 text-white/25" />
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Color Palette</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.color_palette.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => copyColor(color)}
                    className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all"
                  >
                    <div className="w-6 h-6 rounded-lg border border-white/10" style={{ background: color }} />
                    <span className="text-white/50 text-[11px] font-mono group-hover:text-white/70">{color}</span>
                    {copiedColor === color ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/15" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fonts */}
          {template.fonts?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Type className="w-4 h-4 text-white/25" />
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Typography</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.fonts.map((font, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 text-xs">
                    {font}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {template.tags?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Tag className="w-4 h-4 text-white/25" />
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-white/[0.04] text-white/40 text-[11px]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Canvas sections preview */}
          {canvasData?.sections?.length > 0 && (
            <div>
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-3">Layout Sections</span>
              <div className="space-y-2">
                {canvasData.sections.map((section, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 text-[10px] font-bold bg-white/[0.05]">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-white/70 text-xs font-medium">{section.name}</span>
                      {section.description && <p className="text-white/25 text-[10px] mt-0.5">{section.description}</p>}
                    </div>
                    {section.height && <span className="text-white/15 text-[10px]">{section.height}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}