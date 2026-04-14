import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowUpRight, Sparkles, Lightbulb, Send,
  Loader2, RefreshCw, Copy, Check, Rocket, Wand2
} from "lucide-react";

const PROMPTS = [
  "A decentralized voting platform for DAOs",
  "An AI-powered portfolio tracker for Kaspa",
  "A community-driven bug bounty marketplace",
  "A gamified learning platform for blockchain",
  "A peer-to-peer freelance marketplace on Kaspa",
  "An NFT-based event ticketing system",
  "A decentralized content subscription platform",
  "A real-time blockDAG data visualization tool",
  "A KRC-20 token launchpad with fair-launch mechanics",
  "A social trading platform with copy-trade on Kaspa",
  "A decentralized identity reputation system",
  "A blockchain-verified credential platform",
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  const randomPrompt = () => {
    const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setIdea(p);
  };

  const generate = async () => {
    if (!idea.trim() || generating) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert Web3 product designer and startup advisor. The user wants to build something on the Kaspa blockchain ecosystem (blockDAG, KRC-20, GHOSTDAG, PoW).

Their idea seed: "${idea.trim()}"

Generate a concise, inspiring product concept that includes:
1. **Name** — a catchy, memorable product name
2. **One-liner** — a single sentence pitch
3. **The Problem** — what pain point it solves (2-3 sentences)
4. **The Solution** — how it works on Kaspa (2-3 sentences)
5. **Key Features** — 4 bullet points
6. **Why Kaspa** — why blockDAG is perfect for this (1-2 sentences)
7. **Get Started** — a single next step to begin building

Keep it punchy, visionary, and practical. Use markdown formatting.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            one_liner: { type: "string" },
            problem: { type: "string" },
            solution: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            why_kaspa: { type: "string" },
            next_step: { type: "string" },
          },
        },
      });
      setResult(res);
      setHistory(prev => [{ idea: idea.trim(), result: res, time: new Date() }, ...prev].slice(0, 5));
    } catch {
      setResult({ error: true });
    }
    setGenerating(false);
  };

  const copyResult = () => {
    if (!result || result.error) return;
    const text = `${result.name}\n${result.one_liner}\n\nProblem: ${result.problem}\n\nSolution: ${result.solution}\n\nFeatures:\n${result.features?.map(f => `• ${f}`).join("\n")}\n\nWhy Kaspa: ${result.why_kaspa}\n\nNext Step: ${result.next_step}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900 selection:bg-violet-200/60">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 bg-[#F5F5F7]/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-zinc-200/50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[13px] font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-[15px] font-[800] tracking-tight">Idea Lab</span>
        </div>
        <Link to="/TTTV2" className="text-[12px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors">
          TTT 2.0
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 ring-1 ring-amber-200/60 mb-5">
            <Rocket className="w-3 h-3 text-amber-500" />
            <span className="text-[11px] font-semibold text-amber-600 tracking-wide">Where ideas meet the blockDAG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-[900] tracking-tight leading-[0.95] mb-4">
            What will you<br />
            <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">build next?</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Describe a rough idea — or just a feeling — and we'll shape it into a full product concept on Kaspa.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="bg-white rounded-2xl ring-1 ring-zinc-200/80 shadow-sm p-4">
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
              placeholder="e.g. A platform where artists can sell AI-generated NFTs using Kaspa..."
              rows={3}
              className="w-full bg-transparent text-[15px] text-zinc-900 outline-none placeholder-zinc-300 resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
              <button
                onClick={randomPrompt}
                className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Surprise me
              </button>
              <button
                onClick={generate}
                disabled={!idea.trim() || generating}
                className="flex items-center gap-2 h-9 px-5 bg-zinc-900 text-white text-[13px] font-semibold rounded-full disabled:opacity-40 hover:bg-zinc-800 transition-colors"
              >
                {generating ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…</>
                ) : (
                  <><Wand2 className="w-3.5 h-3.5" /> Generate</>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-white rounded-2xl ring-1 ring-zinc-200/80 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span className="text-[13px] text-zinc-500">Crafting your concept…</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && !result.error && !generating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[20px] ring-1 ring-zinc-200/80 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500 p-6 sm:p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-2">Your concept</p>
                    <h2 className="text-2xl sm:text-3xl font-[900] text-white tracking-tight">{result.name}</h2>
                    <p className="text-[14px] text-white/80 mt-2 leading-relaxed">{result.one_liner}</p>
                  </div>
                  <button
                    onClick={copyResult}
                    className="flex-shrink-0 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {/* Problem */}
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">The Problem</h3>
                  <p className="text-[14px] text-zinc-600 leading-relaxed">{result.problem}</p>
                </div>

                {/* Solution */}
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">The Solution</h3>
                  <p className="text-[14px] text-zinc-600 leading-relaxed">{result.solution}</p>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Key Features</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {result.features?.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 bg-zinc-50 rounded-xl">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[13px] text-zinc-600 leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why Kaspa */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 ring-1 ring-cyan-100/60">
                  <h3 className="text-[11px] font-bold text-cyan-600 uppercase tracking-widest mb-2">Why Kaspa</h3>
                  <p className="text-[13px] text-cyan-700 leading-relaxed">{result.why_kaspa}</p>
                </div>

                {/* Next Step */}
                <div className="pt-4 border-t border-zinc-100">
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Get Started</h3>
                  <p className="text-[14px] text-zinc-700 font-medium">{result.next_step}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => { setResult(null); setIdea(""); }}
                    className="h-10 px-5 text-[13px] font-semibold text-zinc-500 rounded-full ring-1 ring-zinc-200 hover:ring-zinc-300 hover:bg-zinc-50 transition-all"
                  >
                    New Idea
                  </button>
                  <Link to="/Feed">
                    <button className="h-10 px-5 bg-zinc-900 text-white text-[13px] font-semibold rounded-full hover:bg-zinc-800 transition-colors flex items-center gap-2">
                      Share on Feed <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {result?.error && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <p className="text-sm text-zinc-400">Something went wrong. Try again!</p>
            <button onClick={generate} className="mt-3 text-[13px] font-semibold text-violet-600 hover:text-violet-700">
              Retry
            </button>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && !generating && !result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Recent Ideas</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setIdea(h.idea); setResult(h.result); }}
                  className="w-full text-left p-4 bg-white rounded-xl ring-1 ring-zinc-200/80 hover:ring-zinc-300 transition-all"
                >
                  <div className="text-[14px] font-semibold text-zinc-800">{h.result.name}</div>
                  <div className="text-[12px] text-zinc-400 mt-0.5">{h.result.one_liner}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state inspiration */}
        {!result && !generating && history.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center mt-8">
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {PROMPTS.slice(0, 4).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setIdea(p)}
                  className="p-3 bg-white rounded-xl ring-1 ring-zinc-200/80 hover:ring-zinc-300 text-left transition-all"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 mb-1.5" />
                  <span className="text-[12px] text-zinc-500 leading-snug line-clamp-2">{p}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-300 mt-4">Tap one to get started</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}