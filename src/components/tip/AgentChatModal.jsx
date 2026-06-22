import React from "react";
import { X, Briefcase, Send, Sparkles, Globe, MessageSquare, Bot, Plus, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AgentChatModal({
  chatUser,
  setChatUser,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  hireFlow,
  broadcastedJob,
  startHireFlow,
  sendChatMessage,
  handleQuickReply,
  handleUrlSubmit,
  getAvatarUrl,
  openJobsBoard,
  chatEndRef
}) {
  if (!chatUser) return null;

  const commonContent = (
    <>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative">
          <div className="w-11 h-11 rounded-2xl overflow-hidden" style={{ border: "2px solid #b9f18a" }}>
            <img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#1a1a1a]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base">{chatUser.agent_name || chatUser.username}</p>
          <p className="text-[11px]" style={{ color: "#888888" }}>Active now · {chatUser.agent_rate_kas || "—"} KAS/hr</p>
        </div>
        {!hireFlow && !broadcastedJob && (
          <button onClick={startHireFlow}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold flex-shrink-0 transition-all hover:opacity-90"
            style={{ background: "#b9f18a", color: "#121212", boxShadow: "0 2px 12px rgba(185,241,138,0.3)" }}>
            <Briefcase className="w-3.5 h-3.5" /> Hire
          </button>
        )}
        <button onClick={() => setChatUser(null)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {chatMessages.map((msg, i) => {
          const isUser = msg.role === "user";
          if (msg.type === "thinking") return (
            <div key={i} className="flex justify-start gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                <img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 animate-pulse" style={{ color: "#b9f18a" }} />
                  <span className="text-[10px] font-semibold" style={{ color: "rgba(185,241,138,0.7)" }}>Structuring job brief...</span>
                </div>
                <div className="flex gap-1">
                  {["Broadcasting to agents", "Generating wallet", "Setting KAS estimate"].map((t, j) => (
                    <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.3 }}
                      className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(185,241,138,0.15)", color: "rgba(185,241,138,0.7)" }}>
                      {t}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          );
          if (msg.type === "job_broadcast" && msg.job) return (
            <div key={i} className="flex justify-start gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                <img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" />
              </div>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex-1 rounded-2xl rounded-tl-sm overflow-hidden"
                style={{ background: "rgba(0,20,50,0.8)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <div className="px-4 pt-3 pb-2" style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>{msg.job.job_id}</span>
                    <span className="text-[9px] font-bold" style={{ color: "#4ade80" }}>✓ Broadcasted</span>
                  </div>
                  <p className="text-white font-bold text-sm">{msg.job.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(200,230,200,0.55)" }}>{msg.job.description}</p>
                </div>
                <div className="px-4 py-2.5 grid grid-cols-2 gap-2">
                  <div><p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "rgba(251,191,36,0.5)" }}>Budget</p><p className="text-sm font-black font-mono" style={{ color: "#fbbf24" }}>{msg.job.budget_kas?.toLocaleString()} KAS</p></div>
                  <div><p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "rgba(96,165,250,0.5)" }}>Timeline</p><p className="text-xs font-bold" style={{ color: "#93c5fd" }}>{msg.job.timeline}</p></div>
                </div>
                <div className="px-4 pb-3 flex items-center gap-2">
                  <code className="text-[9px] font-mono flex-1 truncate" style={{ color: "rgba(74,222,128,0.4)" }}>{msg.job.job_wallet?.slice(0,18)}...</code>
                  <button onClick={() => openJobsBoard(null, null)} className="text-[10px] px-2.5 py-1 rounded-lg font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}>View Board</button>
                </div>
              </motion.div>
            </div>
          );
          if (msg.type === "quickreply" && msg.step === hireFlow?.step) return (
            <div key={i} className="space-y-2">
              <div className="flex justify-start gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(220,240,255,0.85)" }}>{msg.content}</div>
              </div>
              <div className="pl-10 flex flex-wrap gap-1.5">
                {msg.options.map(opt => (
                  <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => handleQuickReply(opt, msg.step)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{ background: "rgba(185,241,138,0.15)", border: "1px solid rgba(185,241,138,0.3)", color: "#b9f18a" }}>{opt}</motion.button>
                ))}
              </div>
            </div>
          );
          if (msg.type === "url_input" && hireFlow?.step === 4) return (
            <div key={i} className="space-y-2">
              <div className="flex justify-start gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(220,240,255,0.85)" }}>{msg.content}</div>
              </div>
              <div className="pl-10 flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: "rgba(0,30,80,0.5)", border: "1px solid rgba(185,241,138,0.2)" }}>
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(185,241,138,0.4)" }} />
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { handleUrlSubmit(chatInput); setChatInput(""); } }} placeholder="https://your-project.xyz" className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-white/20" />
                </div>
                <button onClick={() => { handleUrlSubmit(chatInput); setChatInput(""); }} className="px-3 py-2 rounded-2xl text-xs font-bold" style={{ background: "rgba(185,241,138,0.3)", color: "#121212", border: "1px solid rgba(185,241,138,0.3)" }}>Send</button>
                <button onClick={() => { handleUrlSubmit(""); setChatInput(""); }} className="px-3 py-2 rounded-2xl text-xs font-bold" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>Skip</button>
              </div>
            </div>
          );
          return (
            <div key={i} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>}
              <div className="max-w-[75%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={isUser ? { background: "rgba(185,241,138,0.2)", color: "#ffffff", borderRadius: "1rem 1rem 0.25rem 1rem", border: "1px solid rgba(185,241,138,0.3)" } : { background: "rgba(255,255,255,0.05)", color: "rgba(220,240,255,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem 1rem 1rem 0.25rem" }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {chatLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
            <div className="px-3 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex gap-1 items-center h-4">{[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#b9f18a] animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar - always visible */}
      <div className="flex-shrink-0 px-5 pb-5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: "rgba(38,38,38,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
            placeholder={hireFlow ? "Or type your answer..." : `Message ${chatUser.agent_name || chatUser.username}...`}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20" />
          <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
            style={{ background: "#b9f18a" }}>
            <Send className="w-4 h-4 text-[#121212]" />
          </button>
        </div>
        {!hireFlow && (
          <p className="text-center text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.12)" }}>
            Tap <strong style={{ color: "rgba(185,241,138,0.6)" }}>Hire</strong> to post a job · AI-powered
          </p>
        )}
      </div>
    </>
  );

  return (
    <AnimatePresence>
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200]" style={{ background: "rgba(0,2,12,0.88)", backdropFilter: "blur(20px)" }}
          onClick={() => setChatUser(null)} />

        {/* DESKTOP: centered floating window */}
        <div className="hidden sm:flex fixed inset-0 z-[201] items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="flex flex-col"
            style={{ width: 560, height: 720, background: "linear-gradient(180deg, #1a1a1a 0%, #121212 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.5rem", boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)" }}
            onClick={e => e.stopPropagation()}>
            {commonContent}
          </motion.div>
        </div>

        {/* MOBILE: bottom sheet */}
        <div className="sm:hidden fixed inset-0 z-[201] flex items-end justify-center">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="w-full flex flex-col"
            style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #121212 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.5rem 1.5rem 0 0", height: "85vh", boxShadow: "0 -20px 60px rgba(0,0,0,0.7)" }}
            onClick={e => e.stopPropagation()}>
            {commonContent}
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}