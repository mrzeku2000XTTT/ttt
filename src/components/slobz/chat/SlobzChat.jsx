import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Send, Briefcase } from "lucide-react";
import SlobzChatBubble from "@/components/slobz/chat/SlobzChatBubble";
import SlobzGigWidget from "@/components/slobz/chat/SlobzGigWidget";

const SLOB_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9f342179c_generated_image.png";

export default function SlobzChat({ onClose }) {
  const [conversationId, setConversationId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [localMessages, setLocalMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showGigWidget, setShowGigWidget] = useState(false);
  const [initError, setInitError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: "slobz",
          metadata: { name: "Slobz Chat", description: "Ask Slobz anything" },
        });
        if (!alive) return;
        setConversation(conv);
        setConversationId(conv.id);
      } catch {
        if (alive) setInitError("Slobz needs you to log in to chat. Tap Login and come back!");
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, localMessages, showGigWidget]);

  const send = async () => {
    const text = input.trim();
    if (!text || !conversation || sending) return;
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } finally {
      setSending(false);
    }
  };

  const handleGigPosted = (gig) => {
    setShowGigWidget(false);
    setLocalMessages((prev) => [...prev, {
      role: "assistant",
      content: `Gig posted to the Momentum Track! 🎉 It pays **${gig.payout_tkas} TKAS** on testnet — anyone can claim it now.`,
      gig_widget: gig,
    }]);
  };

  const allMessages = [...messages, ...localMessages];
  const lastMsg = messages[messages.length - 1];
  const agentThinking = sending || (lastMsg?.role === "user");

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed z-[998] inset-x-0 bottom-0 h-[82vh] md:inset-x-auto md:right-5 md:bottom-24 md:w-[400px] md:h-[600px] bg-[#DED6F2] rounded-t-[28px] md:rounded-[28px] shadow-[0_-10px_50px_rgba(61,46,124,0.35)] md:shadow-[0_24px_60px_rgba(61,46,124,0.4)] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FDFBF7]">
        <div className="flex items-center gap-2.5">
          <img src={SLOB_LOGO} alt="Slobz" className="w-9 h-9 rounded-full object-cover shadow-[0_4px_10px_rgba(124,92,252,0.35)]" />
          <div>
            <div className="font-display text-sm font-black text-[#3D2E7C]">Slobz</div>
            <div className="text-[9px] text-[#8B84A3]">Your little purple guide to the whole app</div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F3F0FA] text-[#8B84A3]"><X className="w-4 h-4" /></button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3">
        <SlobzChatBubble message={{ role: "assistant", content: "Hey, I'm **Slobz**! 👋 Ask me anything about the app — gigs, tipping, testnet TKAS, Entity X, the escrow waitlist… or hit the briefcase to post a demo gig right here." }} />
        {initError && <SlobzChatBubble message={{ role: "assistant", content: initError }} />}
        {allMessages.map((m, i) => <SlobzChatBubble key={i} message={m} />)}
        {agentThinking && !initError && (
          <div className="flex items-center gap-2 pl-10 text-[#7C5CFC]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] font-display font-extrabold">Slobz is squishing thoughts…</span>
          </div>
        )}
        {showGigWidget && <SlobzGigWidget onPosted={handleGigPosted} onClose={() => setShowGigWidget(false)} />}
      </div>

      {/* Composer */}
      <div className="p-3 bg-[#FDFBF7]" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGigWidget((v) => !v)}
            title="Post a demo gig"
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${showGigWidget ? "bg-[#7C5CFC] text-white" : "bg-[#F3F0FA] text-[#7C5CFC] hover:bg-[#EBE6F8]"}`}
          >
            <Briefcase className="w-4 h-4" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask Slobz anything…"
            disabled={!!initError}
            className="flex-1 bg-[#F3F0FA] rounded-full px-4 py-2.5 text-xs text-[#1F1B2E] placeholder-[#8B84A3] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending || !!initError}
            className="w-10 h-10 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] text-white flex items-center justify-center flex-shrink-0 shadow-[0_6px_14px_rgba(249,107,76,0.4)] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}