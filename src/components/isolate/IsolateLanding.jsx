import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Brain, Sparkles, MessageCircle, Map, Github, ArrowRight } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2a0fa1205_generated_image.png";

export default function IsolateLanding({ onStart }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-2xl border-b border-zinc-200/50">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="ISOLATE" className="w-7 h-7 rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">ISOLATE</span>
          </div>
          <button
            onClick={onStart}
            className="text-[13px] font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
          >
            Start Learning →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-20 pb-10">
        <motion.div style={{ y: heroY, scale: heroScale, opacity: heroOpacity }} className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/20">
              <img src={LOGO_URL} alt="ISOLATE brain" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-[-0.04em] leading-[0.95] text-zinc-900">
              Learn anything.
            </h1>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-[-0.04em] leading-[0.95] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent mt-1">
              Through anything.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-lg sm:text-xl text-zinc-500 max-w-xl font-normal tracking-tight"
          >
            Pick a topic. Choose a theme you love. Get a personalized course with an AI tutor that explains everything in metaphors you already understand.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9"
          >
            <button
              onClick={onStart}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-zinc-900 text-white text-[15px] font-medium hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-100 shadow-lg"
            >
              Start Learning Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </motion.div>

        {/* ── MacBook-style product showcase ── */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 w-full max-w-4xl"
        >
          <MacBookMockup />
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 bg-[#fbfbfd]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-zinc-900">How it works.</h2>
            <p className="mt-4 text-lg text-zinc-500">Three steps. Endless topics.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: "Pick your topic", desc: "Tell us what you want to learn — anything from Python to guitar chords. Set your level and pick a theme you love." },
              { icon: Map, title: "Get your course", desc: "We generate a multi-module course that wraps real concepts in metaphors from your theme. Each module has illustrations and a knowledge check." },
              { icon: MessageCircle, title: "Chat with your tutor", desc: "Ask questions at any step. Your AI tutor responds in the theme's voice and re-explains things differently if you're stuck." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center mx-auto mb-5">
                  <step.icon className="w-6 h-6 text-violet-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-zinc-900 mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-[15px] leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature highlight ── */}
      <section className="py-24 px-6 bg-zinc-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[13px] font-medium mb-6">
              <Brain className="w-4 h-4 text-violet-400" />
              Adaptive learning
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-tight">
              If the metaphor doesn't click,
              <br />
              <span className="text-violet-400">we try a different one.</span>
            </h2>
            <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
              Get a knowledge check wrong? We regenerate the explanation with a deeper or different analogy. No two learners get the same path.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── GitHub / Portfolio ── */}
      <section className="py-24 px-6 bg-[#fbfbfd]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-5">
              <Github className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-zinc-900">
              Your learning, exported.
            </h2>
            <p className="mt-5 text-lg text-zinc-500 max-w-xl mx-auto">
              Optionally connect GitHub. Every completed course exports as structured Markdown to a repo you choose — building a portfolio of what you've studied over time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-[#fbfbfd]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] text-zinc-900">
            Start your first course.
          </h2>
          <p className="mt-5 text-lg text-zinc-500">It's free. No paywall on the tutor.</p>
          <button
            onClick={onStart}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-900 text-white text-[15px] font-medium hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-100 shadow-lg"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-zinc-200/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="ISOLATE" className="w-5 h-5 rounded" />
            <span className="text-[13px] font-medium text-zinc-400">ISOLATE</span>
          </div>
          <p className="text-[13px] text-zinc-400">Learn anything. Through anything.</p>
        </div>
      </footer>
    </div>
  );
}

// ── MacBook-style mockup component ──
function MacBookMockup() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label: "Dashboard", color: "from-violet-500 to-fuchsia-500" },
    { label: "Course", color: "from-cyan-500 to-blue-500" },
    { label: "Tutor Chat", color: "from-emerald-500 to-teal-500" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTab((t) => (t + 1) % tabs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tabs.length]);

  return (
    <div className="relative">
      {/* Screen */}
      <div className="relative rounded-t-2xl overflow-hidden ring-1 ring-zinc-200 shadow-2xl shadow-zinc-300/50 bg-zinc-100" style={{ aspectRatio: "16/10" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50" />
        {/* Browser bar */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-zinc-100/90 backdrop-blur border-b border-zinc-200/60 flex items-center px-3 gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[10px] text-zinc-400 font-medium">isolate.app</div>
        </div>
        {/* Content area */}
        <div className="absolute top-8 left-0 right-0 bottom-0 p-6 sm:p-10 flex flex-col items-center justify-center">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center w-full max-w-md"
          >
            {tab === 0 && (
              <>
                <div className="text-[10px] font-semibold tracking-widest text-violet-500 uppercase mb-2">Your Courses</div>
                <div className="grid grid-cols-2 gap-3">
                  {["Python × Disney", "Neural Nets × Star Wars"].map((t) => (
                    <div key={t} className="rounded-xl bg-white shadow-md p-3 text-left">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-400 mb-2" />
                      <div className="text-[10px] font-semibold text-zinc-800">{t}</div>
                      <div className="mt-1.5 h-1 rounded-full bg-zinc-100">
                        <div className="h-1 rounded-full bg-violet-400" style={{ width: "60%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {tab === 1 && (
              <>
                <div className="text-[10px] font-semibold tracking-widest text-cyan-500 uppercase mb-3">Module Path</div>
                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center">
                      <div className={`w-9 h-9 rounded-full ${i < 3 ? "bg-cyan-400" : i === 3 ? "bg-cyan-200 ring-2 ring-cyan-400" : "bg-zinc-200"} flex items-center justify-center text-[10px] font-bold text-white`}>
                        {i + 1}
                      </div>
                      {i < 4 && <div className={`w-4 h-0.5 ${i < 3 ? "bg-cyan-400" : "bg-zinc-200"}`} />}
                    </div>
                  ))}
                </div>
              </>
            )}
            {tab === 2 && (
              <>
                <div className="text-[10px] font-semibold tracking-widest text-emerald-500 uppercase mb-3">AI Tutor</div>
                <div className="space-y-2 text-left">
                  <div className="rounded-2xl rounded-tl-sm bg-white shadow-sm p-2.5 text-[10px] text-zinc-600 max-w-[80%]">
                    So variables are like Elsa's magic?
                  </div>
                  <div className="rounded-2xl rounded-tr-sm bg-emerald-400 shadow-sm p-2.5 text-[10px] text-white max-w-[85%] ml-auto">
                    Exactly! The spell name stays the same, but what it holds can change. Same with variables.
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
      {/* Base */}
      <div className="relative h-3 bg-gradient-to-b from-zinc-300 to-zinc-400 rounded-b-xl" />
      <div className="mx-auto w-20 h-1 bg-zinc-400/60 rounded-b-lg -mt-0.5" />
      {/* Tab indicator */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${tab === i ? `bg-gradient-to-r ${t.color} text-white` : "bg-zinc-100 text-zinc-400"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}