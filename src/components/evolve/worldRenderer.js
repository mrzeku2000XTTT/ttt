import { BIOMES, factionColor } from "../../lib/evolve/constants";

/**
 * WorldRenderer — draws the world straight onto a canvas.
 * Kept completely separate from world state: it reads a snapshot and paints.
 * One draw call per visible tile, never one DOM node per tile.
 */

const AGENT_COLOR = {
  idle: "#7d90a8",
  working: "#22d3ee",
  moving: "#38bdf8",
  trading: "#34d399",
  researching: "#a78bfa",
  defending: "#60a5fa",
  attacking: "#f87171",
  reproducing: "#c084fc",
};

const ASSET_COLOR = {
  server: "#60a5fa",
  city: "#22d3ee",
  energy: "#fbbf24",
  compute: "#a78bfa",
  storage: "#94a3b8",
  deposit: "#34d399",
};

export function drawWorld(canvas, opts) {
  const {
    world,
    cam,
    selection,
    hover,
    agents = [],
    showTerritory = true,
    showAgents = true,
    showGrid = false,
    pendingTarget,
  } = opts;
  if (!canvas || !world) return;
  const ctx = canvas.getContext("2d");
  const dpr = opts.dpr || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#04080f";
  ctx.fillRect(0, 0, w, h);

  const ts = cam.scale;
  const x0 = Math.max(0, Math.floor(cam.x));
  const y0 = Math.max(0, Math.floor(cam.y));
  const x1 = Math.min(world.width - 1, Math.ceil(cam.x + w / ts));
  const y1 = Math.min(world.height - 1, Math.ceil(cam.y + h / ts));
  const px = Math.ceil(ts) + 0.6;

  // Terrain.
  for (let y = y0; y <= y1; y += 1) {
    const row = y * world.width;
    for (let x = x0; x <= x1; x += 1) {
      const i = row + x;
      const b = world.sculpt[i] >= 0 ? world.sculpt[i] : world.biome[i];
      ctx.fillStyle = BIOMES[b].color;
      ctx.fillRect((x - cam.x) * ts, (y - cam.y) * ts, px, px);
    }
  }

  // Faction territory — a subtle wash, never a repaint of the terrain.
  if (showTerritory && ts >= 2.2) {
    ctx.globalAlpha = 0.3;
    for (let y = y0; y <= y1; y += 1) {
      const row = y * world.width;
      for (let x = x0; x <= x1; x += 1) {
        const o = world.owner[row + x];
        if (!o) continue;
        ctx.fillStyle = factionColor(["neutral", "blue", "green", "yellow", "red", "purple"][o]);
        ctx.fillRect((x - cam.x) * ts, (y - cam.y) * ts, px, px);
      }
    }
    ctx.globalAlpha = 1;
  }

  if (showGrid && ts >= 7) {
    ctx.strokeStyle = "rgba(120,160,200,0.10)";
    ctx.lineWidth = 1;
    for (let x = x0; x <= x1 + 1; x += 1) {
      const sx = Math.round((x - cam.x) * ts) + 0.5;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let y = y0; y <= y1 + 1; y += 1) {
      const sy = Math.round((y - cam.y) * ts) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }
  }

  // Simulated assets.
  const size = Math.max(4, Math.min(14, ts * 0.72));
  world.assets.forEach((a) => {
    if (a.x < x0 - 1 || a.x > x1 + 1 || a.y < y0 - 1 || a.y > y1 + 1) return;
    const cx = (a.x - cam.x) * ts + ts / 2;
    const cy = (a.y - cam.y) * ts + ts / 2;
    ctx.fillStyle = ASSET_COLOR[a.kind] || "#94a3b8";
    ctx.globalAlpha = a.damage >= a.value ? 0.35 : 1;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.globalAlpha = 1;
    if (a.faction !== "neutral") {
      ctx.strokeStyle = factionColor(a.faction);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - size / 2 - 1, cy - size / 2 - 1, size + 2, size + 2);
    }
    if (ts >= 6) {
      ctx.fillStyle = "rgba(238,243,249,0.72)";
      ctx.font = "8px -apple-system, sans-serif";
      ctx.fillText(a.sim_id.replace("SIM_", ""), cx - size / 2, cy - size / 2 - 3);
    }
  });

  // Agents.
  if (showAgents) {
    const r = Math.max(1.2, Math.min(3.2, ts * 0.16));
    agents.forEach((ag) => {
      const p = ag.position;
      if (!p || p.x < x0 - 1 || p.x > x1 + 1 || p.y < y0 - 1 || p.y > y1 + 1) return;
      ctx.fillStyle = AGENT_COLOR[ag.status] || "#7d90a8";
      ctx.beginPath();
      ctx.arc((p.x - cam.x) * ts + ts / 2, (p.y - cam.y) * ts + ts / 2, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Selection, hover and pending conflict target.
  const outline = (x, y, color, lw) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.strokeRect((x - cam.x) * ts + 0.5, (y - cam.y) * ts + 0.5, ts - 1, ts - 1);
  };
  if (hover) outline(hover.x, hover.y, "rgba(238,243,249,0.28)", 1);
  if (pendingTarget?.asset) outline(pendingTarget.asset.x, pendingTarget.asset.y, "#f87171", 2);
  if (selection) outline(selection.x, selection.y, "#22d3ee", 2);
}

/** Minimap: the whole world at a glance, plus the current camera rectangle. */
export function drawMinimap(canvas, { world, cam, viewW, viewH, dpr = 1 }) {
  if (!canvas || !world) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#04080f";
  ctx.fillRect(0, 0, w, h);

  const sx = w / world.width;
  const sy = h / world.height;
  const step = Math.max(1, Math.floor(world.width / 160));

  for (let y = 0; y < world.height; y += step) {
    for (let x = 0; x < world.width; x += step) {
      const i = y * world.width + x;
      const b = world.sculpt[i] >= 0 ? world.sculpt[i] : world.biome[i];
      ctx.fillStyle = BIOMES[b].color;
      ctx.fillRect(x * sx, y * sy, sx * step + 0.6, sy * step + 0.6);
      const o = world.owner[i];
      if (o) {
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = factionColor(["neutral", "blue", "green", "yellow", "red", "purple"][o]);
        ctx.fillRect(x * sx, y * sy, sx * step + 0.6, sy * step + 0.6);
        ctx.globalAlpha = 1;
      }
    }
  }

  if (viewW && viewH) {
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1;
    ctx.strokeRect(cam.x * sx, cam.y * sy, (viewW / cam.scale) * sx, (viewH / cam.scale) * sy);
  }
}