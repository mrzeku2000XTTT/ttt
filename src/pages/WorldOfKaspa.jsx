import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Network, Shield, TrendingUp, ChevronRight, ArrowRight, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const KASPA_FEATURES = [
  { icon: Wallet, title: "Decentralized Wallets", desc: "Secure, self-custodial KAS wallets with full transaction history and KRC-20 support", color: "#14b8a6" },
  { icon: Network, title: "BlockDAG Network", desc: "10 blocks per second — the fastest proof-of-work network ever built", color: "#06b6d4" },
  { icon: Shield, title: "Cryptographic Identity", desc: "Agent ZK brings zero-knowledge identity to the Kaspa ecosystem", color: "#10b981" },
  { icon: TrendingUp, title: "DeFi & Markets", desc: "Prediction markets, token swaps, and staking all powered by KAS", color: "#3b82f6" },
];

const KASPA_APPS = [
  { name: "Terra Wallet", desc: "KAS & KRC-20", path: "/Terra", color: "from-teal-600 to-cyan-800" },
  { name: "Agent ZK", desc: "ZK Identity", path: "/AgentZK", color: "from-cyan-600 to-teal-800" },
  { name: "StakeDAG", desc: "Prediction Markets", path: "/StakeDAG", color: "from-emerald-600 to-teal-900" },
  { name: "KC Bridge", desc: "Buy KAS", path: "/KCbridge", color: "from-teal-500 to-green-800" },
  { name: "DAGKnight", desc: "Wallet & Identity", path: "/DAGKnightWallet", color: "from-cyan-500 to-blue-800" },
  { name: "Kaspa Node", desc: "Run a Node", path: "/Node", color: "from-teal-700 to-emerald-900" },
];

const WORLD_IMAGE = "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=1200&q=80";

export default function WorldOfKaspa() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [particles, setParticles] = useState([]);
  const [kaspaPrice, setKaspaPrice] = useState(null);

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 4 + 3,
    })));

    // Fetch KAS price
    base44.functions.invoke("getKaspaPrice", {}).then(r => {
      if (r?.data?.price) setKaspaPrice(r.data.price);
    }).catch(() => {});
  }, []);

  const handleGenerateImage = async () => {
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: "World of Kaspa cryptocurrency, teal glowing blockDAG network visualization, nodes connected by luminous teal energy beams, futuristic financial landscape, quantum blockchain realm, cinematic 8k render, professional digital art"
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
        <img src={WORLD_IMAGE} alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(20,184,166,0.2) 0%, rgba(0,0,0,0.95) 70%)" }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(rgba(20,184,166,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.3) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Floating particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: "#14b8a6", boxShadow: "0 0 6px #14b8a688" }}
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
              style={{ background: "rgba(0,10,12,0.95)", border: "1px solid rgba(20,184,166,0.3)", boxShadow: "0 0 80px rgba(20,184,166,0.3)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, transparent, #14b8a6, transparent)" }} />

              <div className="p-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ background: "radial-gradient(circle, rgba(20,184,166,0.4) 0%, rgba(20,184,166,0.1) 100%)", border: "2px solid rgba(20,184,166,0.5)", boxShadow: "0 0 40px rgba(20,184,166,0.4)" }}
                >
                  <Network className="w-10 h-10 text-teal-400" />
                </motion.div>

                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">World of Kaspa</h1>
                <div className="text-teal-400 text-sm font-bold tracking-widest mb-5">◈ BLOCKDAG UNIVERSE</div>

                {kaspaPrice && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                    style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)" }}>
                    <Zap className="w-4 h-4 text-teal-400" />
                    <span className="text-teal-300 text-sm font-bold">KAS: ${Number(kaspaPrice).toFixed(4)}</span>
                  </div>
                )}

                <p className="text-white/60 text-base leading-relaxed mb-6">
                  Enter the fastest proof-of-work blockDAG ever built. Instant transactions, zero pre-mine, true decentralization — Kaspa is digital freedom.
                </p>

                <div className="flex flex-wrap gap-2 justify-center mb-7">
                  {["10 BPS", "GHOSTDAG", "KRC-20", "Fair Launch", "PoW"].map(f => (
                    <span key={f} className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", color: "#5eead4" }}>
                      {f}
                    </span>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowWelcome(false)}
                  className="w-full py-4 rounded-2xl font-black text-lg tracking-wide flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6, #06b6d4)", boxShadow: "0 0 30px rgba(20,184,166,0.4)", color: "white" }}
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
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="text-xs font-bold tracking-widest text-teal-400 mb-2">◈ WORLD OF KASPA</div>
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 leading-none"
            style={{ textShadow: "0 0 60px rgba(20,184,166,0.5)" }}>
            BLOCKDAG<br /><span style={{ color: "#14b8a6" }}>UNIVERSE</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">The fastest proof-of-work blockchain ecosystem, powered by GHOSTDAG.</p>
          {kaspaPrice && (
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
              style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)" }}
            >
              <Zap className="w-4 h-4 text-teal-400" />
              <span className="text-teal-300 font-bold">KAS Live: ${Number(kaspaPrice).toFixed(4)}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {KASPA_FEATURES.map((f, i) => {
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

        {/* Image generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10 p-6 rounded-3xl"
          style={{ background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.2)" }}
        >
          <h3 className="text-white font-black text-lg mb-1">Kaspa Vision Generator</h3>
          <p className="text-white/40 text-sm mb-4">Generate a World of Kaspa visual</p>
          {generatedImage ? (
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={generatedImage}
              alt="Generated Kaspa world"
              className="w-full rounded-2xl object-cover mb-4"
              style={{ maxHeight: 300 }}
            />
          ) : (
            <div className="w-full h-40 rounded-2xl mb-4 flex items-center justify-center"
              style={{ background: "rgba(20,184,166,0.05)", border: "1px dashed rgba(20,184,166,0.2)" }}>
              <span className="text-white/20 text-sm">Your generated image appears here</span>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerateImage}
            disabled={generating}
            className="w-full py-3 rounded-2xl font-bold text-sm tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "white" }}
          >
            {generating ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> GENERATING...</>
            ) : (
              <><Network className="w-4 h-4" /> GENERATE KASPA WORLD</>
            )}
          </motion.button>
        </motion.div>

        {/* Apps grid */}
        <div>
          <h3 className="text-white font-black text-xl mb-4">Kaspa Apps</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {KASPA_APPS.map((app, i) => (
              <motion.button
                key={app.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(app.path)}
                className={`bg-gradient-to-br ${app.color} p-4 rounded-2xl text-left relative overflow-hidden`}
                style={{ minHeight: 80, boxShadow: "0 4px 20px rgba(20,184,166,0.15)" }}
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