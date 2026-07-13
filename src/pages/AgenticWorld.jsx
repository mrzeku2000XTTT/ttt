import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bot, ArrowLeft, Zap, Network, Sparkles } from "lucide-react";

// Agentic World — a new window landing page, sector 02 of the greater TTT universe
const NODES = 42;

function AgentNetworkCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const nodes = Array.from({ length: NODES }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0008, vy: (Math.random() - 0.5) * 0.0008,
      r: 1 + Math.random() * 2,
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[i].x - nodes[j].x) * W, dy = (nodes[i].y - nodes[j].y) * H;
          const d = Math.hypot(dx, dy);
          if (d < 160) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
            ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
            ctx.strokeStyle = `rgba(120,220,255,${0.12 * (1 - d / 160)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120,220,255,0.5)";
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
}

const PORTALS = [
  { name: "AGENT HUB", desc: "Command your AI agents", icon: Bot, path: "/AIAgentHub" },
  { name: "AGENT ZK", desc: "The sovereign agent", icon: Zap, path: "/AgentZK" },
  { name: "SCENARIO BOT", desc: "Simulate anything", icon: Network, path: "/ScenarioBot" },
];

export default function AgenticWorld() {
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 400); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative"
      style={{ background: "radial-gradient(ellipse at 50% 120%, #041018 0%, #000 60%)" }}>
      <AgentNetworkCanvas />

      {/* Return to TTT Prime */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        onClick={() => navigate("/")}
        className="fixed top-5 left-5 z-20 flex items-center gap-2 px-3 py-2 text-[10px] tracking-[0.3em] uppercase focus:outline-none"
        style={{ border: "1px solid rgba(120,220,255,0.3)", background: "rgba(0,0,0,0.6)",
          color: "rgba(150,225,255,0.8)", fontFamily: "monospace" }}>
        <ArrowLeft className="w-3.5 h-3.5" /> TTT PRIME
      </motion.button>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* Sector tag */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -10 }}
          className="text-[10px] tracking-[0.6em] uppercase mb-6 flex items-center gap-3"
          style={{ color: "rgba(120,220,255,0.5)", fontFamily: "monospace" }}>
          <span className="w-8 h-px" style={{ background: "rgba(120,220,255,0.3)" }} />
          SECTOR 02 · AGENTIC WORLD
          <span className="w-8 h-px" style={{ background: "rgba(120,220,255,0.3)" }} />
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: entered ? 1 : 0, scale: entered ? 1 : 0.9 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-center leading-none"
          style={{ fontFamily: "'Georgia', serif",
            background: "linear-gradient(180deg, #eafaff 0%, #8fd8f5 40%, #2a7ba0 90%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            filter: "drop-shadow(0 0 40px rgba(100,200,255,0.35))" }}>
          AGENTIC<br />WORLD
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ delay: 0.5 }}
          className="mt-6 text-[11px] sm:text-xs tracking-[0.35em] uppercase text-center max-w-xl"
          style={{ color: "rgba(160,220,245,0.55)", fontFamily: "monospace" }}>
          WHERE AUTONOMOUS AGENTS LIVE, THINK, AND WORK FOR YOU
        </motion.p>

        {/* Portals */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 24 }}
          transition={{ delay: 0.8 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {PORTALS.map((p) => {
            const Icon = p.icon;
            return (
              <motion.button key={p.name} onClick={() => navigate(p.path)}
                whileHover={{ y: -4 }} whileTap={{ scale: 0.96, y: 2 }}
                className="flex flex-col items-center gap-3 px-6 py-7 focus:outline-none group"
                style={{ border: "1px solid rgba(120,220,255,0.25)", background: "rgba(5,20,30,0.5)",
                  boxShadow: "0 4px 0 rgba(40,90,120,0.4), 0 8px 24px rgba(0,0,0,0.6)" }}>
                <Icon className="w-6 h-6 transition-colors" style={{ color: "rgba(140,220,255,0.8)" }} strokeWidth={1.5} />
                <div className="text-[11px] font-bold tracking-[0.3em]" style={{ color: "rgba(210,240,255,0.9)", fontFamily: "monospace" }}>
                  {p.name}
                </div>
                <div className="text-[9px] tracking-[0.15em] uppercase" style={{ color: "rgba(140,200,230,0.4)", fontFamily: "monospace" }}>
                  {p.desc}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} transition={{ delay: 1.2 }}
          className="mt-14 flex items-center gap-2 text-[9px] tracking-[0.45em] uppercase"
          style={{ color: "rgba(120,190,220,0.4)", fontFamily: "monospace" }}>
          <Sparkles className="w-3 h-3" />
          <span>A FRAGMENT OF THE TTT UNIVERSE</span>
        </motion.div>
      </div>
    </div>
  );
}