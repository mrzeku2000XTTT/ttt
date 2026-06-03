import React from "react";

export default function MetaMimicAbout() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-12 text-center">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-[#4A90E2]">
            About
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-black tracking-tight">
            What we do
          </h2>
        </div>
        <p className="mx-auto max-w-[680px] text-center text-[17px] leading-[1.7] text-white/70">
          CloneHTML is a decentralized platform that transforms images and files
          into precise HTML clones with a simple drag-and-drop interface.
        </p>
      </div>
    </section>
  );
}