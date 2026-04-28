import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Copy, Check, Sparkles, BookOpen, Github } from "lucide-react";
import { WEBSITE_PROMPTS, PROMPT_CATEGORIES } from "@/components/motion/websitePrompts";

export default function MotionPromptsPage() {
  const [activeCat, setActiveCat] = useState("All");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const filtered = useMemo(() => {
    return WEBSITE_PROMPTS.filter((p) => {
      const inCat = activeCat === "All" || p.category === activeCat;
      const inQuery =
        !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.tagline.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase());
      return inCat && inQuery;
    });
  }, [activeCat, query]);

  const handleCopy = async (p) => {
    await navigator.clipboard.writeText(p.prompt);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSendToStudio = (p) => {
    sessionStorage.setItem("motion_seeded_prompt", p.prompt);
    window.location.href = "/MotionStudio";
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] text-white overflow-y-auto">
      {/* Top bar */}
      <nav className="sticky top-0 z-40 h-14 flex items-center justify-between px-5 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <Link to="/Motion" className="flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Motion
        </Link>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span className="text-[15px] font-[900] tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Prompt Library
          </span>
        </div>
        <Link
          to="/MotionStudio"
          className="text-[12px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full"
        >
          Studio →
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 w-full">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-300 tracking-wide uppercase">
              Curated · Structured · Ready to ship
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-[900] mb-3 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
            The Prompt Library
          </h1>
          <p className="text-white/50 text-[14px] max-w-2xl mx-auto">
            Reusable, structured website prompt patterns — by category. Each one is a complete
            spec: aesthetic, sections, animations. Copy or send straight to the studio.
          </p>
          <a
            href="https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[11px] text-white/40 hover:text-white/70"
          >
            <Github className="w-3 h-3" /> Inspired by awesome-gpt-image-2-prompts
          </a>
        </div>

        {/* Search + categories */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search prompts… e.g. saas, fragrance, sneaker"
              className="w-full h-10 pl-9 pr-4 bg-black/40 border border-white/10 rounded-xl text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`text-[11px] px-3 py-1.5 rounded-full font-bold transition-all ${
                  activeCat === cat
                    ? "bg-emerald-500 text-black"
                    : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const expanded = expandedId === p.id;
            return (
              <div
                key={p.id}
                className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all"
              >
                {/* Top stripe */}
                <div className={`h-1 -mt-5 -mx-5 mb-4 rounded-t-2xl bg-gradient-to-r ${p.color}`} />

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">
                      {p.case} · {p.author}
                    </div>
                    <h3 className="text-lg font-[900] text-white leading-tight">{p.title}</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-mono uppercase whitespace-nowrap">
                    {p.category}
                  </span>
                </div>

                <p className="text-white/60 text-[13px] mb-3">{p.tagline}</p>

                {/* Structure preview */}
                <div className="bg-black/40 border border-white/5 rounded-lg p-3 mb-3">
                  <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-1.5">
                    Page Structure
                  </div>
                  <ol className="space-y-1">
                    {p.structure.map((s, i) => (
                      <li key={i} className="text-[12px] text-white/75 flex gap-2">
                        <span className="text-emerald-400 font-mono text-[10px] mt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Expanded full prompt */}
                {expanded && (
                  <div className="bg-black/60 border border-white/10 rounded-lg p-3 mb-3 max-h-72 overflow-y-auto">
                    <pre className="text-[11px] text-white/70 font-mono whitespace-pre-wrap leading-relaxed">
                      {p.prompt}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendToStudio(p)}
                    className="flex-1 h-9 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-[11px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" /> Build in Studio
                  </button>
                  <button
                    onClick={() => setExpandedId(expanded ? null : p.id)}
                    className="h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-bold"
                  >
                    {expanded ? "Hide" : "View"}
                  </button>
                  <button
                    onClick={() => handleCopy(p)}
                    className="h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-bold flex items-center gap-1.5"
                  >
                    {copiedId === p.id ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No prompts match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}