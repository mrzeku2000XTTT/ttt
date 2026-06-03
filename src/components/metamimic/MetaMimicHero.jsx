import React from "react";
import { motion } from "framer-motion";

export default function MetaMimicHero() {
  return (
    <section
      className="px-6 py-20 text-center sm:py-24"
      style={{
        background:
          "radial-gradient(ellipse at top, #4A90E222, transparent 60%), radial-gradient(ellipse at bottom right, #2C3E5022, transparent 60%)",
      }}
    >
      <div className="mx-auto max-w-[1100px]">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-4xl bg-gradient-to-br from-white to-[#4A90E2] bg-clip-text text-[clamp(40px,7vw,72px)] font-black leading-[1.05] tracking-tight text-transparent"
        >
          Transform images and files into precise HTML clones with our user-friendly platform. Drag and drop your way to innovation—no coding required!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mb-9 mt-5 max-w-[620px] text-[clamp(16px,2vw,19px)] text-white/65"
        >
          Empower Your Web Design Effortlessly
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <a
            href="#studio"
            className="rounded-full bg-gradient-to-br from-[#4A90E2] to-[#2C3E50] px-7 py-3.5 text-sm font-extrabold text-white transition hover:opacity-90"
            style={{ boxShadow: "0 10px 30px #4A90E255" }}
          >
            Get started
          </a>
          <a href="#studio" className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
            Learn more
          </a>
        </motion.div>
      </div>
    </section>
  );
}