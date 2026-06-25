import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Brain, Cpu, Sparkles, ChevronRight, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const AI_FEATURES = [
  { icon: Brain, title: "Autonomous Agents", desc: "AI agents that think, plan, and execute tasks on your behalf 24/7", color: "#ef4444" },
  { icon: Cpu, title: "Neural Processing", desc: "Access the most powerful AI models — Claude, GPT, Gemini — in one place", color: "#f97316" },
  { icon: Sparkles, title: "Image Generation", desc: "Create stunning visuals from text with state-of-the-art diffusion models", color: "#ec4899" },
  { icon: Zap, title: "Real-time Intelligence", desc: "Live data, web search, and instant AI responses at the speed of thought", color: "#8b5cf6" },
];

const AI_APPS = [
  { name: "Hikaru", desc: "AI Image Studio", path: "/Hikaru", color: "from-pink-600 to-rose-800" },
  { name: "Zeku AI", desc: "Autonomous Agent", path: "/ZekuAI", color: "from-violet-600 to-purple-800" },
  { name: "MIRAGE", desc: "AI Workflow Builder", path: "/MIRAGE", color: "from-red-600 to-orange-800" },
  { name: "Kine", desc: "AI Video Studio", path: "/Kine", color: "from-orange-500 to-red-700" },
  { name: "APEX", desc: "Proof of Work AI", path: "/APEX", color: "from-rose-500 to-pink-800" },
  { name: "ORIN", desc: "AI Navigator", path: "/ORIN", color: "from-fuchsia-600 to-violet-800" },
];

const WORLD_IMAGE = "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80";

export default function WorldOfAI() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 4 + 3,
    })));
  }, []);

  const handleGenerateImage = async () => {
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: "Futuristic AI neural network world, glowing red energy streams connecting floating data nodes, quantum computing landscape, ultra-detailed digital realm, cinematic lighting, 8k"
      });
      setGeneratedImage(res.url);
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <img src={WORLD_IMAGE} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.25) 0%, rgba(0,0,0,0.95) 70%)" }} />
      </div>

      {/* Floating particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: "#ef4444", boxShadow: "0 0 6px #ef444488" }}
          animate={{ y: [0, -30, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity }}
        />
      ))}

      {/* TTT Logo */}
      <button onClick={() => navigate("/Portal")} className="absolute top-5 left-5 z-50 text-white font-black text-2xl tracking-tight hover:opacity-70 transition-opacity">
        TTT
      </button>

      {/* Welcome modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative max-w-lg w-full rounded-3xl overflow-hidden"
              style={{ background: "rgba(15,5,5,0.95)", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 0 80px rgba(239,68,68,0.3)" }}
            >
              {/* Header glow */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, transparent, #ef4444, transparent)" }} />

              <div className="p-8 text-center">
                {/* Icon */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ background: "radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0.1) 100%)", border: "2px solid rgba(239,68,68,0.5)", boxShadow: "0 0 40px rgba(239,68,68,0.4)" }}
                >
                  <Brain className="w-10 h-10 text-red-400" />
                </motion.div>

                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">World of AI</h1>
                <div className="text-red-400 text-sm font-bold tracking-widest mb-5">⚡ INTELLIGENT UNIVERSE</div>

                <p className="text-white/60 text-base leading-relaxed mb-6">
                  Step into a realm where artificial intelligence reshapes reality. Autonomous agents, neural generation, and real-time intelligence await.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 justify-center mb-7">
                  {["AI Agents", "Image Gen", "Neural LLMs", "Real-time AI", "Vision Models"].map(f => (
                    <span key={f} className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
                      {f}
                    </span>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowWelcome(false)}
                  className="w-full py-4 rounded-2xl font-black text-lg tracking-wide flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #ef4444, #f97316, #ec4899)", boxShadow: "0 0 30px rgba(239,68,68,0.4)" }}
                >
                  Enter the World <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 pt-20 pb-16 px-4 max-w-5xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <div className="text-xs font-bold tracking-widest text-red-400 mb-2">⚡ WORLD OF AI</div>
          </motion.div>
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 leading-none"
            style={{ textShadow: "0 0 60px rgba(239,68,68,0.5)" }}>
            INTELLIGENT<br /><span style={{ color: "#ef4444" }}>UNIVERSE</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">The most powerful AI tools in the Kaspa ecosystem, unified.</p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {AI_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${f.color}33`, boxShadow: `0 0 20px ${f.color}11` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${f.color}22`, border: `1px solid ${f.color}44` }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                    <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* AI Image generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10 p-6 rounded-3xl"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <h3 className="text-white font-black text-lg mb-1">AI Image Generator</h3>
          <p className="text-white/40 text-sm mb-4">Generate a World of AI vision</p>
          {generatedImage ? (
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={generatedImage}
              alt="Generated AI world"
              className="w-full rounded-2xl object-cover mb-4"
              style={{ maxHeight: 300 }}
            />
          ) : (
            <div className="w-full h-40 rounded-2xl mb-4 flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px dashed rgba(239,68,68,0.2)" }}>
              <span className="text-white/20 text-sm">Your generated image appears here</span>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerateImage}
            disabled={generating}
            className="w-full py-3 rounded-2xl font-bold text-sm tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #ef4444, #f97316)", color: "white" }}
          >
            {generating ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> GENERATING...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> GENERATE AI WORLD</>
            )}
          </motion.button>
        </motion.div>

        {/* Apps grid */}
        <div>
          <h3 className="text-white font-black text-xl mb-4">AI Apps</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AI_APPS.map((app, i) => (
              <motion.button
                key={app.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(app.path)}
                className={`bg-gradient-to-br ${app.color} p-4 rounded-2xl text-left relative overflow-hidden`}
                style={{ minHeight: 80, boxShadow: "0 4px 20px rgba(239,68,68,0.15)" }}
              >
                <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 70% 30%, white, transparent)" }} />
                <div className="font-black text-white text-base">{app.name}</div>
                <div className="text-white/70 text-xs mt-0.5">{app.desc}</div>
                <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/40" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}