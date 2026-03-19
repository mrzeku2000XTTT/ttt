import React, { useRef, useEffect, useCallback } from "react";

const TWO_PI = Math.PI * 2;

export default function DAGCanvas({ blocks, isMobile }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    particles: [],   // wormhole star-streaks
    blocks: [],      // DAG blocks flying out of tunnel
    rings: [],       // tunnel rings
    time: 0,
    lastT: 0,
    newBlocks: [],   // queue from React
  });

  // Receive new blocks from parent
  useEffect(() => {
    if (!blocks?.length) return;
    stateRef.current.newBlocks.push(...blocks);
  }, [blocks]);

  const drawFrame = useCallback((ts) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const s = stateRef.current;
    const dt = Math.min((ts - s.lastT) / 1000, 0.05);
    s.lastT = ts;
    s.time += dt;

    // ── Background with motion-blur trail ──────────────────────────────────
    ctx.fillStyle = "rgba(1,4,12,0.22)";
    ctx.fillRect(0, 0, W, H);

    // ── Tunnel rings ────────────────────────────────────────────────────────
    const RING_COUNT = isMobile ? 12 : 18;
    for (let i = 0; i < RING_COUNT; i++) {
      // rings cycle from far (small) to near (large)
      const phase = ((s.time * 0.55 + i / RING_COUNT) % 1);
      const depth = 1 - phase;             // 1 = far, 0 = near
      const scale = Math.pow(1 - depth, 0.6);
      const rx = (W * 0.55) * scale;
      const ry = (H * 0.38) * scale;
      const alpha = scale * 0.55;
      const hue = 165 + Math.sin(s.time * 0.4 + i) * 20;

      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, TWO_PI);
      ctx.strokeStyle = `hsla(${hue},100%,65%,${alpha})`;
      ctx.lineWidth = isMobile ? 0.8 : 1.2;
      ctx.stroke();
    }

    // ── Central portal glow ─────────────────────────────────────────────────
    const portalSize = Math.min(W, H) * 0.18;
    const portalPulse = 1 + 0.12 * Math.sin(s.time * 3.2);
    const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, portalSize * portalPulse);
    pg.addColorStop(0, "rgba(0,255,200,0.55)");
    pg.addColorStop(0.3, "rgba(0,212,170,0.25)");
    pg.addColorStop(0.7, "rgba(0,80,120,0.08)");
    pg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(cx, cy, portalSize * portalPulse * 1.4, 0, TWO_PI);
    ctx.fill();

    // ── Spawn star-streaks ───────────────────────────────────────────────────
    const MAX_PARTICLES = isMobile ? 120 : 280;
    if (s.particles.length < MAX_PARTICLES) {
      const count = isMobile ? 1 : 3;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * TWO_PI;
        const speed = 0.4 + Math.random() * 1.6;
        s.particles.push({
          angle,
          dist: Math.random() * 0.02,     // normalized 0–1 distance from center
          speed,
          color: Math.random() < 0.15 ? "#00ffcc" : "#ffffff",
          alpha: 0.4 + Math.random() * 0.6,
          width: Math.random() < 0.1 ? 1.5 : 0.7,
        });
      }
    }

    // ── Update & draw star-streaks ───────────────────────────────────────────
    ctx.save();
    s.particles = s.particles.filter((p) => {
      p.dist += p.speed * dt * 0.35;
      if (p.dist > 1.5) return false;

      // perspective: scale radially from center
      const maxR = Math.sqrt(cx * cx + cy * cy);
      const r0 = p.dist * maxR * 0.95;
      const r1 = Math.min(r0 + p.speed * 18 * dt * maxR * 0.3, r0 + 4);
      const x0 = cx + Math.cos(p.angle) * r0;
      const y0 = cy + Math.sin(p.angle) * r0;
      const x1 = cx + Math.cos(p.angle) * r1;
      const y1 = cy + Math.sin(p.angle) * r1;

      const fade = p.dist > 1.1 ? 1 - (p.dist - 1.1) / 0.4 : 1;
      ctx.globalAlpha = p.alpha * fade;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.width * (1 + p.dist * 0.8);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      return true;
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── Spawn DAG block nodes from new blocks queue ──────────────────────────
    while (s.newBlocks.length > 0) {
      const block = s.newBlocks.shift();
      const hash = block.blockHash || block.header?.hashMerkleRoot || Math.random().toString(36);
      if (s.blocks.find((b) => b.id === hash)) continue;

      const isChain = block.verboseData?.isChainBlock;
      const angle = Math.random() * TWO_PI;

      s.blocks.push({
        id: hash,
        angle,
        dist: 0,             // starts at center tunnel
        speed: 0.18 + Math.random() * 0.22,
        size: isChain ? (isMobile ? 5 : 9) : (isMobile ? 3 : 6),
        isChain,
        hue: isChain ? 160 : 200,
        alpha: 1,
        trail: [],
      });
    }

    // ── Update & draw DAG block nodes ────────────────────────────────────────
    const maxR = Math.min(W, H) * 0.5;
    s.blocks = s.blocks.filter((b) => {
      b.dist += b.speed * dt * 0.55;
      if (b.dist > 1.4) return false;

      const r = b.dist * maxR;
      const x = cx + Math.cos(b.angle) * r;
      const y = cy + Math.sin(b.angle) * r * 0.62; // elliptical tunnel warp

      // Record trail
      b.trail.push({ x, y });
      if (b.trail.length > (isMobile ? 6 : 12)) b.trail.shift();

      const scale = 0.15 + b.dist * 0.85;
      const fade = b.dist > 1.05 ? 1 - (b.dist - 1.05) / 0.35 : 1;
      b.alpha = fade;

      // Draw trail
      if (b.trail.length > 1) {
        for (let i = 1; i < b.trail.length; i++) {
          const t0 = b.trail[i - 1];
          const t1 = b.trail[i];
          const ta = (i / b.trail.length) * 0.4 * fade;
          ctx.beginPath();
          ctx.moveTo(t0.x, t0.y);
          ctx.lineTo(t1.x, t1.y);
          ctx.strokeStyle = b.isChain
            ? `rgba(0,255,190,${ta})`
            : `rgba(0,160,255,${ta})`;
          ctx.lineWidth = b.size * scale * 0.5;
          ctx.stroke();
        }
      }

      const rr = Math.max(b.size * scale, 1);

      // Glow halo
      if (b.isChain || b.dist < 0.5) {
        const gg = ctx.createRadialGradient(x, y, 0, x, y, rr * 3.5);
        gg.addColorStop(0, b.isChain ? `rgba(0,255,190,${0.5 * fade})` : `rgba(0,160,255,${0.35 * fade})`);
        gg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(x, y, rr * 3.5, 0, TWO_PI);
        ctx.fill();
      }

      // Node
      ctx.globalAlpha = b.alpha;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, TWO_PI);
      ctx.fillStyle = b.isChain ? `hsl(${b.hue},100%,60%)` : `hsl(${b.hue},85%,55%)`;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;

      return true;
    });

    // Trim oldest blocks
    const MAX_BLOCKS = isMobile ? 60 : 150;
    if (s.blocks.length > MAX_BLOCKS) s.blocks = s.blocks.slice(-MAX_BLOCKS);

    // ── Center portal core ───────────────────────────────────────────────────
    const coreSize = 6 + 3 * Math.sin(s.time * 5);
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 2);
    cg.addColorStop(0, "rgba(255,255,255,0.95)");
    cg.addColorStop(0.4, "rgba(0,255,200,0.7)");
    cg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, coreSize * 2, 0, TWO_PI);
    ctx.fill();

    requestAnimationFrame(drawFrame);
  }, [isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      const ctx = canvas.getContext("2d");
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      canvas.style.width = canvas.offsetWidth + "px";
      canvas.style.height = canvas.offsetHeight + "px";
    };

    // Set physical size without DPR scale trick (simpler, avoids rescale bug)
    const setSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setSize();

    const observer = new ResizeObserver(setSize);
    observer.observe(canvas);

    stateRef.current.lastT = performance.now();
    const rafId = requestAnimationFrame(drawFrame);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [drawFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ background: "#01040c", touchAction: "none" }}
    />
  );
}