import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Film, Zap, Layers, Download, ArrowRight, ArrowLeft, Cpu, Eye, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Layers, title: "Locked Characters", desc: "Seed your human and digital guardian once — every frame inherits the exact same design." },
  { icon: Film, title: "20-Frame Shot Runs", desc: "Define a motion sequence with start/end states and let the engine build every prompt." },
  { icon: Cpu, title: "Reference Chaining", desc: "Each frame is generated with the previous frame as visual input — defeating character drift." },
  { icon: Zap, title: "Filmstrip Timeline", desc: "Scrub through all frames, spot drift instantly, regenerate problem frames in one click." },
  { icon: Eye, title: "Prompt Editor", desc: "Auto-built prompts are fully editable. Enhance any frame with Claude before generating." },
  { icon: Download, title: "CapCut-Ready Export", desc: "Export frame_001.png … frame_020.png numbered sequence, ready to drop straight into CapCut." },
];

const STORY_BEATS = [
  { n: "01", name: "Stillness", desc: "Man alone in the golden wheat field" },
  { n: "02", name: "Contact", desc: "He crouches, touches the grass" },
  { n: "03", name: "The Meeting", desc: "Guardian materializes from light" },
  { n: "04", name: "The Reaching", desc: "Guardian's arm extends outward" },
  { n: "05", name: "The Choosing", desc: "Contact made — energy transfers" },
  { n: "06", name: "The Rise", desc: "Man stands, Guardian dissolves into him" },
  { n: "07", name: "Signal Check", desc: "Transformed — taps his own forearm" },
  { n: "08", name: "Aftermath", desc: "Alone again, changed, glow settling" },
];

export default function GhostFrameLanding() {
  const navigate = useNavigate();
  const [iconUrl, setIconUrl] = useState(null);
  const [generatingIcon, setGeneratingIcon] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthLoading(false); }).catch(() => setAuthLoading(false));
    const cached = sessionStorage.getItem("ghostframe_icon");
    if (cached) setIconUrl(cached);
  }, []);

  if (authLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" /></div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center px-5">
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Admin Only</h2>
          <p className="text-white/40 text-sm">Ghost Frame Studio is restricted to admins.</p>
        </div>
      </div>
    );
  }

  const generateIcon = async () => {
    setGeneratingIcon(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: "Ghost Frame Studio app icon: a translucent glowing blue-cyan humanoid silhouette with circuit-board vein patterns standing beside a human figure in a golden wheat field at sunset, cel-shaded anime style, dark background, minimal clean logo design, square format",
      });
      setIconUrl(res.url);
      sessionStorage.setItem("ghostframe_icon", res.url);
    } catch (e) {
      console.error(e);
    }
    setGeneratingIcon(false);
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center w-8 h-8 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-all" title="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          {iconUrl ? (
            <img src={iconUrl} alt="icon" className="w-8 h-8 rounded-xl object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
              <Film className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="font-black text-lg tracking-tight">Ghost Frame Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generateIcon}
            disabled={generatingIcon}
            className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all disabled:opacity-40"
          >
            {generatingIcon ? "Generating…" : "✦ Generate Icon"}
          </button>
          <motion.button
            onClick={() => navigate("/GhostFrameStudio")}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2 rounded-full text-sm font-bold text-black transition-all"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}
          >
            Launch App →
          </motion.button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)" }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-widest mb-6"
            style={{ background: "rgba(14,165,233,0.08)" }}>
            <Sparkles className="w-3 h-3" /> GHOST OF THE GRID · FRAME CONSISTENCY SUITE
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6 leading-none">
            <span className="text-white">Ghost Frame</span>
            <br />
            <span style={{ background: "linear-gradient(135deg, #0ea5e9, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Studio</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-white/60 leading-relaxed mb-10">
            Generate long, motion-consistent sequences of two fixed characters across a single animated music video. Every frame stays visually locked — human and digital guardian, frame 1 to 20.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <motion.button
              onClick={() => navigate("/GhostFrameStudio")}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-2 px-8 py-4 rounded-full text-base font-black text-black shadow-2xl"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", boxShadow: "0 0 40px rgba(14,165,233,0.4)" }}
            >
              <Film className="w-5 h-5" /> OPEN STUDIO <ArrowRight className="w-4 h-4" />
            </motion.button>
            <button
              onClick={generateIcon}
              disabled={generatingIcon}
              className="flex items-center gap-2 px-6 py-4 rounded-full text-base font-semibold border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" />
              {generatingIcon ? "Generating Icon…" : "Generate Custom Icon & Logo"}
            </button>
          </div>

          {iconUrl && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 flex justify-center">
              <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{ boxShadow: "0 0 60px rgba(14,165,233,0.3)" }}>
                <img src={iconUrl} alt="Generated icon" className="w-32 h-32 object-cover" />
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Story beats */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xs font-bold tracking-[0.4em] text-white/30 uppercase mb-6 text-center">// THE 8-BEAT STORY ARC</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STORY_BEATS.map((b, i) => (
              <motion.div key={b.n}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="p-4 rounded-2xl border border-white/8"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="text-xs font-black text-cyan-400/60 tracking-widest mb-1">{b.n}</div>
                <div className="text-sm font-bold text-white mb-1">{b.name}</div>
                <div className="text-xs text-white/40 leading-relaxed">{b.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Built for <span style={{ color: "#0ea5e9" }}>visual consistency</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                  className="p-5 rounded-2xl border border-white/8 hover:border-cyan-500/30 transition-all"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.2)" }}>
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="font-bold text-white mb-1">{f.title}</div>
                  <div className="text-sm text-white/50 leading-relaxed">{f.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Characters */}
      <section className="px-6 py-16 border-t border-white/8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10">The Two Characters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-amber-500/20" style={{ background: "rgba(245,158,11,0.05)" }}>
              <div className="text-xs font-black tracking-widest text-amber-400/60 mb-2">CHARACTER A</div>
              <div className="text-lg font-black text-white mb-3">The Chosen One</div>
              <p className="text-sm text-white/50 leading-relaxed">Short dark cropped hair, glasses, light beard, light-to-medium brown skin tone. White dress shirt, fitted dark vest, dark trousers. Calm composed expression.</p>
            </div>
            <div className="p-6 rounded-2xl border border-cyan-500/20" style={{ background: "rgba(6,182,212,0.05)" }}>
              <div className="text-xs font-black tracking-widest text-cyan-400/60 mb-2">CHARACTER B</div>
              <div className="text-lg font-black text-white mb-3">Ghost of the Grid</div>
              <p className="text-sm text-white/50 leading-relaxed">Translucent glowing blue-cyan humanoid. Circuit-board patterns like veins. No distinct facial features — just a soft glowing outline. Emits blue light onto nearby surfaces.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center border-t border-white/8">
        <h2 className="text-4xl font-black mb-4">Ready to build your sequence?</h2>
        <p className="text-white/50 mb-8">Start with a project, add a shot run, generate 20 frames with full consistency.</p>
        <motion.button
          onClick={() => navigate("/GhostFrameStudio")}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.03 }}
          className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-lg font-black text-black shadow-2xl"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", boxShadow: "0 0 60px rgba(14,165,233,0.4)" }}
        >
          <Film className="w-5 h-5" /> LAUNCH GHOST FRAME STUDIO
        </motion.button>
      </section>

      <footer className="px-6 py-6 text-center text-xs text-white/20 border-t border-white/8">
        Ghost Frame Studio · Frame Consistency Suite for "Ghost of the Grid"
      </footer>
    </div>
  );
}