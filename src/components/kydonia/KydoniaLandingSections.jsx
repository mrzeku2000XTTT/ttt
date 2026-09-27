import React from "react";
import { BadgeCheck, Cpu, Gauge, Globe, ListOrdered, ScrollText, ShieldCheck, WifiOff } from "lucide-react";

const FEATURES = [
  { icon: Gauge, title: "Deterministic ranking", body: "Same query, same order — every time." },
  { icon: WifiOff, title: "Runs offline", body: "The index lives in your browser." },
  { icon: ShieldCheck, title: "Respects robots.txt", body: "Disallowed paths are refused, not forced." },
  { icon: Globe, title: "Private per user", body: "You only ever see what you pasted." },
  { icon: Cpu, title: "No credits per query", body: "Searching costs nothing, ever." },
];

const STEPS = [
  { title: "Paste URLs", body: "One link or a whole reading list." },
  { title: "Fetch & clean", body: "One polite request, article text extracted." },
  { title: "Index", body: "Inverted postings built on your device." },
  { title: "Query", body: "BM25 ranks it, and shows you why." },
];

// Every figure below is a real value from the running implementation.
const CARDS = [
  {
    icon: ScrollText,
    title: "Ranked passages",
    body: "The densest window of your terms, verbatim, with the match highlighted.",
    sample: "BM25 · k1 1.2 · b 0.75",
  },
  {
    icon: ListOrdered,
    title: "Ranking explainer",
    body: "Per-term contribution, the boost that applied, the passage that earned it.",
    sample: "title ×3 · headings ×2 · body ×1",
  },
  {
    icon: BadgeCheck,
    title: "Provenance",
    body: "Every hit carries its host, title and URL back to the page.",
    sample: "host · title · url · position",
  },
  {
    icon: Cpu,
    title: "Local index",
    body: "Postings, phrase positions and lengths — all built in the browser.",
    sample: "0 credits per query",
  },
];

export default function KydoniaLandingSections({ onEnter, hasWallet, onConnect }) {
  return (
    <>
      <section className="border-b border-[#23262d]">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-4 w-4 text-[#ff7a45]" />
              <h3 className="mt-3 text-[13px]">{title}</h3>
              <p className="kyd-sans mt-1 text-[12px] leading-relaxed text-[#8f8a83]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="border-b border-[#23262d]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-[10px] tracking-[0.16em] text-[#ff7a45] uppercase">Workflow</p>
          <h2 className="mt-3 text-[26px] sm:text-[32px]">From a link to a queryable record</h2>
          <p className="kyd-sans mt-3 max-w-xl text-[13px] text-[#a29d94]">
            Four steps, no crawling beyond what you paste.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="kyd-panel-2 p-5">
                <span className="kyd-mono-num text-[12px] text-[#ff7a45]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-[14px]">{step.title}</h3>
                <p className="kyd-sans mt-2 text-[12px] leading-relaxed text-[#8f8a83]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="produces" className="border-b border-[#23262d]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-[10px] tracking-[0.16em] text-[#ff7a45] uppercase">What it produces</p>
          <h2 className="mt-3 text-[26px] sm:text-[32px]">Evidence, not a summary</h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map(({ icon: Icon, title, body, sample }) => (
              <div key={title} className="kyd-panel p-5">
                <Icon className="h-4 w-4 text-[#ff7a45]" />
                <h3 className="mt-3 text-[14px]">{title}</h3>
                <p className="kyd-sans mt-2 text-[12px] leading-relaxed text-[#8f8a83]">{body}</p>
                <p className="mt-4 border-t border-[#23262d] pt-3 text-[11px] text-[#c9a08a]">{sample}</p>
              </div>
            ))}

            <div className="rounded-[14px] border border-[#3a1d12] bg-gradient-to-br from-[#1a0d08] to-[#0b0d11] p-6">
              <h3 className="text-[15px]">KYDONIA</h3>
              <p className="kyd-sans mt-3 text-[12px] leading-relaxed text-[#c9bdb1]">
                Paste a link and it becomes a record you can query, audit and trust.
              </p>
              <button
                type="button"
                className="kyd-btn kyd-btn-primary mt-6 w-full"
                onClick={() => (hasWallet ? onEnter() : onConnect())}
              >
                {hasWallet ? "Enter the catalogue" : "Connect Scorpion"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}