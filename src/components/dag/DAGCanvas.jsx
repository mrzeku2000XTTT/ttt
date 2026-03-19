import React, { useRef, useEffect, useCallback } from "react";

// Colors matching Kaspadrome's teal-on-black aesthetic
const C = {
  bg: "#030712",
  chain: "#00d4aa",
  normal: "#0ea5e9",
  edge: "rgba(0,212,170,0.18)",
  gridLine: "rgba(0,212,170,0.04)",
  text: "rgba(0,212,170,0.6)",
};

export default function DAGCanvas({ blocks, isMobile }) {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);         // live node objects
  const animRef = useRef(null);
  const lastTRef = useRef(0);

  const SPEED = isMobile ? 28 : 48;   // px/sec
  const R = isMobile ? 4 : 7;         // node radius
  const MAX = isMobile ? 80 : 250;

  // Convert new blocks into canvas nodes, injected at the right edge
  useEffect(() => {
    if (!blocks?.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const H = canvas.height;

    blocks.forEach((block) => {
      const hash = block.blockHash || block.header?.hashMerkleRoot || Math.random().toString(36);

      // Deduplicate
      if (nodesRef.current.find((n) => n.id === hash)) return;

      // Determine block type
      const isChain = block.verboseData?.isChainBlock;
      const parentHashes = block.header?.parents?.[0]?.parentHashes || [];

      nodesRef.current.push({
        id: hash,
        x: canvas.width + R + 5,
        y: H * 0.08 + Math.random() * H * 0.84,
        r: R + (isChain ? 2 : 0),   // chain blocks slightly larger
        color: isChain ? C.chain : C.normal,
        glow: isChain,
        alpha: 1,
        parents: parentHashes,       // short hash refs for edge drawing
        daaScore: parseInt(block.header?.daaScore || "0"),
      });
    });

    // Trim oldest
    if (nodesRef.current.length > MAX) {
      nodesRef.current = nodesRef.current.slice(nodesRef.current.length - MAX);
    }
  }, [blocks, MAX, R]);

  const drawFrame = useCallback((ts) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const dt = Math.min((ts - lastTRef.current) / 1000, 0.05);
    lastTRef.current = ts;

    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const nodes = nodesRef.current;
    const idMap = {};
    nodes.forEach((n) => { idMap[n.id] = n; });

    // Move + fade
    nodes.forEach((n) => {
      n.x -= SPEED * dt;
      if (n.x < 100) n.alpha = Math.max(0, n.x / 100);
    });
    nodesRef.current = nodes.filter((n) => n.alpha > 0.01 && n.x > -20);

    // Draw edges
    nodesRef.current.forEach((n) => {
      n.parents.forEach((pid) => {
        // Match by prefix — parent hashes are full, our IDs are blockHash
        const parent = idMap[pid] || nodesRef.current.find((x) => x.id.startsWith(pid.slice(0, 8)));
        if (!parent) return;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(parent.x, parent.y);
        ctx.strokeStyle = `rgba(0,212,170,${0.14 * Math.min(n.alpha, parent.alpha)})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
    });

    // Draw nodes
    nodesRef.current.forEach((n) => {
      ctx.globalAlpha = n.alpha;

      // Glow halo for chain blocks
      if (n.glow) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3.5);
        g.addColorStop(0, "rgba(0,212,170,0.35)");
        g.addColorStop(1, "rgba(0,212,170,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node body
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();

      // Rim
      ctx.strokeStyle = n.glow ? "rgba(0,212,170,0.8)" : "rgba(255,255,255,0.15)";
      ctx.lineWidth = n.glow ? 1.5 : 0.8;
      ctx.stroke();

      ctx.globalAlpha = 1;
    });

    // Flow label
    ctx.fillStyle = "rgba(0,212,170,0.1)";
    ctx.font = `${isMobile ? 8 : 10}px monospace`;
    ctx.textAlign = "right";
    ctx.fillText("← BLOCKS FLOWING", W - 8, H - 8);

    animRef.current = requestAnimationFrame(drawFrame);
  }, [SPEED, isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    lastTRef.current = performance.now();
    animRef.current = requestAnimationFrame(drawFrame);

    return () => {
      observer.disconnect();
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [drawFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ background: C.bg, touchAction: "none" }}
    />
  );
}