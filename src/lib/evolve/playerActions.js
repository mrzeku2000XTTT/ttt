/**
 * PlayerActions — all human player actions on the engine.
 * Kept separate from EvolveEngine to keep the engine file maintainable.
 * Every method is bound to an engine instance and mutates engine state directly.
 */
import { createPlayerJob } from "./jobService";
import { createOrganization } from "./organizationService";
import { orgColor, RESOURCE_IDS, BUILD_COST, BUILD_STATS } from "./constants";
import {
  createPlayer,
  applyStartingInventory,
  notifyPlayer,
  adjustReputation,
  checkInsolvency,
} from "./playerService";
import { countryAt, randomCellInCountry, cellStats } from "./countryMap";
import { priceOf } from "./economyService";

const PLAYER_BUILD_COST = {
  energy: 4,
  compute: 5,
  server: 8,
  storage: 3,
};

const PLAYER_BUILD_OUTPUT = {
  energy: { resource: "energy", rate: 0.08 },
  compute: { resource: "compute", rate: 0.06 },
  server: { resource: "data", rate: 0.05 },
  storage: { resource: "storage", rate: 0.04 },
};

export const PlayerActions = {
  /** Spawn a new human player or return their existing actor. */
  spawnPlayer({ userId, country, position }) {
    const existing = this.players.find((p) => p.user_id === userId);
    if (existing) return { ok: true, player: existing, existing: true };

    const wallet = this.kaspa.createAgentWallet(`PLR_${this.playerSeq + 1}`);
    const player = createPlayer({
      userId,
      experimentId: this.config.label,
      country,
      position,
      wallet,
      balance: 15,
      day: this.world.day,
    });
    applyStartingInventory(player);
    this.kaspa.credit(wallet.address, 15);

    this.players.push(player);
    this.playerById.set(player.id, player);
    this.playerSeq = this.players.length;

    this.emit({
      type: "PLAYER_SPAWNED",
      category: "WORLD",
      message: `${player.code} entered ${country}`,
      actor_id: player.id,
      actor_code: player.code,
      target_code: country,
    });
    this.notify();
    return { ok: true, player, existing: false };
  },

  findPlayerByUser(userId) {
    return this.players.find((p) => p.user_id === userId) || null;
  },

  /** Move the player to a new cell. Costs energy. */
  playerMove(playerId, x, y) {
    const player = this.playerById.get(playerId);
    if (!player) return { ok: false, message: "Player not found" };
    if (!this.world.inBounds(x, y)) return { ok: false, message: "Out of bounds" };
    if (!this.world.isBuildable(x, y)) return { ok: false, message: "Cannot move there" };
    const dist = Math.abs(player.position.x - x) + Math.abs(player.position.y - y);
    if (dist === 0) return { ok: false, message: "Already here" };
    const energyCost = dist * 0.05;
    if (player.assets.energy < energyCost) return { ok: false, message: "Not enough energy to move" };
    player.assets.energy = Number((player.assets.energy - energyCost).toFixed(2));
    player.balance = Number((player.balance - energyCost * 0.5).toFixed(2));
    player.lifetime_expenses = Number((player.lifetime_expenses + energyCost * 0.5).toFixed(2));
    player.position = { x, y };
    player.status = "moving";
    this.emit({
      type: "PLAYER_MOVED",
      category: "WORLD",
      message: `${player.code} moved to ${x},${y}`,
      actor_id: player.id,
      actor_code: player.code,
      target_code: `${x},${y}`,
    });
    this.notify();
    return { ok: true, message: `Moved to ${x},${y}` };
  },

  /** Player posts a job for AI to evaluate. Reward is escrowed. */
  playerPostJob(playerId, { type, title, brief, reward, verification, difficulty }) {
    const player = this.playerById.get(playerId);
    if (!player) return { ok: false, message: "Player not found" };
    const r = Number(reward || 0);
    if (r < 0.5) return { ok: false, message: "Reward too low" };
    if (player.balance < r) return { ok: false, message: "Insufficient balance" };
    const job = createPlayerJob({
      type,
      title,
      brief,
      reward: r,
      verification: verification || "SCHEMA",
      difficulty: difficulty || "MEDIUM",
      postedBy: playerId,
      posterCode: player.code,
      day: this.world.day,
    });
    // Escrow the reward from the player's balance.
    player.balance = Number((player.balance - r).toFixed(2));
    player.lifetime_expenses = Number((player.lifetime_expenses + r).toFixed(2));
    this.jobs.push(job);
    this.emit({
      type: "JOB_POSTED_BY_PLAYER",
      category: "JOB",
      message: `${player.code} posted ${job.code} · ${r.toFixed(2)} tKAS reward`,
      actor_id: player.id,
      actor_code: player.code,
      target_id: job.id,
      target_code: job.code,
      amount: r,
    });
    notifyPlayer(player, { type: "JOB_POSTED", message: `You posted ${job.code} for ${r.toFixed(2)} tKAS` });
    this.notify();
    return { ok: true, message: `${job.code} posted — AI will evaluate it`, job };
  },

  /** Player claims an open AI-generated job to perform themselves. */
  playerClaimJob(playerId, jobId) {
    const player = this.playerById.get(playerId);
    const job = this.jobs.find((j) => j.id === jobId);
    if (!player || !job || job.status !== "OPEN") return { ok: false, message: "Job is no longer open" };
    if (job.is_player_job && job.posted_by === playerId) return { ok: false, message: "You posted this job" };
    job.status = "CLAIMED";
    job.claimed_by = playerId;
    player.current_job_id = job.id;
    player.status = "working";
    this.emit({
      type: "PLAYER_CLAIMED_JOB",
      category: "JOB",
      message: `${player.code} claimed ${job.code}`,
      actor_id: player.id,
      actor_code: player.code,
      target_id: job.id,
      target_code: job.code,
    });
    this.notify();
    return { ok: true, message: `You claimed ${job.code}` };
  },

  /** Player trades resources at market price (direct, immediate). */
  playerTrade(playerId, { resource, qty, direction }) {
    const player = this.playerById.get(playerId);
    if (!player) return { ok: false, message: "Player not found" };
    if (!RESOURCE_IDS.includes(resource)) return { ok: false, message: "Unknown resource" };
    const q = Math.max(1, Math.floor(qty || 1));
    const price = priceOf(this.world, resource);
    const value = Number((price * q).toFixed(2));
    if (direction === "buy") {
      if (player.balance < value) return { ok: false, message: "Insufficient balance" };
      if (!this.world.pay({ [resource]: q })) return { ok: false, message: "World pool is short" };
      player.balance = Number((player.balance - value).toFixed(2));
      player.lifetime_expenses = Number((player.lifetime_expenses + value).toFixed(2));
      player.assets[resource] = Number(((player.assets[resource] || 0) + q).toFixed(2));
    } else {
      if ((player.assets[resource] || 0) < q) return { ok: false, message: "You don't have enough" };
      player.assets[resource] = Number(((player.assets[resource] || 0) - q).toFixed(2));
      player.balance = Number((player.balance + value).toFixed(2));
      player.lifetime_earnings = Number((player.lifetime_earnings + value).toFixed(2));
      this.world.credit({ [resource]: q });
    }
    this.emit({
      type: "PLAYER_TRADE",
      category: "ECONOMY",
      message: `${player.code} ${direction === "buy" ? "bought" : "sold"} ${q} ${resource} · ${value.toFixed(2)} tKAS`,
      actor_id: player.id,
      actor_code: player.code,
      amount: value,
    });
    this.notify();
    return { ok: true, message: `${direction === "buy" ? "Bought" : "Sold"} ${q} ${resource} for ${value.toFixed(2)} tKAS` };
  },

  /** Player posts a trade offer that AI can evaluate. */
  playerPostTradeOffer(playerId, { resource, qty, direction, pricePerUnit }) {
    const player = this.playerById.get(playerId);
    if (!player) return { ok: false, message: "Player not found" };
    if (!RESOURCE_IDS.includes(resource)) return { ok: false, message: "Unknown resource" };
    const q = Math.max(1, Math.floor(qty || 1));
    const p = Number(pricePerUnit || 0);
    if (p <= 0) return { ok: false, message: "Price must be positive" };
    const offer = {
      id: `TRO_${Date.now()}_${Math.floor(this.rng() * 1000)}`,
      playerId,
      playerCode: player.code,
      resource,
      qty: q,
      direction, // "sell" = player sells to AI, "buy" = player buys from AI
      pricePerUnit: p,
      totalValue: Number((p * q).toFixed(2)),
      tick: this.tickCount,
    };
    if (direction === "sell" && (player.assets[resource] || 0) < q) {
      return { ok: false, message: "You don't have enough to sell" };
    }
    this.tradeOffers.push(offer);
    if (this.tradeOffers.length > 60) this.tradeOffers.shift();
    this.emit({
      type: "PLAYER_TRADE_OFFER",
      category: "ECONOMY",
      message: `${player.code} offers ${direction === "sell" ? "SELL" : "BUY"} ${q} ${resource} @ ${p.toFixed(2)}`,
      actor_id: player.id,
      actor_code: player.code,
      amount: offer.totalValue,
    });
    this.notify();
    return { ok: true, message: `Trade offer posted — AI will evaluate it` };
  },

  /** Player builds infrastructure. Costs tKAS, creates an asset owned by the player. */
  playerBuild(playerId, { kind, x, y }) {
    const player = this.playerById.get(playerId);
    if (!player) return { ok: false, message: "Player not found" };
    const validKinds = ["energy", "compute", "server", "storage"];
    if (!validKinds.includes(kind)) return { ok: false, message: "Invalid structure" };
    if (!this.world.inBounds(x, y)) return { ok: false, message: "Out of bounds" };
    if (!this.world.isBuildable(x, y)) return { ok: false, message: "Cannot build here" };
    const cost = PLAYER_BUILD_COST[kind] || 5;
    if (player.balance < cost) return { ok: false, message: `Need ${cost} tKAS` };
    const org = this.orgs.find((o) => o.id === player.organization_id);
    const res = this.world.placeAsset(kind, x, y, {
      ownerId: playerId,
      orgSlot: org?.slot || 0,
      organizationId: org?.id || "",
    });
    if (!res.ok) return { ok: false, message: res.reason };
    player.balance = Number((player.balance - cost).toFixed(2));
    player.lifetime_expenses = Number((player.lifetime_expenses + cost).toFixed(2));
    if (kind === "server") player.assets.servers = (player.assets.servers || 0) + 1;
    this.emit({
      type: "PLAYER_BUILT",
      category: "ECONOMY",
      message: `${player.code} built ${kind.toUpperCase()} at ${x},${y} · ${res.asset.sim_id}`,
      actor_id: player.id,
      actor_code: player.code,
      target_id: res.asset.sim_id,
      target_code: res.asset.sim_id,
      amount: cost,
    });
    notifyPlayer(player, { type: "ASSET_BUILT", message: `${res.asset.sim_id} online at ${x},${y}` });
    this.notify();
    return { ok: true, message: `${res.asset.sim_id} online`, asset: res.asset };
  },

  /** Player proposes a cooperation contract to another actor. */
  playerProposeContract(playerId, { partnerId, partnerType, reward, myContribution, theirContribution, myShare }) {
    const player = this.playerById.get(playerId);
    if (!player) return { ok: false, message: "Player not found" };
    const partner =
      partnerType === "agent"
        ? this.agentById.get(partnerId)
        : this.playerById.get(partnerId);
    if (!partner) return { ok: false, message: "Partner not found" };
    if (partner.status === "archived" || partner.status === "insolvent") {
      return { ok: false, message: "Partner is unavailable" };
    }
    const r = Number(reward || 0);
    if (r < 1) return { ok: false, message: "Reward too low" };
    if (player.balance < r * (myShare || 0.5)) {
      return { ok: false, message: "You cannot cover your share" };
    }
    const contract = {
      id: `CTR_${String(this.contracts.length + 1).padStart(4, "0")}`,
      creator_actor_id: playerId,
      creator_code: player.code,
      creator_type: "player",
      participant_actor_ids: [partnerId],
      participant_codes: [partner.code],
      participant_types: [partnerType],
      contributions: {
        [playerId]: myContribution || "capital",
        [partnerId]: theirContribution || "work",
      },
      reward: r,
      reward_distribution: {
        [playerId]: Number((r * (myShare || 0.5)).toFixed(2)),
        [partnerId]: Number((r * (1 - (myShare || 0.5))).toFixed(2)),
      },
      status: "PROPOSED",
      day: this.world.day,
      accepted_by: [],
    };
    this.contracts.push(contract);
    this.emit({
      type: "CONTRACT_PROPOSED",
      category: "ORG",
      message: `${player.code} proposed a contract with ${partner.code} · ${r.toFixed(2)} tKAS`,
      actor_id: player.id,
      actor_code: player.code,
      target_id: partnerId,
      target_code: partner.code,
      amount: r,
    });
    this.notify();
    return { ok: true, message: `Contract proposed to ${partner.code}`, contract };
  },

  /** Player forms an organization with a partner. Requires cooperation history. */
  playerFormOrg(playerId, { partnerId, partnerType, name }) {
    const player = this.playerById.get(playerId);
    if (!player) return { ok: false, message: "Player not found" };
    if (player.organization_id) return { ok: false, message: "You already belong to an organization" };
    const partner =
      partnerType === "agent"
        ? this.agentById.get(partnerId)
        : this.playerById.get(partnerId);
    if (!partner) return { ok: false, message: "Partner not found" };
    if (partner.organization_id) return { ok: false, message: "Partner already in an organization" };
    const check = this.relationships.canFormOrg(playerId, partnerId);
    if (!check.ok) return { ok: false, message: check.reason };
    const cost = 8;
    if (player.balance < cost) return { ok: false, message: `Need ${cost} tKAS to form an organization` };
    const org = createOrganization({
      rng: this.rng,
      name,
      founderId: playerId,
      day: this.world.day,
      members: [playerId, partnerId],
    });
    org.color = orgColor(org.id);
    org.slot = this.world.registerOrg(org.id);
    this.orgs.push(org);
    player.organization_id = org.id;
    partner.organization_id = org.id;
    player.balance = Number((player.balance - cost).toFixed(2));
    player.lifetime_expenses = Number((player.lifetime_expenses + cost).toFixed(2));
    this.emit({
      type: "ORGANIZATION_CREATED",
      category: "ORG",
      message: `${player.code} and ${partner.code} formed ${org.name}`,
      actor_id: playerId,
      actor_code: player.code,
      target_id: org.id,
      target_code: org.name,
    });
    notifyPlayer(player, { type: "ORG_FORMED", message: `You co-founded ${org.name} with ${partner.code}` });
    this.notify();
    return { ok: true, message: `${org.name} founded`, org };
  },

  /** Player leaves their organization. */
  playerLeaveOrg(playerId) {
    const player = this.playerById.get(playerId);
    if (!player || !player.organization_id) return { ok: false, message: "Not in an organization" };
    const org = this.orgs.find((o) => o.id === player.organization_id);
    if (!org) return { ok: false, message: "Organization not found" };
    org.members = org.members.filter((m) => m !== playerId);
    player.organization_id = "";
    this.emit({
      type: "PLAYER_LEFT_ORG",
      category: "ORG",
      message: `${player.code} left ${org.name}`,
      actor_id: playerId,
      actor_code: player.code,
      target_id: org.id,
      target_code: org.name,
    });
    this.notify();
    return { ok: true, message: `You left ${org.name}` };
  },

  /** Player dismisses a notification. */
  playerDismissNotification(playerId, notificationId) {
    const player = this.playerById.get(playerId);
    if (!player || !player.notifications) return { ok: false };
    player.notifications = player.notifications.filter((n) => n.id !== notificationId);
    this.notify();
    return { ok: true };
  },

  playerMarkNotificationsRead(playerId) {
    const player = this.playerById.get(playerId);
    if (!player || !player.notifications) return;
    player.notifications.forEach((n) => {
      n.read = true;
    });
    this.notify();
  },

  /** Get nearby actors (AI + human) for the player's current position. */
  nearbyActors(playerId, radius = 10) {
    const player = this.playerById.get(playerId);
    if (!player) return { agents: [], players: [] };
    const inRange = (p) =>
      p &&
      Math.abs(p.position.x - player.position.x) <= radius &&
      Math.abs(p.position.y - player.position.y) <= radius;
    return {
      agents: this.agents.filter((a) => a.status !== "archived" && inRange(a)),
      players: this.players.filter((p) => p.id !== playerId && inRange(p)),
      assets: this.world.assets.filter((a) => inRange(a)),
    };
  },

  /** Get nearby economic opportunities for the player. */
  nearbyOpportunities(playerId, radius = 10) {
    const player = this.playerById.get(playerId);
    if (!player) return [];
    const nearby = this.nearbyActors(playerId, radius);
    const opps = [];
    // Nearby jobs
    this.jobs
      .filter((j) => j.status === "OPEN")
      .slice(0, 5)
      .forEach((j) => {
        opps.push({ type: "JOB", code: j.code, title: j.title, reward: j.reward, detail: `${j.type} · ${j.difficulty}` });
      });
    // Market prices
    RESOURCE_IDS.forEach((r) => {
      const price = priceOf(this.world, r);
      opps.push({ type: "MARKET", resource: r, price, detail: `${r} @ ${price.toFixed(2)}` });
    });
    // AI trade offers
    this.tradeOffers
      .filter((o) => o.playerId !== playerId)
      .slice(0, 4)
      .forEach((o) => {
        opps.push({
          type: "AI_OFFER",
          detail: `${o.playerCode} ${o.direction === "sell" ? "sells" : "buys"} ${o.qty} ${o.resource} @ ${o.pricePerUnit.toFixed(2)}`,
        });
      });
    // Unclaimed resources (deposits)
    nearby.assets
      .filter((a) => !a.owner_id && a.kind === "deposit")
      .slice(0, 3)
      .forEach((a) => {
        opps.push({ type: "RESOURCE", detail: `Unclaimed ${a.sim_id} ${Math.abs(a.x - player.position.x) + Math.abs(a.y - player.position.y)} cells away` });
      });
    return opps.slice(0, 10);
  },
};

/** AI evaluates and accepts player trade offers each tick. */
export function evaluateTradeOffers(engine) {
  if (!engine.tradeOffers.length) return;
  const remaining = [];
  engine.tradeOffers.forEach((offer) => {
    // Find nearby AI agents that might accept
    const player = engine.playerById.get(offer.playerId);
    if (!player) return;
    const marketPrice = priceOf(engine.world, offer.resource);
    const isGoodDeal =
      offer.direction === "sell"
        ? offer.pricePerUnit < marketPrice * 0.95 // AI buys if cheaper than market
        : offer.pricePerUnit > marketPrice * 1.05; // AI sells if pricier than market
    if (!isGoodDeal) {
      remaining.push(offer);
      return;
    }
    // Find an AI agent nearby that can afford it
    const nearby = engine.agents.filter(
      (a) =>
        a.status !== "archived" &&
        Math.abs(a.position.x - player.position.x) < 12 &&
        Math.abs(a.position.y - player.position.y) < 12
    );
    const buyer = nearby.find((a) => {
      if (offer.direction === "sell") return a.balance >= offer.totalValue;
      return (a.assets[offer.resource] || 0) >= offer.qty;
    });
    if (!buyer) {
      remaining.push(offer);
      return;
    }
    // Execute the trade
    if (offer.direction === "sell") {
      // AI buys from player
      buyer.balance = Number((buyer.balance - offer.totalValue).toFixed(2));
      buyer.lifetime_expenses = Number((buyer.lifetime_expenses + offer.totalValue).toFixed(2));
      buyer.assets[offer.resource] = Number(((buyer.assets[offer.resource] || 0) + offer.qty).toFixed(2));
      player.balance = Number((player.balance + offer.totalValue).toFixed(2));
      player.lifetime_earnings = Number((player.lifetime_earnings + offer.totalValue).toFixed(2));
      player.assets[offer.resource] = Number(((player.assets[offer.resource] || 0) - offer.qty).toFixed(2));
      engine.world.credit({ [offer.resource]: offer.qty });
    } else {
      // AI sells to player
      buyer.assets[offer.resource] = Number(((buyer.assets[offer.resource] || 0) - offer.qty).toFixed(2));
      buyer.balance = Number((buyer.balance + offer.totalValue).toFixed(2));
      buyer.lifetime_earnings = Number((buyer.lifetime_earnings + offer.totalValue).toFixed(2));
      player.balance = Number((player.balance - offer.totalValue).toFixed(2));
      player.lifetime_expenses = Number((player.lifetime_expenses + offer.totalValue).toFixed(2));
      player.assets[offer.resource] = Number(((player.assets[offer.resource] || 0) + offer.qty).toFixed(2));
      engine.world.pay({ [offer.resource]: offer.qty });
    }
    engine.relationships.recordTrade(buyer.id, player.id, true, offer.totalValue, engine.tickCount);
    adjustReputation(player, 0.5);
    engine.emit({
      type: "TRADE_OFFER_ACCEPTED",
      category: "ECONOMY",
      message: `${buyer.code} accepted ${player.code}'s trade · ${offer.qty} ${offer.resource} · ${offer.totalValue.toFixed(2)} tKAS`,
      actor_id: buyer.id,
      actor_code: buyer.code,
      target_id: player.id,
      target_code: player.code,
      amount: offer.totalValue,
    });
    notifyPlayer(player, {
      type: "TRADE_ACCEPTED",
      message: `${buyer.code} accepted your trade · +${offer.totalValue.toFixed(2)} tKAS`,
    });
  });
  engine.tradeOffers = remaining.slice(-40);
}

/** AI evaluates and accepts player contracts each tick. */
export function evaluateContracts(engine) {
  engine.contracts
    .filter((c) => c.status === "PROPOSED")
    .forEach((c) => {
      const partnerId = c.participant_actor_ids[0];
      const partnerType = c.participant_types[0];
      const partner =
        partnerType === "agent" ? engine.agentById.get(partnerId) : engine.playerById.get(partnerId);
      if (!partner) {
        c.status = "CANCELLED";
        return;
      }
      // AI evaluates: is my share worth my contribution?
      if (partnerType !== "agent") return; // only AI auto-evaluates; human contracts need human acceptance
      const myShare = c.reward_distribution[partnerId] || 0;
      const expectedCost = 1.5; // rough estimate
      if (myShare > expectedCost && engine.rng() < 0.3) {
        c.status = "ACCEPTED";
        c.accepted_by = [partnerId];
        // Execute: pay out the reward
        const creator = engine.playerById.get(c.creator_actor_id);
        if (creator && creator.balance >= c.reward) {
          creator.balance = Number((creator.balance - c.reward).toFixed(2));
          partner.balance = Number((partner.balance + myShare).toFixed(2));
          partner.lifetime_earnings = Number((partner.lifetime_earnings + myShare).toFixed(2));
          creator.lifetime_earnings = Number((creator.lifetime_earnings + (c.reward - myShare)).toFixed(2));
          c.status = "COMPLETED";
          engine.relationships.recordSharedJob(creator.id, partner.id, c.reward, engine.tickCount);
          adjustReputation(creator, 1);
          engine.emit({
            type: "CONTRACT_COMPLETED",
            category: "ORG",
            message: `${partner.code} accepted and completed contract with ${creator.code} · ${c.reward.toFixed(2)} tKAS`,
            actor_id: partner.id,
            actor_code: partner.code,
            target_id: creator.id,
            target_code: creator.code,
            amount: c.reward,
          });
          notifyPlayer(creator, {
            type: "CONTRACT_COMPLETED",
            message: `${partner.code} completed your contract · +${(c.reward - myShare).toFixed(2)} tKAS`,
          });
        }
      }
    });
}

/** Player upkeep: pay operating costs, check insolvency, age. */
export function playerUpkeep(engine) {
  engine.players.forEach((p) => {
    p.age_days += 1 / 8;
    const upkeep = 0.02 * (p.assets.servers || 0) + 0.01;
    p.balance = Number((p.balance - upkeep).toFixed(2));
    p.lifetime_expenses = Number((p.lifetime_expenses + upkeep).toFixed(2));
    const insolvent = checkInsolvency(p);
    if (insolvent) {
      notifyPlayer(p, { type: "INSOLVENT", message: "You are insolvent. Work or trade to recover." });
    }
  });
}

/** Player asset income: assets produce resources, player earns passive income. */
export function playerAssetIncome(engine) {
  engine.world.assets.forEach((a) => {
    if (!a.owner_id) return;
    const isPlayerAsset = engine.playerById.has(a.owner_id);
    if (!isPlayerAsset) return;
    if (a.damage >= a.value || a.output <= 0) return;
    const player = engine.playerById.get(a.owner_id);
    const out = PLAYER_BUILD_OUTPUT[a.kind];
    if (!out) return;
    const income = Number((a.output * 0.02).toFixed(2));
    player.balance = Number((player.balance + income).toFixed(2));
    player.lifetime_earnings = Number((player.lifetime_earnings + income).toFixed(2));
  });
}