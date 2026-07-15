import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Bot } from "lucide-react";
import { base44 } from "@/api/base44Client";

// GodZK — TTT OS navigator assistant with ZK's scanned platform knowledge
const ZK_KNOWLEDGE = `
TTT OS is a web-based desktop environment (Windows 11 / macOS style) inside the TTT Kaspa platform.
Desktop apps available (say "open <name>" to launch in a window):
- NODE: Kaspa node dashboard — connect and monitor a Kaspa node.
- TTTV: media browser & video player for the TTT community.
- Feed: the encrypted TTT community social feed — posts, tips in KAS, stamps.
- Agent ZK: cryptographic identity agent — ZK profiles, wallet queries, agent directory.
- Bridge: send KAS between L1 and L2, transfer to any address.
- Marketplace: P2P marketplace — buy/sell with KAS.
- Profile: user profile — username, bio, wallets, TTT ID seals, stamps.
- Settings: platform settings.
OS behaviors (real Windows 11 style): click a window to bring it to front; title bar buttons minimize (–), maximize (□), close (✕); double-click the title bar to maximize/restore; taskbar icons restore or minimize windows; Start menu searches apps.
Wider TTT platform: Kaspa wallet tools, AgentZK, DAGKnight verification, KCC NFT identity, KAS Dollar stablecoin, AWA air-gapped payments, App Store with 80+ community apps.
`;

export default function GodZK({ apps, onOpenApp }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "⚡ I'm GodZK. I know every corner of TTT OS. Ask me anything, or say \"open feed\", \"open agent zk\"… and I'll launch it for you." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const findApp = (msg) => {
    const lower = msg.toLowerCase();
    if (!/(open|launch|start|show me|go to)/.test(lower)) return null;
    return apps.find(a => lower.includes(a.name.toLowerCase()) || lower.includes(a.path.toLowerCase()));
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);

    // Direct app launch command
    const app = findApp(userMsg);
    if (app) {
      onOpenApp(app);
      setMessages(prev => [...prev, { role: "assistant", content: `🪟 Opening **${app.name}** in a window. Click its title bar to move it, – to minimize, □ to maximize.` }]);
      return;
    }

    setIsLoading(true);
    try {
      const context = messages.slice(-6).map(m => `${m.role === "user" ? "User" : "GodZK"}: ${m.content}`).join("\n");
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are GodZK, the omniscient navigator of TTT OS. You help users find their way around the OS and the TTT platform. Here is your scanned knowledge:\n${ZK_KNOWLEDGE}\n\nConversation:\n${context}\n\nUser: ${userMsg}\n\nAnswer concisely and helpfully as GodZK. If the user wants an app, tell them to say "open <app name>" or that you can open it. Use short sentences and occasional ⚡ emoji.`,
      });
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚡ Signal lost. Try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating GodZK orb */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-16 right-4 z-[500] w-12 h-12 rounded-full flex items-center justify-center shadow-2xl"
          style={{ background: "linear-gradient(135deg, #a855f7, #06b6d4)", boxShadow: "0 0 24px rgba(168,85,247,0.5)" }}
          title="GodZK — OS Navigator"
        >
          <Bot className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-16 right-4 z-[500] flex flex-col"
            style={{
              width: "min(340px, calc(100vw - 2rem))", height: "440px", borderRadius: "18px",
              background: "rgba(10,10,16,0.92)", backdropFilter: "blur(30px)",
              border: "1px solid rgba(168,85,247,0.35)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #06b6d4)" }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm leading-none">GodZK</div>
                  <div className="text-white/40 text-[10px] mt-0.5">TTT OS Navigator</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick launch chips */}
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {apps.slice(0, 6).map(app => (
                <button
                  key={app.path}
                  onClick={() => {
                    onOpenApp(app);
                    setMessages(prev => [...prev, { role: "assistant", content: `🪟 Opened **${app.name}**.` }]);
                  }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap text-purple-300 hover:text-white transition-colors"
                  style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}
                >
                  {app.name}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] text-[13px] leading-relaxed px-3 py-2 rounded-2xl"
                    style={msg.role === "user"
                      ? { background: "rgba(6,182,212,0.25)", color: "rgba(255,255,255,0.95)", borderBottomRightRadius: "6px" }
                      : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(168,85,247,0.2)", borderBottomLeftRadius: "6px" }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span className="text-[11px] text-white/50">scanning…</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder='Ask GodZK or "open feed"…'
                  className="flex-1 bg-transparent text-white/90 outline-none placeholder-white/30"
                  style={{ fontSize: "16px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: input.trim() && !isLoading ? "rgba(168,85,247,0.4)" : "transparent" }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}