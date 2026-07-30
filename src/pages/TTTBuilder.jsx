import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, ExternalLink, RefreshCw, Code2, Eye, Zap, Globe, ArrowRight, ChevronRight, GitBranch, CheckCircle, ArrowLeft, Monitor, Smartphone, Server } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import FileExplorer from "@/components/tttbuilder/FileExplorer";
import FileEditor from "@/components/tttbuilder/FileEditor";
import E2BLivePanel from "@/components/tttbuilder/E2BLivePanel";
import ModelSelector from "@/components/tttbuilder/ModelSelector";
import BuildModeToggle from "@/components/tttbuilder/BuildModeToggle";
import { bundleProject, applyFileOps, sortFiles, FILE_OPS_SCHEMA, norm } from "@/components/tttbuilder/projectFiles";

const OUR_REPO = "TTT-Build/ttt-sites";
const ORB_VIDEO = "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/6e804c6dc_Floating_Orb.mp4";

// TTT Agent 1 = strongest available model + elite engineering directive
const TTT_AGENT_1 = "claude_opus_4_8";
const AGENT_1_DIRECTIVE = `

YOU ARE TTT AGENT 1 — the highest tier build agent. Work at the level of a staff engineer shipping production software:
- THINK FIRST: silently decide the data model, the file structure and the component boundaries before writing a line.
- ARCHITECTURE: many small single-purpose files. No file over ~150 lines. Shared logic extracted into its own module. Named, meaningful functions — no giant inline blobs.
- COMPLETENESS: every feature you name in your summary is fully wired — no TODOs, no stubs, no dead handlers, no "coming soon".
- CORRECTNESS: guard every async call, validate inputs, handle empty/loading/error states, avoid race conditions on intervals and fetches, clean up listeners and timers.
- REAL DATA ALWAYS: live APIs over invented numbers, with retry and a visible last-updated state.
- DESIGN: cohesive design system (spacing scale, type scale, tokens), deliberate motion, hover/focus/active states, perfect mobile layout at 375px, no horizontal scroll.
- Ship something a user could put in front of customers today.`;

const EXAMPLES = [
  "Kaspa staking dashboard with live price ticker and animated stats",
  "NFT marketplace with gallery, filters, and wallet connect UI",
  "DeFi protocol app with TVL counter, swap interface, and charts",
  "Crypto portfolio tracker with holdings table and pie chart",
  "Web3 developer portfolio with project cards and contact form",
];

const SYSTEM_PROMPT = `You are TTT Builder — an expert full-stack web developer working in a REAL multi-file project.

FILE SYSTEM RULES — MUST FOLLOW EXACTLY:
- The project is a folder of files. index.html is the entry point and MUST always exist.
- Split the app into proper files, e.g.: index.html, styles/main.css, scripts/app.js, scripts/state.js, data/config.json
- index.html links its files with RELATIVE paths only: <link rel="stylesheet" href="styles/main.css"> and <script src="scripts/app.js"></script>
- NO external CDN <script> or font <link> tags — but fetch() to public APIs DOES work.
- Return in "files" the FULL final content of every file you create or change (never diffs, never partial files, no placeholders like "// rest unchanged")
- Only include files you actually touched. Use "deleted_files" for files that should be removed.
- Keep existing file paths stable when modifying an app — edit those same files instead of renaming them.

TWO PROJECT MODES — pick based on what the user asks for:

A) STATIC MODE (default): vanilla HTML/CSS/JS, no build step. Renders instantly in the Preview tab.
   - No CDN script/font tags and no npm — all code self-contained — but fetch() to public APIs works.

B) REAL PROJECT MODE: use this when the user asks for React, Vue, Svelte, Next, TypeScript, Node/Express, an API, a database, Python, or any real backend.
   - Write a proper npm project: package.json (with all dependencies and a "dev" or "start" script), config files (e.g. vite.config.js), src/ files with real imports/JSX/modules.
   - For frontends use Vite and make the dev script bind publicly: "dev": "vite --host 0.0.0.0 --port 3000"
   - For Node backends listen on port 3000 and host 0.0.0.0.
   - For Python write main.py serving on port 8000, host 0.0.0.0.
   - CDN links and npm packages ARE allowed here — the sandbox has real internet.
   - This mode runs in the Live tab (a real Linux sandbox that runs npm install and starts the server). Tell the user to hit the Live tab to run it.
   - index.html still must exist at the project root (Vite's entry point).

REAL DATA RULE — NEVER FAKE NUMBERS:
- If the app shows real-world data (crypto prices, market caps, weather, sports, news), you MUST fetch it live from a free public CORS-enabled API. Hardcoded/mock prices are a FAILURE.
- Crypto prices/changes: https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,polkadot,kaspa&vs_currencies=usd&include_24hr_change=true
  Charts/history: https://api.coingecko.com/api/v3/coins/{id}/market_chart?vs_currency=usd&days=7
  Map symbols to CoinGecko ids (BTC→bitcoin, ETH→ethereum, SOL→solana, ADA→cardano, DOT→polkadot, KAS→kaspa).
- Refresh with setInterval (e.g. every 30–60s), show a "live" indicator and the last-updated time.
- Handle loading + failure states: skeletons while loading, a visible retry/error message if the request fails. Never silently fall back to invented numbers.
- Only user-owned data (holdings, tasks, settings) may be seeded/persisted locally — value/price columns must be computed from the live prices.

QUALITY BAR — build like a senior product engineer:
- Plan the architecture first, then split it into clean focused files (one concern per file, no 1000-line dumps).
- Real state management, real event handling, no dead buttons — every control does something.
- Polished visual craft: consistent spacing scale, type scale, hover/focus states, empty states, micro-animations, keyboard accessibility.
- Mobile-first responsive: nothing overflows horizontally at 375px width.

CODE RULES:
- Static mode: pure vanilla JavaScript, no frameworks, no build step
- Write ALL styles in CSS files (no Tailwind unless you add it to package.json in real project mode)
- Use CSS custom properties, CSS animations, CSS Grid/Flexbox for beautiful layouts
- Write REAL interactivity: event listeners, DOM manipulation, state variables in JS
- For games: implement full game logic (win detection, turn switching, score tracking, AI if needed)
- For dashboards: fetch real live data on an interval (see REAL DATA RULE), charts drawn with SVG or Canvas
- For apps: full CRUD, local storage persistence, form validation
- Use dark theme with these colors unless user says otherwise: bg #0d1117, accent #70C7BA (Kaspa green), text #e6edf3
- Add CSS animations: keyframes, transitions, hover effects, pulse effects
- Make it fully responsive with media queries
- index.html is a complete <!DOCTYPE html> ... </html> document
- IMPORTANT: The app must render and work immediately — no loading, no missing assets
- Build whatever the user asks, fully functional, beautiful, production quality`;

const MODE_DIRECTIVE = {
  html: `\n\nLOCKED MODE: STATIC MODE (A). The user explicitly chose HTML mode.
- Use ONLY vanilla HTML/CSS/JS. NO package.json, NO npm, NO React/JSX, NO build step.
- index.html at the project root must be a complete document that renders in a sandboxed iframe with no internet.`,
  react: `\n\nLOCKED MODE: REAL PROJECT MODE (B). The user explicitly chose React mode.
- Write a real npm project: package.json (react, react-dom, vite, @vitejs/plugin-react, "dev": "vite --host 0.0.0.0 --port 3000"), vite.config.js, index.html at root, src/main.jsx, src/App.jsx and separate components under src/components/.
- Real ES module imports and JSX. Plain CSS files unless you add a styling package to package.json.
- This renders directly in the Preview tab (compiled in-browser), and can also run in the Live sandbox.`,
};

export default function TTTBuilderPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthLoading(false); }).catch(() => setAuthLoading(false));
  }, []);

  if (authLoading) {
    return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#70C7BA]/40 border-t-[#70C7BA] rounded-full animate-spin" /></div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-center px-5">
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Admin Only</h2>
          <p className="text-white/40 text-sm">TTT Builder is restricted to admins.</p>
        </div>
      </div>
    );
  }

  return <TTTBuilderStudio />;
}

function TTTBuilderStudio() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("preview");
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({ siteName: "", repo: OUR_REPO });
  const iframeRef = useRef(null);
  const chatEndRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [device, setDevice] = useState("desktop"); // desktop | mobile
  const [model, setModel] = useState(() => {
    try { return localStorage.getItem("ttt_builder_model") || "ttt_agent_1"; } catch { return "ttt_agent_1"; }
  });

  const [buildMode, setBuildMode] = useState(() => {
    try { return localStorage.getItem("ttt_builder_mode") || "html"; } catch { return "html"; }
  });

  const changeBuildMode = (m) => {
    setBuildMode(m);
    try { localStorage.setItem("ttt_builder_mode", m); } catch {}
  };

  const changeModel = (m) => {
    setModel(m);
    try { localStorage.setItem("ttt_builder_model", m); } catch {}
  };
  const [mobileView, setMobileView] = useState("preview"); // chat | preview (mobile only)
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // On real phones always show the phone-framed preview
  const effectiveDevice = isNarrow ? "mobile" : device;

  // Persist session across refreshes — real multi-file project
  const [files, setFiles] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ttt_builder_files") || "null");
      if (Array.isArray(saved) && saved.length) return saved;
      const legacy = localStorage.getItem("ttt_builder_html");
      if (legacy) return [{ path: "index.html", content: legacy }];
    } catch {}
    return [];
  });
  const [activePath, setActivePath] = useState("index.html");
  const html = useMemo(() => bundleProject(files), [files]);
  const activeFile = files.find(f => f.path === activePath) || files[0] || null;
  const isRealProject = files.some(f => f.path === "package.json");
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ttt_builder_messages") || "[]"); } catch { return []; }
  });
  const [phase, setPhase] = useState(() => {
    try { return localStorage.getItem("ttt_builder_phase") || "hero"; } catch { return "hero"; }
  });

  useEffect(() => {
    try { localStorage.setItem("ttt_builder_files", JSON.stringify(files)); } catch {}
  }, [files]);

  const updateFile = (path, content) => {
    setFiles(prev => prev.map(f => (f.path === path ? { ...f, content } : f)));
    setIframeKey(k => k + 1);
  };

  const createFile = (path) => {
    setFiles(prev => (prev.some(f => f.path === path) ? prev : sortFiles([...prev, { path, content: "" }])));
    setActivePath(path);
  };

  const deleteFile = (path) => {
    setFiles(prev => prev.filter(f => f.path !== path));
    setActivePath("index.html");
    setIframeKey(k => k + 1);
  };

  useEffect(() => {
    try { localStorage.setItem("ttt_builder_messages", JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem("ttt_builder_phase", phase); } catch {}
  }, [phase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generate = async (userPrompt) => {
    if (!userPrompt.trim() || loading) return;
    setLoading(true);
    setPhase("studio");

    const newMsg = { role: "user", content: userPrompt };
    setMessages(prev => [...prev, newMsg]);
    setPrompt("");

    try {
      const history = [...messages, newMsg]
        .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.role === "assistant" ? "[previous HTML omitted]" : m.content}`)
        .join("\n");

      const projectDump = files.length
        ? `Current project files:\n${files.map(f => `--- FILE: ${f.path} ---\n${f.content.slice(0, 6000)}`).join("\n\n")}`
        : "";

      const isAgent1 = model === "ttt_agent_1";

      const raw = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}${MODE_DIRECTIVE[buildMode] || ""}${isAgent1 ? AGENT_1_DIRECTIVE : ""}

${files.length > 0 ? `Previous conversation:\n${history}\n\n${projectDump}\n\nUser wants to MODIFY this project:` : "User wants to BUILD a new project:"}
${userPrompt}

Return the file operations only.`,
        model: isAgent1 ? TTT_AGENT_1 : model,
        response_json_schema: FILE_OPS_SCHEMA,
      });

      // Some models wrap their structured output in a `response` key (or return it as a JSON string)
      let result = raw;
      if (result && !Array.isArray(result.files) && result.response !== undefined) {
        result = typeof result.response === "string"
          ? JSON.parse(result.response.replace(/^```(?:json)?|```$/g, "").trim())
          : result.response;
      }

      const nextFiles = applyFileOps(files, result);
      if (!nextFiles.length) throw new Error("The model returned no files. Try rephrasing your prompt.");
      const isNpm = nextFiles.some(f => f.path === "package.json");
      // Only static projects need a root index.html — npm projects run through the Live sandbox
      if (!isNpm && !nextFiles.some(f => f.path === "index.html")) {
        throw new Error("The model didn't return an index.html. Try again.");
      }

      setFiles(nextFiles);
      const touched = (result?.files || []).map(f => norm(f.path));
      setActivePath(touched.includes("index.html") ? "index.html" : touched[0] || "index.html");
      setIframeKey(k => k + 1);
      // npm projects auto-run their real sandbox right inside the Preview tab
      setTab("preview");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `✅ ${result?.summary || "Project updated."}${touched.length ? `\n\n📁 ${touched.join("\n📁 ")}` : ""}`,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ Generation failed: ${err?.message || "unknown error"}\n\nTip: big multi-file projects work best with a shorter, more specific prompt.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (ex) => {
    setPrompt(ex);
    generate(ex);
  };

  const publishToGitHub = async () => {
    if (!html || !publishForm.siteName.trim()) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await base44.functions.invoke("publishToGitHub", {
        html,
        siteName: publishForm.siteName.trim(),
        repo: publishForm.repo.trim() || OUR_REPO,
      });
      setPublishResult({ success: true, ...res.data });
    } catch (err) {
      setPublishResult({ success: false, error: err.message });
    } finally {
      setPublishing(false);
    }
  };

  const downloadHtml = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ttt-site.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white overflow-x-hidden">

      {/* Top nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/AppStoreV2")} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors mr-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Back</span>
          </button>
          <span className="font-black text-lg tracking-tight">TTT</span>
          <span className="text-[10px] font-bold bg-[#70C7BA] text-black px-1.5 py-0.5 rounded">BUILDER</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-white/50">
          <span>Built on Kaspa</span>
        </div>
        {html && (
          <button
            onClick={downloadHtml}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#70C7BA]/20 border border-[#70C7BA]/40 text-[#70C7BA] text-xs font-bold hover:bg-[#70C7BA]/30 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Export HTML
          </button>
        )}
      </nav>

      <AnimatePresence mode="wait">
        {phase === "hero" ? (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex flex-col items-center justify-center px-5 pt-12"
          >
            {/* Glow bg */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#70C7BA]/10 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] bg-purple-500/8 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-3xl mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#70C7BA]/30 bg-[#70C7BA]/10 text-[#70C7BA] text-xs font-bold mb-6"
              >
                <Zap className="w-3 h-3" />
                AI Site Builder for Kaspa
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.02] mb-5"
              >
                Build your site.
                <br />
                <span className="bg-gradient-to-r from-[#70C7BA] to-cyan-300 bg-clip-text text-transparent">
                  Ship it now.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/50 text-lg max-w-xl mx-auto mb-10"
              >
                Describe what you want. TTT Builder generates a complete, beautiful landing page — no code needed.
              </motion.p>

              {/* Main input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="relative max-w-2xl mx-auto"
              >
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 focus-within:border-[#70C7BA]/50 rounded-2xl p-2 transition-colors shadow-2xl">
                  <input
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && generate(prompt)}
                    placeholder="Describe your app — e.g. 'Kaspa staking dashboard with live stats and wallet connect'"
                    className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30 text-sm px-3 py-3"
                  />
                  <button
                    onClick={() => generate(prompt)}
                    disabled={!prompt.trim() || loading}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#70C7BA] text-black font-bold text-sm hover:bg-[#70C7BA]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Build</>}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <BuildModeToggle value={buildMode} onChange={changeBuildMode} disabled={loading} />
                  <ModelSelector value={model} onChange={changeModel} disabled={loading} />
                </div>
              </motion.div>

              {/* Examples */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-6 flex flex-wrap gap-2 justify-center"
              >
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleExampleClick(ex)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {ex.slice(0, 40)}…
                  </button>
                ))}
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-16 flex items-center justify-center gap-8 text-center"
              >
                {[
                  { label: "Generation time", value: "~15s" },
                  { label: "AI model", value: "Claude" },
                  { label: "Output", value: "Pure HTML" },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-black text-[#70C7BA]">{s.value}</div>
                    <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-12 h-screen flex flex-col"
          >
            {/* Mobile view toggle */}
            <div className="lg:hidden flex items-center gap-1 px-3 py-2 border-b border-white/5 bg-[#0d1117] flex-shrink-0">
              <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 w-full">
                <button
                  onClick={() => setMobileView("chat")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-colors ${mobileView === "chat" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Chat
                </button>
                <button
                  onClick={() => setMobileView("preview")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-colors ${mobileView === "preview" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
              </div>
            </div>

            {/* Studio layout */}
            <div className="flex-1 grid lg:grid-cols-[380px_1fr] min-h-0 w-full max-w-full overflow-hidden">

              {/* Left: Chat */}
              <div className={`flex flex-col border-r border-white/5 min-h-0 min-w-0 overflow-hidden bg-[#0d1117] ${mobileView === "chat" ? "flex" : "hidden"} lg:flex`}>
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <video
                    src={ORB_VIDEO}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-[#70C7BA]/40 shadow-[0_0_16px_rgba(112,199,186,0.45)]"
                    aria-label="TTT Builder agent orb"
                  />
                  <span className="font-bold text-sm">TTT Builder</span>
                  <button
                    onClick={() => {
                      setFiles([]); setMessages([]); setPhase("hero"); setActivePath("index.html");
                      try { localStorage.removeItem("ttt_builder_files"); localStorage.removeItem("ttt_builder_html"); localStorage.removeItem("ttt_builder_messages"); localStorage.removeItem("ttt_builder_phase"); } catch {}
                    }}
                    className="ml-auto text-[10px] text-white/30 hover:text-white/70 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                  >
                    + New
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-white/30 text-xs">
                      Generating your site…
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-[#70C7BA]/20 text-white"
                          : "bg-white/5 text-white/80"
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Building your site…
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t border-white/5">
                  <form
                    onSubmit={e => { e.preventDefault(); generate(prompt); }}
                    className="flex items-center gap-2 bg-white/[0.04] border border-white/10 focus-within:border-[#70C7BA]/40 rounded-xl pl-3 pr-1.5 py-1.5"
                  >
                    <input
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Modify or rebuild…"
                      disabled={loading}
                      className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30 text-sm py-1.5"
                    />
                    <button
                      type="submit"
                      disabled={loading || !prompt.trim()}
                      className="w-8 h-8 rounded-lg bg-[#70C7BA] text-black flex items-center justify-center disabled:opacity-30 hover:bg-[#70C7BA]/90 transition-colors"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <BuildModeToggle value={buildMode} onChange={changeBuildMode} disabled={loading} />
                    <ModelSelector value={model} onChange={changeModel} disabled={loading} />
                  </div>

                  {/* Quick actions */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Make it darker", "Add pricing section", "More animations", "Add contact form"].map(action => (
                      <button
                        key={action}
                        onClick={() => generate(action)}
                        disabled={loading || !html}
                        className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Preview / Code */}
              <div className={`flex flex-col min-h-0 min-w-0 overflow-hidden bg-[#080c10] ${mobileView === "preview" ? "flex" : "hidden"} lg:flex`}>
                {/* Tab bar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 flex-shrink-0 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 flex-shrink-0">
                    <button
                      onClick={() => setTab("preview")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${tab === "preview" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button
                      onClick={() => setTab("code")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${tab === "code" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                    >
                      <Code2 className="w-3 h-3" /> Files{files.length ? ` (${files.length})` : ""}
                    </button>
                    <button
                      onClick={() => setTab("live")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${tab === "live" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                    >
                      <Server className="w-3 h-3" /> Live
                    </button>
                  </div>
                  <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    {html && (
                      <>
                        <div className="hidden lg:flex gap-1 bg-white/5 rounded-lg p-0.5 flex-shrink-0">
                          <button
                            onClick={() => setDevice("desktop")}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors ${device === "desktop" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                            title="Desktop preview"
                          >
                            <Monitor className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDevice("mobile")}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors ${device === "mobile" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                            title="Mobile preview"
                          >
                            <Smartphone className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => generate("Regenerate with the same concept but different design")}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-colors flex-shrink-0 whitespace-nowrap"
                        >
                          <RefreshCw className="w-3 h-3" /> Remix
                        </button>
                        <button
                          onClick={downloadHtml}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-colors flex-shrink-0 whitespace-nowrap"
                        >
                          <Globe className="w-3 h-3" /> Export
                        </button>
                        <button
                          onClick={() => { setShowPublishModal(true); setPublishResult(null); }}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-[#70C7BA]/20 border border-[#70C7BA]/40 text-[#70C7BA] text-xs font-bold hover:bg-[#70C7BA]/30 transition-colors flex-shrink-0 whitespace-nowrap"
                        >
                          <GitBranch className="w-3 h-3" /> Publish
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 relative">
                  {!html && !loading && tab !== "live" && !isRealProject && (
                    <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                      <div>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#70C7BA]/10 border border-[#70C7BA]/20 flex items-center justify-center">
                          <Globe className="w-8 h-8 text-[#70C7BA]/60" />
                        </div>
                        <p className="text-white/30 text-sm">
                          {isRealProject
                            ? "This npm project needs a server — open the Live tab to run it."
                            : "Your site preview will appear here"}
                        </p>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <div className="absolute inset-0 rounded-full border-2 border-[#70C7BA]/20 animate-ping" />
                          <div className="absolute inset-2 rounded-full border-2 border-t-[#70C7BA] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                          <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-[#70C7BA]" />
                        </div>
                        <p className="text-white/50 text-sm font-medium">Building your site…</p>
                        <p className="text-white/25 text-xs mt-1">Claude is writing the code</p>
                      </div>
                    </div>
                  )}

                  {/* Real npm projects run in the cloud sandbox, streamed straight into Preview */}
                  {tab === "preview" && isRealProject && !loading && (
                    <E2BLivePanel files={files} autoStart />
                  )}

                  {html && tab === "preview" && !isRealProject && (
                    effectiveDevice === "desktop" ? (
                      <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        srcDoc={html}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        className="w-full h-full border-0"
                        style={{ display: loading ? "none" : "block" }}
                        title="Site Preview"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden" style={{ display: loading ? "none" : "flex" }}>
                        <div className="relative h-full max-h-full aspect-[9/19] max-w-full mx-auto">
                          <div className="absolute inset-0 rounded-[2rem] bg-white/5 border border-white/15 pointer-events-none" />
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-white/10 rounded-b-xl z-10 pointer-events-none" />
                          <iframe
                            key={iframeKey}
                            ref={iframeRef}
                            srcDoc={html}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            className="relative w-full h-full rounded-[1.6rem] border border-white/15 overflow-hidden bg-black"
                            title="Site Preview (Mobile)"
                          />
                        </div>
                      </div>
                    )
                  )}

                  {tab === "code" && !loading && (
                    <div className="absolute inset-0 flex min-h-0">
                      <FileExplorer
                        files={files}
                        activePath={activeFile?.path}
                        onSelect={setActivePath}
                        onCreate={createFile}
                        onDelete={deleteFile}
                      />
                      <FileEditor file={activeFile} onChange={updateFile} />
                    </div>
                  )}

                  {tab === "live" && <E2BLivePanel files={files} />}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish to GitHub Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={(e) => e.target === e.currentTarget && setShowPublishModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#161b22] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-2 mb-5">
                <GitBranch className="w-5 h-5 text-[#70C7BA]" />
                <h2 className="font-bold text-white text-base">Publish to GitHub</h2>
              </div>

              {!publishResult ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Site name <span className="text-white/30">(used as folder name)</span></label>
                    <input
                      value={publishForm.siteName}
                      onChange={e => setPublishForm(f => ({ ...f, siteName: e.target.value }))}
                      placeholder="my-kaspa-site"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#70C7BA]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">GitHub repo <span className="text-white/30">(owner/repo-name)</span></label>
                    <input
                      value={publishForm.repo || OUR_REPO}
                      onChange={e => setPublishForm(f => ({ ...f, repo: e.target.value }))}
                      placeholder={OUR_REPO}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#70C7BA]/50"
                    />
                  </div>
                  <p className="text-[11px] text-white/30">
                    The HTML will be pushed to <code className="text-[#70C7BA]/70">sites/[sitename]/index.html</code> in <code className="text-[#70C7BA]/70">{OUR_REPO}</code>. Enable GitHub Pages to get a live URL.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowPublishModal(false)}
                      className="flex-1 h-10 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={publishToGitHub}
                      disabled={publishing || !publishForm.siteName.trim()}
                      className="flex-1 h-10 rounded-xl bg-[#70C7BA] text-black text-sm font-bold hover:bg-[#70C7BA]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      {publishing ? <><Loader2 className="w-4 h-4 animate-spin" /> Pushing…</> : <><GitBranch className="w-4 h-4" /> Push to GitHub</>}
                    </button>
                  </div>
                </div>
              ) : publishResult.success ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-10 h-10 text-[#70C7BA] mx-auto mb-3" />
                  <p className="font-bold text-white mb-1">Published successfully!</p>
                  <p className="text-xs text-white/40 mb-4">Your site has been pushed to GitHub.</p>
                  <div className="space-y-2 text-left">
                    <a href={publishResult.htmlUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#70C7BA] hover:underline">
                      <GitBranch className="w-3.5 h-3.5" /> View on GitHub
                    </a>
                    <a href={publishResult.pagesUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#70C7BA] hover:underline">
                      <Globe className="w-3.5 h-3.5" /> GitHub Pages URL
                    </a>
                  </div>
                  <button onClick={() => setShowPublishModal(false)} className="mt-5 w-full h-9 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors">
                    Close
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-400 font-bold mb-2">Push failed</p>
                  <p className="text-xs text-white/40 mb-4">{publishResult.error}</p>
                  <button onClick={() => setPublishResult(null)} className="w-full h-9 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors">
                    Try again
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}