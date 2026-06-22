import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Send, ChevronDown, Lock, Unlock, Eye, Cpu, FlaskConical, Play, Pause, Music2 } from "lucide-react";

const ORB_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4af893ff9_generated_image.png";
const CORNER_ART = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8b62e8d8d_generated_image.png";
const YOUTUBE_VIDEO_ID = "aUSD-WFhKwY";

// "The Dollar Is Dying" by Kas Tunes — full lyrics
const SONG_LYRICS = [
  { line: "The dollar is dying, Bitcoin can't scale," },
  { line: "Gold is too heavy, Solana transactions fail." },
  { line: "I've tried them all and I must confess —" },
  { line: "Kaspa is the best money." },
  { line: "" },
  { line: "Bitcoin can't scale, Solana is down again," },
  { line: "Ethereum gas fees and scaling solutions went." },
  { line: "Shiny objects flash and making me sick," },
  { line: "Token unlocks flood — I burns out quick." },
  { line: "Markets pumping, dump it's a gambler's dream," },
  { line: "Whales are running like a whale of your machine." },
  { line: "Your favorite influencer's changing up the profile pic," },
  { line: "They say we're still early — better aping quick." },
  { line: "The more things change the more they stay the same," },
  { line: "Shields make back-room deals, playing the same old game." },
  { line: "They get in with half the supply," },
  { line: "Never see screenshots of losses — I wonder why." },
  { line: "Will history repeat or maybe it will rhyme?" },
  { line: "So-called safe native tokens promising now landed shape py." },
  { line: "They're backed by your basket of tier-one top Ponzi picks," },
  { line: "The liquidity will dry into the next bear market." },
  { line: "" },
  { line: "The dollar is dying, Bitcoin can't scale," },
  { line: "Gold is too heavy, Solana transactions fail." },
  { line: "I've tried them all and I must confess —" },
  { line: "Kaspa is the best money." },
  { line: "" },
  { line: "When the fiat falls and the market screams," },
  { line: "Central banks crumble chasing broken dreams." },
  { line: "The dollar's a ghost, it's a valueless race," },
  { line: "Print up another trillion, watch them hyperinflate." },
  { line: "Got the centralized power at that 3% fee," },
  { line: "But now your bank account's frozen, no biometric ID." },
  { line: "Welcome to FI 2.0 — central bank CBDC." },
  { line: "If you want your payment to process, take down that hateful tweet." },
  { line: "Can't afford the rent? Well baby, don't cry," },
  { line: "Here comes the government's universal basic lie." },
  { line: "If your social credit score's approved they will provide," },
  { line: "Your 15-minute prison sentence — there for life." },
  { line: "They'll tax the air you breathe, tax everything you need," },
  { line: "Slavery with more steps — control's their only creed." },
  { line: "They'll feed you cricket flour and 3D printed meat," },
  { line: "Declare too big to fail if Ponzi coin's on the balance sheet." },
  { line: "" },
  { line: "The dollar is dying, Bitcoin can't scale," },
  { line: "Gold is too heavy, Solana transactions fail." },
  { line: "I tried them all and I must confess —" },
  { line: "Kaspa is the best money." },
  { line: "" },
  { line: "The speed blew my mind, scalability defined." },
  { line: "Kaspa is the future — leave the fiat life behind." },
  { line: "The system is rigged, starting to crack," },
  { line: "But I ain't tripping 'cause Kaspa's got my back." },
  { line: "They're watching us bleed, trying to stack the deck," },
  { line: "Maybe decentralized proof of work keeps the crooks in check." },
  { line: "No CEO chains, no centralized control," },
  { line: "Digital freedom for everyone to hold." },
  { line: "Digital cash — Kaspa's got the vision," },
  { line: "No blocks, no wasted energy, just raw precision." },
  { line: "Crypto's always in the code," },
  { line: "Kaspa community the best — settle up and run." },
  { line: "No more middleman taking cuts," },
  { line: "Kaspa's future-proof — DAGnight is waking up." },
  { line: "The hype train's derailed but Kaspa's still on track," },
  { line: "Like a phoenix from the ashes — we're coming back." },
  { line: "" },
  { line: "The dollar is dying, Bitcoin can't scale," },
  { line: "Gold is too heavy, Solana transactions fail." },
  { line: "I've tried them all and I must confess —" },
  { line: "Kaspa is the best money." },
  { line: "" },
  { line: "Dollar is… dollar is… dollar is dying." },
];

const AI_MODELS = [
  { id: "claude_opus_4_8", label: "Claude Opus 4.8", maker: "Anthropic", color: "#c084fc" },
  { id: "claude_sonnet_4_6", label: "Claude Sonnet 4.6", maker: "Anthropic", color: "#a78bfa" },
  { id: "gpt_5_5", label: "GPT-5.5", maker: "OpenAI", color: "#6ee7b7" },
  { id: "gpt_5_4", label: "GPT-5.4", maker: "OpenAI", color: "#34d399" },
  { id: "gemini_3_1_pro", label: "Gemini 3.1 Pro", maker: "Google", color: "#60a5fa" },
  { id: "gemini_3_flash", label: "Gemini 3 Flash", maker: "Google", color: "#93c5fd" },
];

// Simple XOR-based "encryption" for display — dramatic effect
function encryptMessage(text, key = 42) {
  return btoa(text.split("").map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ ((key + i) % 127 || 1))).join(""));
}
function decryptMessage(encoded, key = 42) {
  try {
    const raw = atob(encoded);
    return raw.split("").map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ ((key + i) % 127 || 1))).join("");
  } catch { return "[decryption failed]"; }
}

const ENCRYPTED_MESSAGES_KEY = "orbt_encrypted_msgs";

function loadMessages() {
  try { return JSON.parse(localStorage.getItem(ENCRYPTED_MESSAGES_KEY) || "[]"); } catch { return []; }
}
function saveMessages(msgs) {
  try { localStorage.setItem(ENCRYPTED_MESSAGES_KEY, JSON.stringify(msgs.slice(-20))); } catch {}
}

// ── Left corner: AI Agent chat ──
function AIAgentPanel({ onClose }) {
  const [model, setModel] = useState(AI_MODELS[0]);
  const [showModels, setShowModels] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello. I am the Watcher. Ask me anything — or decrypt a researcher message below." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [encryptedMsgs, setEncryptedMsgs] = useState(loadMessages);
  const [decryptedMap, setDecryptedMap] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Poll for new encrypted messages
  useEffect(() => {
    const interval = setInterval(() => {
      const msgs = loadMessages();
      setEncryptedMsgs(msgs);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a mysterious, poetic AI called the Watcher. Be helpful but slightly enigmatic. Model requested: ${model.label}.\n\nConversation so far:\n${messages.map(m => `${m.role}: ${m.content}`).join("\n")}\nuser: ${userMsg.content}\nassistant:`,
        model: model.id,
      });
      setMessages(prev => [...prev, { role: "assistant", content: typeof res === "string" ? res : JSON.stringify(res) }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "The signal was lost. Try again." }]);
    }
    setLoading(false);
  };

  const decrypt = (msg) => {
    const plain = decryptMessage(msg.cipher);
    setDecryptedMap(prev => ({ ...prev, [msg.id]: plain }));
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.85, x: -20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.85, x: -20 }}
      className="fixed left-3 top-3 z-50 flex flex-col"
      style={{ width: "min(92vw, 360px)", maxHeight: "85vh", background: "rgba(10,8,20,0.97)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 2, fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(167,139,250,0.15)" }}>
        <Cpu className="w-4 h-4" style={{ color: "#a78bfa" }} />
        <span className="text-xs font-bold tracking-wider" style={{ color: "#a78bfa" }}>THE WATCHER</span>
        <div className="ml-auto flex items-center gap-1.5">
          {/* Model picker */}
          <div className="relative">
            <button onClick={() => setShowModels(!showModels)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold"
              style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: model.color, borderRadius: 2 }}>
              {model.label.split(" ")[0]} <ChevronDown className="w-2.5 h-2.5" />
            </button>
            <AnimatePresence>
              {showModels && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-1 z-60 py-1"
                  style={{ background: "rgba(10,8,20,0.99)", border: "1px solid rgba(167,139,250,0.3)", minWidth: 180, borderRadius: 2 }}>
                  {AI_MODELS.map(m => (
                    <button key={m.id} onClick={() => { setModel(m); setShowModels(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                      <div>
                        <div className="text-[11px] font-semibold" style={{ color: model.id === m.id ? m.color : "rgba(255,255,255,0.75)" }}>{m.label}</div>
                        <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{m.maker}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.3)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] px-3 py-2 text-[12px] leading-relaxed"
              style={{
                background: m.role === "user" ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${m.role === "user" ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.07)"}`,
                color: m.role === "user" ? "#e9d5ff" : "rgba(255,255,255,0.75)",
                borderRadius: 2,
              }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#a78bfa", animationDelay: `${i*0.12}s` }} />)}
              </div>
            </div>
          </div>
        )}

        {/* Encrypted messages from researcher */}
        {encryptedMsgs.length > 0 && (
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-[9px] tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>// RESEARCHER TRANSMISSIONS</div>
            {encryptedMsgs.map(msg => (
              <div key={msg.id} className="mb-2 p-2" style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 2 }}>
                <div className="text-[10px] font-mono mb-1.5" style={{ color: "rgba(6,182,212,0.5)", wordBreak: "break-all" }}>
                  {msg.cipher.slice(0, 40)}…
                </div>
                {decryptedMap[msg.id] ? (
                  <div className="text-[11px]" style={{ color: "#67e8f9" }}>
                    <Unlock className="w-3 h-3 inline mr-1" style={{ color: "#22d3ee" }} />
                    {decryptedMap[msg.id]}
                  </div>
                ) : (
                  <button onClick={() => decrypt(msg)}
                    className="flex items-center gap-1.5 text-[10px] font-semibold transition-all hover:opacity-80"
                    style={{ color: "#22d3ee" }}>
                    <Lock className="w-3 h-3" /> Decrypt transmission
                  </button>
                )}
                <div className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.15)" }}>{new Date(msg.ts).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 flex gap-2" style={{ borderTop: "1px solid rgba(167,139,250,0.12)" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask the watcher..."
          className="flex-1 px-3 py-2 text-[12px] outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)", color: "rgba(255,255,255,0.8)", borderRadius: 2, caretColor: "#a78bfa", fontFamily: "system-ui, sans-serif" }} />
        <button onClick={send} disabled={loading || !input.trim()}
          className="w-8 h-8 flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
          style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 2 }}>
          <Send className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Right corner: Researcher — sends encrypted messages ──
const RESEARCHER_TRANSMISSIONS = [
  "The signal from DAG block 94729382 contains an anomaly.",
  "Kaspa hashrate crossed 1 exahash. Something is watching.",
  "Three wallets moved simultaneously at 03:17 UTC. Coincidence?",
  "The GHOSTDAG protocol mirrors a biological neural firing pattern.",
  "Entropy in the mempool spiked 40% before the last halving.",
  "A dormant address from 2021 just woke up. It holds 888,888 KAS.",
  "The confirmation time variance follows a Fibonacci sequence.",
  "Block 0 holds a message no one has decoded yet.",
  "At current growth, Kaspa's TPS will surpass Visa by 2027.",
  "Someone is running a node from coordinates 0,0. No city matches.",
];

function ResearcherPanel({ onClose }) {
  const [sent, setSent] = useState(false);
  const [lastMsg, setLastMsg] = useState("");

  const transmit = () => {
    const plain = RESEARCHER_TRANSMISSIONS[Math.floor(Math.random() * RESEARCHER_TRANSMISSIONS.length)];
    const cipher = encryptMessage(plain);
    const msg = { id: Date.now().toString(), cipher, ts: Date.now() };
    const existing = loadMessages();
    saveMessages([...existing, msg]);
    setLastMsg(cipher);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.85, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.85, x: 20 }}
      className="fixed right-3 top-3 z-50 flex flex-col"
      style={{ width: "min(88vw, 300px)", background: "rgba(6,20,20,0.97)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 2, fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(6,182,212,0.12)" }}>
        <FlaskConical className="w-4 h-4" style={{ color: "#22d3ee" }} />
        <span className="text-xs font-bold tracking-wider" style={{ color: "#22d3ee" }}>RESEARCHER</span>
        <button onClick={onClose} className="ml-auto w-6 h-6 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 py-5">
        <p className="text-[11px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          This node conducts silent research. One tap transmits an encrypted finding to the Watcher.
        </p>
        <p className="text-[10px] mb-5 tracking-wider" style={{ color: "rgba(6,182,212,0.4)" }}>
          // NO PLAINTEXT IS STORED HERE
        </p>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={transmit}
          className="w-full py-3 text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
          style={{ background: sent ? "rgba(34,211,238,0.12)" : "rgba(6,182,212,0.07)", border: `1px solid ${sent ? "#22d3ee" : "rgba(6,182,212,0.3)"}`, color: sent ? "#22d3ee" : "rgba(6,182,212,0.6)", borderRadius: 2 }}>
          <Lock className="w-3.5 h-3.5" />
          {sent ? "TRANSMISSION SENT ✓" : "TRANSMIT ENCRYPTED FINDING"}
        </motion.button>

        {sent && lastMsg && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-2"
            style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 2 }}>
            <div className="text-[9px] font-mono break-all" style={{ color: "rgba(6,182,212,0.4)" }}>{lastMsg.slice(0, 60)}…</div>
            <div className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Decrypt with The Watcher ↙</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Apple-style music player popup with lyrics ──
function MusicPlayer({ isPlaying, onToggle, onEnter }) {
  const [scrolled, setScrolled] = useState(false);
  const lyricsRef = useRef(null);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6"
    >
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(0,0,0,0.06)" }}>

        {/* Now playing bar */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)" }}>
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-slate-900 truncate">The Dollar Is Dying</div>
            <div className="text-[11px] text-slate-500 truncate">Kas Tunes · Crypto Hip-Hop</div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggle}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: "rgba(0,0,0,0.08)" }}>
            {isPlaying
              ? <Pause className="w-4 h-4 text-slate-800" />
              : <Play className="w-4 h-4 text-slate-800 ml-0.5" />}
          </motion.button>
        </div>

        {/* Progress bar — decorative */}
        <div className="px-4 pb-3">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #f97316, #ec4899)" }}
              animate={{ width: isPlaying ? "100%" : "35%" }}
              transition={{ duration: isPlaying ? 180 : 0.5, ease: "linear" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-400">0:00</span>
            <span className="text-[9px] text-slate-400">3:12</span>
          </div>
        </div>

        {/* Lyrics scroll */}
        <div className="px-4 pb-2">
          <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-2">Lyrics</div>
          <div
            ref={lyricsRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ maxHeight: 140, scrollbarWidth: "none" }}>
            <div className="space-y-1 pb-4">
              {SONG_LYRICS.map((l, i) =>
                l.line ? (
                  <motion.p key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-[13px] leading-relaxed text-slate-700 font-medium">{l.line}</motion.p>
                ) : <div key={i} className="h-3" />
              )}
            </div>
          </div>
          {!scrolled && (
            <div className="text-center mt-1">
              <span className="text-[9px] tracking-widest text-slate-400 animate-pulse">scroll to read ↓</span>
            </div>
          )}
        </div>

        {/* Enter button — unlocks after scrolling */}
        <div className="px-4 pb-4 pt-1">
          <motion.button
            onClick={scrolled ? onEnter : undefined}
            whileTap={scrolled ? { scale: 0.97 } : {}}
            animate={{ opacity: scrolled ? 1 : 0.35 }}
            transition={{ duration: 0.4 }}
            className="w-full py-3 rounded-2xl text-[13px] font-bold tracking-wide transition-all"
            style={{ background: scrolled ? "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)" : "rgba(0,0,0,0.06)", color: scrolled ? "white" : "rgba(0,0,0,0.3)", cursor: scrolled ? "pointer" : "default" }}>
            {scrolled ? "Enter →" : "Read the lyrics first"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function TTTLandingPage() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStartedMusic, setHasStartedMusic] = React.useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [showResearcher, setShowResearcher] = useState(false);

  const playerRef = React.useRef(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const musicSrc = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&origin=${origin}`;



  const sendPlayerCommand = (command) => {
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }), "*"
    );
  };

  const handlePlayButton = () => {
    if (!hasStartedMusic) { setHasStartedMusic(true); setIsPlaying(true); }
    else {
      sendPlayerCommand(isPlaying ? "pauseVideo" : "playVideo");
      setIsPlaying(!isPlaying);
    }
    setShowPlayer(true);
  };

  const toggleMusicFromPlayer = () => {
    sendPlayerCommand(isPlaying ? "pauseVideo" : "playVideo");
    setIsPlaying(!isPlaying);
  };

  const toggleMusic = handlePlayButton;

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950">
      <div className="absolute inset-0 bg-white" />

      {/* Corner art — top-left: clickable AI agent */}
      <motion.button
        whileHover={{ scale: 1.04, opacity: 0.9 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => { setShowAgent(true); setShowResearcher(false); }}
        className="absolute left-0 top-0 h-32 w-32 sm:h-80 sm:w-80 cursor-pointer focus:outline-none"
        style={{ zIndex: 20 }}
        aria-label="Open AI Agent"
      >
        <img src={CORNER_ART} alt="AI Agent" className="h-full w-full object-contain opacity-70" />
      </motion.button>

      {/* Corner art — top-right: clickable Researcher */}
      <motion.button
        whileHover={{ scale: 1.04, opacity: 0.9 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => { setShowResearcher(true); setShowAgent(false); }}
        className="absolute right-0 top-0 h-32 w-32 sm:h-80 sm:w-80 cursor-pointer focus:outline-none"
        style={{ zIndex: 20 }}
        aria-label="Open Researcher"
      >
        <img src={CORNER_ART} alt="Researcher" className="h-full w-full object-contain opacity-70" style={{ transform: "scaleX(-1)" }} />
      </motion.button>

      {/* Bottom corners — decorative only */}
      <img src={CORNER_ART} alt="" className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 scale-y-[-1] object-contain opacity-45 sm:h-80 sm:w-80" />
      <img src={CORNER_ART} alt="" className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 scale-[-1] object-contain opacity-45 sm:h-80 sm:w-80" />

      {/* Orb */}
      <motion.div className="absolute inset-0"
        initial={{ scale: 0.42, opacity: 0 }}
        animate={{ scale: 1, y: [0, -12, 0], opacity: [1, 0.96, 1] }}
        transition={{ scale: { duration: 1.4, ease: "easeOut" }, opacity: { duration: 0.8, ease: "easeOut" }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.4 } }}>
        <img src={ORB_IMAGE} alt="TTT cosmic orb"
          className="h-full w-full scale-90 object-contain object-center opacity-100 [image-rendering:auto] transform-gpu md:scale-[0.78]" />
      </motion.div>

      <img src={ORB_IMAGE} alt="" className="absolute inset-x-0 bottom-0 h-1/3 w-full origin-bottom scale-y-[-1] object-contain object-bottom opacity-18" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-white/65 to-transparent" />
      <div className="absolute inset-0 bg-white/5" />

      <iframe ref={playerRef} title="Mind On My Kaspa" src={hasStartedMusic ? musicSrc : "about:blank"}
        allow="autoplay; encrypted-media" className="pointer-events-none absolute h-px w-px opacity-0" />



      <section className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-8 pt-10 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative h-[min(62vh,620px)] w-full">
          <Link to="/TTTGate" aria-label="Launch TTT portal" className="absolute inset-0" />
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mb-2 text-sm font-medium tracking-[0.45em] text-slate-900/80 sm:text-base">
          地球到火星交易
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs font-medium tracking-[0.32em] text-slate-600/70 sm:text-sm">
          由 Kaspa 提供支持
        </motion.p>
        <motion.button type="button" onClick={toggleMusic}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-4 rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-900 shadow-sm backdrop-blur-xl transition hover:bg-white hover:shadow-md active:scale-95">
          {showPlayer ? (isPlaying ? "Pause" : "Play") : "Play"}
        </motion.button>

        <motion.button
          type="button"
          onClick={() => navigate("/TTTGate")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.68 }}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.03 }}
          className="mt-3 rounded-full px-7 py-3 text-[12px] font-black uppercase tracking-[0.22em] text-white shadow-xl active:scale-95 transition-all"
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
            letterSpacing: "0.22em",
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            boxShadow: "0 4px 24px rgba(0,0,0,0.22), 0 1.5px 6px rgba(0,0,0,0.13)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Eye className="inline w-4 h-4 mr-2 mb-0.5" />
          TAP TO TIP
        </motion.button>
        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-5 text-[10px] font-semibold uppercase tracking-[0.5em] text-slate-500/60">
          ttt
        </motion.footer>
      </section>

      {/* Music Player popup */}
      <AnimatePresence>
        {showPlayer && (
          <MusicPlayer
            isPlaying={isPlaying}
            onToggle={toggleMusicFromPlayer}
            onEnter={() => navigate("/TTTGate")}
          />
        )}
      </AnimatePresence>

      {/* Panels */}
      <AnimatePresence>
        {showAgent && <AIAgentPanel onClose={() => setShowAgent(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showResearcher && <ResearcherPanel onClose={() => setShowResearcher(false)} />}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {(showAgent || showResearcher) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => { setShowAgent(false); setShowResearcher(false); }} />
        )}
      </AnimatePresence>
    </main>
  );
}