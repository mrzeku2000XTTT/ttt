import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Full-screen canvas portal transition.
 * Animates from the button's origin point, expanding to fill the viewport
 * with a swirling cyan→violet→pink portal, then navigates.
 */
export default function PortalTransition({ origin, onComplete }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const cx = origin?.x ?? w / 2;
    const cy = origin?.y ?? h / 2;
    const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.1;
    const duration = 1100; // ms

    // pre-spawn particles
    const particles = Array.from({ length: 90 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 40,
      speed: 0.5 + Math.random() * 2.5,
      size: 1 + Math.random() * 3,
      hue: 180 + Math.random() * 140, // cyan→violet→pink
    }));

    const draw = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1);
      // ease-in-out cubic
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      ctx.clearRect(0, 0, w, h);

      // expanding portal radius
      const r = maxR * e;

      // outer dim layer
      ctx.fillStyle = `rgba(0,0,0,${e * 0.95})`;
      ctx.fillRect(0, 0, w, h);

      // gradient core
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(255,255,255,${0.95})`);
      grad.addColorStop(0.15, `rgba(167,139,250,${0.9})`);
      grad.addColorStop(0.4, `rgba(6,182,212,${0.6})`);
      grad.addColorStop(0.7, `rgba(236,72,153,${0.3})`);
      grad.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // swirling rings
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 4; i++) {
        const ringR = r * (0.5 + i * 0.12);
        const alpha = (1 - i * 0.2) * (1 - e * 0.3);
        ctx.strokeStyle = `hsla(${190 + i * 40},85%,65%,${alpha})`;
        ctx.lineWidth = 2 + i * 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // streaking particles
      particles.forEach((p) => {
        p.dist += p.speed * (3 + e * 18);
        p.angle += 0.04;
        const px = cx + Math.cos(p.angle) * p.dist;
        const py = cy + Math.sin(p.angle) * p.dist;
        if (p.dist > maxR) p.dist = 0;
        ctx.fillStyle = `hsla(${p.hue},90%,70%,${1 - e * 0.4})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // bright flash near end
      if (t > 0.85) {
        const flash = (t - 0.85) / 0.15;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [origin, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[99999] pointer-events-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </motion.div>
  );
}