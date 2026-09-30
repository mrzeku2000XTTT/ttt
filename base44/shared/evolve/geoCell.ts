/**
 * geoCell — PURE geographic cell math for the EVOLVE territory system.
 *
 * No imports. Safe to use in both the Deno backend (functions) and the browser.
 * The frontend geoCells.js has the richer version (land index, viewport
 * generation); this is the minimal shared core that the authoritative
 * server-side ownership logic needs.
 *
 * Cells are deterministic from lat/lng at CELL_DEG resolution. The same
 * location ALWAYS resolves to the same cellId. This is the ONLY spatial
 * system the territory layer reads from — it never reads the legacy
 * world.owner[] simulation grid.
 */

export const CELL_DEG = 0.02;

/** Legacy simulation grid dimensions by size key (matches constants.js). */
export const WORLD_SIZES: Record<string, { width: number; height: number }> = {
  small: { width: 72, height: 48 },
  medium: { width: 104, height: 68 },
  large: { width: 144, height: 92 },
};

/** Parse a cellId `G{latInt}_{lngInt}` into its bounds + center. Null if malformed. */
export function parseCellId(cellId: string): {
  cellId: string;
  south: number;
  north: number;
  west: number;
  east: number;
  centerLat: number;
  centerLng: number;
} | null {
  const m = /^G(-?\d+)_(-?\d+)$/.exec(String(cellId || ""));
  if (!m) return null;
  const south = Number(m[1]) / 1e6;
  const west = Number(m[2]) / 1e6;
  return {
    cellId: String(cellId),
    south,
    north: south + CELL_DEG,
    west,
    east: west + CELL_DEG,
    centerLat: south + CELL_DEG / 2,
    centerLng: west + CELL_DEG / 2,
  };
}

/** Deterministic lat/lng → cellId. Same location → same cellId forever. */
export function cellIdFromLatLng(lat: number, lng: number): string {
  const cLat = Math.floor(lat / CELL_DEG) * CELL_DEG;
  const cLng = Math.floor(lng / CELL_DEG) * CELL_DEG;
  return `G${Math.round(cLat * 1e6)}_${Math.round(cLng * 1e6)}`;
}

/**
 * The 8 geographic neighbors of a cell (Moore neighborhood — direct + diagonal).
 * Expansion must originate from territory already controlled, so a claim is
 * only valid against a cell whose id appears in this list for some cell the
 * actor already owns.
 */
export function getNeighborCellIds(cellId: string): string[] {
  const c = parseCellId(cellId);
  if (!c) return [];
  const out: string[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      out.push(cellIdFromLatLng(c.centerLat + dy * CELL_DEG, c.centerLng + dx * CELL_DEG));
    }
  }
  return out;
}

/**
 * Derive a geographic cell from a legacy engine {x,y} position via the same
 * equirectangular projection the map uses (gridToLatLng with +0.5 center
 * offset). Used only for backfilling existing actors that pre-date the
 * geographic ownership layer — never as the source of truth for new claims.
 */
export function cellIdFromEnginePos(
  x: number,
  y: number,
  width: number,
  height: number
): { cellId: string; centerLat: number; centerLng: number } {
  const lng = ((x + 0.5) / width) * 360 - 180;
  const lat = 90 - ((y + 0.5) / height) * 180;
  return { cellId: cellIdFromLatLng(lat, lng), centerLat: lat, centerLng: lng };
}