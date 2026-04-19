import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { STYLE_OPTIONS, STYLE_COLORS } from "./StyleDot";

export default function NewDeckModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("auto");
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      await onCreate({ title: title.trim(), description: description.trim(), style });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "rgba(15,18,25,0.98)", border: "1px solid rgba(0,200,180,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">New Deck</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My awesome deck"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 text-white text-sm outline-none border border-white/10 focus:border-teal-400/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this deck about?"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 text-white text-sm outline-none border border-white/10 focus:border-teal-400/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-2">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all"
                  style={{
                    background: style === s ? `${STYLE_COLORS[s]}33` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${style === s ? STYLE_COLORS[s] : "rgba(255,255,255,0.1)"}`,
                    color: style === s ? STYLE_COLORS[s] : "rgba(255,255,255,0.6)",
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: STYLE_COLORS[s] }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim() || creating}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-40"
            style={{ background: "#00c8b4", color: "#000" }}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}