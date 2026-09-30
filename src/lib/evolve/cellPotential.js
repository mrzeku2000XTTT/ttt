/**
 * cellPotential — browser mirror of the deterministic geographic resource
 * potential used by the server (base44/shared/evolve/territoryPolicy.ts).
 *
 * Same inputs, same constants, same output, so what the Cell Inspector shows is
 * exactly the potential the expansion policy evaluated — not a second, made-up
 * number. Derived from the cell's own coordinates; never from world.owner[].
 */

const num = (v, d) => (Number.isFinite(v) ? v : d);

function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** { elevation, wood, energy, compute, buildable } on the same 0..3 scale. */
export function cellResourcePotential(cellId) {
  if (!cellId) return null;
  const elevation = hash01(`${cellId}|elev`);
  const rich = (v) => Math.min(3, Math.max(0, Math.round(v)));
  return {
    cellId,
    elevation: Number(elevation.toFixed(3)),
    wood: rich(0.4 + hash01(`${cellId}|wood`) * 2.6),
    energy: rich(0.3 + hash01(`${cellId}|energy`) * 2.7),
    compute: rich(0.2 + hash01(`${cellId}|compute`) * 2.8),
    buildable: elevation > 0.06,
  };
}

export const POTENTIAL_WORD = ["NONE", "LOW", "MEDIUM", "HIGH"];
export const potentialWord = (v) => POTENTIAL_WORD[num(v, 0)] || "NONE";