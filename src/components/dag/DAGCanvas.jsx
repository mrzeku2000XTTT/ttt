import React, { useRef, useEffect, useCallback } from "react";

const COLORS = {
  blue: "#00d4aa",       // selected chain block
  orphan: "#334155",     // orphan block
  normal: "#0ea5e9",     // normal block
  edge: "#00d4aa",       // connection lines
  bg: "#030712",
  text: "#00d4aa",
  highlight: "#f59e0b",  // user tx highlight
};

export default function DAGCanvas({ blocks, isMobile }) {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);

  const MAX_NODES = isMobile ? 60 : 200;
  const SPEED = isMobile ? 30 : 50; // px/sec
  const NODE_RADIUS = isMobile ? 5 : 8;

  // Convert incoming blocks to canvas nodes
  useEffect(() => {
    if (!blocks || blocks.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    blocks.forEach((block) => {
      // Avoid duplicates
      if (nodesRef.current.find((n) => n.id === block.blockHash)) return;

      const isBlue = block.verboseData?.isChainBlock;
      const parentCount = block.verboseData?.mergeSetBluesHashes?.length || 0;

      const node = {
        id: block.blockHash,
        x: W + NODE_RADIUS + 10,
        y: H * 0.1 + Math.random() * H * 0.8,
        radius: NODE_RADIUS,
        color: isBlue ? COLORS.blue : parentCount === 0 ? COLORS.orphan : COLORS.normal,
        glow: isBlue,
        alpha: 1,
        parents: block.header?.parents?.[0]?.parentHashes || [],
        txCount: block.transactions?.length || 0,
        blueScore: block.verboseData?.blueScore || 0,
      };

      nodesRef.current.push(node);
    });

    // Trim oldest nodes
    if (nodesRef.current.length > MAX_NODES) {
      nodesRef.current = nodesRef.current.slice(nodesRef.current.length - MAX_NODES);
    }
  }, [blocks, MAX_NODES]);

  const draw = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Draw grid lines (subtle)
    ctx.strokeStyle = "rgba(0,212,170,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const nodes = nodesRef.current;

    // Build id->node map for parent lookup
    const nodeMap = {};
    nodes.forEach((n) => { nodeMap[n.id] = n; });

    // Move nodes left
    nodes.forEach((node) => {
      node.x -= SPEED * dt;
      // Fade out nodes near left edge
      if (node.x < 80) {
        node.alpha = Math.max(0, node.x / 80);
      }
    });

    // Remove fully faded nodes
    nodesRef.current = nodes.filter((n) => n.alpha > 0.02 && n.x > -20);

    // Draw edges first
    nodesRef.current.forEach((node) => {
      node.parents.forEach((parentId) => {
        const parent = nodeMap[parentId];
        if (!parent) return;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(parent.x, parent.y);
        ctx.strokeStyle = `rgba(0,212,170,${0.15 * node.alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
    });

    // Draw nodes
    nodesRef.current.forEach((node) => {
      ctx.globalAlpha = node.alpha;

      // Glow for chain blocks
      if (node.glow) {
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 3);
        grad.addColorStop(0, "rgba(0,212,170,0.4)");
        grad.addColorStop(1, "rgba(0,212,170,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Border
      ctx.strokeStyle = node.glow ? "#00d4aa" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // TX count label (only on desktop for visible nodes)
      if (!isMobile && node.txCount > 0 && node.alpha > 0.5 && node.x < W - 20) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(node.txCount + "tx", node.x, node.y - node.radius - 3);
      }

      ctx.globalAlpha = 1;
    });

    // "Flow" label on right side
    ctx.fillStyle = "rgba(0,212,170,0.15)";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText("← BLOCKS FLOWING", W - 10, H - 10);

    animFrameRef.current = requestAnimationFrame(draw);
  }, [SPEED, NODE_RADIUS, isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block", background: COLORS.bg }}
    />
  );
}