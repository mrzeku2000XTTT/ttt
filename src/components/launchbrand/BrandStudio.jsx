import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, PanelRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BrandMessageBubble from "@/components/launchbrand/BrandMessageBubble";
import BrandWorkspace from "@/components/launchbrand/BrandWorkspace";
import BrandPreview from "@/components/launchbrand/BrandPreview";
import { runBrandAgent } from "@/components/launchbrand/brandAgent";

export default function BrandStudio() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [rightTab, setRightTab] = useState("preview"); // "preview" | "workspace"
  const scrollRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const init = async () => {
    let me;
    try { me = await base44.auth.me(); } catch { me = null; }
    if (!me) {
      setMessages([{
        role: "assistant",
        kind: "text",
        content: "Login to start building your brand. Click the login button in the top bar to continue.",
      }]);
      return;
    }
    setUser(me);

    const existing = await base44.entities.Brand.filter({ owner_email: me.email }, "-created_date", 1);
    let b;
    if (existing.length > 0) {
      b = existing[0];
      const msgs = await base44.entities.BrandMessage.filter({ brand_id: b.id }, "created_date", 200);
      setMessages(msgs);
    } else {
      b = await base44.entities.Brand.create({ owner_email: me.email, stage: "discovery", completion: 0 });
      const opener = {
        role: "assistant",
        kind: "text",
        content: "Hey — I'm your brand strategist. Let's build something real.\n\nIn one sentence: what are you launching, and who's it for?",
      };
      const saved = await base44.entities.BrandMessage.create({ ...opener, brand_id: b.id, owner_email: me.email });
      setMessages([saved]);
    }
    setBrand(b);
  };

  const send = async (text) => {
    if (!text.trim() || !brand || busy) return;
    setBusy(true);
    setInput("");

    try {
      const userMsg = await base44.entities.BrandMessage.create({
        brand_id: brand.id,
        owner_email: user.email,
        role: "user",
        kind: "text",
        content: text,
      });
      setMessages((m) => [...m, userMsg]);

      let currentBrand = brand;
      let history = [...messages, userMsg];
      let lastUserText = text;
      let advance = true;
      let safety = 0;

      while (advance && safety < 5) {
        safety += 1;
        let result;
        try {
          result = await runBrandAgent({ brand: currentBrand, userMessage: lastUserText, history });
        } catch (err) {
          console.warn("[BrandStudio] agent step failed:", err);
          const errMsg = await base44.entities.BrandMessage.create({
            brand_id: currentBrand.id,
            owner_email: user.email,
            role: "assistant",
            kind: "text",
            content: "Hit a snag on that step. Try sending again or rephrase what you'd like.",
          });
          setMessages((prev) => [...prev, errMsg]);
          break;
        }

        if (result.brandUpdates && Object.keys(result.brandUpdates).length > 0) {
          try {
            currentBrand = await base44.entities.Brand.update(currentBrand.id, result.brandUpdates);
            setBrand(currentBrand);
          } catch (err) {
            console.warn("[BrandStudio] brand update failed:", err);
          }
        }

        for (const m of result.messages || []) {
          try {
            const saved = await base44.entities.BrandMessage.create({
              brand_id: currentBrand.id,
              owner_email: user.email,
              role: m.role,
              kind: m.kind || "text",
              content: m.content,
              data: m.data || {},
            });
            setMessages((prev) => [...prev, saved]);
            history = [...history, saved];
          } catch (err) {
            console.warn("[BrandStudio] message save failed:", err);
          }
        }

        advance = !!result.autoAdvance;
        lastUserText = "";
      }
    } catch (err) {
      console.warn("[BrandStudio] send failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const onPickName = (n) => send(n);

  return (
    <section className="relative py-16 sm:py-24 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[12px] font-semibold text-cyan-400 tracking-widest uppercase mb-3">Brand Studio</p>
          <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight">Talk it into existence.</h2>
          <p className="text-white/50 mt-3 max-w-md mx-auto text-sm">
            Chat with your AI strategist. Real assets get built as you go.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl overflow-hidden grid lg:grid-cols-[1fr_420px] h-[640px]">
          {/* Chat */}
          <div className="flex flex-col min-h-0 relative">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-sm">Brand Strategist</span>
                {brand && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 tracking-widest uppercase">
                    {brand.stage}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowWorkspace((v) => !v)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-bold"
              >
                <PanelRight className="w-3.5 h-3.5" /> Brand
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((m) => (
                <BrandMessageBubble key={m.id || `${m.role}-${m.created_date || Math.random()}`} message={m} onPickName={onPickName} />
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> thinking…
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/10">
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="flex items-center gap-2 bg-white/[0.04] border border-white/10 focus-within:border-cyan-400/40 rounded-2xl pl-4 pr-1.5 py-1.5"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={brand?.stage === "complete" ? "Refine your brand…" : "Reply…"}
                  disabled={busy || !user}
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30 text-sm py-2"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim() || !user}
                  className="w-9 h-9 rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>

          {/* Right panel - desktop (Preview / Workspace tabs) */}
          <div className="hidden lg:flex flex-col border-l border-white/10 bg-black/40 min-h-0">
            <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 flex-shrink-0">
              {[
                { id: "preview", label: "Preview" },
                { id: "workspace", label: "Assets" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRightTab(t.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-colors ${
                    rightTab === t.id
                      ? "bg-white text-black"
                      : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {rightTab === "preview" ? <BrandPreview brand={brand} /> : <BrandWorkspace brand={brand} />}
            </div>
          </div>

          {/* Mobile drawer */}
          <AnimatePresence>
            {showWorkspace && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.25 }}
                className="lg:hidden absolute inset-y-0 right-0 w-[88%] max-w-sm bg-black/95 border-l border-white/10 z-10 flex flex-col"
              >
                <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 flex-shrink-0">
                  {[
                    { id: "preview", label: "Preview" },
                    { id: "workspace", label: "Assets" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setRightTab(t.id)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-colors ${
                        rightTab === t.id
                          ? "bg-white text-black"
                          : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {rightTab === "preview" ? <BrandPreview brand={brand} /> : <BrandWorkspace brand={brand} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}