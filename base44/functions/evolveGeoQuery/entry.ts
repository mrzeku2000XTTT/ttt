import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * evolveGeoQuery — read-only territory queries for EVOLVE.
 *
 * The renderer never reads the legacy world.owner[] grid for territory. It
 * asks this function for the ownership records relevant to the current map
 * viewport, so the browser only holds the cells it can see.
 *
 * modes:
 *   cell   → getCellOwner(experimentId, cellId)
 *   actor  → getActorTerritory(experimentId, actorId, actorType)
 *   org    → getOrganizationTerritory(experimentId, orgId)
 *   bounds → getTerritoryInBounds(experimentId, {north,south,east,west})
 *
 * read is public (RLS: null) so visibility never depends on who is logged in.
 */
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { mode, experimentId } = body;
    if (!experimentId || !mode) {
      return Response.json({ error: 'MISSING_PARAMS' }, { status: 400 });
    }

    if (mode === 'cell') {
      const { cellId } = body;
      if (!cellId) return Response.json({ error: 'MISSING_PARAMS: cellId' }, { status: 400 });
      const [owner] = await svc.entities.EvolveGeoOwnership.filter({
        experiment_id: experimentId,
        cell_id: cellId,
      });
      return Response.json({ ok: true, owner: owner || null });
    }

    if (mode === 'actor') {
      const { actorId, actorType } = body;
      if (!actorId || !actorType) {
        return Response.json({ error: 'MISSING_PARAMS' }, { status: 400 });
      }
      const cells = await svc.entities.EvolveGeoOwnership.filter(
        { experiment_id: experimentId, owner_id: actorId, owner_type: actorType },
        '-claimed_at',
        2000
      );
      return Response.json({ ok: true, cells });
    }

    if (mode === 'org') {
      const { orgId } = body;
      if (!orgId) return Response.json({ error: 'MISSING_PARAMS: orgId' }, { status: 400 });
      const cells = await svc.entities.EvolveGeoOwnership.filter(
        { experiment_id: experimentId, organization_id: orgId },
        '-claimed_at',
        2000
      );
      return Response.json({ ok: true, cells });
    }

    if (mode === 'bounds') {
      const { north, south, east, west } = body;
      if (![north, south, east, west].every(Number.isFinite)) {
        return Response.json({ error: 'MISSING_PARAMS: bounds' }, { status: 400 });
      }
      // Fetch all territory for the experiment, then filter to the viewport.
      // At Phase 1 population this is inexpensive; for scale, a cell-id prefix
      // or geohash index would let the query itself be bounded.
      const all = await svc.entities.EvolveGeoOwnership.filter(
        { experiment_id: experimentId },
        '-claimed_at',
        5000
      );
      const inBounds = all.filter(
        (r: any) =>
          Number.isFinite(r.center_lat) &&
          r.center_lat >= south &&
          r.center_lat <= north &&
          r.center_lng >= west &&
          r.center_lng <= east
      );
      return Response.json({ ok: true, cells: inBounds });
    }

    return Response.json({ error: 'INVALID_MODE' }, { status: 400 });
  } catch (error: any) {
    console.error('[evolveGeoQuery]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}