import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, ExternalLink, RefreshCw, Code2, Eye, Zap, Globe, ArrowRight, ChevronRight, GitBranch, CheckCircle, ArrowLeft, Monitor, Smartphone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

const OUR_REPO = "TTT-Build/ttt-sites";

const EXAMPLES = [
  "Kaspa staking dashboard with live price ticker and animated stats",
  "NFT marketplace with gallery, filters, and wallet connect UI",
  "DeFi protocol app with TVL counter, swap interface, and charts",
  "Crypto portfolio tracker with holdings table and pie chart",
  "Web3 developer portfolio with project cards and contact form",
];

const SYSTEM_PROMPT = `You are TTT Builder — an expert full-stack web developer. Generate a COMPLETE, fully interactive web application as a SINGLE self-contained HTML file.

CRITICAL RULES — MUST FOLLOW EXACTLY:
- Output ONLY raw HTML — no markdown, no code fences, no explanation, no \`\`\`html wrapper
- NO external CDN scripts — the iframe has NO internet access. Everything must be inline.
- Write ALL logic in pure vanilla JavaScript inside <script> tags
- Write ALL styles in <style> tags using CSS (no Tailwind, no external CSS)
- The app must be 100% self-contained — zero external dependencies
- Use CSS custom properties, CSS animations, CSS Grid/Flexbox for beautiful layouts
- Write REAL interactivity: event listeners, DOM manipulation, state variables in JS
- For games: implement full game logic (win detection, turn switching, score tracking, AI if needed)
- For dashboards: use setInterval for live-updating mock data, charts drawn with SVG or Canvas
- For apps: full CRUD, local storage persistence, form validation
- Use dark theme with these colors unless user says otherwise: bg #0d1117, accent #70C7BA (Kaspa green), text #e6edf3
- Add CSS animations: keyframes, transitions, hover effects, pulse effects
- Make it fully responsive with media queries
- Structure: complete <!DOCTYPE html> ... </html> document
- IMPORTANT: The HTML must render and work immediately — no loading, no missing assets
- For a tic tac toe game example: implement the board, X/O turns, win detection, restart button, score tracker — all working
- Build whatever the user asks, fully functional, beautiful, production quality`;

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
  const [mobileView, setMobileView] = useState("preview"); // chat | preview (mobile only)

  // Persist session across refreshes
  const [html, setHtml] = useState(() => {
    try { return localStorage.getItem("ttt_builder_html") || ""; } catch { return ""; }
  });
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ttt_builder_messages") || "[]"); } catch { return []; }
  });
  const [phase, setPhase] = useState(() => {
    try { return localStorage.getItem("ttt_builder_phase") || "hero"; } catch { return "hero"; }
  });

  useEffect(() => {
    try { localStorage.setItem("ttt_builder_html", html); } catch {}
  }, [html]);

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

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

${messages.length > 0 ? `Previous conversation:\n${history}\n\nUser wants to MODIFY the existing page:` : "User wants to BUILD a new page:"}
${userPrompt}

${html && messages.length > 0 ? `Here is the current HTML to modify:\n${html.slice(0, 8000)}` : ""}

Output ONLY the complete HTML — nothing else.`,
        model: "claude_sonnet_4_6",
      });

      const generated = typeof result === "string" ? result : result?.html || result?.code || JSON.stringify(result);
      // Strip any markdown fences Claude might add
      const cleaned = generated
        .replace(/^```html\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      setHtml(cleaned);
      setIframeKey(k => k + 1);
      setMessages(prev => [...prev, { role: "assistant", content: "✅ Site generated! You can see the preview on the right. Ask me to change anything." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Generation failed. Try again or rephrase your prompt." }]);
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
          <span>Vanilla JS · CSS · Claude</span>
          <span>·</span>
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
            <div className="flex-1 grid lg:grid-cols-[380px_1fr] min-h-0">

              {/* Left: Chat */}
              <div className={`flex flex-col border-r border-white/5 min-h-0 bg-[#0d1117] ${mobileView === "chat" ? "flex" : "hidden"} lg:flex`}>
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#70C7BA] to-cyan-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span className="font-bold text-sm">TTT Builder</span>
                  <button
                    onClick={() => {
                      setHtml(""); setMessages([]); setPhase("hero");
                      try { localStorage.removeItem("ttt_builder_html"); localStorage.removeItem("ttt_builder_messages"); localStorage.removeItem("ttt_builder_phase"); } catch {}
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
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
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
              <div className={`flex flex-col min-h-0 bg-[#080c10] ${mobileView === "preview" ? "flex" : "hidden"} lg:flex`}>
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
                      <Code2 className="w-3 h-3" /> Code
                    </button>
                  </div>
                  <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    {html && (
                      <>
                        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 flex-shrink-0">
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
                  {!html && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                      <div>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#70C7BA]/10 border border-[#70C7BA]/20 flex items-center justify-center">
                          <Globe className="w-8 h-8 text-[#70C7BA]/60" />
                        </div>
                        <p className="text-white/30 text-sm">Your site preview will appear here</p>
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

                  {html && tab === "preview" && (
                    device === "desktop" ? (
                      <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        srcDoc={html}
                        sandbox="allow-scripts"
                        className="w-full h-full border-0"
                        style={{ display: loading ? "none" : "block" }}
                        title="Site Preview"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4" style={{ display: loading ? "none" : "flex" }}>
                        <div className="relative w-full h-full max-w-[390px] max-h-[780px] mx-auto">
                          <div className="absolute -inset-[6px] rounded-[2.2rem] bg-white/5 border border-white/15 pointer-events-none" />
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-white/10 rounded-b-xl z-10 pointer-events-none" />
                          <iframe
                            key={iframeKey}
                            ref={iframeRef}
                            srcDoc={html}
                            sandbox="allow-scripts"
                            className="relative w-full h-full rounded-[1.8rem] border border-white/15 overflow-hidden bg-black"
                            title="Site Preview (Mobile)"
                          />
                        </div>
                      </div>
                    )
                  )}

                  {html && tab === "code" && !loading && (
                    <div className="h-full overflow-auto">
                      <pre className="p-4 text-[11px] font-mono text-green-300/80 whitespace-pre-wrap leading-relaxed">
                        {html}
                      </pre>
                    </div>
                  )}
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