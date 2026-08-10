import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowUpRight, Sparkles, Lightbulb, Twitter,
  Loader2, RefreshCw, Copy, Check, Settings, Share2, Info, Layout, Globe, X, Coins
} from "lucide-react";
import BlueprintBuilder from "@/components/explore/BlueprintBuilder";
import KronTokensPanel from "@/components/explore/KronTokensPanel";

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

// Real Kaspa ecosystem sources scraped at generate-time so the agent grounds
// concepts in current developments (esp. KCC-20) instead of guessing.
const KASPA_SOURCES = [
  "https://kaspa.news",
  "https://kaspa.org",
];
const KASPA_PRIMER = `KASPA ECOSYSTEM PRIMER (ground truth — use this AND verify/extend with the live data below):
- Kaspa is a Proof-of-Work blockDAG cryptocurrency using the GHOSTDAG consensus protocol, ~1 block/second, sub-second finality.
- KRC-20 is Kaspa's fungible token standard (minted/transferred on Kaspa L1, indexed by Kasplex), analogous to ERC-20.
- KCC-20 ("Kaspa Covenant Contract-20") is Kaspa's covenant-based smart-contract / token standard. Covenants let Kaspa scripts enforce spending conditions on UTXOs, enabling programmable tokens, NFTs, and contracts NATIVELY on Kaspa L1 — without a virtual machine or external smart-contract layer. KCC-20 is the emerging standard for covenant-secured coins/contracts on Kaspa.
- Confirm the latest protocol upgrades, KCC-20 launches, KRC-20 activity, and tooling news from kaspa.news and official Kaspa sources.`;

// Editorial Light palette — clean white, black ink, hairline rules
const WHITE = "#ffffff";
const INK = "#000000";
const INK_SOFT = "#1a1a1a";
const GREY = "#6b6b6b";
const GREY_LIGHT = "#a8a8a8";
const LINE = "#e5e5e5";
const SERIF = "'Fraunces', Georgia, serif";

// Numbered editorial section header (module-level so it keeps stable identity across renders)
const Section = ({ n, title, children, className = "" }) => (
  <section className={`relative ${className}`}>
    <div className="flex items-baseline gap-4 mb-5">
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>{n}</span>
      {title && (
        <h2 className="text-[clamp(1.5rem,4vw,2.1rem)] font-bold leading-[1.05]" style={{ color: INK, fontFamily: SERIF }}>
          {title}
        </h2>
      )}
    </div>
    {children}
  </section>
);

const Rule = () => <div className="h-px w-full" style={{ background: LINE }} />;

// A numbered outline row with hairline divider
const OutlineRow = ({ n, label, text, icon, strong }) => (
  <>
    <div className="py-8">
      <div className="flex items-baseline gap-4 mb-3">
        <span className="text-[13px] font-semibold tabular-nums" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>{n}</span>
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] flex items-center gap-1.5" style={{ color: INK, fontFamily: SERIF }}>
          {icon}{label}
        </h3>
      </div>
      <p className={`text-[15px] leading-[1.8] pl-0 sm:pl-[2.4rem] ${strong ? 'font-semibold' : ''}`} style={{ color: strong ? INK : INK_SOFT, fontFamily: SERIF }}>
        {text}
      </p>
    </div>
    <Rule />
  </>
);

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
  const [kaspanetUrl, setKaspanetUrl] = useState("https://kaspanet.online");
  const [kaspanetHtml, setKaspanetHtml] = useState("");
  const [kaspanetLoading, setKaspanetLoading] = useState(false);
  const [kaspanetError, setKaspanetError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const fetchKaspanet = async (url) => {
    setKaspanetLoading(true);
    setKaspanetError(false);
    setKaspanetHtml("");
    try {
      const res = await fetch('/api/functions/webProxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.html) {
        setKaspanetHtml(data.html);
      } else {
        setKaspanetError(true);
      }
    } catch {
      setKaspanetError(true);
    } finally {
      setKaspanetLoading(false);
    }
  };

  useEffect(() => {
    if (kaspanetOpen) fetchKaspanet(kaspanetUrl);
  }, [kaspanetOpen]);

  useEffect(() => {
    try { localStorage.setItem("idea_lab_history", JSON.stringify(history)); } catch {}
  }, [history]);

  const randomPrompt = () => {
    const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setIdea(p);
  };

  const generate = async (overrideIdea) => {
    const seed = (overrideIdea ?? idea).trim();
    if (!seed || generating) return;
    if (overrideIdea) setIdea(overrideIdea);
    setGenerating(true);
    setResult(null);
    setView('idea');
    try {
      // Detect URLs — fetch REAL page content so the agent doesn't hallucinate
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = seed.match(urlRegex);
      const hasUrl = urls && urls.length > 0;

      let urlContext = '';
      if (hasUrl) {
        try {
          const resp = await base44.functions.invoke('fetchUrlContent', { url: urls[0] });
          const d = resp.data;
          if (d && !d.error && d.textContent) {
            urlContext = `\n\nThe user provided this URL: ${d.url}\nHere is the ACTUAL content scraped from that URL — use this real data, do NOT guess or fabricate:\nTitle: ${d.title || 'N/A'}\nSite: ${d.siteName || d.host || 'N/A'}\nMeta Description: ${d.metaDescription || 'N/A'}\nHeadings: ${(d.headings || []).join(' | ') || 'N/A'}\nPage Content:\n${d.textContent}\n\nBase your concept on this real content. Describe what the site actually does based on the text above.`;
          } else {
            urlContext = `\n\nThe user provided this URL: ${urls[0]} — the page could not be fetched automatically. Search the web for information about this URL and describe what it actually does.`;
          }
        } catch {
          urlContext = `\n\nThe user provided this URL: ${urls[0]} — search the web for information about this URL.`;
        }
      }

      // Fetch REAL Kaspa ecosystem news (kaspa.news + official) so the agent
      // grounds the concept in current developments — especially KCC-20.
      let kaspaContext = '';
      try {
        const sources = await Promise.allSettled(
          KASPA_SOURCES.map((u) => base44.functions.invoke('fetchUrlContent', { url: u }))
        );
        const blocks = sources
          .map((r, i) => {
            if (r.status !== 'fulfilled') return null;
            const d = r.value?.data;
            if (!d || d.error || !d.textContent) return null;
            return `--- ${KASPA_SOURCES[i]} ---\nTitle: ${d.title || ''}\n${(d.textContent || '').slice(0, 3500)}`;
          })
          .filter(Boolean);
        if (blocks.length) kaspaContext = blocks.join('\n\n');
      } catch {}

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert Web3 product designer and startup advisor with real-time web search. The user wants to build something on the Kaspa blockchain ecosystem (blockDAG, GHOSTDAG, PoW, KRC-20, KCC-20).

${KASPA_PRIMER}

LATEST KASPA DEVELOPMENTS (scraped from kaspa.news & official sources — treat as REAL grounding data, do not guess):
${kaspaContext || "(live fetch unavailable — use your own web search for KCC-20 and kaspa.news)"}

Their idea seed: "${seed}"${urlContext}

SEARCH THE WEB for real, current information about:
- **KCC-20** — the Kaspa Covenant Contract token standard (programmable covenant-based smart coins native to Kaspa L1). Find the latest spec, launches, and projects. If the idea could use KCC-20, reference it accurately.
- **KRC-20** — Kaspa's fungible token standard; current tokens, launches, and activity.
- **kaspa.news** — the latest Kaspa headlines, protocol upgrades, and ecosystem developments.
- **X.com (Twitter)** — search for REAL posts, threads, and discussions about this type of product or idea. What are people actually saying on X.com? What's the social sentiment? Quote real takes if possible.
- Market size and trends for this type of product
- Existing competitors and similar projects (especially on Kaspa and other blockchains)
- Current best practices, tools, and technologies
- Real data that grounds this concept in reality

Frame this as a premium, design-forward product (the kind that would win an Awwward) — world-class UX, motion-rich "motionsites" aesthetic, production-grade polish.

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
            kaspa_dev: { type: "string", description: "Latest Kaspa developments and KCC-20/KRC-20 findings grounded in kaspa.news & web search" },
            market_research: { type: "string" },
            social_buzz: { type: "string", description: "Real findings from X.com/Twitter — what people are saying" },
            competitors: { type: "array", items: { type: "string" } },
            next_step: { type: "string" },
            source_urls: { type: "array", items: { type: "string" } },
          },
        },
      });
      setResult(res);
      setHistory(prev => [{ idea: seed, result: res, time: new Date() }, ...prev].slice(0, 5));
    } catch {
      setResult({ error: true });
    }
    setGenerating(false);
  };

  const formatResultText = () => {
    if (!result || result.error) return "";
    return `💡 ${result.name}\n${result.one_liner}\n\n🔴 Problem: ${result.problem}\n\n✅ Solution: ${result.solution}\n\n⚡ Key Features:\n${result.features?.map(f => `• ${f}`).join("\n")}\n\n🔷 Why Kaspa: ${result.why_kaspa}\n\n⛓️ Latest Kaspa Dev (KCC-20): ${result.kaspa_dev || "N/A"}\n\n📊 Market Research: ${result.market_research || "N/A"}\n\n🏢 Competitors: ${(result.competitors || []).join(", ") || "N/A"}\n\n🚀 Next Step: ${result.next_step}\n\n🔗 Sources:\n${(result.source_urls || []).map(u => `• ${u}`).join("\n")}\n\n— Generated with TTT Idea Lab (Web-Powered)`;
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
    <div
      className="min-h-screen selection:bg-black selection:text-white"
      style={{ background: WHITE, fontFamily: SERIF, color: INK_SOFT }}
    >
      {/* Nav */}
      <nav
        className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 sm:px-8"
        style={{ background: WHITE, borderBottom: `1px solid ${LINE}` }}
      >
        <button
          onClick={() => (view === 'blueprint' || view === 'kron') ? setView('idea') : navigate(-1)}
          className="flex items-center gap-1.5 h-full -ml-2 transition-colors duration-150 cursor-pointer"
          style={{ touchAction: 'manipulation', minHeight: '44px', minWidth: '44px', WebkitTapHighlightColor: 'transparent', color: INK }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span className="text-[14px] font-medium select-none" style={{ fontFamily: SERIF }}>{(view === 'blueprint' || view === 'kron') ? 'Idea Lab' : 'Back'}</span>
        </button>
        <span
          className="text-[15px] font-semibold tracking-tight"
          style={{ color: INK, fontFamily: SERIF }}
        >
          {view === 'blueprint' ? 'Blueprint' : view === 'kron' ? 'KRON Tokens' : 'Idea Lab'}
        </span>
        <div className="flex items-center gap-4">
          {view === 'idea' && (
            <button
              onClick={() => setView('blueprint')}
              className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-60"
              style={{ color: INK, minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <Layout className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Blueprint</span>
            </button>
          )}
          {view === 'idea' && (
            <button
              onClick={() => setView('kron')}
              className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-60"
              style={{ color: INK, minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <Coins className="w-3.5 h-3.5" /> <span className="hidden sm:inline">KRON</span>
            </button>
          )}
          <button
            onClick={() => setKaspanetOpen(true)}
            className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-60"
            style={{ color: INK, minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <Globe className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Kaspanet</span>
          </button>
          <Link
            to="/TTTV2"
            className="flex items-center text-[13px] font-medium transition-opacity hover:opacity-60"
            style={{ color: INK, minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            TTT 2.0
          </Link>
        </div>
      </nav>

      {view === 'blueprint' ? (
        <div className="px-3 lg:px-5 pt-16 pb-4 relative z-10">
          <BlueprintBuilder idea={idea} concept={result} />
        </div>
      ) : view === 'kron' ? (
        <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-20 pb-24 relative z-10">
          <KronTokensPanel onGenerateIdea={(prompt) => generate(prompt)} />
        </div>
      ) : (
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-20 pb-24 relative z-10">

        {/* 02 — Hero */}
        <Section n="02">
          <h1
            className="text-[clamp(1.9rem,6vw,3rem)] font-bold tracking-tight leading-[1.02] mb-4"
            style={{ color: INK, fontFamily: SERIF }}
          >
            What Will You Build?
          </h1>
          <p
            className="text-[15px] max-w-md leading-relaxed mb-4"
            style={{ color: GREY, fontFamily: SERIF }}
          >
            Type any idea or paste a URL — the agent searches the web and shapes it into a full product concept on Kaspa.
          </p>
          <button
            onClick={() => setShowInfo(s => !s)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-60"
            style={{ color: INK, fontFamily: SERIF }}
          >
            <Info className="w-3.5 h-3.5" /> What is Idea Lab?
          </button>
        </Section>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {/* 05 — Additional Details */}
              <div className="pt-8">
                <Section n="05" title="Additional Details">
                  <p className="text-[15px] leading-[1.8]" style={{ color: INK_SOFT, fontFamily: SERIF }}>
                    TTT's <strong>AI-powered brainstorming agent</strong> with <strong>real-time web search</strong>. Type any rough concept or paste a URL — the agent researches competitors, market data, and trends from the live web, then generates a <strong>full product pitch built for the Kaspa ecosystem</strong>. Copy, share to the TTT Feed, or keep iterating.
                  </p>
                </Section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 03 — Input */}
        <div className="mt-10">
          <Section n="03">
            <div
              className="rounded-lg p-5 relative z-20"
              style={{ background: WHITE, border: `1px solid ${INK}` }}
            >
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
                placeholder="Type any idea or URL to research — e.g. 'AI NFT marketplace on Kaspa' or 'https://example.com'…"
                rows={4}
                className="w-full bg-transparent text-[15px] outline-none resize-none leading-relaxed"
                style={{ color: INK, fontFamily: SERIF }}
              />
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  onClick={randomPrompt}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-opacity hover:opacity-60 cursor-pointer"
                  style={{ color: GREY, fontFamily: SERIF, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', cursor: 'pointer', userSelect: 'auto', WebkitUserSelect: 'auto' }}
                >
                  <RefreshCw className="w-3 h-3" /> Surprise me
                </button>
                <button
                  type="button"
                  onClick={generate}
                  disabled={!idea.trim() || generating}
                  className="flex items-center gap-2 h-11 px-6 text-[13px] font-semibold rounded-full transition-colors cursor-pointer"
                  style={{
                    background: (!idea.trim() || generating) ? LINE : INK,
                    color: (!idea.trim() || generating) ? GREY : WHITE,
                    fontFamily: SERIF,
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px',
                    cursor: 'pointer',
                    userSelect: 'auto',
                    WebkitUserSelect: 'auto',
                    position: 'relative',
                    zIndex: 30,
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
          </Section>
        </div>

        {/* Loading */}
        <AnimatePresence>
          {generating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" style={{ color: INK }} />
              <p className="text-[14px] mb-1" style={{ color: INK_SOFT, fontFamily: SERIF }}>Researching kaspa.news, KCC-20 & X.com…</p>
              <p className="text-[12px]" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>Gathering real Kaspa developments, social buzz & market data</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result / Outline */}
        <AnimatePresence>
          {result && !result.error && !generating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              {/* Concept header */}
              <div className="pb-8">
                <p className="text-[12px] font-semibold uppercase mb-3 tracking-[0.18em]" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>Your Concept</p>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2
                      className="text-[clamp(1.7rem,5vw,2.4rem)] font-bold leading-[1.05] mb-3"
                      style={{ color: INK, fontFamily: SERIF }}
                    >
                      {result.name}
                    </h2>
                    <p className="text-[15px] leading-relaxed max-w-lg" style={{ color: GREY, fontFamily: SERIF }}>
                      {result.one_liner}
                    </p>
                  </div>
                  <button
                    onClick={copyResult}
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
                    style={{ border: `1px solid ${INK}` }}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4" style={{ color: INK }} /> : <Copy className="w-4 h-4" style={{ color: INK }} />}
                  </button>
                </div>
              </div>

              <Rule />

              {/* Numbered outline sections */}
              <OutlineRow n="01" label="The Problem" text={result.problem} />
              <OutlineRow n="02" label="The Solution" text={result.solution} />

              {/* Key Features */}
              <div className="py-8">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-[13px] font-semibold tabular-nums" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>03</span>
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: INK, fontFamily: SERIF }}>Key Features</h3>
                </div>
                <div className="space-y-3 pl-0 sm:pl-[2.4rem]">
                  {result.features?.map((f, i) => (
                    <div key={i} className="flex items-baseline gap-3">
                      <span className="text-[13px] font-semibold tabular-nums flex-shrink-0" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[15px] leading-snug" style={{ color: INK_SOFT, fontFamily: SERIF }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Rule />

              <OutlineRow n="04" label="Why Kaspa" text={result.why_kaspa} />
              {result.kaspa_dev && (
                <div className="py-6 pl-0 sm:pl-[2.4rem] -mt-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5" style={{ color: INK, fontFamily: SERIF }}>
                    <Globe className="w-3 h-3" /> Latest Kaspa Dev (KCC-20 · kaspa.news)
                  </p>
                  <p className="text-[14px] leading-[1.8]" style={{ color: INK_SOFT, fontFamily: SERIF }}>{result.kaspa_dev}</p>
                </div>
              )}
              {result.market_research && (
                <OutlineRow n="05" label="Market Research" text={result.market_research} icon={<Sparkles className="w-3 h-3" />} />
              )}
              {result.social_buzz && (
                <OutlineRow n="06" label="Social Buzz (X.com)" text={result.social_buzz} icon={<Twitter className="w-3 h-3" />} />
              )}

              {/* Competitors */}
              {result.competitors && result.competitors.length > 0 && (
                <>
                  <div className="py-8">
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="text-[13px] font-semibold tabular-nums" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>07</span>
                      <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: INK, fontFamily: SERIF }}>Competitors</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-0 sm:pl-[2.4rem]">
                      {result.competitors.map((c, i) => (
                        <span key={i} className="text-[13px] px-3 py-1 rounded-full" style={{ color: INK_SOFT, border: `1px solid ${LINE}`, fontFamily: SERIF }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Rule />
                </>
              )}

              {/* Sources */}
              {result.source_urls && result.source_urls.length > 0 && (
                <>
                  <div className="py-8">
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="text-[13px] font-semibold tabular-nums" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>08</span>
                      <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: INK, fontFamily: SERIF }}>Sources</h3>
                    </div>
                    <div className="space-y-2 pl-0 sm:pl-[2.4rem]">
                      {result.source_urls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] hover:underline transition-opacity" style={{ color: INK, fontFamily: SERIF }}>
                          <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{u}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                  <Rule />
                </>
              )}

              {/* Next Step */}
              <OutlineRow n="09" label="Next Step" text={result.next_step} strong />

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-10">
                <button
                  onClick={() => setView('blueprint')}
                  className="h-11 px-6 text-[13px] font-semibold rounded-full transition-all flex items-center gap-2"
                  style={{ color: WHITE, background: INK, fontFamily: SERIF }}
                >
                  <Layout className="w-3.5 h-3.5" /> Blueprint
                </button>
                <button
                  onClick={() => { setResult(null); setIdea(""); }}
                  className="h-11 px-6 text-[13px] font-semibold rounded-full transition-all"
                  style={{ color: INK, border: `1px solid ${LINE}`, background: WHITE, fontFamily: SERIF }}
                >
                  New Idea
                </button>
                <button
                  onClick={shareToFeed}
                  disabled={sharing || shared}
                  className="h-11 px-6 text-[13px] font-semibold rounded-full transition-all flex items-center gap-2 disabled:opacity-50"
                  style={{ color: INK, border: `1px solid ${INK}`, background: WHITE, fontFamily: SERIF }}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {result?.error && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
            <p className="text-[14px] mb-3" style={{ color: GREY, fontFamily: SERIF }}>Something went wrong.</p>
            <button onClick={generate} className="text-[13px] font-semibold underline underline-offset-2" style={{ color: INK, fontFamily: SERIF }}>
              Try again
            </button>
          </motion.div>
        )}

        {/* 06 — Community Highlights (history) */}
        {history.length > 0 && !generating && !result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12">
            <Rule />
            <div className="pt-8">
              <Section n="06" title="Community Highlights">
                <p className="text-[12px] uppercase tracking-[0.18em] mb-4" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>Recent Projects</p>
                <div className="divide-y" style={{ borderColor: LINE }}>
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { setIdea(h.idea); setResult(h.result); }}
                      className="w-full text-left py-5 flex items-baseline gap-4 transition-opacity hover:opacity-60"
                    >
                      <span className="text-[13px] font-semibold tabular-nums flex-shrink-0" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <div className="text-[16px] font-semibold" style={{ color: INK, fontFamily: SERIF }}>{h.result.name}</div>
                        <div className="text-[13px] mt-0.5 line-clamp-1" style={{ color: GREY, fontFamily: SERIF }}>{h.result.one_liner}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          </motion.div>
        )}

        {/* 04 — Empty state suggestions */}
        {!result && !generating && history.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-12">
            <Rule />
            <div className="pt-8">
              <Section n="04" title="Or start with one of these">
                <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                  {PROMPTS.slice(0, 4).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setIdea(p)}
                      className="text-left py-5 transition-opacity hover:opacity-60 flex items-start gap-3"
                      style={{ borderRight: i % 2 === 0 ? `1px solid ${LINE}` : 'none' }}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ border: `1px solid ${INK}` }}>
                        <Lightbulb className="w-3.5 h-3.5" style={{ color: INK }} />
                      </div>
                      <span className="text-[14px] leading-snug" style={{ color: INK_SOFT, fontFamily: SERIF }}>{p}</span>
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          </motion.div>
        )}
      </div>
      )}

      {/* Kaspanet Browser overlay */}
      {kaspanetOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: WHITE }}>
          <div
            className="flex items-center justify-between gap-2 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: `1px solid ${LINE}` }}
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              <Globe className="w-4 h-4" style={{ color: INK }} />
              <span className="text-[13px] font-semibold hidden sm:inline" style={{ color: INK, fontFamily: SERIF }}>
                Kaspanet
              </span>
            </div>
            <form
              className="flex-1 flex items-center gap-1.5 max-w-xl"
              onSubmit={(e) => { e.preventDefault(); fetchKaspanet(kaspanetUrl); }}
            >
              <input
                type="text"
                value={kaspanetUrl}
                onChange={(e) => setKaspanetUrl(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg text-[12px] outline-none"
                style={{ background: WHITE, color: INK, border: `1px solid ${LINE}`, fontFamily: SERIF }}
                placeholder="Enter URL"
              />
              <button
                type="submit"
                className="flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0 transition-opacity hover:opacity-60"
                style={{ color: INK, border: `1px solid ${INK}` }}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </form>
            <button
              onClick={() => setKaspanetOpen(false)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg flex-shrink-0 transition-opacity hover:opacity-60"
              style={{ color: INK, border: `1px solid ${LINE}` }}
            >
              <X className="w-4 h-4" />
              <span className="text-[12px] font-medium hidden sm:inline" style={{ fontFamily: SERIF }}>Close</span>
            </button>
          </div>
          <div className="flex-1 relative">
            {kaspanetLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: INK }} />
              </div>
            )}
            {kaspanetError && !kaspanetLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                <p className="text-[13px] text-center" style={{ color: INK_SOFT, fontFamily: SERIF }}>
                  Could not load this page.
                </p>
                <a
                  href={kaspanetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12px] font-medium"
                  style={{ color: INK, border: `1px solid ${INK}` }}
                >
                  <ArrowUpRight className="w-4 h-4" /> Open in new tab
                </a>
              </div>
            )}
            {!kaspanetLoading && !kaspanetError && kaspanetHtml && (
              <iframe
                srcDoc={kaspanetHtml}
                title="Kaspanet Browser"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}