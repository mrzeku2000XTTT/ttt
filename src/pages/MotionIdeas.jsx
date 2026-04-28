import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, Lightbulb, Wand2, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SEED_THEMES = [
  "🎮 Indie game studio",
  "🍷 Natural wine bar",
  "🚀 Rocket startup",
  "🎨 Tattoo parlor",
  "🧘 Meditation app",
  "📷 Film photography",
  "🛹 Skate brand",
  "☕ Specialty coffee roaster",
  "🌱 Vertical farm",
  "🎙️ Podcast network",
  "🏔️ Backcountry gear",
  "💎 Indie jewelry",
];

export default function MotionIdeasPage() {
  const [seed, setSeed] = useState("");
  const [count, setCount] = useState(6);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const generateIdeas = async () => {
    setLoading(true);
    setIdeas([]);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a creative director generating fresh, vibe-driven landing page concepts for a vibe-code template marketplace called Motion.

${seed ? `THEME / DIRECTION: ${seed}` : "No specific theme — generate a wild, eclectic mix across categories (tech, lifestyle, food, art, finance, hardware, media, etc.)."}

Generate ${count} distinct landing page ideas. Each must feel modern, distinct, and visually unique — not generic. Mix different aesthetics (brutalist, editorial, cinematic, minimalist, kinetic, photographic, etc.).

For each idea return:
- name: short brand name (1-2 words)
- tagline: one-line description of what the brand does
- category: short category label (e.g. "AI Lab", "Coffee", "Game Studio")
- vibe: 3-5 word aesthetic descriptor (e.g. "Brutalist · Volt yellow · Mono")
- accent_colors: 2 hex codes that capture the brand
- hero_headline: a punchy hero headline they'd actually use (can include line breaks as \\n)
- key_sections: array of 4-6 section names this landing page should have

Be inventive. Avoid clichés. Make each idea feel like a real brand someone could launch tomorrow.`,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  tagline: { type: "string" },
                  category: { type: "string" },
                  vibe: { type: "string" },
                  accent_colors: { type: "array", items: { type: "string" } },
                  hero_headline: { type: "string" },
                  key_sections: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      });
      setIdeas(result.ideas || []);
    } catch (err) {
      alert("Generation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyIdeaAsPrompt = async (idea, idx) => {
    const promptText = `Create a landing page called "${idea.name}" — ${idea.tagline}.

CATEGORY: ${idea.category}
VIBE: ${idea.vibe}
ACCENT COLORS: ${idea.accent_colors?.join(", ")}

HERO HEADLINE:
${idea.hero_headline}

REQUIRED SECTIONS:
${idea.key_sections?.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Design a beautiful, motion-rich, animated landing page that captures this brand's vibe. Include cinematic background videos or animated gradients in the hero, scroll-triggered reveals, hover micro-interactions, and a custom font pairing that fits the aesthetic.`;
    await navigator.clipboard.writeText(promptText);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const sendToStudio = (idea) => {
    const promptText = `Create a landing page called "${idea.name}" — ${idea.tagline}.

CATEGORY: ${idea.category}
VIBE: ${idea.vibe}
ACCENT COLORS: ${idea.accent_colors?.join(", ")}

HERO HEADLINE:
${idea.hero_headline}

REQUIRED SECTIONS:
${idea.key_sections?.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Design a beautiful, motion-rich, animated landing page that captures this brand's vibe. Include cinematic background videos or animated gradients in the hero, scroll-triggered reveals, hover micro-interactions, and a custom font pairing that fits the aesthetic.`;
    sessionStorage.setItem("motion_seeded_prompt", promptText);
    window.location.href = "/MotionStudio";
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] text-white flex flex-col overflow-y-auto">
      {/* Top bar */}
      <nav className="h-14 flex items-center justify-between px-5 bg-black/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 flex-shrink-0">
        <Link to="/Motion" className="flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Motion
        </Link>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span className="text-[15px] font-[900] tracking-tight bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Idea Generator
          </span>
        </div>
        <Link
          to="/MotionStudio"
          className="text-[12px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full"
        >
          Studio →
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 w-full">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span className="text-[11px] font-bold text-yellow-300 tracking-wide uppercase">
              AI-powered brainstorm
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-[900] mb-3 bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">
            Need landing page ideas?
          </h1>
          <p className="text-white/50 text-[14px] max-w-xl mx-auto">
            Drop a seed theme (or leave blank for a wild mix) and we'll brainstorm fresh, vibe-driven concepts you can send straight to the studio.
          </p>
        </div>

        {/* Seed input */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2 block">
            Seed theme (optional)
          </label>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="e.g. retro skateboard brand, AI for lawyers, vinyl record store..."
            className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-[14px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-yellow-500/50"
          />

          {/* Quick seed chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SEED_THEMES.map((t) => (
              <button
                key={t}
                onClick={() => setSeed(t.replace(/^[^\s]+\s/, ""))}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">Count</span>
              <div className="flex gap-1">
                {[3, 6, 9, 12].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all ${
                      count === n
                        ? "bg-yellow-500 text-black"
                        : "bg-white/5 hover:bg-white/10 text-white/70"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateIdeas}
              disabled={loading}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 disabled:opacity-40 text-black text-[13px] font-[900] flex items-center gap-2 shadow-lg shadow-yellow-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Brainstorming…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Generate Ideas
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-3" />
            <p className="text-white/50 text-sm">Cooking up ideas...</p>
          </div>
        )}

        {ideas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.map((idea, i) => (
              <div
                key={i}
                className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all group"
              >
                {/* Color swatches */}
                <div className="flex items-center gap-1.5 mb-3">
                  {idea.accent_colors?.slice(0, 3).map((c, j) => (
                    <div
                      key={j}
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ background: c }}
                    />
                  ))}
                  <span className="text-[10px] text-white/40 ml-1 font-mono">
                    {idea.accent_colors?.join(" / ")}
                  </span>
                </div>

                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-[900] text-white">{idea.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-mono uppercase">
                    {idea.category}
                  </span>
                </div>

                <p className="text-white/70 text-[13px] mb-3">{idea.tagline}</p>

                <div className="text-[10px] text-yellow-400/80 font-mono mb-3 uppercase tracking-wider">
                  {idea.vibe}
                </div>

                <div className="bg-black/40 border border-white/5 rounded-lg p-3 mb-3">
                  <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-1">
                    Hero headline
                  </div>
                  <div className="text-[14px] font-bold text-white whitespace-pre-line leading-tight">
                    {idea.hero_headline}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-1.5">
                    Sections
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {idea.key_sections?.map((s, j) => (
                      <span
                        key={j}
                        className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/70"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => sendToStudio(idea)}
                    className="flex-1 h-9 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-[11px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" /> Build in Studio
                  </button>
                  <button
                    onClick={() => copyIdeaAsPrompt(idea, i)}
                    className="h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-bold flex items-center gap-1.5"
                  >
                    {copiedIdx === i ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {ideas.length === 0 && !loading && (
          <div className="text-center py-16 text-white/30">
            <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No ideas yet — drop a seed and hit generate.</p>
          </div>
        )}
      </div>
    </div>
  );
}