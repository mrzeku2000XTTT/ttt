import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Copy, Check, RefreshCw, ChevronDown } from "lucide-react";

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
  const mono = { fontFamily: "'Courier New', Courier, monospace" };

  const run = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setOutput("");

    let systemPrompt = agent.systemPrompt;
    let userPrompt = isBrandVoice
      ? `Rewrite this as ${selectedBrand.label}: "${input}"`
      : `Tone: ${selectedTone}\n\n${input}`;

    if (isBrandVoice) {
      systemPrompt = `You are a brand voice expert. Rewrite the user's text to perfectly match ${selectedBrand.label}'s voice and style. ${selectedBrand.desc} Their typical copy sounds like: "${selectedBrand.sample}". Output ONLY the rewritten copy, no explanation.`;
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
      setOutput("// ERROR: Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: "#050a0a", color: "#e5e5e5", ...mono, minHeight: "100vh", backgroundImage: "radial-gradient(circle, rgba(0,255,136,0.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>

      {/* Header */}
      <div className="sticky top-0 z-40" style={{ background: "rgba(5,10,10,0.97)", borderBottom: "1px solid rgba(0,255,136,0.2)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
          <button onClick={onBack} className="flex items-center justify-center w-8 h-8 transition-all flex-shrink-0" style={{ border: "1px solid rgba(0,255,136,0.3)", color: "rgba(0,255,136,0.6)" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 flex items-center justify-center text-xl" style={{ border: `1px solid ${agent.accent}50`, background: `${agent.accent}0d` }}>
            {agent.emoji}
          </div>
          <div>
            <div className="text-[13px] font-black tracking-widest uppercase" style={{ color: agent.accent }}>{agent.name}</div>
            <div className="text-[9px] tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{agent.tagline}</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Agent info bar */}
        <div className="p-4" style={{ border: `1px solid ${agent.accent}30`, background: `${agent.accent}06` }}>
          <span className="text-[10px] tracking-widest" style={{ color: agent.accent }}>// AGENT_DESC</span>
          <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{agent.desc}</p>
        </div>

        {/* Brand voice selector */}
        {isBrandVoice && (
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>TARGET_BRAND</div>
            <div className="relative">
              <button onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left transition-all"
                style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${agent.accent}40` }}>
                <span className="text-[13px] font-black tracking-wider" style={{ color: agent.accent }}>{selectedBrand.label}</span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{selectedBrand.desc}</span>
                <ChevronDown className="w-4 h-4 ml-auto" style={{ color: "rgba(255,255,255,0.3)" }} />
              </button>
              <AnimatePresence>
                {showBrandDropdown && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-1 z-30 overflow-hidden"
                    style={{ background: "#060e0e", border: `1px solid ${agent.accent}40` }}>
                    {BRAND_VOICES.map(b => (
                      <button key={b.id} onClick={() => { setSelectedBrand(b); setShowBrandDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/5"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span className="text-[12px] font-black tracking-wider" style={{ color: selectedBrand.id === b.id ? agent.accent : "rgba(255,255,255,0.7)" }}>{b.label}</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{b.desc}</span>
                        {selectedBrand.id === b.id && <span className="ml-auto text-xs" style={{ color: agent.accent }}>▶</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Tone selector */}
        {!isBrandVoice && (
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>TONE_SETTING</div>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map(t => (
                <button key={t} onClick={() => setSelectedTone(t)}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all"
                  style={{
                    background: selectedTone === t ? `${agent.accent}18` : "transparent",
                    border: `1px solid ${selectedTone === t ? agent.accent : "rgba(255,255,255,0.12)"}`,
                    color: selectedTone === t ? agent.accent : "rgba(255,255,255,0.3)",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div>
          <div className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>{agent.inputLabel.toUpperCase()}</div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={agent.inputPlaceholder}
            rows={6}
            className="w-full resize-none p-4 text-[12px] outline-none transition-all"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", ...mono, caretColor: agent.accent }}
            onFocus={e => { e.target.style.borderColor = agent.accent + "80"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
          />
        </div>

        {/* Run button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={run}
          disabled={isLoading || !input.trim()}
          className="w-full py-4 text-[12px] font-black tracking-widest uppercase flex items-center justify-center gap-3 disabled:opacity-40 transition-all"
          style={{ background: isLoading ? "transparent" : `${agent.accent}18`, border: `1px solid ${isLoading ? "rgba(255,255,255,0.15)" : agent.accent}`, color: isLoading ? "rgba(255,255,255,0.4)" : agent.accent, ...mono }}
        >
          {isLoading ? (
            <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> RUNNING_{agent.name.replace(/ /g, "_")}_AGENT…</>
          ) : (
            <>▶ RUN {agent.name} AGENT</>
          )}
        </motion.button>

        {/* Output */}
        <AnimatePresence>
          {(output || isLoading) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>{agent.outputLabel.toUpperCase()}</div>
                {output && !isLoading && (
                  <div className="flex gap-1.5">
                    <button onClick={run} className="w-7 h-7 flex items-center justify-center transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button onClick={handleCopy} className="w-7 h-7 flex items-center justify-center transition-all" style={{ border: `1px solid ${copied ? "#00ff88" : "rgba(255,255,255,0.1)"}`, color: copied ? "#00ff88" : "rgba(255,255,255,0.3)" }}>
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
              <div className="p-5 min-h-[120px]" style={{ background: `${agent.accent}06`, border: `1px solid ${agent.accent}30` }}>
                {isLoading ? (
                  <div className="flex items-center gap-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: agent.accent, animationDelay: `${i * 0.12}s` }} />)}
                    </div>
                    <span className="text-[11px] tracking-wider">{agent.name} agent processing…</span>
                  </div>
                ) : (
                  <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.8)" }}>{output}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {iterations.length > 0 && (
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>// PREVIOUS_RUNS</div>
            <div className="space-y-1.5">
              {iterations.map((it, i) => (
                <button key={it.ts} onClick={() => setOutput(it.output)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all hover:bg-white/3"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-[9px] flex-shrink-0 font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>#{iterations.length - i}</span>
                  <span className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{it.input}…</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}