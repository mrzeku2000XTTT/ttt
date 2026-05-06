import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import {
  Sparkles, Play, Pause, Code2, Zap, Layers, Clock, Move, Eye,
  Cpu, Box, Rocket, Lightbulb, BookOpen, Wand2, Activity, Target,
  GitBranch, Gauge, Palette, Film, ArrowRight, Lock, Globe
} from "lucide-react";
import KatagamiAIEditor from "@/components/katagami/KatagamiAIEditor";

// ─────────────────────────────────────────────────────────────────────────
// 型紙 (Katagami) — Template
// A fullstack motion-design masterclass: principles → easing → orchestration
// → springs → scroll → code → performance → production patterns.
// Admin-only page inside the AppStore.
// ─────────────────────────────────────────────────────────────────────────

const CHAPTERS = [
  { id: "ai", label: "AI Editor 編集", icon: Sparkles },
  { id: "intro", label: "序章 · Intro", icon: BookOpen },
  { id: "principles", label: "12 Principles", icon: Lightbulb },
  { id: "easing", label: "Easing Lab", icon: Activity },
  { id: "timing", label: "Timing & Rhythm", icon: Clock },
  { id: "spring", label: "Springs", icon: Zap },
  { id: "orchestration", label: "Orchestration", icon: Layers },
  { id: "scroll", label: "Scroll Motion", icon: Move },
  { id: "transitions", label: "Page Transitions", icon: GitBranch },
  { id: "code", label: "Code Patterns", icon: Code2 },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "stack", label: "The Fullstack", icon: Box },
];

export default function Katagami() {
  const [active, setActive] = useState("intro");
  const sectionsRef = useRef({});

  // Track which section is in view
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.4) {
            setActive(e.target.dataset.id);
          }
        });
      },
      { threshold: [0.4] }
    );
    Object.values(sectionsRef.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = sectionsRef.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <Hero />

      {/* Sticky chapter nav */}
      <div className="sticky top-28 z-30 bg-black/80 backdrop-blur-xl border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {CHAPTERS.map((c) => {
            const Icon = c.icon;
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => scrollTo(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-fuchsia-500 to-orange-500 text-white shadow-lg shadow-fuchsia-500/30"
                    : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                }`}
              >
                <Icon className="w-3 h-3" />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-32">
        <Section id="ai" innerRef={(el) => (sectionsRef.current.ai = el)}>
          <KatagamiAIEditor />
        </Section>
        <Section id="intro" innerRef={(el) => (sectionsRef.current.intro = el)}>
          <IntroSection />
        </Section>
        <Section id="principles" innerRef={(el) => (sectionsRef.current.principles = el)}>
          <PrinciplesSection />
        </Section>
        <Section id="easing" innerRef={(el) => (sectionsRef.current.easing = el)}>
          <EasingSection />
        </Section>
        <Section id="timing" innerRef={(el) => (sectionsRef.current.timing = el)}>
          <TimingSection />
        </Section>
        <Section id="spring" innerRef={(el) => (sectionsRef.current.spring = el)}>
          <SpringSection />
        </Section>
        <Section id="orchestration" innerRef={(el) => (sectionsRef.current.orchestration = el)}>
          <OrchestrationSection />
        </Section>
        <Section id="scroll" innerRef={(el) => (sectionsRef.current.scroll = el)}>
          <ScrollSection />
        </Section>
        <Section id="transitions" innerRef={(el) => (sectionsRef.current.transitions = el)}>
          <TransitionsSection />
        </Section>
        <Section id="code" innerRef={(el) => (sectionsRef.current.code = el)}>
          <CodeSection />
        </Section>
        <Section id="performance" innerRef={(el) => (sectionsRef.current.performance = el)}>
          <PerformanceSection />
        </Section>
        <Section id="stack" innerRef={(el) => (sectionsRef.current.stack = el)}>
          <StackSection />
        </Section>
      </main>

      <footer className="py-12 text-center text-white/30 text-xs border-t border-white/5">
        型紙 · Katagami · The pattern from which all motion is cut
      </footer>
    </div>
  );
}

const Section = ({ id, innerRef, children }) => (
  <section ref={innerRef} data-id={id} className="scroll-mt-44">
    {children}
  </section>
);

// ── Hero ──────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/10">
      {/* Animated mesh gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 30% 30%, #c026d3 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, #f97316 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, #06b6d4 0%, transparent 50%), #000",
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-black/40" />
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center px-4"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-black tracking-widest uppercase flex items-center gap-1">
            <Lock className="w-3 h-3" /> Admin Only
          </div>
          <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-black tracking-widest uppercase">
            Fullstack · Motion Design
          </div>
        </div>
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-3 bg-gradient-to-br from-white via-fuchsia-200 to-orange-300 bg-clip-text text-transparent">
          型紙
        </h1>
        <p className="text-xl md:text-2xl text-white/80 font-light tracking-wide mb-2">
          Katagami · Template
        </p>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-white/60 mt-4">
          A fullstack masterclass on motion design. From the 12 principles to springs, scroll choreography, GPU-accelerated transforms, and production-grade React orchestration.
        </p>
        <motion.div
          className="mt-8 inline-flex items-center gap-2 text-white/40 text-xs"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowRight className="w-3 h-3 rotate-90" /> Scroll to begin
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Intro ─────────────────────────────────────────────────────────────────
function IntroSection() {
  return (
    <div>
      <ChapterHeader num="00" kanji="序" title="Why Motion Matters" />
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="space-y-4 text-white/80 leading-relaxed">
          <p>
            Motion is <span className="text-fuchsia-300 font-bold">communication</span>. It tells the user where things came from, where they're going, and how the system feels under their fingers.
          </p>
          <p>
            Bad motion is jarring, slow, or distracts. Good motion is <span className="text-orange-300 font-bold">invisible until you remove it</span>. Great motion makes the product feel alive.
          </p>
          <p>
            This guide is a complete tour of the craft — from physical intuition to code patterns to performance budgets.
          </p>
        </div>
        <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-fuchsia-900/40 to-orange-900/40 border border-white/10 overflow-hidden flex items-center justify-center">
          <motion.div
            className="w-32 h-32 rounded-3xl bg-gradient-to-br from-fuchsia-400 to-orange-400 shadow-2xl shadow-fuchsia-500/50"
            animate={{
              rotate: [0, 90, 180, 270, 360],
              borderRadius: ["1.5rem", "50%", "1.5rem", "50%", "1.5rem"],
              scale: [1, 1.1, 1, 1.1, 1],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── 12 Principles ─────────────────────────────────────────────────────────
const PRINCIPLES = [
  { name: "Squash & Stretch", desc: "Convey weight and elasticity through controlled deformation.", icon: "🫨" },
  { name: "Anticipation", desc: "Tiny pre-action that prepares the user for the main move.", icon: "👀" },
  { name: "Staging", desc: "Frame attention. One hero per moment.", icon: "🎬" },
  { name: "Straight-ahead vs Pose-to-Pose", desc: "Spontaneous flow vs planned keyframes.", icon: "📐" },
  { name: "Follow-through & Overlap", desc: "Different parts settle at different times.", icon: "🌊" },
  { name: "Slow In / Slow Out", desc: "Real things accelerate and decelerate. Linear is robotic.", icon: "🌀" },
  { name: "Arcs", desc: "Natural movement curves. Straight lines feel mechanical.", icon: "🏹" },
  { name: "Secondary Action", desc: "Supporting motion that enriches the primary.", icon: "✨" },
  { name: "Timing", desc: "Speed = mass + emotion. 200ms cheerful, 600ms heavy.", icon: "⏱️" },
  { name: "Exaggeration", desc: "Push beyond literal reality to communicate clearly.", icon: "💥" },
  { name: "Solid Drawing", desc: "Maintain weight and volume across frames.", icon: "🧊" },
  { name: "Appeal", desc: "Make it feel good. Charm matters.", icon: "💎" },
];

function PrinciplesSection() {
  return (
    <div>
      <ChapterHeader num="01" kanji="原則" title="The 12 Principles of Animation" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        Disney's foundational rules from <em>The Illusion of Life</em>. They predate the web by 80 years yet still govern every great UI motion today.
      </p>
      <div className="grid md:grid-cols-3 gap-3">
        {PRINCIPLES.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.04, duration: 0.4 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-fuchsia-400/40 transition-colors"
          >
            <div className="text-2xl mb-2">{p.icon}</div>
            <div className="text-sm font-bold text-white mb-1">{p.name}</div>
            <div className="text-[11px] text-white/50 leading-relaxed">{p.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Easing Lab ────────────────────────────────────────────────────────────
const EASINGS = [
  { name: "linear", curve: "linear", note: "Robotic, avoid for most UI" },
  { name: "easeIn", curve: [0.42, 0, 1, 1], note: "Slow start — exit animations" },
  { name: "easeOut", curve: [0, 0, 0.58, 1], note: "Fast start — entrance, default for UI" },
  { name: "easeInOut", curve: [0.42, 0, 0.58, 1], note: "Symmetric — for in-place transforms" },
  { name: "circOut", curve: [0, 0.55, 0.45, 1], note: "Aggressive deceleration" },
  { name: "expo", curve: [0.16, 1, 0.3, 1], note: "Modern designer's favorite" },
  { name: "back", curve: [0.34, 1.56, 0.64, 1], note: "Overshoots — playful bounce" },
];

function EasingSection() {
  const [playKey, setPlayKey] = useState(0);
  return (
    <div>
      <ChapterHeader num="02" kanji="緩急" title="Easing Lab" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        Easing is the <span className="text-fuchsia-300">soul</span> of motion. A bezier curve dictates how a value moves between two points — and changes everything emotionally.
      </p>
      <button
        onClick={() => setPlayKey((k) => k + 1)}
        className="mb-6 inline-flex items-center gap-2 px-4 h-9 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-bold"
      >
        <Play className="w-3.5 h-3.5" /> Replay all curves
      </button>
      <div className="space-y-2">
        {EASINGS.map((e) => (
          <div key={e.name} className="grid grid-cols-[140px_1fr_180px] items-center gap-4 py-2 border-b border-white/5">
            <div className="text-sm font-mono text-fuchsia-300">{e.name}</div>
            <div className="relative h-12 rounded-lg bg-white/[0.03] border border-white/10 overflow-hidden">
              <motion.div
                key={`${playKey}_${e.name}`}
                initial={{ x: 0 }}
                animate={{ x: "calc(100% - 2.5rem)" }}
                transition={{ duration: 1.6, ease: e.curve, repeat: Infinity, repeatDelay: 0.4 }}
                className="absolute top-1/2 -translate-y-1/2 left-1 w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-400 to-orange-400 shadow-lg"
              />
            </div>
            <div className="text-[10px] text-white/50">{e.note}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-fuchsia-900/20 to-orange-900/20 border border-white/10">
        <div className="text-xs font-bold text-orange-300 mb-2 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5" /> Rule of thumb</div>
        <p className="text-xs text-white/70 leading-relaxed">
          Use <code className="text-fuchsia-300 bg-black/40 px-1 rounded">easeOut</code> for things appearing (snappy entry), <code className="text-fuchsia-300 bg-black/40 px-1 rounded">easeIn</code> for things leaving, and <code className="text-fuchsia-300 bg-black/40 px-1 rounded">easeInOut</code> for in-place changes. <code className="text-fuchsia-300 bg-black/40 px-1 rounded">[0.22, 1, 0.36, 1]</code> is the gold-standard "smooth confident" curve.
        </p>
      </div>
    </div>
  );
}

// ── Timing & Rhythm ───────────────────────────────────────────────────────
function TimingSection() {
  const buckets = [
    { ms: 100, label: "Tap feedback", color: "from-cyan-400 to-blue-500" },
    { ms: 200, label: "Hover, micro", color: "from-emerald-400 to-cyan-500" },
    { ms: 300, label: "Standard UI", color: "from-fuchsia-400 to-violet-500" },
    { ms: 500, label: "Page transitions", color: "from-orange-400 to-red-500" },
    { ms: 800, label: "Hero / cinematic", color: "from-yellow-400 to-orange-500" },
  ];
  return (
    <div>
      <ChapterHeader num="03" kanji="間" title="Timing & Rhythm — 間 (Ma)" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        Japanese has a word for the <em>space between</em>: 間 (ma). It's the negative space of time — the silence that lets the music breathe.
      </p>
      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.ms} className="grid grid-cols-[80px_1fr_140px] items-center gap-3">
            <div className="text-2xl font-black tabular-nums text-white/90">{b.ms}<span className="text-xs text-white/40">ms</span></div>
            <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${b.color} rounded-full`}
                initial={{ width: 0 }}
                whileInView={{ width: `${(b.ms / 800) * 100}%` }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: b.ms / 1000, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="text-xs text-white/60">{b.label}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs font-bold text-fuchsia-300 mb-2">Material Design</div>
          <p className="text-xs text-white/60">Standard: 200–300ms · Complex: 375ms · Large surface: 500ms</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs font-bold text-orange-300 mb-2">Apple HIG</div>
          <p className="text-xs text-white/60">UIView default 0.25s · Spring response 0.5s · Damping 1.0</p>
        </div>
      </div>
    </div>
  );
}

// ── Springs ───────────────────────────────────────────────────────────────
function SpringSection() {
  const [config, setConfig] = useState({ stiffness: 200, damping: 20, mass: 1 });
  const [trigger, setTrigger] = useState(0);
  return (
    <div>
      <ChapterHeader num="04" kanji="弾性" title="Spring Physics" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        Springs simulate real-world physics. Instead of fixed durations, you define <span className="text-fuchsia-300">stiffness</span>, <span className="text-orange-300">damping</span>, and <span className="text-cyan-300">mass</span> — the system finds its own time.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <SliderRow label="Stiffness" value={config.stiffness} min={10} max={500} step={10} onChange={(v) => setConfig({ ...config, stiffness: v })} hint="Higher = snappier" />
          <SliderRow label="Damping" value={config.damping} min={1} max={50} step={1} onChange={(v) => setConfig({ ...config, damping: v })} hint="Lower = more bounce" />
          <SliderRow label="Mass" value={config.mass} min={0.1} max={5} step={0.1} onChange={(v) => setConfig({ ...config, mass: v })} hint="Higher = sluggish" />
          <button
            onClick={() => setTrigger((t) => t + 1)}
            className="w-full h-10 rounded-lg bg-gradient-to-r from-fuchsia-500 to-orange-500 text-white text-sm font-bold"
          >
            Trigger Spring
          </button>
        </div>
        <div className="relative h-64 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden flex items-center justify-center">
          <motion.div
            key={trigger}
            initial={{ x: -100, scale: 0.5 }}
            animate={{ x: 100, scale: 1 }}
            transition={{ type: "spring", ...config }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-fuchsia-400 to-orange-400 shadow-2xl shadow-fuchsia-500/40"
          />
        </div>
      </div>
      <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
        <div className="text-white/40 mb-2"># Framer Motion</div>
        <pre className="text-fuchsia-200 whitespace-pre-wrap">{`transition={{ type: "spring", stiffness: ${config.stiffness}, damping: ${config.damping}, mass: ${config.mass} }}`}</pre>
      </div>
    </div>
  );
}

const SliderRow = ({ label, value, min, max, step, onChange, hint }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs font-bold text-white/80">{label}</label>
      <span className="text-xs font-mono text-fuchsia-300">{value}</span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-fuchsia-500"
    />
    <div className="text-[10px] text-white/40 mt-0.5">{hint}</div>
  </div>
);

// ── Orchestration ─────────────────────────────────────────────────────────
function OrchestrationSection() {
  const [run, setRun] = useState(0);
  const items = [0, 1, 2, 3, 4, 5];
  return (
    <div>
      <ChapterHeader num="05" kanji="編成" title="Orchestration · Stagger & Choreography" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        Animating one element is easy. Animating ten in sequence so the eye flows naturally — that's choreography. The key is <span className="text-fuchsia-300">stagger</span>.
      </p>
      <button
        onClick={() => setRun((r) => r + 1)}
        className="mb-6 inline-flex items-center gap-2 px-4 h-9 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-bold"
      >
        <Play className="w-3.5 h-3.5" /> Replay
      </button>
      <div className="grid grid-cols-6 gap-3" key={run}>
        {items.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="aspect-square rounded-2xl bg-gradient-to-br from-fuchsia-500/40 to-orange-500/40 border border-white/20 flex items-center justify-center text-2xl font-black"
          >
            {i + 1}
          </motion.div>
        ))}
      </div>
      <div className="mt-8 p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
        <div className="text-white/40 mb-2"># Stagger pattern</div>
        <pre className="text-fuchsia-200 whitespace-pre-wrap">{`{items.map((it, i) => (
  <motion.div
    key={it.id}
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.08 }}
  />
))}`}</pre>
      </div>
    </div>
  );
}

// ── Scroll Motion ─────────────────────────────────────────────────────────
function ScrollSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["-50%", "50%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1.2, 0.6]);

  return (
    <div ref={ref}>
      <ChapterHeader num="06" kanji="巻物" title="Scroll-Driven Motion" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        Tying motion to the scrollbar transforms a page into a film. <code className="text-fuchsia-300 bg-black/40 px-1 rounded">useScroll</code> + <code className="text-fuchsia-300 bg-black/40 px-1 rounded">useTransform</code> map scroll progress to any value.
      </p>
      <div className="relative h-80 rounded-2xl bg-gradient-to-br from-fuchsia-900/20 to-orange-900/20 border border-white/10 overflow-hidden flex items-center justify-center">
        <motion.div
          style={{ x, rotate, scale }}
          className="w-32 h-32 rounded-3xl bg-gradient-to-br from-fuchsia-400 to-orange-400 shadow-2xl shadow-fuchsia-500/50 flex items-center justify-center text-white font-black"
        >
          SCROLL
        </motion.div>
      </div>
      <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
        <pre className="text-fuchsia-200 whitespace-pre-wrap">{`const { scrollYProgress } = useScroll({ target: ref });
const x = useTransform(scrollYProgress, [0, 1], ["-50%", "50%"]);
const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1.2, 0.6]);`}</pre>
      </div>
    </div>
  );
}

// ── Page Transitions ──────────────────────────────────────────────────────
function TransitionsSection() {
  const [page, setPage] = useState(0);
  const pages = [
    { color: "from-fuchsia-500 to-pink-500", label: "ONE" },
    { color: "from-cyan-500 to-blue-500", label: "TWO" },
    { color: "from-orange-500 to-red-500", label: "THREE" },
  ];
  return (
    <div>
      <ChapterHeader num="07" kanji="転換" title="Page Transitions" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        <code className="text-fuchsia-300 bg-black/40 px-1 rounded">AnimatePresence</code> lets you animate components <em>as they leave the tree</em> — the secret to elegant page transitions.
      </p>
      <div className="flex gap-2 mb-4">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`px-4 h-9 rounded-full text-xs font-bold transition-colors ${page === i ? "bg-white text-black" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
          >
            Page {i + 1}
          </button>
        ))}
      </div>
      <div className="relative h-64 rounded-2xl border border-white/10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 100, filter: "blur(20px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -100, filter: "blur(20px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 bg-gradient-to-br ${pages[page].color} flex items-center justify-center text-6xl font-black text-white`}
          >
            {pages[page].label}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Code Patterns ─────────────────────────────────────────────────────────
function CodeSection() {
  const snippets = [
    {
      title: "Variants — Reusable motion vocabulary",
      code: `const fade = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } }
};
<motion.div variants={fade} initial="hidden" animate="show" />`,
    },
    {
      title: "Layout animations — FLIP for free",
      code: `<motion.div layout transition={{ type: "spring", stiffness: 300 }}>
  {/* re-renders that change size/position auto-animate */}
</motion.div>`,
    },
    {
      title: "Gestures — drag, hover, tap",
      code: `<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  drag dragConstraints={{ left: 0, right: 200 }}
/>`,
    },
    {
      title: "Exit animations",
      code: `<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )}
</AnimatePresence>`,
    },
  ];
  return (
    <div>
      <ChapterHeader num="08" kanji="符" title="Code Patterns" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        The four patterns you'll use 90% of the time. Learn these by heart.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {snippets.map((s) => (
          <div key={s.title} className="rounded-xl bg-black/60 border border-white/10 overflow-hidden">
            <div className="px-4 py-2 border-b border-white/10 bg-white/[0.03] text-xs font-bold text-fuchsia-300">
              {s.title}
            </div>
            <pre className="p-4 text-[11px] font-mono text-white/80 overflow-x-auto whitespace-pre-wrap">{s.code}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Performance ───────────────────────────────────────────────────────────
function PerformanceSection() {
  const tips = [
    { title: "Animate only transform & opacity", desc: "These are GPU-composited. width/height/top/left trigger layout = jank.", icon: Cpu, ok: true },
    { title: "Use will-change sparingly", desc: "Promotes to its own layer, but too many = memory pressure. Add only when actively animating.", icon: Layers, ok: true },
    { title: "Prefer transform: translate3d()", desc: "Hints the GPU. Framer Motion does this automatically.", icon: Rocket, ok: true },
    { title: "Avoid animating box-shadow", desc: "Repaints every frame. Animate a separate shadow layer's opacity instead.", icon: Eye, ok: false },
    { title: "Throttle scroll handlers", desc: "Use requestAnimationFrame or useScroll hooks — not raw scroll events.", icon: Gauge, ok: true },
    { title: "Respect prefers-reduced-motion", desc: "Some users get sick. Always honor the OS-level setting.", icon: Target, ok: true },
  ];
  return (
    <div>
      <ChapterHeader num="09" kanji="速" title="Performance Budget" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        60fps means each frame has <span className="text-fuchsia-300 font-bold">16.67ms</span>. After React, paint, and composite, you have ~6ms of motion budget per frame. Every CSS property you touch matters.
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        {tips.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.title} className={`p-4 rounded-xl border ${t.ok ? "bg-emerald-500/5 border-emerald-500/30" : "bg-red-500/5 border-red-500/30"}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${t.ok ? "text-emerald-400" : "text-red-400"}`} />
                <div>
                  <div className="text-sm font-bold text-white mb-1">{t.title}</div>
                  <div className="text-[11px] text-white/60 leading-relaxed">{t.desc}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── The Fullstack ─────────────────────────────────────────────────────────
function StackSection() {
  const layers = [
    { layer: "Browser", what: "Compositor, GPU, requestAnimationFrame", color: "from-fuchsia-500 to-pink-500" },
    { layer: "CSS", what: "transitions, @keyframes, will-change, transform-3d", color: "from-pink-500 to-orange-500" },
    { layer: "Web APIs", what: "Web Animations API, IntersectionObserver, ResizeObserver", color: "from-orange-500 to-yellow-500" },
    { layer: "React", what: "useEffect, refs, render scheduling, AnimatePresence", color: "from-yellow-500 to-emerald-500" },
    { layer: "Framer Motion", what: "motion.* components, variants, layout, gestures, useScroll", color: "from-emerald-500 to-cyan-500" },
    { layer: "Three.js / R3F", what: "WebGL — 3D scenes, shaders, post-processing", color: "from-cyan-500 to-blue-500" },
    { layer: "Lottie / SVG", what: "Vector animations from After Effects", color: "from-blue-500 to-violet-500" },
    { layer: "Backend (LLM)", what: "Generate motion presets, narrate scenes, drive timeline keyframes", color: "from-violet-500 to-fuchsia-500" },
  ];
  return (
    <div>
      <ChapterHeader num="10" kanji="全層" title="The Full Stack of Motion" />
      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        Motion isn't one library — it's a stack. From the GPU compositor up to LLM-generated keyframes. Master each layer and you can ship anything.
      </p>
      <div className="space-y-2">
        {layers.map((l, i) => (
          <motion.div
            key={l.layer}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="grid grid-cols-[180px_1fr] items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10"
          >
            <div className={`px-3 h-8 rounded-lg bg-gradient-to-r ${l.color} flex items-center text-xs font-black text-white shadow-lg`}>
              {l.layer}
            </div>
            <div className="text-xs text-white/70">{l.what}</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-fuchsia-900/30 to-orange-900/30 border border-fuchsia-500/30 text-center">
        <Sparkles className="w-8 h-8 mx-auto text-fuchsia-300 mb-3" />
        <div className="text-lg font-black text-white mb-2">Now go animate something.</div>
        <div className="text-sm text-white/60">The pattern is cut. The cloth is yours.</div>
      </div>
    </div>
  );
}

// ── Shared chapter header ─────────────────────────────────────────────────
function ChapterHeader({ num, kanji, title }) {
  return (
    <div className="flex items-end gap-4 border-b border-white/10 pb-4">
      <div className="text-7xl md:text-8xl font-black text-white/10 leading-none tabular-nums">{num}</div>
      <div className="flex-1">
        <div className="text-3xl md:text-4xl font-black text-fuchsia-300 mb-1">{kanji}</div>
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
      </div>
      <Wand2 className="w-5 h-5 text-white/30 hidden md:block" />
    </div>
  );
}