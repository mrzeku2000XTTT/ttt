import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { parseCellId, getNeighborCellIds } from '../../shared/evolve/geoCell.ts';
import { isLand } from '../../shared/evolve/geoLand.ts';
import { generateTestnetWallet } from '../../shared/kaspaAddress.ts';
import { sendTn10, tn10BalanceSompi } from '../../shared/tn10Send.ts';
import { paidToAddress } from '../../shared/evolveFactory.ts';
import {
  TERRITORY_POLICY,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
  cellResourcePotential,
  potentialToWorldResources,
  expansionCostUnits,
  evaluateExpansionCapacity,
  evaluateFrontier,
  BUILD_COST,
  BUILD_STATS,
} from '../../shared/evolve/territoryPolicy.ts';

/**
 * evolveTerritoryClaim — the BOUNDED Phase 2 territory settlement path.
 *
 *   ACTOR INTENT → CLAIM POLICY → GEOGRAPHIC VALIDATION → EXPANSION CAPACITY
 *   → ECONOMIC POLICY → RESOURCE RESERVATION → TN10 SETTLEMENT
 *   → CHAIN VERIFICATION → OWNERSHIP COMMIT → WORLD EVENT
 *
 * This deliberately does NOT reopen the globally-blocked payment pipeline
 * (evolveConfirmTick / BUY_RESOURCE / PAY_AGENT / genesis funding). It builds a
 * new, narrow settlement path on the already-proven primitives:
 *   - autonomous AI wallets (evolveCreateAgentWallet + EvolveAgentKey)
 *   - the server-side signer (shared/tn10Send.ts sendTn10)
 *   - real chain verification (shared/evolveFactory.ts paidToAddress)
 *
 * A txid from sendTn10 means PAYMENT_BROADCAST — never confirmation.
 * Confirmation comes only from chain evidence. Secrets never leave the server.
 *
 * actions:
 *   treasury → ensure + return the public EVOLVE Territory Treasury address
 *   frontier → evaluate an actor's real frontier (EXPAND / DECLINE)
 *   develop  → establish the minimum legitimate infrastructure foothold
 *   claim    → run the full bounded state machine for one cell
 *   resume   → continue a claim (verification + commit) without paying again
 *   list     → claims for an experiment
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
    const policy = TERRITORY_POLICY;

    /* ------------------------------------------------------------- treasury */
    const ensureTreasury = async () => {
      let rec = (await svc.entities.EvolveAgentWallet.filter({ agent_id: policy.treasury_actor_id }))[0];
      if (rec) return rec;
      const { mnemonic, address } = generateTestnetWallet();
      await svc.entities.EvolveAgentKey.create({
        agent_id: policy.treasury_actor_id,
        label: 'EVOLVE Territory Treasury',
        network: 'kaspa_testnet_10',
        address,
        mnemonic,
        derivation_path: "m/44'/111111'/0'/0/0",
      });
      rec = await svc.entities.EvolveAgentWallet.create({
        experiment_id: experimentId,
        agent_id: policy.treasury_actor_id,
        agent_code: 'TERRITORY_TREASURY',
        wallet_id: 'WTERRITORY',
        network: 'kaspa_testnet_10',
        address,
        status: 'active',
        is_treasury: true,
        created_at: new Date().toISOString(),
      });
      return rec;
    };

    if (action === 'treasury') {
      const t = await ensureTreasury();
      return Response.json({ ok: true, treasuryAddress: t.address, actorId: policy.treasury_actor_id });
    }

    /* ------------------------------------------------------------ helpers */
    const loadActor = async (actorId: string) => {
      const [rec] = await svc.entities.EvolveAgent.filter({ experiment_id: experimentId, agent_key: actorId });
      return rec || null;
    };
    const ownTerritory = async (actorId: string) =>
      await svc.entities.EvolveGeoOwnership.filter(
        { experiment_id: experimentId, owner_id: actorId, owner_type: 'AI' },
        '-claimed_at',
        500
      );
    const actorAssets = async (actorId: string) =>
      await svc.entities.EvolveAsset.filter({ experiment_id: experimentId, owner_id: actorId }, 'sim_id', 200);
    const activeClaims = async () =>
      await svc.entities.EvolveTerritoryClaim.filter({ experiment_id: experimentId }, '-created_date', 300);
    const pendingUnitsFor = async (actorId: string, exceptId = '') => {
      const claims = await activeClaims();
      return claims
        .filter((c: any) => c.actor_id === actorId && c.id !== exceptId && ACTIVE_STATUSES.includes(c.status))
        .reduce((s: number, c: any) => s + Object.values(c.resource_cost || {}).reduce((a: number, v: any) => a + Number(v || 0), 0), 0);
    };

    /** Ensure the actor's economic policy permits a bounded territory claim. */
    const ensurePolicy = async (actor: any) => {
      const [existing] = await svc.entities.AgentEconomicPolicy.filter(
        { experiment_id: experimentId, agent_id: actor.agent_key },
        '-created_date',
        1
      );
      if (!existing) {
        return await svc.entities.AgentEconomicPolicy.create({
          experiment_id: experimentId,
          agent_id: actor.agent_key,
          agent_code: actor.code || '',
          enabled: true,
          max_transaction_sompi: 200000000,
          max_hourly_spend_sompi: 500000000,
          max_daily_spend_sompi: 2000000000,
          minimum_reserve_sompi: 10000000,
          allowed_purposes: ['RESOURCE_PURCHASE', 'JOB_PAYMENT', 'TERRITORY_CLAIM'],
          hourly_spent_sompi: 0,
          daily_spent_sompi: 0,
          last_hour_reset: new Date().toISOString(),
          last_day_reset: new Date().toISOString(),
        });
      }
      if (!(existing.allowed_purposes || []).includes('TERRITORY_CLAIM')) {
        return await svc.entities.AgentEconomicPolicy.update(existing.id, {
          allowed_purposes: [...(existing.allowed_purposes || []), 'TERRITORY_CLAIM'],
        });
      }
      return existing;
    };

    const releaseReservation = async (claim: any, status = 'RELEASED') => {
      if (!claim?.resource_reservation_id) return;
      try {
        await svc.entities.EvolveTerritoryReservation.update(claim.resource_reservation_id, {
          status,
          settled_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('[evolveTerritoryClaim] reservation release failed:', (e as any).message);
      }
    };

    const fail = async (claim: any, status: string, code: string, detail: string) => {
      await releaseReservation(claim, status === 'PAYMENT_FAILED' || status === 'INSUFFICIENT_RESOURCES' ? 'RELEASED' : 'RELEASED');
      return await svc.entities.EvolveTerritoryClaim.update(claim.id, {
        status,
        failure_code: code,
        failure_detail: String(detail).slice(0, 500),
      });
    };

    /* ------------------------------------------------------------- develop */
    // Establish the smallest legitimate infrastructure foothold using the
    // EXISTING build model (BUILD_COST / BUILD_STATS / EvolveAsset), recorded
    // as a real asset row owned by the actor. Idempotent per kind.
    if (action === 'develop') {
      const { actorId, kind } = body;
      const actor = await loadActor(actorId);
      if (!actor) return Response.json({ ok: false, reason: 'ACTOR_NOT_FOUND' });
      const buildKind = kind || policy.development_kind;
      const territory = await ownTerritory(actorId);
      if (!territory.length) return Response.json({ ok: false, reason: 'NO_TERRITORIAL_FOOTHOLD' });

      const existing = (await actorAssets(actorId)).find((a: any) => a.kind === buildKind);
      if (existing) return Response.json({ ok: true, already: true, asset: existing });

      // Place it on the actor's own controlled cell (legacy engine coords are
      // derived from the cell's centre — the same equirectangular projection the
      // renderer uses). This is the EXISTING asset record, not a new class.
      const cell = parseCellId(territory[0].cell_id);
      const world = (await svc.entities.EvolveWorld.filter({ experiment_id: experimentId }, '-created_date', 1))[0];
      const width = world?.width || 104;
      const height = world?.height || 68;
      const x = Math.min(width - 1, Math.max(0, Math.floor(((cell.centerLng + 180) / 360) * width)));
      const y = Math.min(height - 1, Math.max(0, Math.floor(((90 - cell.centerLat) / 180) * height)));

      const cost = BUILD_COST[buildKind] || {};
      const stats = BUILD_STATS[buildKind] || { value: 14, defense: 10, output: 2 };

      const asset = await svc.entities.EvolveAsset.create({
        experiment_id: experimentId,
        sim_id: `SIM_${buildKind.toUpperCase()}_${Date.now().toString(36).toUpperCase()}`,
        kind: buildKind,
        x,
        y,
        owner_id: actorId,
        value: stats.value,
        defense: stats.defense,
        damage: 0,
        level: 1,
        output: stats.output,
      });

      return Response.json({
        ok: true,
        built: buildKind,
        asset,
        resourceCost: cost,
        worldResourceBefore: world?.resources || null,
      });
    }

    /* ------------------------------------------------------------ frontier */
    if (action === 'frontier') {
      const { actorId } = body;
      const actor = await loadActor(actorId);
      if (!actor) return Response.json({ ok: false, reason: 'ACTOR_NOT_FOUND' });
      const territory = await ownTerritory(actorId);
      const assets = await actorAssets(actorId);
      const ownedIds = new Set(territory.map((t: any) => t.cell_id));
      const allOwned = await svc.entities.EvolveGeoOwnership.filter({ experiment_id: experimentId }, '-claimed_at', 5000);
      const takenIds = new Set(allOwned.map((o: any) => o.cell_id));
      const claims = await activeClaims();
      const reservedIds = new Set(
        claims.filter((c: any) => ACTIVE_STATUSES.includes(c.status)).map((c: any) => c.target_cell_id)
      );

      // Candidates: 8-neighbours of owned cells that are neutral, land and unreserved.
      const candidateIds: string[] = [];
      for (const cellId of ownedIds) {
        for (const n of getNeighborCellIds(cellId)) {
          if (ownedIds.has(n) || takenIds.has(n) || reservedIds.has(n)) continue;
          if (!candidateIds.includes(n)) candidateIds.push(n);
        }
      }
      const candidates: any[] = [];
      for (const id of candidateIds.slice(0, 40)) {
        const cell = parseCellId(id);
        if (!cell) continue;
        try {
          if (!(await isLand(cell.centerLat, cell.centerLng, origin))) continue;
        } catch (e) {
          continue;
        }
        candidates.push({ cellId: id, potential: cellResourcePotential(id) });
      }

      const evaluation = evaluateFrontier({
        ownedCells: territory,
        candidates,
        genome: actor.genome || {},
        assets,
        policy,
      });
      return Response.json({
        ok: true,
        actor: { id: actor.agent_key, code: actor.code, genome: actor.genome || {} },
        territoryCells: territory.length,
        ...evaluation,
      });
    }

    /* -------------------------------------------------------------- resume */
    if (action === 'resume') {
      const { claimId } = body;
      if (!claimId) return Response.json({ error: 'MISSING_PARAMS: claimId' }, { status: 400 });
      let claim = await svc.entities.EvolveTerritoryClaim.get(claimId);
      if (!claim) return Response.json({ ok: false, reason: 'CLAIM_NOT_FOUND' });
      claim = await finalizeClaim(claim);
      return Response.json({ ok: true, claim: publicClaim(claim) });
    }

    /* ---------------------------------------------------------------- list */
    if (action === 'list') {
      const claims = await svc.entities.EvolveTerritoryClaim.filter(
        { experiment_id: experimentId },
        '-created_date',
        100
      );
      return Response.json({ ok: true, claims: claims.map(publicClaim) });
    }

    /* --------------------------------------------------------------- claim */
    if (action !== 'claim') return Response.json({ error: 'Invalid action' }, { status: 400 });

    const { actorId, cellId, claimActionId } = body;
    if (!actorId || !cellId || !claimActionId) {
      return Response.json({ error: 'MISSING_PARAMS: actorId, cellId, claimActionId' }, { status: 400 });
    }

    // --- IDEMPOTENCY: the same action id returns the existing claim, always. ---
    const [dupe] = await svc.entities.EvolveTerritoryClaim.filter(
      { experiment_id: experimentId, claim_action_id: claimActionId },
      '-created_date',
      1
    );
    if (dupe) {
      const resumed = await finalizeClaim(dupe);
      return Response.json({ ok: true, idempotent: true, claim: publicClaim(resumed) });
    }

    const actor = await loadActor(actorId);
    if (!actor) return Response.json({ ok: false, reason: 'ACTOR_NOT_FOUND' });
    if (actor.owner_user_id !== user.id && user.role !== 'admin') {
      return Response.json({ ok: false, reason: 'NOT_PERMITTED' });
    }

    const cell = parseCellId(cellId);
    if (!cell) return Response.json({ ok: false, reason: 'INVALID_CELL' });

    // Create the claim row first so the cell lock exists before anything is spent.
    let claim = await svc.entities.EvolveTerritoryClaim.create({
      experiment_id: experimentId,
      claim_action_id: claimActionId,
      actor_id: actorId,
      actor_type: 'AI',
      actor_code: actor.code || '',
      controller_id: actor.organization_id || actorId,
      target_cell_id: cellId,
      status: 'REQUESTED',
      resource_cost: { ...policy.expansion_resource_cost },
      amount_sompi: policy.claim_tkas_sompi,
      requested_at: new Date().toISOString(),
      day: body.day || 0,
    });

    /* ---------------- 1. GEOGRAPHIC VALIDATION (before spending anything) -- */
    claim = await svc.entities.EvolveTerritoryClaim.update(claim.id, { status: 'VALIDATING' });

    const [existingCell] = await svc.entities.EvolveGeoOwnership.filter({
      experiment_id: experimentId,
      cell_id: cellId,
    });
    if (existingCell) return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'VALIDATION_FAILED', 'CELL_ALREADY_OWNED', `${existingCell.owner_code || existingCell.owner_id} already controls this cell`)) });

    try {
      if (!(await isLand(cell.centerLat, cell.centerLng, origin))) {
        return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'VALIDATION_FAILED', 'WATER_CELL', 'Target cell is not land')) });
      }
    } catch (e: any) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'VALIDATION_FAILED', 'LAND_CHECK_FAILED', e.message)) });
    }

    const territory = await ownTerritory(actorId);
    if (territory.length === 0) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'VALIDATION_FAILED', 'NO_ADJACENT_TERRITORY', 'Actor controls no territory')) });
    }
    const ownedIds = new Set(territory.map((t: any) => t.cell_id));
    const fromCell = getNeighborCellIds(cellId).find((n) => ownedIds.has(n)) || '';
    if (!fromCell) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'VALIDATION_FAILED', 'NOT_ADJACENT', 'Target cell is not adjacent to controlled territory')) });
    }

    // Cell lock — another actor's live claim owns this cell.
    const claims = await activeClaims();
    const cellLock = claims.find(
      (c: any) => c.target_cell_id === cellId && c.id !== claim.id && ACTIVE_STATUSES.includes(c.status)
    );
    if (cellLock) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'VALIDATION_FAILED', 'CELL_CLAIM_RESERVED', `Cell reserved by ${cellLock.actor_code || cellLock.actor_id}`)) });
    }

    const mine = claims.filter(
      (c: any) => c.actor_id === actorId && ACTIVE_STATUSES.includes(c.status) && c.id !== claim.id
    );
    if (mine.length >= policy.max_pending_claims_per_actor) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'VALIDATION_FAILED', 'TOO_MANY_PENDING_CLAIMS', `Max ${policy.max_pending_claims_per_actor} pending claims`)) });
    }

    claim = await svc.entities.EvolveTerritoryClaim.update(claim.id, {
      validated_at: new Date().toISOString(),
      from_cell_id: fromCell,
    });

    /* ------------------------------- 2. EXPANSION CAPACITY (real state) ----- */
    const assets = await actorAssets(actorId);
    const pendingUnits = await pendingUnitsFor(actorId, claim.id);
    const capacity = evaluateExpansionCapacity({ territory, assets, pendingUnits, policy });
    if (!capacity.eligible) {
      const code = capacity.reasons.includes('INSUFFICIENT_EXPANSION_CAPACITY')
        ? 'INSUFFICIENT_EXPANSION_CAPACITY'
        : capacity.reasons[0];
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'INSUFFICIENT_RESOURCES', code, capacity.reasons.join(', '))), capacity });
    }

    /* --------------------------------------- 3. ECONOMIC POLICY + TN10 ----- */
    const agentPolicy = await ensurePolicy(actor);
    if (agentPolicy.enabled === false) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'POLICY_REJECTED', 'POLICY_DISABLED', 'Agent economic policy is disabled')) });
    }
    if (!(agentPolicy.allowed_purposes || []).includes('TERRITORY_CLAIM')) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'POLICY_REJECTED', 'PURPOSE_NOT_PERMITTED', 'TERRITORY_CLAIM not permitted')) });
    }
    const amount = policy.claim_tkas_sompi;
    if (amount > (agentPolicy.max_transaction_sompi || 0)) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'POLICY_REJECTED', 'EXCEEDS_MAX_TRANSACTION', `${amount} > ${agentPolicy.max_transaction_sompi}`)) });
    }
    if ((agentPolicy.hourly_spent_sompi || 0) + amount > (agentPolicy.max_hourly_spend_sompi || 0)) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'POLICY_REJECTED', 'EXCEEDS_HOURLY_LIMIT', 'Hourly limit exceeded')) });
    }
    if ((agentPolicy.daily_spent_sompi || 0) + amount > (agentPolicy.max_daily_spend_sompi || 0)) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'POLICY_REJECTED', 'EXCEEDS_DAILY_LIMIT', 'Daily limit exceeded')) });
    }

    // The AI's own wallet + signing key (server-side only).
    const [wallet] = await svc.entities.EvolveAgentWallet.filter(
      { experiment_id: experimentId, agent_id: actorId },
      '-created_date',
      1
    );
    if (!wallet) return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'INSUFFICIENT_TKAS', 'NO_WALLET', 'Actor has no TN-10 wallet')) });
    const [key] = await svc.entities.EvolveAgentKey.filter({ agent_id: actorId }, '-created_date', 1);
    if (!key?.mnemonic) return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'INSUFFICIENT_TKAS', 'NO_SIGNING_KEY', 'Actor signing key unavailable')) });

    let balance = 0n;
    try {
      balance = await tn10BalanceSompi(wallet.address);
    } catch (e: any) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'INSUFFICIENT_TKAS', 'BALANCE_UNAVAILABLE', e.message)) });
    }
    const needed = BigInt(amount) + BigInt(agentPolicy.minimum_reserve_sompi || 0);
    if (balance < needed) {
      return Response.json({
        ok: true,
        claim: publicClaim(await fail(claim, 'INSUFFICIENT_TKAS', 'INSUFFICIENT_TKAS', `Have ${balance} sompi, need ${needed}`)),
        balanceSompi: Number(balance),
      });
    }

    /* --------------------------- 4. RESOURCE RESERVATION (before payment) --- */
    const treasury = await ensureTreasury();
    const reservedUnits = expansionCostUnits(policy);
    const reservation = await svc.entities.EvolveTerritoryReservation.create({
      experiment_id: experimentId,
      reservation_key: `TRES_${claimActionId}`,
      claim_id: claim.id,
      claim_action_id: claimActionId,
      actor_id: actorId,
      cell_id: cellId,
      resources: { ...policy.expansion_resource_cost },
      resource_units: reservedUnits,
      status: 'RESERVED',
      created_at: new Date().toISOString(),
    });
    claim = await svc.entities.EvolveTerritoryClaim.update(claim.id, {
      status: 'RESOURCES_RESERVED',
      resource_reservation_id: reservation.id,
      reserved_at: new Date().toISOString(),
      sender_address: wallet.address,
      treasury_address: treasury.address,
      utility: body.utility ?? null,
    });

    /* ------------------------------------- 5. REAL AUTONOMOUS TN10 PAYMENT -- */
    claim = await svc.entities.EvolveTerritoryClaim.update(claim.id, { status: 'PAYMENT_BUILDING' });
    let txId = '';
    try {
      const sent = await sendTn10({
        mnemonic: key.mnemonic,
        fromAddress: wallet.address,
        toAddress: treasury.address,
        amountSompi: BigInt(amount),
      });
      txId = String(sent.txId || '');
    } catch (e: any) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'PAYMENT_FAILED', 'BROADCAST_FAILED', e.message)) });
    }
    if (!txId) {
      return Response.json({ ok: true, claim: publicClaim(await fail(claim, 'PAYMENT_FAILED', 'NO_TXID', 'Broadcast produced no txid')) });
    }
    // A txid is BROADCAST, not confirmation.
    claim = await svc.entities.EvolveTerritoryClaim.update(claim.id, {
      status: 'PAYMENT_BROADCAST',
      tx_id: txId,
      broadcast_at: new Date().toISOString(),
    });

    /* ------------------------------- 6. CHAIN VERIFICATION → OWNERSHIP ------ */
    claim = await finalizeClaim(claim);

    return Response.json({ ok: true, claim: publicClaim(claim), capacity });

    /* ------------------------------------------------------------ finalize */
    async function finalizeClaim(input: any) {
      let claim = input;
      if (TERMINAL_STATUSES.includes(claim.status)) return claim;

      // Verify (resumable — never re-signs, never re-pays).
      if (['PAYMENT_BUILDING', 'PAYMENT_BROADCAST', 'PAYMENT_CONFIRMING'].includes(claim.status)) {
        if (!claim.tx_id) {
          return await fail(claim, 'PAYMENT_FAILED', 'NO_TXID', 'No txid recorded for this claim');
        }
        const tx = await paidToAddress(claim.tx_id, claim.treasury_address, {
          attempts: policy.confirmation_attempts,
        });
        if (!tx.found) {
          // Delayed, not failed. Ownership is NOT granted.
          return await svc.entities.EvolveTerritoryClaim.update(claim.id, {
            status: 'PAYMENT_CONFIRMING',
            failure_code: 'PAYMENT_TIMEOUT',
            failure_detail: 'Payment not visible on TN-10 yet — will resume, never re-pay',
          });
        }
        if (Number(tx.paidSompi) < Number(claim.amount_sompi)) {
          return await fail(claim, 'PAYMENT_FAILED', 'UNDERPAID', `Chain shows ${tx.paidSompi} < ${claim.amount_sompi}`);
        }
        claim = await svc.entities.EvolveTerritoryClaim.update(claim.id, {
          status: 'PAYMENT_CONFIRMED',
          confirmed_at: new Date().toISOString(),
          confirmation_evidence: {
            txid: tx.txid,
            paidSompi: tx.paidSompi,
            inputAddresses: tx.inputAddresses,
          },
        });
      }

      if (claim.status !== 'PAYMENT_CONFIRMED') return claim;

      // Commit ownership exactly once.
      claim = await svc.entities.EvolveTerritoryClaim.update(claim.id, { status: 'OWNERSHIP_COMMITTING' });
      const cell = parseCellId(claim.target_cell_id);
      const [existing] = await svc.entities.EvolveGeoOwnership.filter({
        experiment_id: experimentId,
        cell_id: claim.target_cell_id,
      });
      if (existing && existing.owner_id !== claim.actor_id) {
        return await svc.entities.EvolveTerritoryClaim.update(claim.id, {
          status: 'OWNERSHIP_FAILED',
          failure_code: 'CELL_ALREADY_OWNED',
          failure_detail: `${existing.owner_code || existing.owner_id} acquired the cell before commit`,
        });
      }
      if (!existing) {
        await svc.entities.EvolveGeoOwnership.create({
          experiment_id: experimentId,
          cell_id: claim.target_cell_id,
          owner_type: claim.actor_type,
          owner_id: claim.actor_id,
          owner_code: claim.actor_code || '',
          organization_id: '',
          claimed_at: new Date().toISOString(),
          claim_source: 'ECONOMIC_EXPANSION',
          center_lat: cell.centerLat,
          center_lng: cell.centerLng,
          claim_id: claim.id,
          claim_tx_id: claim.tx_id,
          claim_amount_sompi: claim.amount_sompi,
        });
      }
      claim = await svc.entities.EvolveTerritoryClaim.update(claim.id, {
        status: 'OWNERSHIP_COMMITTED',
        ownership_committed_at: new Date().toISOString(),
        previous_owner_id: existing?.owner_id || '',
      });

      await releaseReservation(claim, 'CONSUMED');

      // Exactly one world event for this claim.
      const [already] = await svc.entities.EvolveEvent.filter(
        { experiment_id: experimentId, type: 'TERRITORY_CLAIMED', target_id: claim.target_cell_id },
        '-created_date',
        20
      );
      const duplicate = already && String(already.message || '').includes(claim.id);
      if (!duplicate) {
        await svc.entities.EvolveEvent.create({
          experiment_id: experimentId,
          type: 'TERRITORY_CLAIMED',
          category: 'WORLD',
          message: `${claim.actor_code || claim.actor_id} claimed ${claim.target_cell_id} — ${(claim.amount_sompi / 1e8).toFixed(4)} tKAS settled to the territory treasury [${claim.id}]`,
          actor_id: claim.actor_id,
          actor_code: claim.actor_code || '',
          target_id: claim.target_cell_id,
          target_code: claim.target_cell_id,
          amount: Number((claim.amount_sompi / 1e8).toFixed(4)),
          day: claim.day || 0,
        });
      }
      return claim;
    }

    function publicClaim(c: any) {
      if (!c) return null;
      // Never surface signing material — there is none on the claim record.
      return {
        id: c.id,
        claim_action_id: c.claim_action_id,
        actor_id: c.actor_id,
        actor_code: c.actor_code,
        target_cell_id: c.target_cell_id,
        from_cell_id: c.from_cell_id,
        status: c.status,
        resource_cost: c.resource_cost,
        resource_reservation_id: c.resource_reservation_id,
        sender_address: c.sender_address,
        treasury_address: c.treasury_address,
        amount_sompi: c.amount_sompi,
        tx_id: c.tx_id,
        confirmation_evidence: c.confirmation_evidence || null,
        previous_owner_id: c.previous_owner_id || '',
        failure_code: c.failure_code || '',
        failure_detail: c.failure_detail || '',
        requested_at: c.requested_at,
        validated_at: c.validated_at,
        reserved_at: c.reserved_at,
        broadcast_at: c.broadcast_at,
        confirmed_at: c.confirmed_at,
        ownership_committed_at: c.ownership_committed_at,
      };
    }
  } catch (error: any) {
    console.error('[evolveTerritoryClaim]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}