import { fbm, makeRng, clamp01 } from "./rng";
import { BIOME_INDEX, WORLD_SIZES, SCARCITY_YIELD } from "./constants";

/**
 * Procedural world generation. Everything derives from the seed, so the world can
 * be rebuilt exactly from a single number and never has to be stored tile-by-tile.
 */
export function generateWorld({ seed = 1, size = "medium", scarcity = "medium" }) {
  const { width, height } = WORLD_SIZES[size] || WORLD_SIZES.medium;
  const n = width * height;
  const elevation = new Float32Array(n);
  const biome = new Uint8Array(n);
  const yieldMul = SCARCITY_YIELD[scarcity] ?? 1;

  const s = (seed % 100000) + 7;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / width;
      const ny = y / height;
      // Island falloff — keeps coastlines readable instead of noise soup.
      const dx = (nx - 0.5) * 2;
      const dy = (ny - 0.5) * 2;
      const falloff = clamp01(1 - Math.sqrt(dx * dx * 0.82 + dy * dy * 1.05));
      const base = fbm(nx * 4.6, ny * 4.6, s, 5);
      const ridge = fbm(nx * 9.2, ny * 9.2, s + 991, 3);
      elevation[y * width + x] = clamp01(base * 0.72 + ridge * 0.28) * (0.35 + falloff * 0.85);
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const e = elevation[i];
      const lat = Math.abs(y / height - 0.5) * 2;
      const temp = clamp01(1 - lat * 1.15 + (fbm(x / 12, y / 12, s + 404, 3) - 0.5) * 0.5);
      let b;
      if (e < 0.26) b = BIOME_INDEX.DEEP;
      else if (e < 0.35) b = BIOME_INDEX.OCEAN;
      else if (e < 0.41) b = BIOME_INDEX.COAST;
      else if (e > 0.78) b = temp < 0.42 ? BIOME_INDEX.SNOW : BIOME_INDEX.MOUNTAIN;
      else if (temp < 0.2) b = BIOME_INDEX.TUNDRA;
      else if (temp > 0.82 && e < 0.56) b = BIOME_INDEX.DESERT;
      else if (e > 0.68 && temp > 0.86) b = BIOME_INDEX.VOLCANIC;
      else if (fbm(x / 7, y / 7, s + 77, 3) > 0.58) b = BIOME_INDEX.FOREST;
      else b = BIOME_INDEX.PLAINS;
      biome[i] = b;
    }
  }

  carveRivers(biome, elevation, width, height, s);

  return { seed, size, width, height, elevation, biome, yieldMul };
}

/** Rivers run downhill from high ground to the sea, then stop. */
function carveRivers(biome, elevation, width, height, seed) {
  const rng = makeRng(seed + 3131);
  const rivers = Math.max(3, Math.round(width / 16));
  for (let r = 0; r < rivers; r += 1) {
    let x = Math.floor(rng() * width);
    let y = Math.floor(rng() * height);
    for (let step = 0; step < width * 1.5; step += 1) {
      const i = y * width + x;
      if (biome[i] === BIOME_INDEX.DEEP || biome[i] === BIOME_INDEX.OCEAN) break;
      biome[i] = BIOME_INDEX.RIVER;
      let best = null;
      let bestE = elevation[i];
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const e = elevation[ny * width + nx];
          if (e < bestE) {
            bestE = e;
            best = [nx, ny];
          }
        }
      }
      if (!best) break;
      [x, y] = best;
    }
  }
}

/** Local survey of what a tile can carry. */
export function surveyTile(biome, elevation, width, x, y, yieldMul = 1) {
  const i = y * width + x;
  const b = BIOME_INDEX;
  const e = elevation ? elevation[i] : 0.5;
  const kind = biome[i];
  const rich = (v) => Math.min(3, Math.round(v * yieldMul));
  if (kind === b.DEEP || kind === b.OCEAN) {
    return { wood: 0, energy: rich(0.6), compute: 0, buildable: false };
  }
  const wood = rich((kind === b.FOREST ? 3 : kind === b.PLAINS ? 1.6 : kind === b.COAST ? 1 : 0.4) / 3);
  const energy = rich(kind === b.VOLCANIC || kind === b.DESERT ? 1 : kind === b.MOUNTAIN ? 0.8 : 0.5);
  const compute = rich(kind === b.MOUNTAIN ? 1 : e > 0.6 ? 0.8 : 0.4);
  return { wood, energy, compute, buildable: true };
}