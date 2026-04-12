import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Eye, Palette, Type, ExternalLink, Trash2 } from "lucide-react";

const PLACEHOLDER_PREVIEWS = {
  "Landing Page": "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&h=400&fit=crop",
  "Dashboard": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
  "E-Commerce": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
  "Portfolio": "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&h=400&fit=crop",
  "Blog": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop",
  "SaaS": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  "Mobile App": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
  "Admin Panel": "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop",
};

export default function TemplateCard({ template, onOpen, onDelete, isAdmin, viewMode = 'grid' }) {
  const [imgError, setImgError] = useState(false);
  const previewSrc = (!imgError && template.preview_url) || PLACEHOLDER_PREVIEWS[template.category] || PLACEHOLDER_PREVIEWS["Landing Page"];

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer"
        onClick={() => onOpen(template)}
      >
        <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.04]">
          <img src={previewSrc} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-bold truncate">{template.title}</h3>
          <p className="text-white/30 text-[11px] truncate mt-0.5">{template.description || 'No description'}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-indigo-400/60 text-[10px]">{template.category}</span>
            <span className="text-purple-400/60 text-[10px]">{template.style}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/20 text-[10px] flex-shrink-0">
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{template.likes || 0}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{template.views || 0}</span>
        </div>
        {isAdmin && onDelete && (
          <button onClick={e => { e.stopPropagation(); onDelete(template); }} className="text-red-400/40 hover:text-red-400 p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.15] transition-all overflow-hidden cursor-pointer"
      onClick={() => onOpen(template)}
    >
      {/* Preview */}
      <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.03]">
        <img
          src={previewSrc}
          alt={template.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Hover overlay actions */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 backdrop-blur-sm text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
              {template.category}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 backdrop-blur-sm text-purple-300 text-[10px] font-bold border border-purple-500/20">
              {template.style}
            </span>
          </div>
          <button className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white border border-white/10">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {isAdmin && onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(template); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/20 backdrop-blur-sm flex items-center justify-center text-red-400/60 hover:text-red-400 border border-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="text-white text-sm font-bold truncate">{template.title}</h3>
        {template.description && (
          <p className="text-white/30 text-[11px] mt-1 line-clamp-2 leading-relaxed">{template.description}</p>
        )}

        {/* Color palette */}
        {template.color_palette?.length > 0 && (
          <div className="flex items-center gap-1 mt-2.5">
            <Palette className="w-3 h-3 text-white/15 mr-0.5" />
            {template.color_palette.slice(0, 6).map((color, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: color }} />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 text-white/20 text-[10px]">
            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{template.likes || 0}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{template.views || 0}</span>
          </div>
          {template.fonts?.length > 0 && (
            <div className="flex items-center gap-1 text-white/15 text-[10px]">
              <Type className="w-3 h-3" />
              <span>{template.fonts[0]}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}