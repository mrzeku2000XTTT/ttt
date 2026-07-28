import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowUpRight, Sparkles, Lightbulb, Twitter,
  Loader2, RefreshCw, Copy, Check, Settings, Share2, Info, Layout, Globe, X
} from "lucide-react";
import BlueprintBuilder from "@/components/explore/BlueprintBuilder";

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

const EMERALD = "#0a3a2d";
const EMERALD_DARK = "#072a22";
const CREAM = "#f4efdf";
const GOLD = "#b89a66";
const GOLD_BRIGHT = "#d4b878";
const CHARCOAL = "#2e2e2e";

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
  const [view, setView] = useState('idea');
  const [kaspanetOpen, setKaspanetOpen] = useState(false);

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
      // Detect URLs in the input — agent will deep-research them
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = idea.match(urlRegex);
      const hasUrl = urls && urls.length > 0;

      const urlInstruction = hasUrl
        ? `\n\nThe user has provided this URL: ${urls.join(', ')}. Visit and research the content at this URL thoroughly — extract what the site does, its target audience, features, and business model. Base your concept on what you find there.`
        : '';

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert Web3 product designer and startup advisor with real-time web search. The user wants to build something on the Kaspa blockchain ecosystem (blockDAG, KRC-20, GHOSTDAG, PoW).

Their idea seed: "${idea.trim()}"${urlInstruction}

SEARCH THE WEB for real, current information about:
- **X.com (Twitter)** — search for REAL posts, threads, and discussions about this type of product or idea. What are people actually saying on X.com? What's the social sentiment? Quote real takes if possible.
- Market size and trends for this type of product
- Existing competitors and similar projects (especially on Kaspa and other blockchains)
- Current best practices, tools, and technologies
- Real data that grounds this concept in reality

Then generate a concise, inspiring product concept that includes:
1. **Name** — a catchy, memorable product name
2. **One-liner** — a single sentence pitch
3. **The Problem** — what pain point it solves (2-3 sentences)
4. **The Solution** — how it works on Kaspa (2-3 sentences)
5. **Key Features** — 4 bullet points
6. **Why Kaspa** — why blockDAG is perfect for this (1-2 sentences)
7. **Market Research** — real findings from your web search (competitors, market size, trends — 3-4 sentences)
8. **Social Buzz** — real findings from X.com/Twitter: what people are saying, real sentiment, notable voices (3-4 sentences with real quotes or paraphrased takes)
9. **Competitors** — 3-5 real competitor names or similar projects you found
10. **Next Step** — a single next step to begin building
11. **Sources** — list of real URLs you found during your research (include X.com post URLs if found)

Ground everything in real data from the live web. Be punchy, visionary, and practical.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            one_liner: { type: "string" },
            problem: { type: "string" },
            solution: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            why_kaspa: { type: "string" },
            market_research: { type: "string" },
            social_buzz: { type: "string", description: "Real findings from X.com/Twitter — what people are saying" },
            competitors: { type: "array", items: { type: "string" } },
            next_step: { type: "string" },
            source_urls: { type: "array", items: { type: "string" } },
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
    return `💡 ${result.name}\n${result.one_liner}\n\n🔴 Problem: ${result.problem}\n\n✅ Solution: ${result.solution}\n\n⚡ Key Features:\n${result.features?.map(f => `• ${f}`).join("\n")}\n\n🔷 Why Kaspa: ${result.why_kaspa}\n\n📊 Market Research: ${result.market_research || "N/A"}\n\n🏢 Competitors: ${(result.competitors || []).join(", ") || "N/A"}\n\n🚀 Next Step: ${result.next_step}\n\n🔗 Sources:\n${(result.source_urls || []).map(u => `• ${u}`).join("\n")}\n\n— Generated with TTT Idea Lab (Web-Powered)`;
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

  const Ornament = () => (
    <div className="flex items-center justify-center gap-3 my-8">
      <div className="h-px w-16 sm:w-32" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
      <div className="flex items-center gap-2">
        <span className="text-[10px]" style={{ color: `${GOLD}88` }}>✦</span>
        <span className="text-xs" style={{ color: GOLD }}>❦</span>
        <span className="text-base" style={{ color: GOLD_BRIGHT }}>✺</span>
        <span className="text-xs" style={{ color: GOLD }}>❦</span>
        <span className="text-[10px]" style={{ color: `${GOLD}88` }}>✦</span>
      </div>
      <div className="h-px w-16 sm:w-32" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
    </div>
  );

  return (
    <div
      className="min-h-screen selection:bg-amber-200/30"
      style={{ background: EMERALD, fontFamily: "'Fraunces', Georgia, serif" }}
    >
      {/* Decorative border frame */}
      <div
        className="fixed inset-2 sm:inset-3 pointer-events-none z-30"
        style={{ border: `1px solid ${GOLD}55`, borderRadius: 4 }}
      />
      <div
        className="fixed inset-3 sm:inset-4 pointer-events-none z-30"
        style={{ border: `1px solid ${GOLD}22`, borderRadius: 3 }}
      />

      {/* Nav */}
      <nav
        className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 backdrop-blur-2xl"
        style={{ background: `${EMERALD_DARK}cc`, borderBottom: `1px solid ${GOLD}33` }}
      >
        <button
          onClick={() => view === 'blueprint' ? setView('idea') : navigate(-1)}
          className="flex items-center justify-center gap-1.5 h-full px-4 -ml-3 transition-colors duration-150 cursor-pointer"
          style={{ touchAction: 'manipulation', minHeight: '48px', minWidth: '88px', WebkitTapHighlightColor: 'transparent', color: GOLD_BRIGHT }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 flex-shrink-0" />
          <span className="text-[15px] font-medium select-none" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{view === 'blueprint' ? 'Idea Lab' : 'Back'}</span>
        </button>
        <span
          className="text-[15px] font-bold tracking-wide"
          style={{ color: CREAM, fontFamily: "'Fraunces', Georgia, serif", letterSpacing: '0.02em' }}
        >
          {view === 'blueprint' ? 'Blueprint' : 'Idea Lab'}
        </span>
        <div className="flex items-center gap-3">
          {view === 'idea' && (
            <button
              onClick={() => setView('blueprint')}
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
              style={{ color: GOLD_BRIGHT }}
            >
              <Layout className="w-3.5 h-3.5" /> Blueprint
            </button>
          )}
          <button
            onClick={() => setKaspanetOpen(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
            style={{ color: GOLD_BRIGHT }}
          >
            <Globe className="w-3.5 h-3.5" /> Kaspanet
          </button>
          <Link
            to="/TTTV2"
            className="text-[12px] font-medium transition-colors"
            style={{ color: `${GOLD}cc` }}
          >
            TTT 2.0
          </Link>
        </div>
      </nav>

      {view === 'blueprint' ? (
        <div className="px-3 lg:px-5 pt-16 pb-4 relative z-10">
          <BlueprintBuilder idea={idea} concept={result} />
        </div>
      ) : (
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-24 relative z-10">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          {/* Decorative logo with flourishes */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-lg" style={{ color: `${GOLD}66` }}>❧</span>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center relative"
              style={{ background: EMERALD_DARK, border: `1.5px solid ${GOLD}`, boxShadow: `0 0 40px ${GOLD}44, inset 0 1px 0 ${GOLD}22` }}
            >
              <Lightbulb className="w-7 h-7" style={{ color: GOLD_BRIGHT }} />
            </div>
            <span className="text-lg" style={{ color: `${GOLD}66`, transform: 'scaleX(-1)' }}>❧</span>
          </div>
          <h1
            className="text-[clamp(1.8rem,5vw,2.8rem)] font-bold tracking-tight leading-[1.05] mb-3"
            style={{ color: CREAM, fontFamily: "'Fraunces', Georgia, serif" }}
          >
            What Will You Build?
          </h1>
          <p
            className="text-[14px] max-w-sm mx-auto leading-relaxed"
            style={{ color: `${CREAM}88`, fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Type any idea or paste a URL — the agent searches the web and shapes it into a full product concept on Kaspa.
          </p>
        </motion.div>

        {/* Two-column: Info card + Input area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid sm:grid-cols-5 gap-4 mb-8"
        >
          {/* Info Card */}
          <div
            className="sm:col-span-2 rounded-lg flex flex-col relative overflow-hidden"
            style={{ background: CREAM, border: `1px solid ${GOLD}66`, boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)` }}
          >
            {/* Top flourish */}
            <div className="text-center py-2" style={{ background: `${GOLD}11`, borderBottom: `1px solid ${GOLD}33` }}>
              <span className="text-sm" style={{ color: GOLD }}>❦ ❦ ❦</span>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}55` }}
                >
                  <Info className="w-4 h-4" style={{ color: GOLD }} />
                </div>
                <h3
                  className="text-[12px] font-bold uppercase"
                  style={{ color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif", letterSpacing: '0.05em' }}
                >
                  What is Idea Lab?
                </h3>
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: `${CHARCOAL}cc`, fontFamily: "'Fraunces', Georgia, serif" }}
              >
                TTT's AI-powered brainstorming agent with real-time web search. Type any rough concept or paste a URL — the agent researches competitors, market data, and trends from the live web, then generates a complete product pitch built for the Kaspa ecosystem. Copy, share to the TTT Feed, or keep iterating.
              </p>
            </div>
            {/* Bottom flourish */}
            <div className="text-center py-2" style={{ background: `${GOLD}11`, borderTop: `1px solid ${GOLD}33` }}>
              <span className="text-sm" style={{ color: GOLD }}>❦ ❦ ❦</span>
            </div>
          </div>

          {/* Input Area */}
          <div className="sm:col-span-3">
            <div
              className="rounded-lg p-5 relative"
              style={{ background: CREAM, border: `2px solid ${GOLD}`, boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)` }}
            >
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
                placeholder="Type any idea or paste a URL to research — e.g. 'AI NFT marketplace on Kaspa' or 'https://example.com'…"
                rows={4}
                className="w-full bg-transparent text-[15px] outline-none resize-none leading-relaxed"
                style={{ color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}
              />
              {/* Generate button at bottom-right of input box */}
              <div className="flex justify-end mt-3">
                <button
                  onClick={generate}
                  disabled={!idea.trim() || generating}
                  className="flex items-center gap-2 h-10 px-6 text-[13px] font-semibold rounded-full transition-all"
                  style={{
                    background: !idea.trim() || generating ? `${GOLD}44` : `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                    color: EMERALD_DARK,
                    border: `1px solid ${GOLD}`,
                    boxShadow: !idea.trim() || generating ? 'none' : `0 2px 12px ${GOLD}44`,
                    fontFamily: "'Fraunces', Georgia, serif",
                  }}
                >
                  {generating ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                  ) : (
                    <><Settings className="w-3.5 h-3.5" /> Generate</>
                  )}
                </button>
              </div>
            </div>
            {/* Surprise me below the input box */}
            <div className="text-center mt-3">
              <button
                onClick={randomPrompt}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                style={{ color: `${CREAM}88`, fontFamily: "'Fraunces', Georgia, serif" }}
              >
                <RefreshCw className="w-3 h-3" /> Surprise me
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {generating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" style={{ color: GOLD }} />
              <p className="text-[13px] mb-1" style={{ color: `${CREAM}88`, fontFamily: "'Fraunces', Georgia, serif" }}>Searching the web, X.com posts & researching competitors…</p>
              <p className="text-[11px]" style={{ color: `${GOLD}66`, fontFamily: "'Fraunces', Georgia, serif" }}>Gathering real social buzz and market data</p>
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
              <div
                className="rounded-t-lg p-6 sm:p-8"
                style={{ background: EMERALD_DARK, border: `1px solid ${GOLD}`, borderBottom: 'none' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase mb-2"
                      style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      Your Concept
                    </p>
                    <h2
                      className="text-xl sm:text-2xl font-bold tracking-tight leading-tight"
                      style={{ color: CREAM, fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      {result.name}
                    </h2>
                    <p className="text-[14px] mt-2 leading-relaxed" style={{ color: `${CREAM}88`, fontFamily: "'Fraunces', Georgia, serif" }}>
                      {result.one_liner}
                    </p>
                  </div>
                  <button
                    onClick={copyResult}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}44` }}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" style={{ color: GOLD_BRIGHT }} /> : <Copy className="w-3.5 h-3.5" style={{ color: `${GOLD}aa` }} />}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div
                className="rounded-b-lg divide-y"
                style={{ background: CREAM, border: `1px solid ${GOLD}66`, borderTop: 'none' }}
              >
                <div style={{ borderColor: `${GOLD}33` }}>
                  <div className="p-6" style={{ borderBottom: `1px solid ${GOLD}22` }}>
                    <h3 className="text-[10px] font-bold uppercase mb-2" style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>The Problem</h3>
                    <p className="text-[14px] leading-relaxed" style={{ color: `${CHARCOAL}cc`, fontFamily: "'Fraunces', Georgia, serif" }}>{result.problem}</p>
                  </div>
                  <div className="p-6" style={{ borderBottom: `1px solid ${GOLD}22` }}>
                    <h3 className="text-[10px] font-bold uppercase mb-2" style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>The Solution</h3>
                    <p className="text-[14px] leading-relaxed" style={{ color: `${CHARCOAL}cc`, fontFamily: "'Fraunces', Georgia, serif" }}>{result.solution}</p>
                  </div>
                  <div className="p-6" style={{ borderBottom: `1px solid ${GOLD}22` }}>
                    <h3 className="text-[10px] font-bold uppercase mb-3" style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>Key Features</h3>
                    <div className="space-y-2">
                      {result.features?.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 py-2">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: EMERALD_DARK, border: `1px solid ${GOLD}55` }}
                          >
                            <span className="text-[10px] font-bold" style={{ color: GOLD_BRIGHT }}>{i + 1}</span>
                          </div>
                          <span className="text-[13px] leading-snug" style={{ color: `${CHARCOAL}cc`, fontFamily: "'Fraunces', Georgia, serif" }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6" style={{ borderBottom: `1px solid ${GOLD}22` }}>
                    <h3 className="text-[10px] font-bold uppercase mb-2" style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>Why Kaspa</h3>
                    <p className="text-[14px] leading-relaxed" style={{ color: `${CHARCOAL}cc`, fontFamily: "'Fraunces', Georgia, serif" }}>{result.why_kaspa}</p>
                  </div>
                  {result.market_research && (
                    <div className="p-6" style={{ borderBottom: `1px solid ${GOLD}22` }}>
                      <h3 className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1.5" style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>
                        <Sparkles className="w-3 h-3" /> Market Research
                      </h3>
                      <p className="text-[14px] leading-relaxed" style={{ color: `${CHARCOAL}cc`, fontFamily: "'Fraunces', Georgia, serif" }}>{result.market_research}</p>
                    </div>
                  )}
                  {result.social_buzz && (
                    <div className="p-6" style={{ borderBottom: `1px solid ${GOLD}22` }}>
                      <h3 className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1.5" style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>
                        <Twitter className="w-3 h-3" /> Social Buzz (X.com)
                      </h3>
                      <p className="text-[14px] leading-relaxed" style={{ color: `${CHARCOAL}cc`, fontFamily: "'Fraunces', Georgia, serif" }}>{result.social_buzz}</p>
                    </div>
                  )}
                  {result.competitors && result.competitors.length > 0 && (
                    <div className="p-6" style={{ borderBottom: `1px solid ${GOLD}22` }}>
                      <h3 className="text-[10px] font-bold uppercase mb-3" style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>Competitors</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.competitors.map((c, i) => (
                          <span key={i} className="text-[12px] px-3 py-1 rounded-full" style={{ background: `${GOLD}15`, color: `${CHARCOAL}cc`, border: `1px solid ${GOLD}33`, fontFamily: "'Fraunces', Georgia, serif" }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.source_urls && result.source_urls.length > 0 && (
                    <div className="p-6" style={{ borderBottom: `1px solid ${GOLD}22` }}>
                      <h3 className="text-[10px] font-bold uppercase mb-3" style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>Sources</h3>
                      <div className="space-y-1.5">
                        {result.source_urls.map((u, i) => (
                          <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] hover:underline" style={{ color: GOLD, fontFamily: "'Fraunces', Georgia, serif" }}>
                            <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{u}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-6" style={{ borderBottom: `1px solid ${GOLD}22` }}>
                    <h3 className="text-[10px] font-bold uppercase mb-2" style={{ color: GOLD, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>Next Step</h3>
                    <p className="text-[14px] font-medium leading-relaxed" style={{ color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}>{result.next_step}</p>
                  </div>
                  <div className="p-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => setView('blueprint')}
                      className="h-10 px-5 text-[13px] font-semibold rounded-full transition-all flex items-center gap-2"
                      style={{ color: EMERALD_DARK, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, border: `1px solid ${GOLD}`, boxShadow: `0 2px 12px ${GOLD}44`, fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      <Layout className="w-3.5 h-3.5" /> Blueprint
                    </button>
                    <button
                      onClick={() => { setResult(null); setIdea(""); }}
                      className="h-10 px-5 text-[13px] font-semibold rounded-full transition-all"
                      style={{ color: `${CHARCOAL}88`, border: `1px solid ${GOLD}55`, background: 'transparent', fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      New Idea
                    </button>
                    <button
                      onClick={shareToFeed}
                      disabled={sharing || shared}
                      className="h-10 px-5 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-2 disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: EMERALD_DARK, border: `1px solid ${GOLD}`, fontFamily: "'Fraunces', Georgia, serif" }}
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {result?.error && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
            <p className="text-sm mb-3" style={{ color: `${CREAM}88`, fontFamily: "'Fraunces', Georgia, serif" }}>Something went wrong.</p>
            <button onClick={generate} className="text-[13px] font-semibold underline underline-offset-2" style={{ color: GOLD_BRIGHT }}>
              Try again
            </button>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && !generating && !result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Ornament />
            <h3 className="text-[10px] font-bold uppercase mb-3 text-center" style={{ color: `${GOLD}aa`, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>Recent</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setIdea(h.idea); setResult(h.result); }}
                  className="w-full text-left p-4 rounded-lg transition-all"
                  style={{ background: CREAM, border: `1px solid ${GOLD}44` }}
                >
                  <div className="text-[14px] font-semibold" style={{ color: CHARCOAL, fontFamily: "'Fraunces', Georgia, serif" }}>{h.result.name}</div>
                  <div className="text-[12px] mt-0.5 line-clamp-1" style={{ color: `${CHARCOAL}88`, fontFamily: "'Fraunces', Georgia, serif" }}>{h.result.one_liner}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state — prompt suggestions */}
        {!result && !generating && history.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Ornament />
            <p className="text-[10px] font-bold uppercase mb-4 text-center" style={{ color: `${GOLD}88`, letterSpacing: '0.15em', fontFamily: "'Fraunces', Georgia, serif" }}>Or start with one of these</p>
            <div className="grid grid-cols-2 gap-3">
              {PROMPTS.slice(0, 4).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setIdea(p)}
                  className="p-4 rounded-lg text-center transition-all group"
                  style={{ background: CREAM, border: `1px solid ${GOLD}44`, boxShadow: '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)' }}
                >
                  <div className="flex justify-center mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}33` }}
                    >
                      <Lightbulb className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    </div>
                  </div>
                  <span className="text-[12px] leading-snug block" style={{ color: `${CHARCOAL}aa`, fontFamily: "'Fraunces', Georgia, serif" }}>{p}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
        </div>
        )}

      {/* Kaspanet Browser iframe overlay */}
      {kaspanetOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: EMERALD_DARK }}>
          <div
            className="h-12 flex items-center justify-between px-5 flex-shrink-0"
            style={{ background: EMERALD_DARK, borderBottom: `1px solid ${GOLD}33` }}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" style={{ color: GOLD_BRIGHT }} />
              <span className="text-[13px] font-bold" style={{ color: CREAM, fontFamily: "'Fraunces', Georgia, serif" }}>
                Kaspanet Browser
              </span>
              <span className="text-[10px]" style={{ color: `${GOLD}aa` }}>kaspanet.online</span>
            </div>
            <button
              onClick={() => setKaspanetOpen(false)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg transition-colors"
              style={{ color: CREAM, background: `${GOLD}22`, border: `1px solid ${GOLD}44` }}
            >
              <X className="w-4 h-4" />
              <span className="text-[12px] font-medium" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Close</span>
            </button>
          </div>
          <iframe
            src="https://kaspanet.online"
            title="Kaspanet Browser"
            className="flex-1 w-full border-0"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}
        </div>
        );
        }