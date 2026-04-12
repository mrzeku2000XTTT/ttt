import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Plus, Trash2, Sparkles, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const CATEGORIES = ["Landing Page", "Dashboard", "E-Commerce", "Portfolio", "Blog", "SaaS", "Mobile App", "Admin Panel"];
const STYLES = ["Minimal", "Bold", "Glassmorphism", "Neomorphism", "Dark Mode", "Gradient", "Retro", "Corporate"];

export default function CreateTemplateModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Landing Page");
  const [style, setStyle] = useState("Minimal");
  const [colors, setColors] = useState(["#6366f1", "#a855f7", "#0f172a", "#f8fafc", "#1e293b"]);
  const [fonts, setFonts] = useState(["Inter", "Space Grotesk"]);
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleColorChange = (idx, val) => {
    const updated = [...colors];
    updated[idx] = val;
    setColors(updated);
  };

  const addColor = () => setColors([...colors, "#94a3b8"]);
  const removeColor = (idx) => setColors(colors.filter((_, i) => i !== idx));

  const handleFontChange = (idx, val) => {
    const updated = [...fonts];
    updated[idx] = val;
    setFonts(updated);
  };

  const addFont = () => setFonts([...fonts, ""]);
  const removeFont = (idx) => setFonts(fonts.filter((_, i) => i !== idx));

  const handleUploadPreview = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPreviewUrl(file_url);
      toast.success("Preview uploaded");
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const generateWithAI = async () => {
    if (!title.trim()) { toast.error("Enter a title first"); return; }
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a UI/UX design template specification for: "${title}" (Category: ${category}, Style: ${style}).
Return a JSON with:
- description (2-3 sentences about the design)
- color_palette (5-6 hex colors that work for this style)
- fonts (2-3 Google Font names)
- tags (5-8 relevant tags)
- sections (array of {name, description, height} for the page layout sections, e.g. Hero, Features, Pricing, Footer)`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            color_palette: { type: "array", items: { type: "string" } },
            fonts: { type: "array", items: { type: "string" } },
            tags: { type: "array", items: { type: "string" } },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  height: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (res.description) setDescription(res.description);
      if (res.color_palette?.length) setColors(res.color_palette);
      if (res.fonts?.length) setFonts(res.fonts);
      if (res.tags?.length) setTags(res.tags.join(", "));
      toast.success("AI generated template specs!");
    } catch (err) {
      toast.error("AI generation failed");
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    try {
      const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
      const canvasData = JSON.stringify({ sections: [] });
      
      await base44.entities.DesignTemplate.create({
        title: title.trim(),
        description: description.trim(),
        category,
        style,
        preview_url: previewUrl || "",
        canvas_data: canvasData,
        color_palette: colors.filter(c => c),
        fonts: fonts.filter(f => f.trim()),
        tags: tagList,
        is_public: true,
      });
      toast.success("Template created!");
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error("Failed to create template");
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0d0d0f] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-white font-bold text-base">New Template</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title + AI */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold block mb-1.5">Title</label>
            <div className="flex gap-2">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. SaaS Dashboard Pro"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40"
              />
              <button
                onClick={generateWithAI}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs font-bold hover:bg-indigo-500/25 transition-colors disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                AI
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 resize-none"
            />
          </div>

          {/* Category + Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold block mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/40"
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold block mb-1.5">Style</label>
              <select
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/40"
              >
                {STYLES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
              </select>
            </div>
          </div>

          {/* Preview Upload */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold block mb-1.5">Preview Image</label>
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                <img src={previewUrl} alt="" className="w-full h-32 object-cover" />
                <button onClick={() => setPreviewUrl("")} className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/60 flex items-center justify-center text-white/60 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 py-4 rounded-xl border border-dashed border-white/[0.1] hover:border-indigo-500/30 cursor-pointer transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 text-white/30 animate-spin" /> : <Upload className="w-5 h-5 text-white/20" />}
                <span className="text-white/25 text-xs">{uploading ? 'Uploading...' : 'Upload screenshot or mockup'}</span>
                <input type="file" accept="image/*" onChange={handleUploadPreview} className="hidden" />
              </label>
            )}
          </div>

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Colors</label>
              <button onClick={addColor} className="text-white/20 hover:text-white/40"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-1.5">
                  <input type="color" value={c} onChange={e => handleColorChange(i, e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
                  <input value={c} onChange={e => handleColorChange(i, e.target.value)} className="w-16 bg-transparent text-white/50 text-[10px] font-mono focus:outline-none" />
                  <button onClick={() => removeColor(i)} className="text-white/15 hover:text-red-400"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Fonts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Fonts</label>
              <button onClick={addFont} className="text-white/20 hover:text-white/40"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {fonts.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1.5">
                  <input value={f} onChange={e => handleFontChange(i, e.target.value)} placeholder="Font name" className="w-28 bg-transparent text-white/60 text-xs focus:outline-none placeholder:text-white/15" />
                  <button onClick={() => removeFont(i)} className="text-white/15 hover:text-red-400"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold block mb-1.5">Tags</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="hero, pricing, dark, responsive (comma separated)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}