import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, WandSparkles, Copy, Check, Loader2 } from "lucide-react";
import invokeProtectedOperation from '@/components/integrations/invokeProtectedOperation';

const TONES = ["Calm", "Honest", "Gentle", "Direct"];



/** "Say It Better" — rewrite a raw reaction in a chosen tone. */
export default function FlagSayItBetter({ onClose }) {
  const [text, setText] = useState("");
  const [tone, setTone] = useState("Calm");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const run = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setResults(null);
    try {
      const res = await invokeProtectedOperation('flagSenseAssistant', { action: 'rewrite', text: text.trim(), tone });
      setResults(res?.rewrites?.length ? res.rewrites : ["Could you help me rephrase that more gently?"]);
    } catch {
      setResults(null);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (t, i) => {
    try {
      await navigator.clipboard.writeText(t);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1800);
    } catch {}
  };

  return (
    <div className="flag-sense fixed inset-0 z-[360] overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-md px-6 pt-6 pb-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="fs-label">Communication tool</p>
            <h1 className="text-[24px] font-bold tracking-tight">Say it better</h1>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-500 hover:text-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 text-[13.5px] leading-relaxed text-neutral-500">
          Write what you're feeling — exactly as it comes out. We'll keep the feeling and soften the delivery.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={'"You never listen to me."'}
          className="mb-4 w-full resize-none rounded-2xl border border-black/10 bg-card px-5 py-4 text-[14.5px] leading-relaxed outline-none placeholder:text-neutral-400 focus:border-neutral-400"
        />

        <div className="mb-5 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`rounded-full border px-4 py-2 text-[12.5px] font-medium transition-colors ${
                tone === t ? "border-neutral-900 bg-neutral-900 text-white" : "border-black/10 bg-white text-neutral-700 hover:border-black/25"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={run}
          disabled={!text.trim() || busy}
          className="mb-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-[14.5px] font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
          {busy ? "Finding the words…" : `Rewrite in a ${tone.toLowerCase()} tone`}
        </button>

        <AnimatePresence>
          {results && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
              {results.map((r, i) => (
                <div key={i} className="rounded-2xl border border-black/[0.06] bg-card p-4 shadow-sm">
                  <p className="mb-2.5 text-[14px] font-medium leading-relaxed">"{r}"</p>
                  <button
                    onClick={() => copy(r, i)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-[11.5px] font-semibold text-neutral-700 hover:border-black/30"
                  >
                    {copiedIdx === i ? <Check className="h-3 w-3 text-[hsl(var(--fs-green))]" /> : <Copy className="h-3 w-3" />}
                    {copiedIdx === i ? "Copied" : "Copy"}
                  </button>
                </div>
              ))}
              <p className="pt-1 text-center text-[11.5px] text-neutral-400">
                The goal isn't to win — it's to be heard.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}