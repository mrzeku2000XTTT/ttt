import React from "react";

export default function MetaMimicCTA() {
  return (
    <section
      id="cta"
      className="border-y border-white/[0.08] px-6 py-20 text-center"
      style={{
        background: "linear-gradient(135deg, #4A90E233, #2C3E5033)",
      }}
    >
      <h2 className="mb-3 text-[clamp(28px,4vw,42px)] font-black">
        Ready to begin?
      </h2>
      <p className="mb-7 text-white/70">Join us — be part of what's next.</p>
      <a
        href="#studio"
        className="inline-block rounded-full bg-gradient-to-br from-[#4A90E2] to-[#2C3E50] px-7 py-3.5 text-sm font-extrabold text-white transition hover:opacity-90"
        style={{ boxShadow: "0 10px 30px #4A90E255" }}
      >
        Get started today
      </a>
    </section>
  );
}