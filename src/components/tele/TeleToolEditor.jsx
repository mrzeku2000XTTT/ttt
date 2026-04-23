import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "info", label: "Info", icon: "📊" },
  { id: "action", label: "Action", icon: "⚡" },
  { id: "ai", label: "AI", icon: "🤖" },
  { id: "wallet", label: "Wallet", icon: "💰" },
  { id: "custom", label: "Custom", icon: "🔧" },
];

const EMOJI_OPTIONS = ["🔧", "📊", "⚡", "🤖", "💰", "🎯", "🚀", "✨", "🔥", "💎", "🎨", "📰", "🌐", "🛡️", "🎮"];

export default function TeleToolEditor({ tool, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    command: "",
    description: "",
    category: "info",
    prompt_template: "",
    icon: "🔧",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tool) setForm({ ...form, ...tool });
    // eslint-disable-next-line
  }, [tool]);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name || !form.command || !form.description || !form.prompt_template) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        command: form.command.replace(/^\//, "").toLowerCase().replace(/\s+/g, "_"),
      };
      if (tool?.id) {
        await base44.entities.TeleTool.update(tool.id, payload);
      } else {
        await base44.entities.TeleTool.create(payload);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-cyan-500/20 rounded-2xl w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-bold text-lg">{tool ? "Edit Tool" : "New Tool"}</h3>
          </div>
          <button onClick={onCancel} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleChange("icon", emoji)}
                  className={`w-9 h-9 rounded-lg text-lg transition-all ${
                    form.icon === emoji ? "bg-cyan-500/20 ring-2 ring-cyan-500" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">Name</label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Kaspa Price Checker"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">
              Telegram Command <span className="text-cyan-400">/</span>
            </label>
            <Input
              value={form.command}
              onChange={(e) => handleChange("command", e.target.value)}
              placeholder="price"
              className="bg-white/5 border-white/10 text-white font-mono"
            />
            <p className="text-white/40 text-[11px] mt-1">Users type /{form.command || "command"} in Telegram</p>
          </div>

          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">Description</label>
            <Input
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Get current KAS price and market data"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">Category</label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleChange("category", c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    form.category === c.id
                      ? "bg-cyan-500 text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-white/70 text-xs font-semibold mb-1.5 block">AI Prompt Template</label>
            <Textarea
              value={form.prompt_template}
              onChange={(e) => handleChange("prompt_template", e.target.value)}
              placeholder="Get the current Kaspa (KAS) price in USD along with 24h change. User input: {{input}}"
              rows={5}
              className="bg-white/5 border-white/10 text-white font-mono text-sm"
            />
            <p className="text-white/40 text-[11px] mt-1">
              Use <code className="bg-white/10 px-1 rounded text-cyan-300">{"{{input}}"}</code> for user's arguments
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <div className="text-white text-sm font-semibold">Active</div>
              <div className="text-white/40 text-xs">Enable in Telegram bot</div>
            </div>
            <button
              onClick={() => handleChange("is_active", !form.is_active)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.is_active ? "bg-cyan-500" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                  form.is_active ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-white/10">
          <Button variant="ghost" onClick={onCancel} className="flex-1 text-white/60 hover:bg-white/5">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.name || !form.command || !form.description || !form.prompt_template}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Saving..." : "Save Tool"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}