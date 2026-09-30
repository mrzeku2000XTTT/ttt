import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  parseCellId,
  getNeighborCellIds,
  cellIdFromLatLng,
  cellIdFromEnginePos,
  WORLD_SIZES,
} from '../../shared/evolve/geoCell.ts';
import { isLand } from '../../shared/evolve/geoLand.ts';

/**
 * evolveGeoClaim — the AUTHORITATIVE geographic ownership writer for EVOLVE.
 *
 * The legacy world.owner[] grid is NOT the source of truth for territory.
 * This function is. The frontend may never write EvolveGeoOwnership directly;
 * every claim flows through here so the server validates:
 *   1. the actor exists
 *   2. the cell id is well-formed and matches its reported center
 *   3. the cell is not already controlled
 *   4. the cell is over land (not water-only)
 *   5. the actor already controls an adjacent cell OR this is its valid
 *      initial spawn claim (no prior territory)
 *   6. the caller is permitted (owns the actor, or is admin)
 *
 * actions:
 *   claim    → validate + atomically create one ownership record
 *   backfill → idempotently give every existing actor a single spawn cell at
 *              their current geographic position (no fabricated expansion)
 */
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { action, experimentId } = body;
    if (!experimentId) return Response.json({ error: 'MISSING_PARAMS: experimentId' }, { status: 400 });

    const origin = new URL(req.url).origin;

    /* ------------------------------------------------------------- backfill */
    if (action === 'backfill') {
      const [players, agents, existing, worlds, exp] = await Promise.all([
        svc.entities.EvolvePlayer.filter({ experiment_id: experimentId }, 'code', 500),
        svc.entities.EvolveAgent.filter({ experiment_id: experimentId }, 'code', 500),
        svc.entities.EvolveGeoOwnership.filter({ experiment_id: experimentId }, '-claimed_at', 5000),
        svc.entities.EvolveWorld.filter({ experiment_id: experimentId }, '-created_date', 1),
        svc.entities.EvolveExperiment.get(experimentId).catch(() => null),
      ]);
      const world = worlds[0];
      // Fall back to the experiment's declared world size when no EvolveWorld
      // checkpoint exists yet (e.g. a fresh test experiment). Never invented —
      // resolves to the same authoritative 104×68 for "medium".
      const dims = (world && world.width && world.height)
        ? { width: world.width, height: world.height }
        : (WORLD_SIZES[exp?.world_size] || WORLD_SIZES.medium);
      const hasTerritory = new Set(existing.map((o: any) => `${o.owner_type}:${o.owner_id}`));
      const cellTaken = new Map(existing.map((o: any) => [o.cell_id, o]));
      let created = 0;

      const claimOne = async (
        ownerId: string,
        ownerType: string,
        ownerCode: string,
        orgId: string,
        lat: number,
        lng: number
      ) => {
        if (!ownerId || hasTerritory.has(`${ownerType}:${ownerId}`)) return;
        const cellId = cellIdFromLatLng(lat, lng);
        if (cellTaken.has(cellId)) return;
        let land = true;
        try {
          land = await isLand(lat, lng, origin);
        } catch (e) {
          // If the land index can't load, skip this actor rather than claim water.
          return;
        }
        if (!land) return;
        await svc.entities.EvolveGeoOwnership.create({
          experiment_id: experimentId,
          cell_id: cellId,
          owner_type: ownerType,
          owner_id: ownerId,
          owner_code: ownerCode || '',
          organization_id: orgId || '',
          claimed_at: new Date().toISOString(),
          claim_source: 'SPAWN',
          center_lat: lat,
          center_lng: lng,
        });
        hasTerritory.add(`${ownerType}:${ownerId}`);
        cellTaken.set(cellId, { owner_type: ownerType, owner_id: ownerId });
        created += 1;
      };

      for (const p of players) {
        let lat: number | null = null;
        let lng: number | null = null;
        if (Number.isFinite(p.geo_lat) && Number.isFinite(p.geo_lng)) {
          lat = p.geo_lat;
          lng = p.geo_lng;
        } else if (p.position && Number.isFinite(p.position.x)) {
          const d = cellIdFromEnginePos(p.position.x, p.position.y, dims.width, dims.height);
          lat = d.centerLat;
          lng = d.centerLng;
        }
        if (lat == null) continue;
        await claimOne(p.player_key || p.id, 'HUMAN', p.code, p.organization_id, lat, lng);
      }
      for (const a of agents) {
        if (a.status === 'archived') continue;
        let lat: number | null = null;
        let lng: number | null = null;
        if (Number.isFinite(a.geo_lat) && Number.isFinite(a.geo_lng)) {
          lat = a.geo_lat;
          lng = a.geo_lng;
        } else if (a.position && Number.isFinite(a.position.x)) {
          const d = cellIdFromEnginePos(a.position.x, a.position.y, dims.width, dims.height);
          lat = d.centerLat;
          lng = d.centerLng;
        }
        if (lat == null) continue;
        await claimOne(a.agent_key || a.id, 'AI', a.code, a.organization_id, lat, lng);
      }
      return Response.json({ ok: true, created, total: existing.length + created });
    }

    /* --------------------------------------------------------------- claim */
    const { actorId, actorType, cellId, centerLat, centerLng, claimSource, organizationId } = body;
    if (!actorId || !actorType || !cellId) {
      return Response.json({ error: 'MISSING_PARAMS' }, { status: 400 });
    }
    const cell = parseCellId(cellId);
    if (!cell) return Response.json({ ok: false, reason: 'INVALID_CELL' });
    if (
      !Number.isFinite(centerLat) ||
      Math.abs(centerLat - cell.centerLat) > 0.001 ||
      Math.abs(centerLng - cell.centerLng) > 0.001
    ) {
      return Response.json({ ok: false, reason: 'CELL_MISMATCH' });
    }

    // 1. actor exists
    let actorRec: any = null;
    if (actorType === 'AI') {
      [actorRec] = await svc.entities.EvolveAgent.filter({ experiment_id: experimentId, agent_key: actorId });
    } else if (actorType === 'HUMAN') {
      [actorRec] = await svc.entities.EvolvePlayer.filter({ experiment_id: experimentId, player_key: actorId });
    } else if (actorType === 'ORGANIZATION') {
      [actorRec] = await svc.entities.EvolveOrganization.filter({ experiment_id: experimentId, org_key: actorId });
    } else {
      return Response.json({ ok: false, reason: 'INVALID_OWNER_TYPE' });
    }
    if (!actorRec) return Response.json({ ok: false, reason: 'ACTOR_NOT_FOUND' });

    // 6. caller permitted (owns the actor, or admin)
    if (actorType === 'HUMAN') {
      if (actorRec.user_id !== user.id && user.role !== 'admin') {
        return Response.json({ ok: false, reason: 'NOT_PERMITTED' });
      }
    } else if (actorType === 'AI') {
      if (actorRec.owner_user_id !== user.id && user.role !== 'admin') {
        return Response.json({ ok: false, reason: 'NOT_PERMITTED' });
      }
    } else {
      if (user.role !== 'admin') return Response.json({ ok: false, reason: 'NOT_PERMITTED' });
    }

    // 3. cell not already controlled
    const [existingCell] = await svc.entities.EvolveGeoOwnership.filter({
      experiment_id: experimentId,
      cell_id: cellId,
    });
    if (existingCell) return Response.json({ ok: false, reason: 'CELL_ALREADY_OWNED', owner: existingCell });

    // 4. land check (water-only cells are never claimable)
    let land: boolean;
    try {
      land = await isLand(cell.centerLat, cell.centerLng, origin);
    } catch (e: any) {
      return Response.json({ ok: false, reason: 'LAND_CHECK_FAILED', error: e.message });
    }
    if (!land) return Response.json({ ok: false, reason: 'WATER_CELL' });

    // 5. adjacency OR valid initial spawn
    const myTerritory = await svc.entities.EvolveGeoOwnership.filter(
      { experiment_id: experimentId, owner_id: actorId, owner_type: actorType },
      '-claimed_at',
      500
    );
    const isSpawn = (claimSource || 'CLAIM') === 'SPAWN';
    if (isSpawn) {
      if (myTerritory.length > 0) return Response.json({ ok: false, reason: 'ALREADY_HAS_TERRITORY' });
    } else {
      if (myTerritory.length === 0) return Response.json({ ok: false, reason: 'NO_ADJACENT_TERRITORY' });
      const ownedIds = new Set(myTerritory.map((t: any) => t.cell_id));
      const adjacent = getNeighborCellIds(cellId).some((nid) => ownedIds.has(nid));
      if (!adjacent) return Response.json({ ok: false, reason: 'NOT_ADJACENT' });
    }

    // Atomically assign ownership.
    const rec = await svc.entities.EvolveGeoOwnership.create({
      experiment_id: experimentId,
      cell_id: cellId,
      owner_type: actorType,
      owner_id: actorId,
      owner_code: actorRec.code || '',
      organization_id: organizationId || actorRec.organization_id || '',
      claimed_at: new Date().toISOString(),
      claim_source: claimSource || 'CLAIM',
      center_lat: cell.centerLat,
      center_lng: cell.centerLng,
    });
    return Response.json({ ok: true, ownership: rec });
  } catch (error: any) {
    console.error('[evolveGeoClaim]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}