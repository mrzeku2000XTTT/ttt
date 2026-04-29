import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Send, Sparkles, Loader2, Trash2, Move } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * VisionCanvas — infinite grid canvas with editable note cards.
 * + button opens the Vision Agent (LLM) to brainstorm/expand vision items.
 */
export default function VisionCanvas() {
  const [cards, setCards] = useState(() => {
    try {
      const saved = localStorage.getItem("ttt_v3_vision_cards");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: "c1", x: 120, y: 80, w: 240, text: "The agent internet starts here.\n\nClick + to talk to the Vision Agent." },
    ];
  });
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentInput, setAgentInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentMessages, setAgentMessages] = useState([
    { role: "assistant", content: "I'm the Vision Agent. Tell me what TTT 3.0 should become — I'll drop ideas onto your canvas." },
  ]);
  const [draggingId, setDraggingId] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Persist
  useEffect(() => {
    try { localStorage.setItem("ttt_v3_vision_cards", JSON.stringify(cards)); } catch {}
  }, [cards]);

  const addCard = (text = "") => {
    const id = `c${Date.now()}`;
    const x = 200 + Math.random() * 400;
    const y = 150 + Math.random() * 300;
    setCards((prev) => [...prev, { id, x, y, w: 240, text }]);
    return id;
  };

  const updateCard = (id, patch) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteCard = (id) => setCards((prev) => prev.filter((c) => c.id !== id));

  const onCardPointerDown = (e, card) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") return;
    setDraggingId(card.id);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - canvasRect.left - card.x,
      y: e.clientY - canvasRect.top - card.y,
    };
  };

  const onCanvasPointerMove = (e) => {
    if (!draggingId) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.current.x;
    const y = e.clientY - canvasRect.top - dragOffset.current.y;
    updateCard(draggingId, { x, y });
  };

  const onCanvasPointerUp = () => setDraggingId(null);

  const askAgent = async () => {
    const q = agentInput.trim();
    if (!q || agentLoading) return;
    setAgentMessages((m) => [...m, { role: "user", content: q }]);
    setAgentInput("");
    setAgentLoading(true);
    try {
      const existing = cards.map((c) => `- ${c.text}`).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the TTT 3.0 Vision Agent — a futurist strategist helping shape the next generation of the TTT super-app on Kaspa (agent internet, ZK identity, autonomous agents, blockDAG).

Current vision board:
${existing || "(empty)"}

User request: ${q}

Generate 3 concise, bold vision items (each 1-2 sentences, ~20 words). Make them specific, ambitious, and grounded in Kaspa/AI agents.`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
            cards: { type: "array", items: { type: "string" } },
          },
        },
      });
      const reply = res?.reply || "Added a few ideas to your canvas.";
      setAgentMessages((m) => [...m, { role: "assistant", content: reply }]);
      (res?.cards || []).forEach((text, i) => {
        setTimeout(() => addCard(text), i * 250);
      });
    } catch {
      setAgentMessages((m) => [...m, { role: "assistant", content: "Hit a snag. Try again?" }]);
    }
    setAgentLoading(false);
  };

  return (
    <div
      ref={canvasRef}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      onPointerLeave={onCanvasPointerUp}
      className="relative w-full h-[80vh] rounded-[28px] ring-1 ring-white/10 overflow-hidden bg-zinc-950"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Subtle aurora */}
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{
        background:
          "radial-gradient(circle at 20% 30%, rgba(6,182,212,0.15), transparent 50%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.15), transparent 50%)",
      }} />

      {/* Hint label */}
      <div className="absolute top-4 left-4 text-[10px] font-bold tracking-widest uppercase text-white/30 pointer-events-none">
        Vision Canvas · drag · edit · expand
      </div>

      {/* Cards */}
      {cards.map((card) => (
        <div
          key={card.id}
          onPointerDown={(e) => onCardPointerDown(e, card)}
          className="absolute select-none touch-none"
          style={{
            left: card.x,
            top: card.y,
            width: card.w,
            cursor: draggingId === card.id ? "grabbing" : "grab",
            zIndex: draggingId === card.id ? 20 : 10,
          }}
        >
          <div className="group relative bg-white/[0.04] backdrop-blur-md rounded-2xl ring-1 ring-white/10 hover:ring-cyan-400/30 transition-all p-3 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between mb-1.5">
              <Move className="w-3 h-3 text-white/30" />
              <button
                onClick={() => deleteCard(card.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <textarea
              value={card.text}
              onChange={(e) => updateCard(card.id, { text: e.target.value })}
              placeholder="Type your vision…"
              className="w-full bg-transparent text-white/85 text-[13px] leading-relaxed outline-none resize-none placeholder-white/25"
              rows={Math.max(2, card.text.split("\n").length + Math.floor(card.text.length / 32))}
            />
          </div>
        </div>
      ))}

      {/* Floating + button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setAgentOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 via-violet-400 to-pink-400 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)] z-30"
      >
        <Plus className="w-6 h-6 text-black" strokeWidth={3} />
      </motion.button>

      {/* Vision Agent panel */}
      <AnimatePresence>
        {agentOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="absolute bottom-6 right-6 w-[min(380px,calc(100%-48px))] h-[min(500px,calc(100%-48px))] bg-zinc-950/95 backdrop-blur-2xl rounded-3xl ring-1 ring-white/15 shadow-2xl shadow-black/60 z-40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Vision Agent</div>
                  <div className="text-white/40 text-[10px]">TTT 3.0 strategist</div>
                </div>
              </div>
              <button
                onClick={() => setAgentOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {agentMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-cyan-500/20 text-cyan-50 ring-1 ring-cyan-400/30"
                        : "bg-white/[0.05] text-white/85 ring-1 ring-white/10"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {agentLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.05] ring-1 ring-white/10 rounded-2xl px-3 py-2">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/[0.05] rounded-2xl px-3 py-2 ring-1 ring-white/10">
                <input
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askAgent()}
                  placeholder="What should TTT 3.0 be?"
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
                />
                <button
                  onClick={askAgent}
                  disabled={!agentInput.trim() || agentLoading}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-400 flex items-center justify-center disabled:opacity-30"
                >
                  <Send className="w-3.5 h-3.5 text-black" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}