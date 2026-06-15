import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Sparkles, Copy, Check, RefreshCw, ChevronDown } from "lucide-react";

// Brand voice presets only used by brand_voice agent
const BRAND_VOICES = [
  { id: "apple", label: "Apple", desc: "Minimal. Poetic. Powerful.", sample: "Clean. Capable. Ready for whatever you're into." },
  { id: "nike", label: "Nike", desc: "Bold. Motivational. No fluff.", sample: "Don't think about it. Do it. All in." },
  { id: "notion", label: "Notion", desc: "Clear. Helpful. Calm.", sample: "Write it down. Organize it. Ship it." },
  { id: "openai", label: "OpenAI", desc: "Technical but human.", sample: "AI that works with you, not around you." },
  { id: "stripe", label: "Stripe", desc: "Precise. Developer-friendly.", sample: "Payments infrastructure for the internet." },
  { id: "duolingo", label: "Duolingo", desc: "Fun. Punchy. Relatable.", sample: "Learning a language is hard. We made it a game." },
  { id: "tesla", label: "Tesla", desc: "Visionary. Sleek. Future-first.", sample: "Not just a car. A revolution on wheels." },
  { id: "airbnb", label: "Airbnb", desc: "Warm. Inclusive. Adventurous.", sample: "Belong anywhere. Every trip, a new home." },
  { id: "spotify", label: "Spotify", desc: "Playful. Cultural. Relatable.", sample: "There's a playlist for this moment." },
  { id: "netflix", label: "Netflix", desc: "Engaging. Drama. Effortless.", sample: "One more episode. You already know." },
];

const TONE_OPTIONS = ["Professional", "Casual", "Urgent", "Inspiring", "Witty", "Formal", "Conversational", "Authoritative"];

export default function ORBTAgent({ agent, onBack }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(BRAND_VOICES[0]);
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [iterations, setIterations] = useState([]);

  const isBrandVoice = agent.extraConfig?.type === "brand_voice";

  const run = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setOutput("");

    let systemPrompt = agent.systemPrompt;
    let userPrompt = input;

    if (isBrandVoice) {
      systemPrompt = `You are a brand voice expert. Rewrite the user's text to perfectly match ${selectedBrand.label}'s voice and style. ${selectedBrand.desc} Their typical copy sounds like: "${selectedBrand.sample}". Output ONLY the rewritten copy, no explanation.`;
      userPrompt = `Rewrite this as ${selectedBrand.label}: "${input}"`;
    } else {
      userPrompt = `Tone: ${selectedTone}\n\n${input}`;
    }

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\n---\nUser request:\n${userPrompt}`,
        model: "claude_sonnet_4_6",
      });
      const clean = typeof result === "string" ? result.trim() : JSON.stringify(result);
      setOutput(clean);
      setIterations(prev => [{ input: input.slice(0, 60), output: clean, ts: Date.now() }, ...prev.slice(0, 4)]);
    } catch {
      setOutput("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: "#08080d", color: "#e5e5e5", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-white/5" style={{ background: "rgba(8,8,13,0.95)", backdropFilter: "blur(20px)" }}>
        <button onClick={onBack} className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </button>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xl" style={{ background: `${agent.accent}18`, border: `1px solid ${agent.accent}30` }}>
          {agent.emoji}
        </div>
        <div>
          <h1 className="text-[14px] font-[800] text-white leading-none">{agent.name}</h1>
          <p className="text-[10px] leading-none mt-0.5" style={{ color: agent.accent }}>{agent.tagline}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Agent card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: `${agent.accent}08`, border: `1px solid ${agent.accent}20` }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: `${agent.accent}08`, transform: "translate(30%, -30%)" }} />
          <p className="text-[13px] text-white/50 leading-relaxed relative z-10">{agent.desc}</p>
        </motion.div>

        {/* Brand voice selector */}
        {isBrandVoice && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Target Brand</p>
            <div className="relative">
              <button onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${agent.accent}30` }}>
                <span className="text-[14px] font-[700] text-white">{selectedBrand.label}</span>
                <span className="text-[11px] text-white/40">{selectedBrand.desc}</span>
                <ChevronDown className="w-4 h-4 text-white/30 ml-auto" />
              </button>
              <AnimatePresence>
                {showBrandDropdown && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-30 shadow-2xl"
                    style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {BRAND_VOICES.map(b => (
                      <button key={b.id} onClick={() => { setSelectedBrand(b); setShowBrandDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-all"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span className="text-[13px] font-[700] text-white">{b.label}</span>
                        <span className="text-[11px] text-white/30">{b.desc}</span>
                        {selectedBrand.id === b.id && <span className="ml-auto text-xs" style={{ color: agent.accent }}>✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Tone selector for non-brand-voice */}
        {!isBrandVoice && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Tone</p>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map(t => (
                <button key={t} onClick={() => setSelectedTone(t)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                  style={{
                    background: selectedTone === t ? `${agent.accent}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selectedTone === t ? agent.accent + "50" : "rgba(255,255,255,0.06)"}`,
                    color: selectedTone === t ? agent.accent : "rgba(255,255,255,0.35)",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{agent.inputLabel}</p>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={agent.inputPlaceholder}
            rows={6}
            className="w-full resize-none rounded-2xl p-4 text-[13px] text-white/80 outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", caretColor: agent.accent }}
            onFocus={e => { e.target.style.borderColor = agent.accent + "60"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
          />
        </div>

        {/* Run button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={run}
          disabled={isLoading || !input.trim()}
          className="w-full py-3.5 rounded-2xl text-[13px] font-[800] text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
          style={{ background: isLoading ? `${agent.accent}40` : `linear-gradient(135deg, ${agent.accent}, ${agent.accent}bb)`, boxShadow: isLoading ? "none" : `0 0 30px ${agent.accent}40` }}
        >
          {isLoading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running {agent.name} Agent…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Run {agent.name} Agent</>
          )}
        </motion.button>

        {/* Output */}
        <AnimatePresence>
          {(output || isLoading) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">{agent.outputLabel}</p>
                {output && !isLoading && (
                  <div className="flex gap-1.5">
                    <button onClick={run} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleCopy} className="w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ background: copied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)", color: copied ? "#34d399" : "rgba(255,255,255,0.4)" }}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
              <div className="rounded-2xl p-5 min-h-[120px]" style={{ background: `${agent.accent}08`, border: `1px solid ${agent.accent}25` }}>
                {isLoading ? (
                  <div className="flex items-center gap-3 text-white/30">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: agent.accent, animationDelay: `${i * 0.12}s` }} />)}
                    </div>
                    <span className="text-[12px]">{agent.name} agent is working…</span>
                  </div>
                ) : (
                  <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">{output}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {iterations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-2">Previous runs</p>
            <div className="space-y-1.5">
              {iterations.map((it, i) => (
                <button key={it.ts} onClick={() => setOutput(it.output)}
                  className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-[10px] text-white/20 shrink-0 font-mono">#{iterations.length - i}</span>
                  <span className="text-[11px] text-white/30 truncate">{it.input}…</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}