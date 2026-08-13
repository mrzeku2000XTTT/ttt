import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, BadgeCheck, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * KACHAT — a direct thread with the verified human owner of a site / X profile.
 * One thread per visitor per site; the owner sees every thread for what they own.
 */
export default function KaChatPanel({ open, app, claim, onClose }) {
  const [me, setMe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  const isOwner = me?.email && claim?.owner_email === me.email;
  const threadId = isOwner ? null : `${app?.url}::${me?.email || ""}`;

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const user = await base44.auth.me();
        setMe(user);
      } catch {
        setMe(null);
      }
      setLoading(false);
    })();
  }, [open, app?.url]);

  const load = async () => {
    if (!me?.email || !app?.url) return;
    const query = claim?.owner_email === me.email
      ? { site_url: app.url }
      : { thread_id: `${app.url}::${me.email}` };
    const list = await base44.entities.KaChatMessage.filter(query, "created_date", 200);
    setMessages(list);
  };

  useEffect(() => {
    if (!open || !me?.email) return;
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [open, me?.email, app?.url]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !me?.email) return;
    setInput("");
    await base44.entities.KaChatMessage.create({
      site_url: app.url,
      thread_id: isOwner ? (messages[messages.length - 1]?.thread_id || `${app.url}::${me.email}`) : threadId,
      sender_email: me.email,
      sender_name: me.full_name || me.email,
      sender_role: isOwner ? "owner" : "visitor",
      owner_address: claim?.owner_address || "",
      content: text,
    });
    load();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 260 }}
          className="fixed top-0 right-0 bottom-0 z-[240] w-full sm:w-[420px] bg-[#050505] border-l border-white/10 flex flex-col"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">KACHAT · {claim?.owner_display || app?.name}</p>
              <p className="text-[11px] text-emerald-400/70 font-mono truncate">verified {claim?.kns_domain}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Opening thread…
              </div>
            ) : !me ? (
              <p className="text-white/50 text-[13px]">Sign in to message the owner directly.</p>
            ) : messages.length === 0 ? (
              <p className="text-white/50 text-[13px] leading-relaxed">
                {isOwner
                  ? "No messages yet — visitors who reach out will show up here."
                  : <>You're messaging the real human behind <span className="text-white">{app?.name}</span>. They reply when they're around.</>}
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_email === me.email;
                return (
                  <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                      mine
                        ? "bg-cyan-500/15 border border-cyan-400/30 text-cyan-50"
                        : "bg-white/[0.05] border border-white/10 text-white/80"
                    }`}>
                      {m.sender_role === "owner" && !mine && (
                        <span className="block text-[10px] text-emerald-300 mb-0.5">owner</span>
                      )}
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="p-3 border-t border-white/10 flex items-center gap-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!me}
              placeholder={me ? "Message the owner…" : "Sign in to message"}
              className="flex-1 h-11 px-4 rounded-full bg-white/[0.06] border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 min-w-0 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!me || !input.trim()}
              className="w-11 h-11 flex-shrink-0 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}