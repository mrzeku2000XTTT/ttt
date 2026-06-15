import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, Copy, Check, RefreshCw, ChevronDown, Zap, Mic, FileText, MessageSquare, Mail, Share2, ArrowLeft, Plus, Trash2, PenTool } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TONE_PRESETS = [
  { id: "apple", label: "Apple", desc: "Minimal. Poetic. Powerful.", icon: "🍎", color: "#1d1d1f", accent: "#0071e3", sample: "Clean. Capable. Ready for whatever you're into." },
  { id: "nike", label: "Nike", desc: "Bold. Motivational. No fluff.", icon: "⚡", color: "#111", accent: "#fa5400", sample: "Don't think about it. Do it. All in." },
  { id: "notion", label: "Notion", desc: "Clear. Helpful. Calm.", icon: "📝", color: "#191919", accent: "#ffffff", sample: "Write it down. Organize it. Ship it." },
  { id: "openai", label: "OpenAI", desc: "Technical but human.", icon: "🤖", color: "#10a37f", accent: "#10a37f", sample: "AI that works with you, not around you." },
  { id: "stripe", label: "Stripe", desc: "Precise. Developer-friendly.", icon: "💳", color: "#635bff", accent: "#635bff", sample: "Payments infrastructure for the internet." },
  { id: "duolingo", label: "Duolingo", desc: "Fun. Punchy. Relatable.", icon: "🦉", color: "#58cc02", accent: "#58cc02", sample: "Learning a language is hard. We made it a game." },
];

const CONTENT_TYPES = [
  { id: "tweet", label: "Tweet/Post", icon: Share2, maxChars: 280 },
  { id: "email", label: "Email", icon: Mail, maxChars: null },
  { id: "ad", label: "Ad Copy", icon: Zap, maxChars: 150 },
  { id: "pitch", label: "Pitch", icon: Mic, maxChars: null },
  { id: "bio", label: "Bio", icon: FileText, maxChars: 300 },
  { id: "caption", label: "Caption", icon: MessageSquare, maxChars: 200 },
];

export default function ORBTPage() {
  const [selectedTone, setSelectedTone] = useState(TONE_PRESETS[0]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customTones, setCustomTones] = useState([]);
  const [showAddTone, setShowAddTone] = useState(false);
  const [newToneName, setNewToneName] = useState("");
  const [newToneDesc, setNewToneDesc] = useState("");
  const [newToneSample, setNewToneSample] = useState("");
  const [addingTone, setAddingTone] = useState(false);
  const [versions, setVersions] = useState([]);
  const [activeVersion, setActiveVersion] = useState(0);

  const allTones = [...TONE_PRESETS, ...customTones];

  const rewrite = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setOutputText("");
    try {
      const charLimit = contentType.maxChars ? `Keep it under ${contentType.maxChars} characters.` : "";
      const prompt = `You are a brand voice expert. Rewrite the following text in the exact style of "${selectedTone.label}":
Brand tone: ${selectedTone.desc}
Sample of their voice: "${selectedTone.sample}"
Content type: ${contentType.label}
${charLimit}

Original text:
"${inputText}"

Rewrite it. Output ONLY the rewritten text, no quotes, no explanation, no prefix. Just the copy.`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      const clean = typeof result === "string" ? result.trim() : JSON.stringify(result).trim();
      setOutputText(clean);
      setVersions(prev => [{ text: clean, tone: selectedTone.label, type: contentType.label }, ...prev.slice(0, 9)]);
      setActiveVersion(0);
    } catch (e) {
      setOutputText("Something went wrong. Try again.");
    }
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addCustomTone = async () => {
    if (!newToneName.trim() || !newToneDesc.trim()) return;
    setAddingTone(true);
    try {
      // If sample is empty, AI generates a sample phrase from the desc
      let sample = newToneSample.trim();
      if (!sample) {
        const p = `Generate a single short brand voice sample sentence (10-15 words) for a brand described as: "${newToneDesc}". Output only the sentence.`;
        sample = await base44.integrations.Core.InvokeLLM({ prompt: p });
        sample = typeof sample === "string" ? sample.trim() : "Your brand. Your voice.";
      }
      const colors = ["#9333ea", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];
      const accent = colors[customTones.length % colors.length];
      const newTone = {
        id: `custom_${Date.now()}`,
        label: newToneName.trim(),
        desc: newToneDesc.trim(),
        icon: "✨",
        color: "#18181b",
        accent,
        sample,
        custom: true,
      };
      setCustomTones(prev => [...prev, newTone]);
      setSelectedTone(newTone);
      setNewToneName("");
      setNewToneDesc("");
      setNewToneSample("");
      setShowAddTone(false);
    } catch {}
    setAddingTone(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", color: "#e5e5e5", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-white/5" style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)" }}>
        <Link to={createPageUrl("AppStoreV2")} className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </Link>
        <div className="flex items-center gap-2.5">
          <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ecf033abc_generated_image.png" alt="ORBT" className="w-8 h-8 rounded-xl object-cover" />
          <div>
            <h1 className="text-[15px] font-[800] tracking-tight text-white leading-none">ORBT</h1>
            <p className="text-[10px] text-purple-400 leading-none mt-0.5">AI Brand Voice Studio</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center pt-2 pb-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold mb-4" style={{ background: "rgba(147,51,234,0.15)", border: "1px solid rgba(147,51,234,0.3)", color: "#c084fc" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Brand Voice Transformer
            </div>
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight text-white leading-tight">
              Write in any <span style={{ background: "linear-gradient(135deg, #a855f7, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>brand's voice</span>
            </h2>
            <p className="text-white/40 text-sm mt-2 max-w-md mx-auto">Paste your draft. Pick a voice. Get instant rewrites that sound exactly like the brand.</p>
          </motion.div>
        </div>

        {/* Tone Selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Brand Voice</p>
            <button onClick={() => setShowAddTone(true)} className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors">
              <Plus className="w-3 h-3" /> Add custom
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {allTones.map((tone) => (
              <motion.button
                key={tone.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setSelectedTone(tone)}
                className="flex-shrink-0 px-4 py-2.5 rounded-2xl text-left transition-all"
                style={{
                  background: selectedTone.id === tone.id ? `${tone.accent}22` : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${selectedTone.id === tone.id ? tone.accent : "rgba(255,255,255,0.06)"}`,
                  boxShadow: selectedTone.id === tone.id ? `0 0 16px ${tone.accent}33` : "none",
                }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-base leading-none">{tone.icon}</span>
                  <span className="text-[12px] font-[700] text-white whitespace-nowrap">{tone.label}</span>
                  {tone.custom && <span className="text-[8px] px-1 rounded bg-purple-500/20 text-purple-300">custom</span>}
                </div>
                <p className="text-[9px] text-white/30 whitespace-nowrap">{tone.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Type */}
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Format</p>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map(ct => {
              const Icon = ct.icon;
              const active = contentType.id === ct.id;
              return (
                <button key={ct.id} onClick={() => setContentType(ct)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                  style={{
                    background: active ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.06)"}`,
                    color: active ? "#67e8f9" : "rgba(255,255,255,0.4)",
                  }}>
                  <Icon className="w-3 h-3" />
                  {ct.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Input */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Your Draft</p>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Paste your ${contentType.label.toLowerCase()} here…`}
              rows={8}
              className="w-full resize-none rounded-2xl p-4 text-[13px] text-white/80 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", caretColor: "#a855f7" }}
              onFocus={e => { e.target.style.borderColor = "rgba(168,85,247,0.4)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
            />
            {contentType.maxChars && (
              <p className="text-[10px] text-white/20 text-right">{inputText.length} / {contentType.maxChars}</p>
            )}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={rewrite}
              disabled={isGenerating || !inputText.trim()}
              className="w-full py-3 rounded-2xl text-[13px] font-[800] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{ background: isGenerating ? "rgba(168,85,247,0.3)" : "linear-gradient(135deg, #9333ea, #06b6d4)", boxShadow: isGenerating ? "none" : "0 0 24px rgba(147,51,234,0.4)" }}
            >
              {isGenerating ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Transforming…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Rewrite in {selectedTone.label} voice</>
              )}
            </motion.button>
          </div>

          {/* Output */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
              {selectedTone.label} Voice
            </p>
            <div className="relative">
              <div
                className="w-full rounded-2xl p-4 text-[13px] min-h-[196px] transition-all"
                style={{ background: outputText ? `${selectedTone.accent}0a` : "rgba(255,255,255,0.02)", border: `1px solid ${outputText ? selectedTone.accent + "33" : "rgba(255,255,255,0.07)"}` }}
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2 text-white/30">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                    </div>
                    <span className="text-[12px]">Crafting your {selectedTone.label} voice…</span>
                  </div>
                ) : outputText ? (
                  <p className="text-white/85 leading-relaxed whitespace-pre-wrap">{outputText}</p>
                ) : (
                  <p className="text-white/20 text-[12px]">Your rewritten copy will appear here…</p>
                )}
              </div>
              {outputText && !isGenerating && (
                <div className="absolute bottom-3 right-3 flex gap-1.5">
                  <button onClick={rewrite} title="Regenerate"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white transition-all"
                    style={{ background: "rgba(255,255,255,0.07)" }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleCopy}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{ background: copied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)", color: copied ? "#34d399" : "rgba(255,255,255,0.4)" }}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
            {contentType.maxChars && outputText && (
              <p className={`text-[10px] text-right ${outputText.length > contentType.maxChars ? "text-red-400" : "text-white/20"}`}>
                {outputText.length} / {contentType.maxChars}
              </p>
            )}
          </div>
        </div>

        {/* Sample preview for selected tone */}
        <motion.div
          key={selectedTone.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4"
          style={{ background: `${selectedTone.accent}08`, border: `1px solid ${selectedTone.accent}22` }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: selectedTone.accent }}>
            {selectedTone.label} voice example
          </p>
          <p className="text-[13px] text-white/60 italic">"{selectedTone.sample}"</p>
          <p className="text-[10px] text-white/25 mt-1">{selectedTone.desc}</p>
        </motion.div>

        {/* Version history */}
        {versions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Recent Rewrites</p>
            <div className="space-y-2">
              {versions.slice(0, 5).map((v, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setOutputText(v.text)}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-start gap-3 transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>{v.tone}</span>
                  </div>
                  <p className="text-[12px] text-white/50 truncate flex-1">{v.text}</p>
                  <span className="text-[9px] text-white/20 shrink-0">{v.type}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Tone Modal */}
      <AnimatePresence>
        {showAddTone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowAddTone(false)}>
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-6 space-y-4"
              style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-[800] text-white flex items-center gap-2"><PenTool className="w-4 h-4 text-purple-400" /> Custom Brand Voice</h3>
                <button onClick={() => setShowAddTone(false)} className="text-white/30 hover:text-white transition-colors text-lg">×</button>
              </div>
              <div className="space-y-3">
                <input value={newToneName} onChange={e => setNewToneName(e.target.value)} placeholder="Brand name (e.g. Tesla)" className="w-full px-4 py-2.5 rounded-xl text-[13px] text-white bg-white/5 border border-white/08 outline-none" />
                <input value={newToneDesc} onChange={e => setNewToneDesc(e.target.value)} placeholder="Voice description (e.g. Visionary. Bold. Future-first.)" className="w-full px-4 py-2.5 rounded-xl text-[13px] text-white bg-white/5 border border-white/08 outline-none" />
                <textarea value={newToneSample} onChange={e => setNewToneSample(e.target.value)} placeholder="Sample copy in their voice (optional — AI will generate if blank)" rows={3} className="w-full resize-none px-4 py-2.5 rounded-xl text-[13px] text-white bg-white/5 border border-white/08 outline-none" />
              </div>
              <button onClick={addCustomTone} disabled={addingTone || !newToneName.trim() || !newToneDesc.trim()}
                className="w-full py-3 rounded-2xl text-[13px] font-[800] text-white disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #9333ea, #06b6d4)" }}>
                {addingTone ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</> : <><Sparkles className="w-4 h-4" /> Create Voice</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none;}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
    </div>
  );
}