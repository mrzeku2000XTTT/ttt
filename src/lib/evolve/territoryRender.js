/**
 * territoryRender — pure geometry helpers for rendering the authoritative
 * geographic territory layer.
 *
 * Kept free of React and MapLibre so the geometry rules are testable and the
 * viewport stays a thin consumer.
 *
 * Two jobs:
 *   1. contiguous borders — a cell edge shared with the SAME controller is
 *      internal and must not be drawn, so a group of cells reads as one shape.
 *      Ownership records are never touched; this is display only.
 *   2. frontier wipe — the polygon of a newly committed cell, clipped to the
 *      fraction of the cell that has "filled" so far, growing outward from the
 *      edge it shares with the actor's existing territory.
 */

/** Cell id format is G{lat*1e6}_{lng*1e6} — matches the authoritative layer. */
export function cellIdFor(lat, lng) {
  return `G${Math.round(lat * 1e6)}_${Math.round(lng * 1e6)}`;
}

/** Stable identity for a controller — the unit that owns a contiguous shape. */
export function ownerKey(cell) {
  if (!cell) return null;
  return `${cell.owner_type || 'AI'}:${cell.owner_id || ''}`;
}

/**
 * Outer frontier only.
 *
 * For every owned cell, emit the edges whose neighbour is NOT controlled by the
 * same owner. Internal edges (same owner on both sides) are dropped, so adjacent
 * cells of one controller read as a single contiguous territory with one clean
 * outline, while every frontier against another controller or neutral land stays
 * fully readable.
 *
 * Returns GeoJSON LineString features carrying the controller colour.
 */
export function boundarySegments(cells) {
  if (!Array.isArray(cells) || !cells.length) return [];

  // cellId -> ownerKey, so an edge can be resolved in O(1).
  const ownerByCell = new Map();
  for (const c of cells) {
    const key = ownerKey(c);
    if (key) ownerByCell.set(c.cell_id, key);
  }

  const HALF = 0.02 / 2; // half a cell in degrees (cell resolution is 0.02°)
  const features = [];

  for (const c of cells) {
    const key = ownerKey(c);
    if (!key) continue;
    const lat = Number(c.center_lat);
    const lng = Number(c.center_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const west = lng - HALF;
    const east = lng + HALF;
    const south = lat - HALF;
    const north = lat + HALF;

    // Each edge is dropped when the neighbour across it shares the controller.
    const edges = [
      { neighbour: cellIdFor(lat, lng - 0.02), coords: [[west, south], [west, north]] }, // west
      { neighbour: cellIdFor(lat, lng + 0.02), coords: [[east, south], [east, north]] }, // east
      { neighbour: cellIdFor(lat - 0.02, lng), coords: [[west, south], [east, south]] }, // south
      { neighbour: cellIdFor(lat + 0.02, lng), coords: [[west, north], [east, north]] }, // north
    ];

    for (const edge of edges) {
      if (ownerByCell.get(edge.neighbour) === key) continue; // internal — suppress
      features.push({
        type: 'Feature',
        properties: { color: c.color || '#22d3ee', ownerId: c.owner_id, cellId: c.cell_id },
        geometry: { type: 'LineString', coordinates: edge.coords },
      });
    }
  }
  return features;
}

/**
 * The polygon of `cell` filled from the edge it shares with `fromCell` outward,
 * at progress t (0 = nothing, 1 = the whole cell).
 *
 * This is what makes a frontier read as territory growing out of the actor's
 * existing land rather than a cell popping into existence. Growth runs along the
 * dominant axis (N/S/E/W), which is the shared edge in every orthogonal case and
 * a clean choice for diagonal neighbours too.
 */
export function wipePolygon(cell, fromCell, t) {
  const p = Math.max(0, Math.min(1, Number(t) || 0));
  const HALF = 0.02 / 2;
  const lat = Number(cell.center_lat);
  const lng = Number(cell.center_lng);
  const west = lng - HALF;
  const east = lng + HALF;
  const south = lat - HALF;
  const north = lat + HALF;

  // Default growth direction is north (a fresh cell with no known neighbour).
  let dLat = 0;
  let dLng = 0;
  if (fromCell) {
    dLat = lat - Number(fromCell.center_lat);
    dLng = lng - Number(fromCell.center_lng);
  } else {
    dLat = 1;
  }

  let w = west;
  let e = east;
  let s = south;
  let n = north;

  if (Math.abs(dLat) >= Math.abs(dLng)) {
    if (dLat >= 0) s = north - (north - south) * p; // neighbour to the south → grow north
    else n = south + (north - south) * p; // neighbour to the north → grow south
  } else if (dLng >= 0) {
    w = east - (east - west) * p; // neighbour to the west → grow east
  } else {
    e = west + (east - west) * p; // neighbour to the east → grow west
  }

  return [[w, s], [e, s], [e, n], [w, n], [w, s]];
}

/** GeoJSON Polygon feature for one owned cell, with the given fill opacity. */
export function territoryFeature(cell, color, opacity) {
  const HALF = 0.02 / 2;
  const lat = Number(cell.center_lat);
  const lng = Number(cell.center_lng);
  const ring = [
    [lng - HALF, lat - HALF],
    [lng + HALF, lat - HALF],
    [lng + HALF, lat + HALF],
    [lng - HALF, lat + HALF],
    [lng - HALF, lat - HALF],
  ];
  return {
    type: 'Feature',
    properties: {
      color,
      opacity,
      stroke: color,
      cellId: cell.cell_id,
      ownerType: cell.owner_type,
      ownerId: cell.owner_id,
      ownerCode: cell.owner_code || '',
      organizationId: cell.organization_id || '',
    },
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}