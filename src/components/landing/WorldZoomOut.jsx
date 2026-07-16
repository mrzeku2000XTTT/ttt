import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Full-screen gold "warp speed" radial line overlay shown while the landing
// page zooms out into a small world. Center stays clear so the world is visible.
// Left/right controls turn between worlds in the carousel.
export default function WorldZoomOut({ onClose, worlds = [], index = 0, onNavigate }) {
  const canvasRef = useRef(null);
  const [showUi, setShowUi] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowUi(true), 2400);
    return () => clearTimeout(t);
  }, []);

  // Arrow-key world switching
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") onNavigate?.(-1);
      if (e.key === "ArrowRight") onNavigate?.(1);
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate, onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const LINES = 160;
    const lines = Array.from({ length: LINES }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random(),
      speed: 0.01 + Math.random() * 0.025,
      len: 0.05 + Math.random() * 0.18,
      w: Math.random() < 0.15 ? 2 : 1,
    }));
    let ringPhase = 0;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const maxR = Math.hypot(cx, cy);
      const innerR = Math.min(W, H) * 0.14;
      ctx.clearRect(0, 0, W, H);

      // expanding concentric pattern rings
      ringPhase += 0.014;
      for (let i = 0; i < 6; i++) {
        const p = (ringPhase + i / 6) % 1;
        const rr = innerR + p * (maxR - innerR);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,150,40,${0.16 * (1 - p)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // fast radial speed lines
      for (const l of lines) {
        l.dist += l.speed;
        if (l.dist > 1) { l.dist = 0; l.angle = Math.random() * Math.PI * 2; }
        const r0 = innerR + l.dist * (maxR - innerR);
        const r1 = Math.min(r0 + l.len * maxR * (0.35 + l.dist), maxR);
        const cos = Math.cos(l.angle), sin = Math.sin(l.angle);
        const alpha = Math.min(1, l.dist * 3) * (1 - l.dist * 0.3);
        const grad = ctx.createLinearGradient(cx + cos * r0, cy + sin * r0, cx + cos * r1, cy + sin * r1);
        grad.addColorStop(0, "rgba(240,200,80,0)");
        grad.addColorStop(1, `rgba(240,200,80,${0.7 * alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = l.w;
        ctx.beginPath();
        ctx.moveTo(cx + cos * r0, cy + sin * r0);
        ctx.lineTo(cx + cos * r1, cy + sin * r1);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const canLeft = index > 0;
  const canRight = index < worlds.length - 1;
  const current = worlds[index] || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-40 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {showUi && (
        <>
          {/* Current world label + dots */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 top-8 flex flex-col items-center gap-2">
            <div className="text-[10px] tracking-[0.5em] uppercase text-center px-4"
              style={{ color: "rgba(220,175,70,0.7)", fontFamily: "monospace", textShadow: "0 0 20px rgba(200,140,0,0.5)" }}>
              {current.name || "TTT"} · {current.desc || "SECTOR 01"}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[80vw]">
              {worlds.map((_, i) => (
                <div key={i} className="rounded-full transition-all"
                  style={{ width: i === index ? 14 : 5, height: 5,
                    background: i === index ? "rgba(240,200,80,0.9)" : "rgba(200,150,40,0.3)",
                    boxShadow: i === index ? "0 0 10px rgba(240,200,80,0.6)" : "none" }} />
              ))}
            </div>
          </motion.div>

          {/* Turn LEFT */}
          <motion.button initial={{ opacity: 0, x: -12 }} animate={{ opacity: canLeft ? 1 : 0.2, x: 0 }}
            whileTap={canLeft ? { scale: 0.9, x: -4 } : {}}
            onClick={() => canLeft && onNavigate?.(-1)}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 pointer-events-auto focus:outline-none p-3"
            style={{ border: "1px solid rgba(180,140,60,0.5)", background: "rgba(0,0,0,0.6)",
              boxShadow: "0 4px 0 rgba(140,100,30,0.5)", cursor: canLeft ? "pointer" : "default" }}>
            <ChevronLeft className="w-5 h-5" style={{ color: "rgba(230,190,90,0.85)" }} />
          </motion.button>

          {/* Turn RIGHT */}
          <motion.button initial={{ opacity: 0, x: 12 }} animate={{ opacity: canRight ? 1 : 0.2, x: 0 }}
            whileTap={canRight ? { scale: 0.9, x: 4 } : {}}
            onClick={() => canRight && onNavigate?.(1)}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 pointer-events-auto focus:outline-none p-3"
            style={{ border: "1px solid rgba(180,140,60,0.5)", background: "rgba(0,0,0,0.6)",
              boxShadow: "0 4px 0 rgba(140,100,30,0.5)", cursor: canRight ? "pointer" : "default" }}>
            <ChevronRight className="w-5 h-5" style={{ color: "rgba(230,190,90,0.85)" }} />
          </motion.button>

          {/* Bottom label + return */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 pointer-events-auto px-4">
            <div className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase text-center"
              style={{ color: "rgba(220,175,70,0.75)", fontFamily: "monospace", textShadow: "0 0 20px rgba(200,140,0,0.5)" }}>
              YOU ARE VIEWING A FRAGMENT OF A GREATER WORLD · TURN ◂ ▸ TO SWITCH
            </div>
            <motion.button whileTap={{ scale: 0.95, y: 3 }} onClick={onClose}
              className="text-[10px] tracking-[0.25em] uppercase px-4 py-2 focus:outline-none"
              style={{ border: "1px solid rgba(180,140,60,0.5)", color: "rgba(230,190,90,0.85)",
                background: "rgba(0,0,0,0.6)", fontFamily: "monospace",
                boxShadow: "0 4px 0 rgba(140,100,30,0.5), 0 6px 14px rgba(0,0,0,0.7)" }}>
              [ RETURN TO WORLD ]
            </motion.button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}