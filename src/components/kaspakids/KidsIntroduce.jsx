import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Loader2, Rocket, Sparkles, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MASCOT = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";
const KID_INTERESTS_KEY = "slobz_kid_interests";

const SYSTEM = `You are Slobby, a friendly purple mascot tutor for kids ages 10-14 inside the Slobz Trading Academy.
Right now you are just getting to know the kid. Ask about things they LIKE and DO — games on their phone, apps, sports, food, shows, hobbies. Be warm and curious, 1-2 short sentences.
HARD RULES:
- NEVER ask for or mention the kid's name, age, address, school, or any personal/family detail.
- Only collect THINGS and ACTIVITIES they enjoy.
From what they tell you, extract 3-12 short interest nouns/phrases (e.g. "Minecraft", "Roblox", "pizza", "skateboarding", "soccer", "Among Us"). NEVER extract names/ages/locations — only things/activities.
Return JSON: { "interests": [strings], "reply": string }.
The reply should warmly confirm you'll use their favorites to explain trading, and ask a light follow-up about something else they like (still no personal info).`;

export default function KidsIntroduce({ onDone }) {
  const [messages, setMessages] = useState([
    { role: "slobby", text: "Hey! I'm Slobby 🟣 Before we start learning, tell me what YOU love! Games on your phone, apps you use, sports, food, shows — anything fun. I'll use your favorites to make every lesson make sense to you. No names or anything personal — just stuff you're into! What do you love playing or doing?" },
  ]);
  const [interests, setInterests] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    if (!text.trim() || busy) return;
    const kidMsg = text.trim();
    setText("");
    setMessages((m) => [...m, { role: "kid", text: kidMsg }]);
    setBusy(true);
    try {
      const convo = messages.map((m) => `${m.role === "kid" ? "Kid" : "Slobby"}: ${m.text}`).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM}\n\nConversation so far:\n${convo}\nKid just said: "${kidMsg}"\n\nExtract interests and reply.`,
        response_json_schema: {
          type: "object",
          properties: {
            interests: { type: "array", items: { type: "string" } },
            reply: { type: "string" },
          },
        },
      });
      const newOnes = (res.interests || []).map((s) => s.trim()).filter(Boolean);
      setInterests((prev) => {
        const merged = [...prev];
        newOnes.forEach((n) => { if (!merged.some((x) => x.toLowerCase() === n.toLowerCase())) merged.push(n); });
        return merged;
      });
      setMessages((m) => [...m, { role: "slobby", text: res.reply || "Awesome! Tell me more — what else do you like?" }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "slobby", text: "My brain hiccuped 🫠 — try telling me again what you like!" }]);
    } finally {
      setBusy(false);
    }
  };

  const start = () => {
    const final = interests.length ? interests : ["pizza", "video games", "music"];
    try { localStorage.setItem(KID_INTERESTS_KEY, JSON.stringify(final)); } catch {}
    onDone(final);
  };

  return (
    <div className="relative min-h-screen bg-[#e0d7f5] font-body text-[#1F1B2E] overflow-x-hidden flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-2 h-14 px-3 border-b border-[#7C4DFF]/15 bg-[#e0d7f5]/85 backdrop-blur-xl sticky top-0 z-20" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-1 text-[#5A4B8A] hover:text-[#3D2E7C] text-sm h-9 px-2 rounded-lg hover:bg-white/60">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Store</span>
        </Link>
        <img src={MASCOT} alt="Slobby" className="w-8 h-8 rounded-xl object-cover" />
        <span className="font-display font-black text-sm text-[#3D2E7C]">Meet Slobby 🟣</span>
      </div>

      {/* CHAT */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4 py-4 space-y-2.5">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "kid" ? "justify-end" : "justify-start"}`}>
            {m.role === "slobby" && <img src={MASCOT} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0 mr-2 mt-1" />}
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${m.role === "kid" ? "bg-[#3D2E7C] text-white" : "bg-white text-[#3D2E7C] border border-[#e6d9fb]"}`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <img src={MASCOT} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0 mr-2 mt-1" />
            <div className="bg-white rounded-2xl px-3.5 py-2.5 border border-[#e6d9fb] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#7C4DFF]" />
              <span className="text-xs text-[#7f7f7f]">Slobby is thinking…</span>
            </div>
          </div>
        )}

        {/* INTEREST CHIPS */}
        {interests.length > 0 && (
          <div className="pt-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#7C4DFF] mb-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Things Slobby knows you love</div>
            <div className="flex flex-wrap gap-1.5">
              {interests.map((it, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-[#f3eafa] border border-[#e6d9fb] text-xs font-bold text-[#3D2E7C]">💜 {it}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="border-t border-[#7C4DFF]/15 bg-white p-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Tell Slobby what you like…"
            className="flex-1 h-10 px-3.5 rounded-full bg-[#f3eafa] border border-[#e6d9fb] text-sm text-[#1F1B2E] placeholder-[#9f8fbf] outline-none focus:border-[#7C4DFF]"
          />
          <button onClick={send} disabled={busy || !text.trim()} className="w-10 h-10 rounded-full bg-[#7C4DFF] text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={start}
          className="mt-2 w-full max-w-2xl mx-auto h-11 rounded-full bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white font-display font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-[0_10px_24px_rgba(249,107,76,0.4)] disabled:opacity-50"
          disabled={interests.length === 0}
        >
          <Rocket className="w-4 h-4" /> {interests.length ? `Start learning → (${interests.length})` : "Tell me 1 thing you like to start"}
        </button>
      </div>
    </div>
  );
}