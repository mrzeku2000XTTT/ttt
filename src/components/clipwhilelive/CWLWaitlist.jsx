import React, { useState } from "react";

export default function CWLWaitlist() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <div className="max-w-xl mx-auto px-4 py-14 text-center" style={{ fontFamily: "monospace" }}>
      <p className="text-[10px] tracking-[0.3em] text-red-400 mb-3">HOSTED CLOUD / WAITLIST</p>
      <h2 className="text-3xl font-black text-white tracking-tight mb-3">
        SKIP THE SETUP. <span className="italic text-red-500">KEEP THE SPEED.</span>
      </h2>
      <p className="text-xs text-zinc-500 leading-relaxed mb-6">
        The local beta is available now. This waitlist is for the upcoming hosted version —
        no Mac worker, models, or media pipeline to maintain yourself.
      </p>
      {joined ? (
        <div className="border border-emerald-500/40 text-emerald-400 text-xs py-4 px-6">
          ✓ YOU'RE ON THE LIST. We'll be in touch when your spot opens.
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setJoined(true); }}
          className="flex gap-2"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="YOUR EMAIL"
            className="flex-1 bg-black border border-zinc-700 px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold tracking-[0.15em] transition-colors whitespace-nowrap"
          >
            JOIN WAITLIST →
          </button>
        </form>
      )}
      <p className="mt-3 text-[9px] text-zinc-600 tracking-widest uppercase">Cloud waitlist · No local setup · No spam</p>
    </div>
  );
}