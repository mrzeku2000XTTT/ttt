import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw, Home, ExternalLink, Globe, Lock, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

const QUICK_LINKS = [
  { label: "Kaspa News", url: "https://kaspa-app-9cc9fe40.base44.app" },
  { label: "TTTz", url: "https://tttz.xyz" },
  { label: "Explorer", url: "https://explorer.kaspa.org" },
];

const DEFAULT_HOME = "https://kaspa-app-9cc9fe40.base44.app";




export default function AgentBrowserPanel({ url: initialUrl, onAskKai }) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl || DEFAULT_HOME);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([initialUrl || DEFAULT_HOME]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [floatingAnswer, setFloatingAnswer] = useState(null); // { question, answer, loading }
  const iframeRef = useRef(null);
  const panelRef = useRef(null);
  const prevInitialUrl = useRef(initialUrl);

  const askKaiInline = async (question) => {
    setFloatingAnswer({ question, answer: "", loading: true });
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are KAI, a concise AI assistant for the TTT Kaspa platform. Answer this question in 2-3 sentences max. Be helpful and direct.\n\nQuestion: ${question}`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
      });
      setFloatingAnswer({ question, answer: response, loading: false });
    } catch {
      setFloatingAnswer({ question, answer: "Sorry, couldn't get an answer right now. Try again!", loading: false });
    }
  };

  // Sync when parent passes a new URL
  useEffect(() => {
    if (initialUrl && initialUrl !== prevInitialUrl.current) {
      prevInitialUrl.current = initialUrl;
      setCurrentUrl(initialUrl);
      setLoading(true);
      const newHistory = [...history.slice(0, historyIndex + 1), initialUrl];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [initialUrl]);

  const isHttps = currentUrl?.startsWith("https");
  const activeQuickLink = QUICK_LINKS.find(q => {
    try { return currentUrl?.includes(new URL(q.url).hostname); } catch { return false; }
  });

  const navigateTo = (url) => {
    setLoading(true);
    setCurrentUrl(url);
    const newHistory = [...history.slice(0, historyIndex + 1), url];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const i = historyIndex - 1;
      setHistoryIndex(i);
      setCurrentUrl(history[i]);
      setLoading(true);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const i = historyIndex + 1;
      setHistoryIndex(i);
      setCurrentUrl(history[i]);
      setLoading(true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-1.5 py-1.5">
      {/* Browser frame */}
      <div ref={panelRef} className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(18,18,24,0.95)" }}>

        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0"
          style={{ background: "rgba(30,30,38,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={goBack} disabled={historyIndex <= 0}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors">
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button onClick={goForward} disabled={historyIndex >= history.length - 1}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors">
            <ArrowRight className="w-3 h-3" />
          </button>
          <button onClick={() => { setLoading(true); if (iframeRef.current) iframeRef.current.src = currentUrl; }}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <RotateCw className="w-2.5 h-2.5" />
          </button>
          <button onClick={() => navigateTo(DEFAULT_HOME)}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <Home className="w-2.5 h-2.5" />
          </button>

          {/* Address bar */}
          <div className="flex-1 flex items-center gap-1 px-2 py-0.5 rounded-md min-w-0"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {isHttps && <Lock className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />}
            <span className="text-[9px] text-white/45 truncate">{currentUrl}</span>
          </div>

          <a href={currentUrl} target="_blank" rel="noopener noreferrer"
            className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors">
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Loading progress bar */}
        {loading && (
          <div className="h-[2px] w-full overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.02)" }}>
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #06b6d4)", width: "40%" }}
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Iframe — scaled down to fit small panel */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="border-0 absolute top-0 left-0"
            style={{ width: "166.67%", height: "166.67%", transform: "scale(0.6)", transformOrigin: "top left" }}
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Browser"
          />

          {/* Floating KAI answer overlay */}
          <AnimatePresence>
            {floatingAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-2 left-2 right-2 z-10 rounded-xl overflow-hidden"
                style={{
                  background: "rgba(10,10,16,0.92)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(6,182,212,0.3)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-[10px] font-bold text-cyan-400">KAI</span>
                  <button onClick={() => setFloatingAnswer(null)} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white/80">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="px-3 py-2 max-h-[140px] overflow-y-auto scrollbar-hide">
                  <div className="text-[10px] text-white/40 mb-1 truncate">Q: {floatingAnswer.question}</div>
                  {floatingAnswer.loading ? (
                    <div className="flex items-center gap-1.5 text-cyan-400 text-[11px]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Thinking…</span>
                    </div>
                  ) : (
                    <ReactMarkdown
                      className="text-[11px] leading-relaxed text-white/85 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      components={{
                        p: ({ children }) => <p className="my-0.5">{children}</p>,
                        a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">{children}</a>,
                        strong: ({ children }) => <span className="font-semibold text-white">{children}</span>,
                      }}
                    >
                      {floatingAnswer.answer}
                    </ReactMarkdown>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* URL / Search input */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Globe className="w-3 h-3 text-white/25 flex-shrink-0" />
          <input
            type="text"
            placeholder="Ask KAI or enter URL…"
            className="flex-1 bg-transparent text-[11px] text-white/80 outline-none placeholder-white/25"
            style={{ fontSize: "16px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                const val = e.target.value.trim();
                // Direct URLs → navigate in browser
                if (/^https?:\/\//i.test(val) || /^www\./i.test(val) || (/\.\w{2,}/.test(val) && !val.includes(" "))) {
                  let url;
                  if (/^https?:\/\//i.test(val)) url = val;
                  else if (/^www\./i.test(val)) url = `https://${val}`;
                  else url = `https://${val}`;
                  navigateTo(url);
                } else {
                  // Ask KAI inline over the browser
                  askKaiInline(val);
                }
                e.target.value = "";
                e.target.blur();
              }
            }}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-1 flex-wrap">
        {QUICK_LINKS.map((link) => {
          const isActive = activeQuickLink?.url === link.url;
          return (
            <button
              key={link.label}
              onClick={() => navigateTo(link.url)}
              className="px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all hover:scale-105"
              style={{
                background: isActive ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isActive ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: isActive ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.35)",
              }}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}