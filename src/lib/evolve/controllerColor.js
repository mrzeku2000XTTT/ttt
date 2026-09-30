/**
 * controllerColor — ONE deterministic identity colour per controller.
 *
 * A controller is visually recognisable everywhere because a single function
 * decides its colour: the actor's map dot, its territory fill, its territory
 * outline, the selection emphasis, the inspector accent, the controller label
 * over a selected cell, and the territory-list marker all resolve from here.
 *
 * Stability: the colour is a pure function of the controller id, so it is
 * identical across reloads, across sessions and across clients. Nothing random,
 * nothing stored.
 *
 * COLOUR IS PRESENTATION ONLY. Ownership is never decided by comparing colours
 * — EvolveGeoOwnership.owner_id is authoritative, and this only decides how that
 * id is drawn.
 *
 * Organizations: when a controller belongs to an organization, callers pass the
 * organization id as the key, so every member's land reads as one organisation
 * colour without touching underlying cell ownership. That is the hook a future
 * faction/organization visual layer plugs into.
 */

/**
 * Deterministic colour for a controller identity key.
 * Hue is spread with the golden-ratio step so sequentially-created ids
 * (AGT_0011, AGT_0012, …) land far apart on the wheel instead of next to each
 * other.
 */
export function getControllerColor(controllerId) {
  if (!controllerId) return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < controllerId.length; i += 1) {
    hash = (hash * 31 + controllerId.charCodeAt(i)) | 0;
  }
  const norm = (Math.abs(hash) % 100000) / 100000;
  const hue = Math.round(((norm + 0.618033988749895) % 1) * 360);
  return `hsl(${hue}, 72%, 58%)`;
}

/**
 * The identity key a cell's colour resolves from: the organization when the
 * controller belongs to one, otherwise the actor itself.
 */
export function controllerKeyOf(cell) {
  return cell?.organization_id || cell?.owner_id || "";
}

/** Same identity colour, dimmed — for the selection de-emphasis of others. */
export function getControllerColorDim(controllerId) {
  if (!controllerId) return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < controllerId.length; i += 1) {
    hash = (hash * 31 + controllerId.charCodeAt(i)) | 0;
  }
  const norm = (Math.abs(hash) % 100000) / 100000;
  const hue = Math.round(((norm + 0.618033988749895) % 1) * 360);
  return `hsl(${hue}, 34%, 42%)`;
}