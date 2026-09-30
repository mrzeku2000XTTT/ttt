/**
 * geoTerritoryService — frontend gateway to the authoritative geographic
 * ownership layer.
 *
 * The frontend NEVER writes EvolveGeoOwnership directly. Every claim goes
 * through the evolveGeoClaim backend function, which validates existence,
 * land, adjacency and permission server-side. Reads go through
 * evolveGeoQuery, which returns only the cells relevant to a viewport so the
 * browser never holds the whole planet's territory.
 *
 * This module is independent of the legacy world.owner[] grid. Territory
 * authority flows: geographic cell → EvolveGeoOwnership → renderer.
 */
import { base44 } from "@/api/base44Client";

async function invoke(name, payload) {
  const res = await base44.functions.invoke(name, payload);
  const data = res?.data || res;
  return data;
}

/** Claim one geographic cell for an actor. Server validates everything. */
export async function claimGeoCell({
  experimentId,
  actorId,
  actorType,
  cellId,
  centerLat,
  centerLng,
  claimSource = "CLAIM",
  organizationId = "",
}) {
  return invoke("evolveGeoClaim", {
    action: "claim",
    experimentId,
    actorId,
    actorType,
    cellId,
    centerLat,
    centerLng,
    claimSource,
    organizationId,
  });
}

/**
 * One-time idempotent backfill: give every existing actor a single spawn cell
 * at their current geographic position. No fabricated expansion. Safe to
 * call on every EVOLVE init — actors that already own territory are skipped.
 */
export async function backfillTerritory({ experimentId }) {
  return invoke("evolveGeoClaim", { action: "backfill", experimentId });
}

/** Ownership record for a single cell, or null if unclaimed. */
export async function getCellOwner({ experimentId, cellId }) {
  return invoke("evolveGeoQuery", { mode: "cell", experimentId, cellId });
}

/** Every cell an actor controls. */
export async function getActorTerritory({ experimentId, actorId, actorType }) {
  return invoke("evolveGeoQuery", { mode: "actor", experimentId, actorId, actorType });
}

/** Every cell an organization controls. */
export async function getOrganizationTerritory({ experimentId, orgId }) {
  return invoke("evolveGeoQuery", { mode: "org", experimentId, orgId });
}

/**
 * Ownership provenance for ONE cell — the immutable events that produced its
 * current control. Scoped to that cell; global history never reaches the browser.
 */
export async function getCellHistory({ experimentId, cellId }) {
  return invoke("evolveGeoQuery", { mode: "history", experimentId, cellId });
}

/** Ownership provenance for ONE actor. */
export async function getActorOwnershipEvents({ experimentId, actorId }) {
  return invoke("evolveGeoQuery", { mode: "actorEvents", experimentId, actorId });
}

/**
 * Territory intersecting a map viewport. The browser only receives the cells
 * it can see — not the whole planet.
 * bounds: { north, south, east, west } (MapLibre LngLatBounds or plain object).
 */
export async function getTerritoryInBounds({ experimentId, bounds }) {
  const north = typeof bounds.getNorth === "function" ? bounds.getNorth() : bounds.north;
  const south = typeof bounds.getSouth === "function" ? bounds.getSouth() : bounds.south;
  const east = typeof bounds.getEast === "function" ? bounds.getEast() : bounds.east;
  const west = typeof bounds.getWest === "function" ? bounds.getWest() : bounds.west;
  return invoke("evolveGeoQuery", { mode: "bounds", experimentId, north, south, east, west });
}