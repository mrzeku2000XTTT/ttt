import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowUpRight, Sparkles, Lightbulb,
  Loader2, RefreshCw, Copy, Check, Wand2, Share2, Info
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
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("idea_lab_history");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("idea_lab_history", JSON.stringify(history)); } catch {}
  }, [history]);

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

Keep it punchy, visionary, and practical.`,
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

  const formatResultText = () => {
    if (!result || result.error) return "";
    return `💡 ${result.name}\n${result.one_liner}\n\n🔴 Problem: ${result.problem}\n\n✅ Solution: ${result.solution}\n\n⚡ Key Features:\n${result.features?.map(f => `• ${f}`).join("\n")}\n\n🔷 Why Kaspa: ${result.why_kaspa}\n\n🚀 Next Step: ${result.next_step}\n\n— Generated with TTT Idea Lab`;
  };

  const copyResult = () => {
    if (!result || result.error) return;
    navigator.clipboard.writeText(formatResultText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToFeed = async () => {
    if (!result || result.error || sharing) return;
    setSharing(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Post.create({
        content: formatResultText(),
        author_name: user?.username || user?.full_name || "Idea Lab User",
        author_wallet_address: user?.created_wallet_address || "",
      });
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (err) {
      alert("Please log in to share ideas to the feed.");
    }
    setSharing(false);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-black/10">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 bg-white/80 backdrop-blur-2xl border-b border-zinc-100">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center justify-center gap-1.5 h-full px-4 -ml-3 rounded-full active:bg-zinc-100 transition-colors duration-150 text-zinc-400 cursor-pointer"
          style={{ touchAction: 'manipulation', minHeight: '48px', minWidth: '88px', WebkitTapHighlightColor: 'transparent' }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 flex-shrink-0" />
          <span className="text-[15px] font-semibold select-none">Back</span>
        </button>
        <span className="text-[15px] font-[800] tracking-tight text-zinc-900">Idea Lab</span>
        <Link to="/TTTV2" className="text-[12px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors">
          TTT 2.0
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-5 pt-28 pb-24">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[clamp(1.8rem,5vw,3rem)] font-[900] tracking-tight leading-[1.05] mb-3">
            What will you build?
          </h1>
          <p className="text-[15px] text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Describe a rough idea and we'll shape it into a full product concept on Kaspa.
          </p>
        </motion.div>

        {/* What is this */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="mb-10 bg-zinc-50 rounded-2xl border border-zinc-100 p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-200/60 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-zinc-800 mb-1">What is Idea Lab?</h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Idea Lab is TTT's AI-powered brainstorming tool. Type any rough concept — even just a few words — and it generates a complete product pitch built for the Kaspa ecosystem. You can copy the result, share it directly to the TTT Feed, or keep iterating. Your generated ideas are saved so you never lose them.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Input Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-10">
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
              placeholder="A platform where artists can sell AI-generated NFTs using Kaspa…"
              rows={3}
              className="w-full bg-transparent text-[15px] text-zinc-900 outline-none placeholder-zinc-300 resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200/60">
              <button
                onClick={randomPrompt}
                className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Surprise me
              </button>
              <button
                onClick={generate}
                disabled={!idea.trim() || generating}
                className="flex items-center gap-2 h-10 px-6 bg-zinc-900 text-white text-[13px] font-semibold rounded-full disabled:opacity-30 hover:bg-zinc-800 transition-all"
              >
                {generating ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-300 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-400">Crafting your concept…</p>
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
              className="space-y-0"
            >
              {/* Concept Name */}
              <div className="bg-zinc-900 rounded-t-2xl p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2">Your Concept</p>
                    <h2 className="text-xl sm:text-2xl font-[900] text-white tracking-tight leading-tight">{result.name}</h2>
                    <p className="text-[14px] text-zinc-400 mt-2 leading-relaxed">{result.one_liner}</p>
                  </div>
                  <button
                    onClick={copyResult}
                    className="flex-shrink-0 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-zinc-50 rounded-b-2xl border border-t-0 border-zinc-100 divide-y divide-zinc-100">
                {/* Problem */}
                <div className="p-6">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">The Problem</h3>
                  <p className="text-[14px] text-zinc-600 leading-relaxed">{result.problem}</p>
                </div>

                {/* Solution */}
                <div className="p-6">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">The Solution</h3>
                  <p className="text-[14px] text-zinc-600 leading-relaxed">{result.solution}</p>
                </div>

                {/* Features */}
                <div className="p-6">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-3">Key Features</h3>
                  <div className="space-y-2">
                    {result.features?.map((f, i) => (
                      <div key={i} className="flex items-start gap-3 py-2">
                        <div className="w-5 h-5 rounded-md bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-white">{i + 1}</span>
                        </div>
                        <span className="text-[13px] text-zinc-600 leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why Kaspa */}
                <div className="p-6">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Why Kaspa</h3>
                  <p className="text-[14px] text-zinc-600 leading-relaxed">{result.why_kaspa}</p>
                </div>

                {/* Next Step */}
                <div className="p-6">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Next Step</h3>
                  <p className="text-[14px] text-zinc-900 font-medium leading-relaxed">{result.next_step}</p>
                </div>

                {/* Actions */}
                <div className="p-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => { setResult(null); setIdea(""); }}
                    className="h-10 px-5 text-[13px] font-semibold text-zinc-500 rounded-full border border-zinc-200 hover:border-zinc-300 hover:bg-white transition-all"
                  >
                    New Idea
                  </button>
                  <button
                    onClick={shareToFeed}
                    disabled={sharing || shared}
                    className="h-10 px-5 bg-zinc-900 text-white text-[13px] font-semibold rounded-full hover:bg-zinc-800 disabled:opacity-60 transition-colors flex items-center gap-2"
                  >
                    {shared ? (
                      <><Check className="w-3.5 h-3.5" /> Posted!</>
                    ) : sharing ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Posting…</>
                    ) : (
                      <><Share2 className="w-3.5 h-3.5" /> Share on Feed</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {result?.error && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
            <p className="text-sm text-zinc-400 mb-3">Something went wrong.</p>
            <button onClick={generate} className="text-[13px] font-semibold text-zinc-900 underline underline-offset-2">
              Try again
            </button>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && !generating && !result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-3">Recent</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setIdea(h.idea); setResult(h.result); }}
                  className="w-full text-left p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-all"
                >
                  <div className="text-[14px] font-semibold text-zinc-900">{h.result.name}</div>
                  <div className="text-[12px] text-zinc-400 mt-0.5 line-clamp-1">{h.result.one_liner}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state — prompt suggestions */}
        {!result && !generating && history.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.15em] mb-3 text-center">Or start with one of these</p>
            <div className="grid grid-cols-2 gap-2">
              {PROMPTS.slice(0, 4).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setIdea(p)}
                  className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-200 text-left transition-all group"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 mb-2 transition-colors" />
                  <span className="text-[12px] text-zinc-500 leading-snug line-clamp-2">{p}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}