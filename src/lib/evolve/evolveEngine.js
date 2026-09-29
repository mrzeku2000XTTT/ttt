import { WorldEngine } from "./worldEngine";
import { EventService } from "./eventService";
import { createKaspaService } from "./kaspaService";
import { isolatedMockEnabled, blockedPayment, tn10BlockedMessage } from '@/lib/evolve/tn10Safety';
import { ActionValidator } from "./actionValidator";
import { EvolutionService, REPRODUCTION_REQUIREMENTS } from "./evolutionService";
import { createAgent, decide, recordDecision, agentName, OPERATING_COSTS } from "./agentEngine";
import { createJob, nextStatus, verifySubmission, jobProgressPerTick, resetJobSeq } from "./jobService";
import {
  createOrganization,
  joinOrganization,
  contribute,
  contract,
  ally,
  declareRivalry,
  resetOrgSeq,
} from "./organizationService";
import { planAttack, resolveAttack, recon } from "./conflictService";
import { charge, priceOf } from "./economyService";
import { randomGenome, calculateFitness, meanGenome } from "./genome";
import { makeRng, clamp01 } from "./rng";
import { TOOLS, RESOURCE_IDS, WORLD_SIZES, BUILD_STATS, BASE_PRICES, orgColor } from "./constants";
import { RelationshipService, ORG_FORMATION_REQUIREMENTS } from "./relationshipService";
import {
  createPlayer,
  applyStartingInventory,
  notifyPlayer,
  markNotificationsRead,
  adjustReputation,
  checkInsolvency,
  resetPlayerSeq,
  PLAYER_START,
} from "./playerService";
import { createPlayerJob } from "./jobService";
import { COUNTRIES, countryAt, countryStats, randomCellInCountry, cellStats } from "./countryMap";
import {
  PlayerActions,
  evaluateTradeOffers,
  evaluateContracts,
  playerUpkeep,
  playerAssetIncome,
} from "./playerActions";

const ACTIONS_PER_TICK = 48;
const TICKS_PER_DAY = 8;
const TREASURY_SEED_MULTIPLIER = 3;
/* External research grants — the money supply that keeps verified work payable. */
const TREASURY_GRANT_PER_DAY = 140;

export const DEFAULT_CONFIG = {
  label: "EVOLVE-01",
  seed: 20260929,
  network: "kaspa-tn10",
  genesis_agents: 0,
  initial_test_kas: 60,
  mutation_rate: 0.05,
  scarcity: "medium",
  world_size: "medium",
  selection: "economic",
  objective: "Maximize long-term economic survival",
  ledger_mode: isolatedMockEnabled ? 'mock' : 'tn10',
};

/**
 * EvolveEngine — the single owner of simulation state.
 * The world renderer draws from it, the HUD reads from it, and every mutation
 * (human tool, agent decision, or simulated conflict) is routed through it.
 */
export class EvolveEngine {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rng = makeRng(this.config.seed);
    this.world = new WorldEngine({
      seed: this.config.seed,
      size: this.config.world_size,
      scarcity: this.config.scarcity,
    });
    this.kaspa = createKaspaService(this.config.ledger_mode);
    this.events = new EventService();
    this.validator = new ActionValidator({ world: this.world });
    this.evolution = new EvolutionService({
      world: this.world,
      mutationRate: this.config.mutation_rate,
      rng: this.rng,
    });

    this.agents = [];
    this.agentById = new Map();
    this.jobs = [];
    this.orgs = [];
    this.transactions = [];
    this.relationships = new RelationshipService();
    this.treasury = { address: "", balance: 0, totalPaid: 0, pending: 0 };

    this.players = [];
    this.playerById = new Map();
    this.playerSeq = 0;
    this.contracts = [];
    this.tradeOffers = [];

    this.agentSeq = 0;
    this.tickCount = 0;
    this.paused = false;
    this.speed = 5;
    this.selection = null;
    this.tool = "OBSERVE";
    this.paintBiome = "PLAINS";
    this.paintFaction = "neutral";
    this.pendingTarget = null;
    this.started = false;
    this.genesisStage = "";
    this.window = { births: 0, jobs: 0, from: 0 };
    this.listeners = new Set();
    this.dirty = false;

    // Bind player actions to this engine instance.
    Object.keys(PlayerActions).forEach((k) => {
      const action = PlayerActions[k].bind(this);
      this[k] = (...args) => isolatedMockEnabled ? action(...args) : blockedPayment();
    });
  }

  /* ------------------------------------------------------------- plumbing */
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  /**
   * Hard notify = an explicit action, repaint immediately.
   * Soft notify = a simulation tick: coalesced so a fast clock cannot thrash React
   * while the canvas keeps drawing from live state.
   */
  notify(soft = false) {
    if (soft) {
      const now = Date.now();
      if (this._lastSoft && now - this._lastSoft < 110) return;
      this._lastSoft = now;
    }
    this.dirty = false;
    this.listeners.forEach((fn) => fn());
  }

  code(seq) {
    return `A#${String(seq).padStart(3, "0")}`;
  }

  /* -------------------------------------------------------------- genesis */
  async bootstrap(onStage = () => {}) {
    if (!isolatedMockEnabled) throw new Error(tn10BlockedMessage);
    const cfg = this.config;
    const stage = async (label) => {
      this.genesisStage = label;
      this.notify();
      onStage(label);
      await new Promise((r) => setTimeout(r, 120));
    };

    await stage("Generating world");
    resetJobSeq(0);
    resetOrgSeq(0);

    await stage("Creating genesis agents");
    const tw = this.kaspa.createAgentWallet("treasury");
    this.treasury.address = tw.address;
    const treasurySeed = Math.max(2000, cfg.initial_test_kas * cfg.genesis_agents * TREASURY_SEED_MULTIPLIER);
    this.treasury.balance = treasurySeed;
    this.kaspa.credit(tw.address, treasurySeed);

    // Genesis agents are SOLO, INDEPENDENT, NEUTRAL.
    // No factions, no organizations, no territory — civilization emerges from them.
    const spots = this.spawnSpots(cfg.genesis_agents);
    for (let i = 0; i < cfg.genesis_agents; i += 1) {
      const spot = spots[i] || this.randomLandTile();
      const agent = this.newAgent({
        generation: 0,
        genome: randomGenome(this.rng),
        faction: "neutral",
        position: spot,
        balance: cfg.initial_test_kas,
      });
      this.agents.push(agent);
      this.agentById.set(agent.id, agent);
      // No territory claim at genesis — the world starts unowned.
    }

    // No organizations are founded at genesis.
    // They emerge later when agents discover that cooperation improves survival.

    await stage("Seeding the job market");
    for (let i = 0; i < 23; i += 1) this.jobs.push(createJob(this.rng, this.world.day));

    await stage("Running early economy");
    this.quiet = true;
    for (let i = 0; i < 1024; i += 1) this.tick(true);
    this.quiet = false;

    await stage("Recording snapshot");
    this.snapshot();
    this.started = true;
    this.events.push({
      type: "WORLD_ONLINE",
      category: "WORLD",
      message: `World online — ${this.agents.length} independent agents, 0 organizations, 0 territories`,
      day: this.world.day,
      clock: this.clockLabel(),
    });
    this.notify();
    return this;
  }

  spawnSpots(count) {
    const out = [];
    let guard = 0;
    while (out.length < count && guard < 4000) {
      guard += 1;
      const t = this.randomLandTile();
      if (t && !out.some((s) => Math.abs(s.x - t.x) < 6 && Math.abs(s.y - t.y) < 6)) out.push(t);
    }
    return out;
  }

  randomLandTile() {
    for (let i = 0; i < 400; i += 1) {
      const x = Math.floor(this.rng() * this.world.width);
      const y = Math.floor(this.rng() * this.world.height);
      if (this.world.isBuildable(x, y)) return { x, y };
    }
    return { x: Math.floor(this.world.width / 2), y: Math.floor(this.world.height / 2) };
  }

  newAgent({ generation, genome, faction, position, balance, parentId = "", lineageRoot = "" }) {
    this.agentSeq += 1;
    const id = `AGT_${String(this.agentSeq).padStart(4, "0")}`;
    const wallet = this.kaspa.createAgentWallet(id);
    if (balance) this.kaspa.credit(wallet.address, balance);
    return createAgent({
      id,
      code: this.code(this.agentSeq),
      name: agentName(this.rng),
      generation,
      parentId,
      lineageRoot,
      genome,
      faction,
      position,
      wallet,
      balance,
      day: this.world.day,
    });
  }

  /**
   * Create an AI agent owned by a human player, using a REAL Kaspa testnet
   * address (minted server-side by evolveCreateAgentWallet). The agent starts
   * with zero balance — the player funds it on TN10. It can sign its own
   * transactions autonomously via the stored server-side key.
   */
  createAgentForPlayer({ player, address, name }) {
    this.agentSeq += 1;
    const id = `AGT_${String(this.agentSeq).padStart(4, "0")}`;
    const agent = createAgent({
      id,
      code: this.code(this.agentSeq),
      name: name || agentName(this.rng),
      generation: 0,
      genome: randomGenome(this.rng),
      faction: player.faction || "neutral",
      position: { ...player.position },
      wallet: { walletId: "", address, agentId: id, network: "kaspa_testnet_10", ledger: "tn10" },
      balance: 0,
      day: this.world.day,
    });
    agent.owner_user_id = player.user_id;
    agent.owner_player_id = player.id;
    agent.address = address;
    this.agents.push(agent);
    this.agentById.set(id, agent);
    this.emit({
      type: "AGENT_CREATED",
      category: "EVOLUTION",
      message: `${player.code} generated AI agent ${agent.code} · Kaspa TN-10`,
      actor_id: player.id,
      actor_code: player.code,
      target_id: id,
      target_code: agent.code,
    });
    this.notify();
    return { ok: true, agent };
  }

  /* ----------------------------------------------------------- clock/label */
  clockLabel() {
    const minutes = Math.floor((this.world.dayTicks / TICKS_PER_DAY) * 24 * 60);
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  setSpeed(v) {
    this.speed = v;
    this.paused = v === 0;
    this.notify();
  }
  togglePause() {
    this.paused = !this.paused;
    this.notify();
  }

  /** Advances exactly one tick regardless of pause state. For debugging. */
  step() {
    this.tick(false);
    this.notify();
  }

  /** Clears all simulation state so a new genesis can begin. */
  reset() {
    this.agents = [];
    this.agentById = new Map();
    this.jobs = [];
    this.orgs = [];
    this.transactions = [];
    this.world.assets = [];
    this.world.assetById = new Map();
    this.world.assetsByTile = new Map();
    this.world.resources = { compute: 420, energy: 380, storage: 300, data: 260, information: 180, materials: 520 };
    this.world.market = { ...BASE_PRICES };
    this.world.day = 0;
    this.world.dayTicks = 0;
    this.world.owner.fill(0);
    this.world.sculpt.fill(-1);
    this.treasury = { address: "", balance: 0, totalPaid: 0, pending: 0 };
    this.players = [];
    this.playerById = new Map();
    this.playerSeq = 0;
    this.contracts = [];
    this.tradeOffers = [];
    this.agentSeq = 0;
    this.tickCount = 0;
    this.events = new EventService();
    this.started = false;
    this.paused = false;
    this.selection = null;
    this.notify();
  }

  /* ------------------------------------------------------------ main tick */
  tick(quiet = false) {
    if (!isolatedMockEnabled) return;
    this.tickCount += 1;
    const rng = this.rng;
    const dayBefore = this.world.day;
    this.world.produce(rng);
    if (this.world.day !== dayBefore) {
      this.treasury.balance = Number((this.treasury.balance + TREASURY_GRANT_PER_DAY).toFixed(2));
      this.kaspa.credit(this.treasury.address, TREASURY_GRANT_PER_DAY);
      if (!quiet) {
        this.emit({
          type: "TREASURY_GRANT",
          category: "ECONOMY",
          message: `Research grant received · +${TREASURY_GRANT_PER_DAY} tKAS`,
          amount: TREASURY_GRANT_PER_DAY,
        });
        this.maybePostJob();
      }
    }

    // Ledger confirmations are wall-clock driven and never accelerated.
    const confirmed = this.kaspa.tick();
    confirmed.forEach((tx) => {
      const rec = this.transactions.find((t) => t.txid === tx.txid);
      if (rec) rec.status = "CONFIRMED";
      this.treasury.pending = Math.max(0, this.treasury.pending - tx.amount);
      this.emit(
        {
          type: "PAYMENT_CONFIRMED",
          category: "PAYMENT",
          message: `Payment confirmed · ${tx.amount.toFixed(2)} tKAS`,
          amount: tx.amount,
          target_id: tx.txid,
        },
        quiet
      );
    });

    this.advanceJobs(quiet);
    this.actAgents(quiet);
    this.chargeUpkeep();
    if (!quiet) {
      evaluateTradeOffers(this);
      evaluateContracts(this);
      playerUpkeep(this);
      playerAssetIncome(this);
    }

    if (!quiet && this.tickCount % 240 === 0) this.snapshot();
    this.notify(true);
  }

  /** Only a slice of agents act per tick, so cost stays flat as the population grows. */
  actAgents(quiet) {
    const pool = this.agents.filter((a) => a.status !== "archived");
    if (!pool.length) return;
    const foreignPool = this.world.assets
      .filter((a) => a.owner_id && a.damage < a.value)
      .slice(0, 60);
    const start = (this.tickCount * ACTIONS_PER_TICK) % pool.length;

    for (let i = 0; i < ACTIONS_PER_TICK; i += 1) {
      const agent = pool[(start + i) % pool.length];
      agent.age_days += 1 / TICKS_PER_DAY;
      const mine = this.world.assets.find((a) => a.owner_id === agent.id && a.defense < 40);
      // Agents only know what they have discovered — nearby agents, not the whole world.
      const nearby = pool
        .filter(
          (o) =>
            o.id !== agent.id &&
            Math.abs(o.position.x - agent.position.x) < 12 &&
            Math.abs(o.position.y - agent.position.y) < 12
        )
        .slice(0, 6);
      const proposal = decide(agent, {
        jobs: this.jobs,
        orgs: this.orgs,
        rng: this.rng,
        foreignPool,
        myAsset: mine || null,
        nearbyAgents: nearby,
        relationships: this.relationships,
        tick: this.tickCount,
      });
      const check = this.validator.validate(proposal, agent);
      if (!check.ok) continue;
      this.runProposal(agent, proposal, quiet);
    }
    pool.forEach((a) => {
      a.fitness = calculateFitness(a, { org: this.orgs.find((o) => o.id === a.organization_id) });
    });
  }

  runProposal(agent, proposal, quiet) {
    if (!isolatedMockEnabled) return blockedPayment();
    switch (proposal.action) {
      case "CLAIM_JOB": {
        const job = this.jobs.find((j) => j.id === proposal.targetId && j.status === "OPEN");
        if (!job) return;
        this.claimJobInternal(agent, job, quiet);
        return;
      }
      case "WORK": {
        if (!agent.current_job_id) return;
        const job = this.jobs.find((j) => j.id === agent.current_job_id);
        if (job) this.advanceJob(job, agent, quiet);
        return;
      }
      case "MOVE": {
        const t = this.randomLandTile();
        agent.position = t;
        agent.status = "moving";
        charge(agent, ["energy"]);
        recordDecision(agent, "MOVE", { note: `Relocating to ${t.x},${t.y}` });
        return;
      }
      case "RESEARCH": {
        const cost = charge(agent, ["research", "inference"]);
        this.world.credit({ information: 0.4 });
        agent.status = "researching";
        recordDecision(agent, "RESEARCH", { cost, note: "Information purchased" });
        return;
      }
      case "RECON": {
        const asset = this.world.findAsset(proposal.targetId);
        if (!asset) return;
        const cost = charge(agent, ["recon"]);
        const intel = recon(asset, this.rng);
        recordDecision(agent, "RECON", { cost, note: `Server ${asset.sim_id} · defence ≈ ${intel.defense}` });
        this.emit(
          { type: "RECON_COMPLETED", category: "CONFLICT", message: `${agent.code} recon on ${asset.sim_id}`, actor_id: agent.id, actor_code: agent.code, target_id: asset.sim_id },
          quiet
        );
        return;
      }
      case "ATTACK_SIM_ASSET": {
        const asset = this.world.findAsset(proposal.targetId);
        if (!asset) return;
        const plan = planAttack({ actor: agent, asset, commit: 0.6 + (agent.genome.risk || 0.5) * 0.8 });
        this.resolveSimAction(agent, asset, plan, quiet);
        return;
      }
      case "FORTIFY_SIM_ASSET": {
        const asset = this.world.findAsset(proposal.targetId);
        if (!asset || asset.owner_id !== agent.id) return;
        charge(agent, ["defense"]);
        this.world.fortifyAsset(asset.sim_id, 4 + (agent.genome.saving || 0.5) * 6);
        recordDecision(agent, "FORTIFY_SIM_ASSET", { note: `${asset.sim_id} reinforced` });
        return;
      }
      case "JOIN_ORG": {
        const org = this.orgs.find((o) => o.id === proposal.targetId);
        if (!org) return;
        joinOrganization(org, agent);
        charge(agent, ["membership"]);
        recordDecision(agent, "JOIN_ORG", { note: `Joined ${org.name}` });
        this.emit(
          { type: "ORGANIZATION_JOINED", category: "ORG", message: `${agent.code} joined ${org.name}`, actor_id: agent.id, actor_code: agent.code, target_id: org.id, target_code: org.name },
          quiet
        );
        return;
      }
      case "CREATE_ORG": {
        if (agent.organization_id) return;
        // Organization formation requires proven cooperation history.
        const partner = this.agentById.get(proposal.targetId);
        if (!partner || partner.id === agent.id || partner.organization_id) return;
        const check = this.relationships.canFormOrg(agent.id, partner.id);
        if (!check.ok) return;
        if (agent.balance < ORG_FORMATION_REQUIREMENTS.formationCost) return;
        const org = createOrganization({
          rng: this.rng,
          founderId: agent.id,
          day: this.world.day,
          members: [agent.id, partner.id],
        });
        org.color = orgColor(org.id);
        org.slot = this.world.registerOrg(org.id);
        this.orgs.push(org);
        agent.organization_id = org.id;
        partner.organization_id = org.id;
        agent.balance = Number((agent.balance - ORG_FORMATION_REQUIREMENTS.formationCost).toFixed(2));
        agent.lifetime_expenses = Number((agent.lifetime_expenses + ORG_FORMATION_REQUIREMENTS.formationCost).toFixed(2));
        recordDecision(agent, "CREATE_ORG", { note: `Founded ${org.name} with ${partner.code}` });
        this.emit(
          { type: "ORGANIZATION_CREATED", category: "ORG", message: `${agent.code} and ${partner.code} formed ${org.name} — the world's first organization`, actor_id: agent.id, actor_code: agent.code, target_id: org.id, target_code: org.name },
          quiet
        );
        return;
      }
      case "COOPERATE": {
        const other = this.agentById.get(proposal.targetId);
        if (!other || other.id === agent.id || other.status === "archived") return;
        this.relationships.encounter(agent.id, other.id, this.tickCount);
        const rel = this.relationships.get(agent.id, other.id);
        // After enough trust, agents can trade resources.
        if (rel && rel.trustScore > 5 && agent.balance > 3 && this.rng() < 0.35) {
          const resource = RESOURCE_IDS[Math.floor(this.rng() * RESOURCE_IDS.length)];
          const qty = 1 + Math.floor(this.rng() * 3);
          const price = priceOf(this.world, resource);
          const value = Number((price * qty).toFixed(2));
          if (agent.balance >= value) {
            agent.balance = Number((agent.balance - value).toFixed(2));
            other.balance = Number((other.balance + value).toFixed(2));
            agent.lifetime_expenses = Number((agent.lifetime_expenses + value).toFixed(2));
            other.lifetime_earnings = Number((other.lifetime_earnings + value).toFixed(2));
            this.relationships.recordTrade(agent.id, other.id, true, value, this.tickCount);
            recordDecision(agent, "COOPERATE", { note: `Traded with ${other.code} · ${value.toFixed(2)} tKAS` });
            this.emit(
              { type: "AGENT_TRADE", category: "ECONOMY", message: `${agent.code} traded with ${other.code} · ${value.toFixed(2)} tKAS`, actor_id: agent.id, actor_code: agent.code, target_id: other.id, target_code: other.code, amount: value },
              quiet
            );
          }
        } else {
          recordDecision(agent, "COOPERATE", { note: `Encountered ${other.code}` });
        }
        return;
      }
      case "LEAVE_ORG": {
        const org = this.orgs.find((o) => o.id === agent.organization_id);
        if (!org) return;
        const idx = org.members.indexOf(agent.id);
        if (idx >= 0) org.members.splice(idx, 1);
        agent.organization_id = "";
        recordDecision(agent, "LEAVE_ORG", { note: `Left ${org.name}` });
        this.emit(
          { type: "ORGANIZATION_LEFT", category: "ORG", message: `${agent.code} left ${org.name}`, actor_id: agent.id, actor_code: agent.code, target_id: org.id, target_code: org.name },
          quiet
        );
        return;
      }
      case "IDLE": {
        agent.status = "idle";
        recordDecision(agent, "IDLE", { note: "No positive-expected-return action" });
        return;
      }
      case "REPRODUCE": {
        this.reproduceInternal(agent, quiet);
        return;
      }
      default:
        return;
    }
  }

  claimJobInternal(agent, job, quiet) {
    job.status = "CLAIMED";
    job.claimed_by = agent.id;
    agent.current_job_id = job.id;
    agent.status = "working";
    charge(agent, ["inference"]);
    recordDecision(agent, "CLAIM_JOB", {
      note: `${job.code} · expected reward ${job.reward.toFixed(2)}`,
      cost: OPERATING_COSTS.inference,
    });
    this.emit(
      { type: "JOB_CLAIMED", category: "JOB", message: `${agent.code} claimed ${job.code}`, actor_id: agent.id, actor_code: agent.code, target_id: job.id, target_code: job.code },
      quiet
    );
  }

  /** The full lifecycle: RUNNING → SUBMITTED → VERIFYING → VERIFIED/FAILED → PAID. */
  advanceJobs(quiet) {
    this.jobs
      .filter((j) => j.status === "RUNNING")
      .slice(0, 14)
      .forEach((job) => {
        const agent = this.agentById.get(job.claimed_by);
        if (!agent || agent.status === "archived") {
          job.status = "OPEN";
          job.claimed_by = "";
          job.progress = 0;
          return;
        }
        this.advanceJob(job, agent, quiet);
      });

    this.jobs
      .filter((j) => j.status === "VERIFYING")
      .slice(0, 8)
      .forEach((job) => this.verifyJob(job, quiet));
  }

  advanceJob(job, agent, quiet) {
    if (job.status === "CLAIMED") job.status = "RUNNING";
    job.progress = Math.min(1, job.progress + jobProgressPerTick(job, agent));
    charge(agent, ["compute", "energy"]);
    if (job.progress >= 1) {
      job.status = "SUBMITTED";
      job.submission = `${job.type} output for ${job.code}`;
      agent.status = "idle";
      this.emit(
        { type: "JOB_SUBMITTED", category: "JOB", message: `${agent.code} submitted ${job.code}`, actor_id: agent.id, actor_code: agent.code, target_id: job.id, target_code: job.code },
        quiet
      );
      job.status = "VERIFYING";
    }
  }

  verifyJob(job, quiet) {
    const agent = this.agentById.get(job.claimed_by);
    if (!agent) return;
    const result = verifySubmission(job, agent, this.rng);
    job.verification_notes = result.notes;
    job.status = result.passed ? "VERIFIED" : "FAILED";
    if (result.passed) {
      agent.jobs_completed += 1;
      this.payJob(job, agent, quiet);
    } else {
      agent.jobs_failed += 1;
      agent.current_job_id = "";
      // Return escrow to the player if this was a player-posted job.
      if (job.is_player_job && job.posted_by) {
        const poster = this.playerById.get(job.posted_by);
        if (poster) {
          poster.balance = Number((poster.balance + (job.escrow || job.reward)).toFixed(2));
          notifyPlayer(poster, {
            type: "JOB_FAILED",
            message: `${agent.code} failed ${job.code} — ${job.escrow?.toFixed(2) || job.reward.toFixed(2)} tKAS returned`,
          });
        }
      }
      this.emit(
        { type: "JOB_FAILED", category: "JOB", message: `${job.code} failed verification — no payment`, actor_id: agent.id, actor_code: agent.code, target_id: job.id, target_code: job.code },
        quiet
      );
      this.maybeReplaceJob(job, quiet);
    }
  }

  /** Verified work is the only thing the treasury pays for. */
  payJob(job, agent, quiet) {
    if (!isolatedMockEnabled) return blockedPayment();
    job.status = "PAYMENT_PENDING";
    // Player-posted jobs pay from escrow; treasury jobs pay from the treasury.
    const isPlayerJob = !!job.is_player_job;
    const amount = isPlayerJob ? job.reward : Math.min(job.reward, this.treasury.balance);
    const fromAddr = isPlayerJob ? "escrow" : this.treasury.address;
    const tx = this.kaspa.sendPayment({
      from: fromAddr,
      to: agent.address,
      amount,
      note: job.code,
    });
    if (isPlayerJob) {
      // Notify the player who posted the job.
      const poster = this.playerById.get(job.posted_by);
      if (poster) {
        notifyPlayer(poster, {
          type: "JOB_COMPLETED",
          message: `${agent.code} completed your ${job.code} · paid ${amount.toFixed(2)} tKAS`,
        });
      }
    } else {
      this.treasury.balance = Number((this.treasury.balance - amount).toFixed(2));
      this.treasury.totalPaid = Number((this.treasury.totalPaid + amount).toFixed(2));
      this.treasury.pending = Number((this.treasury.pending + amount).toFixed(2));
    }
    agent.balance = Number((agent.balance + amount).toFixed(2));
    agent.lifetime_earnings = Number((agent.lifetime_earnings + amount).toFixed(2));
    agent.current_job_id = "";
    job.status = "PAID";
    job.completed_day = this.world.day;

    this.transactions.unshift({
      id: tx.txid,
      job_id: job.id,
      job_code: job.code,
      agent_id: agent.id,
      agent_code: agent.code,
      amount,
      direction: "credit",
      txid: tx.txid,
      status: "PENDING",
      day: this.world.day,
      note: job.type,
    });
    if (this.transactions.length > 200) this.transactions.length = 200;

    const org = this.orgs.find((o) => o.id === agent.organization_id);
    if (org) {
      org.treasury = Number((org.treasury + amount * 0.05).toFixed(2));
      org.jobs_completed += 1;
      org.reputation = Math.min(100, org.reputation + 0.6);
    }

    recordDecision(agent, "SUBMIT_JOB", { note: `${job.code} verified · +${amount.toFixed(2)} tKAS` });
    this.emit(
      {
        type: "JOB_COMPLETED",
        category: "PAYMENT",
        message: `${agent.code} completed ${job.type.toLowerCase()} job · +${amount.toFixed(2)} tKAS`,
        actor_id: agent.id,
        actor_code: agent.code,
        target_id: job.id,
        target_code: job.code,
        amount,
      },
      quiet
    );
    this.maybeReplaceJob(job, quiet);
  }

  maybeReplaceJob(job, quiet) {
    if (this.jobs.filter((j) => !["PAID", "FAILED"].includes(j.status)).length < 18) {
      const fresh = createJob(this.rng, this.world.day);
      this.jobs.push(fresh);
      this.emit(
        { type: "JOB_CREATED", category: "JOB", message: `New job posted: ${fresh.title}`, target_id: fresh.id, target_code: fresh.code, amount: fresh.reward },
        quiet
      );
    }
  }

  maybePostJob() {
    if (this.jobs.filter((j) => j.status === "OPEN").length > 6) return;
    const fresh = createJob(this.rng, this.world.day);
    this.jobs.push(fresh);
    this.emit({
      type: "JOB_CREATED",
      category: "JOB",
      message: `New job posted: ${fresh.title}`,
      target_id: fresh.id,
      target_code: fresh.code,
      amount: fresh.reward,
    });
  }

  /** Agents pay to exist. This is what makes fitness economic. */
  chargeUpkeep() {
    const slice = this.agents.slice(0, 60).filter((a) => a.status !== "archived");
    slice.forEach((a) => {
      charge(a, ["storage"]);
      if (a.balance < -6) {
        this.evolution.archiveAgent(a, "Insolvent");
        this.emit({
          type: "AGENT_ARCHIVED",
          category: "EVOLUTION",
          message: `${a.code} archived — insolvent`,
          actor_id: a.id,
          actor_code: a.code,
        });
      }
    });
  }

  /** Territory drifts as agents claim tiles, so faction share is emergent. */
  rebalanceFactions() {
    if (this.tickCount % 30 !== 0) return;
    const pool = this.agents.filter((a) => a.status !== "archived");
    if (!pool.length) return;
    for (let i = 0; i < 6; i += 1) {
      const a = pool[Math.floor(this.rng() * pool.length)];
      const t = this.randomLandTile();
      if (this.world.ownerAt(t.x, t.y) === "neutral") this.world.claim(t.x, t.y, a.faction);
    }
  }

  reproduceInternal(parent, quiet) {
    const pop = this.agents.filter((a) => a.status !== "archived").length;
    const can = this.evolution.canReproduce(parent, pop);
    if (!can.ok) return;
    const child = this.evolution.createDescendant(parent, {
      id: "",
      code: "",
      name: agentName(this.rng),
      wallet: null,
      position: parent.position,
      day: this.world.day,
      faction: parent.faction,
    });
    // Rebuild the child through newAgent so it gets a real code and wallet.
    this.agentSeq += 1;
    const id = `AGT_${String(this.agentSeq).padStart(4, "0")}`;
    const wallet = this.kaspa.createAgentWallet(id);
    const finalChild = {
      ...child,
      id,
      code: this.code(this.agentSeq),
      wallet_id: wallet.walletId,
      address: wallet.address,
      position: this.randomLandTile(),
    };
    this.agents.push(finalChild);
    this.agentById.set(id, finalChild);
    parent.children[parent.children.length - 1] = id;

    const mutated = Object.entries(child.genome_delta || {}).filter(([, v]) => Math.abs(v) > 0.001);
    this.emit(
      {
        type: "AGENT_REPRODUCED",
        category: "EVOLUTION",
        message: `${parent.code} created descendant ${finalChild.code}`,
        actor_id: parent.id,
        actor_code: parent.code,
        target_id: finalChild.id,
        target_code: finalChild.code,
      },
      quiet
    );
    if (mutated.length) {
      this.emit(
        {
          type: "MUTATION_OCCURRED",
          category: "EVOLUTION",
          message: `${finalChild.code} mutated · ${mutated.slice(0, 3).map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`).join(", ")}`,
          actor_id: finalChild.id,
          actor_code: finalChild.code,
        },
        quiet
      );
    }
  }

  resolveSimAction(actor, asset, plan, quiet = false) {
    const cost = charge(actor, ["defense"], plan.commit);
    const result = resolveAttack(plan, this.rng);
    const actorOrg = this.orgs.find((o) => o.id === actor.organization_id);
    const actorSlot = actorOrg?.slot || 0;
    if (result.success) {
      this.world.damageAsset(asset.sim_id, result.damage);
      if (asset.damage >= asset.value) {
        this.world.destroyAsset(asset.sim_id, actorSlot);
        if (actorSlot > 0) this.world.claim(asset.x, asset.y, actorSlot);
        // Record conflict in relationships if the asset owner is known
        if (asset.owner_id && asset.owner_id !== actor.id) {
          this.relationships.recordConflict(actor.id, asset.owner_id, this.tickCount);
        }
      }
      actor.balance = Number((actor.balance + result.spoils).toFixed(2));
      actor.lifetime_earnings = Number((actor.lifetime_earnings + result.spoils).toFixed(2));
    } else {
      actor.balance = Number((actor.balance - result.counterDamage * 0.4).toFixed(2));
      actor.lifetime_expenses = Number((actor.lifetime_expenses + result.counterDamage * 0.4).toFixed(2));
    }
    recordDecision(actor, plan.simAction, {
      cost,
      note: `${asset.sim_id} · ${result.success ? "success" : "failed"} · damage ${result.damage}`,
    });
    this.emit(
      {
        type: result.success ? "SIM_ATTACK_SUCCESS" : "SIM_ATTACK_FAILED",
        category: "CONFLICT",
        message: `${actor.code} ${plan.simActionLabel.toLowerCase()} on ${asset.sim_id} — ${result.success ? "success" : "repelled"}`,
        actor_id: actor.id,
        actor_code: actor.code,
        target_id: asset.sim_id,
        amount: result.spoils,
      },
      quiet
    );
    return { plan, result, cost };
  }

  emit(partial, quiet) {
    if (quiet && this.events.events.length > 320) return;
    this.events.push({ day: this.world.day, clock: this.clockLabel(), ...partial });
  }

  /* -------------------------------------------------------- human actions */
  selectTile(x, y, geo = null) {
    this.selection = this.world.tile(x, y);
    if (geo) this.selection.geo = geo;
    this.notify();
    return this.selection;
  }

  clearSelection() {
    this.selection = null;
    this.pendingTarget = null;
    this.notify();
  }

  setTool(id) {
    this.tool = id;
    this.pendingTarget = null;
    this.notify();
  }

  setPaintBiome(key) {
    this.paintBiome = key;
    this.notify();
  }

  setPaintFaction(id) {
    this.paintFaction = id;
    this.notify();
  }

  /** One entry point for every world tool. Returns { ok, message }. */
  applyTool(x, y, opts = {}) {
    const tool = this.tool;
    const def = TOOLS.find((t) => t.id === tool);
    if (!def) return { ok: false, message: "Unknown tool" };
    const tile = this.world.tile(x, y);
    if (!tile) return { ok: false, message: "Outside the world" };

    const sculpt = {
      TERRAIN: this.paintBiome || "PLAINS",
      WATER: "RIVER",
      FOREST: "FOREST",
      MOUNTAIN: "MOUNTAIN",
    };

    const __geo = opts.geo || null;
    switch (tool) {
      case "OBSERVE":
        this.selectTile(x, y, opts.geo);
        return { ok: true, message: opts.geo ? `Inspecting ${opts.geo.cellId}` : `Inspecting ${tile.label} at ${x},${y}` };

      case "TERRAIN":
      case "WATER":
      case "FOREST":
      case "MOUNTAIN": {
        this.world.sculptTile(x, y, sculpt[tool]);
        this.selectTile(x, y, __geo);
        this.emit({
          type: "WORLD_SCULPTED",
          category: "WORLD",
          message: `Terrain reshaped at ${x},${y} → ${sculpt[tool].toLowerCase()}`,
          target_code: `${x},${y}`,
        });
        this.notify();
        return { ok: true, message: `Painted ${sculpt[tool].toLowerCase()} at ${x},${y}` };
      }

      case "FACTION": {
        // Territory is claimed for an organization, not a predefined faction.
        if (!this.orgs.length) return { ok: false, message: "No organizations exist yet — civilization must emerge first" };
        const org = this.orgs[0];
        if (tile.ownerOrg && tile.ownerOrg !== org.id) {
          return { ok: false, message: `${tile.label} already held by another organization` };
        }
        this.world.claim(x, y, org.slot);
        this.selectTile(x, y, __geo);
        this.emit({
          type: "TERRITORY_CLAIMED",
          category: "WORLD",
          message: `${org.name} claimed ${x},${y}`,
          target_id: org.id,
          target_code: org.name,
        });
        this.notify();
        return { ok: true, message: `Claimed for ${org.name}` };
      }

      case "SERVER":
      case "COMPUTE":
      case "ENERGY":
      case "CITY":
      case "RESOURCE": {
        const kind = tool === "RESOURCE" ? "deposit" : tool.toLowerCase();
        // Assets are claimed for the agent's organization, if they have one.
        const agent = this.agentById.get(opts.ownerId || "");
        const org = agent ? this.orgs.find((o) => o.id === agent.organization_id) : null;
        // When the user clicked a real-world geographic cell that is land,
        // allow building even if the abstract biome is water.
        const landOverride = !!(opts.geo && opts.geo.cellId);
        const res = this.world.placeAsset(kind, x, y, {
          ownerId: opts.ownerId || "",
          orgSlot: org?.slot || 0,
          organizationId: org?.id || "",
          landOverride,
        });
        if (!res.ok) return { ok: false, message: res.reason };
        this.selectTile(x, y, __geo);
        this.emit({
          type: "ASSET_BUILT",
          category: "ECONOMY",
          message: `${kind.toUpperCase()} built at ${x},${y} · ${res.asset.sim_id}`,
          target_id: res.asset.sim_id,
          target_code: res.asset.sim_id,
          amount: res.asset.value,
        });
        this.notify();
        return { ok: true, message: `${res.asset.sim_id} online` };
      }

      case "ATTACK":
      case "DEFEND":
      case "TRADE": {
        const asset = tile.assets[0];
        if (!asset) return { ok: false, message: "No simulated asset on this tile" };
        this.pendingTarget = { asset, tool };
        this.selectTile(x, y, __geo);
        this.notify();
        return { ok: true, message: `Selected ${asset.sim_id}` };
      }

      default:
        this.selectTile(x, y, __geo);
        return { ok: true, message: def.hint };
    }
  }

  /** Manual execution of a planned simulation action (from the Attack Planner). */
  executeAttack(plan) {
    const actor = this.agentById.get(plan.attacker.id) || plan.attacker;
    const asset = this.world.findAsset(plan.target.sim_id);
    if (!asset) return { ok: false, message: "Target no longer exists" };
    const out = this.resolveSimAction(actor, asset, plan);
    this.pendingTarget = null;
    this.notify();
    return {
      ok: true,
      message: out.result.success
        ? `${plan.simActionLabel} succeeded · ${out.result.damage} damage`
        : `${plan.simActionLabel} repelled · ${out.result.damage} damage taken`,
      out,
    };
  }

  fortify(simId, actorId) {
    const asset = this.world.findAsset(simId);
    if (!asset) return { ok: false, message: "Asset not found" };
    const agent = this.agentById.get(actorId);
    if (agent) charge(agent, ["defense"]);
    this.world.fortifyAsset(simId, 8);
    this.emit({
      type: "SIM_FORTIFIED",
      category: "CONFLICT",
      message: `${simId} fortified to defence ${asset.defense.toFixed(0)}`,
      target_id: simId,
      target_code: simId,
    });
    this.notify();
    return { ok: true, message: `${simId} reinforced` };
  }

  trade({ assetId, resource, qty, direction, agentId }) {
    if (!isolatedMockEnabled) return blockedPayment();
    const agent = this.agentById.get(agentId);
    if (!agent) return { ok: false, message: "Select an agent first" };
    const price = priceOf(this.world, resource);
    const value = Number((price * qty).toFixed(2));
    if (direction === "buy") {
      if (agent.balance < value) return { ok: false, message: "Agent balance is short" };
      if (!this.world.pay({ [resource]: qty })) return { ok: false, message: "World pool is short" };
      agent.balance = Number((agent.balance - value).toFixed(2));
      agent.lifetime_expenses = Number((agent.lifetime_expenses + value).toFixed(2));
      agent.assets.compute += resource === "compute" ? qty : 0;
    } else {
      agent.balance = Number((agent.balance + value).toFixed(2));
      agent.lifetime_earnings = Number((agent.lifetime_earnings + value).toFixed(2));
      this.world.credit({ [resource]: qty });
    }
    recordDecision(agent, direction === "buy" ? "BUY" : "SELL", {
      note: `${qty} ${resource} at ${price} · ${value.toFixed(2)} tKAS`,
      cost: value,
    });
    this.emit({
      type: "TRADE",
      category: "ECONOMY",
      message: `${agent.code} ${direction === "buy" ? "bought" : "sold"} ${qty} ${resource} · ${value.toFixed(2)} tKAS`,
      actor_id: agent.id,
      actor_code: agent.code,
      target_id: assetId || "",
      amount: value,
    });
    this.notify();
    return { ok: true, message: `${direction === "buy" ? "Bought" : "Sold"} ${qty} ${resource}` };
  }

  claimJob(agentId, jobId) {
    const agent = this.agentById.get(agentId);
    const job = this.jobs.find((j) => j.id === jobId);
    if (!agent || !job || job.status !== "OPEN") return { ok: false, message: "Job is no longer open" };
    this.claimJobInternal(agent, job, false);
    this.notify();
    return { ok: true, message: `${agent.code} claimed ${job.code}` };
  }

  reproduce(agentId) {
    const agent = this.agentById.get(agentId);
    if (!agent) return { ok: false, message: "Agent not found" };
    const can = this.evolution.canReproduce(agent, this.agents.filter((a) => a.status !== "archived").length);
    if (!can.ok) return { ok: false, message: `Cannot reproduce yet — short on ${can.fails.join(", ")}` };
    this.reproduceInternal(agent, false);
    this.notify();
    return { ok: true, message: `${agent.code} produced a descendant` };
  }

  formOrg(agentId, partnerId, name) {
    const agent = this.agentById.get(agentId);
    const partner = this.agentById.get(partnerId);
    if (!agent) return { ok: false, message: "Agent not found" };
    if (agent.organization_id) return { ok: false, message: "Agent already belongs to an organization" };
    if (!partner) return { ok: false, message: "Need a partner with proven cooperation" };
    const check = this.relationships.canFormOrg(agent.id, partner.id);
    if (!check.ok) return { ok: false, message: check.reason };
    const org = createOrganization({ rng: this.rng, name, founderId: agent.id, day: this.world.day, members: [agent.id, partner.id] });
    org.color = orgColor(org.id);
    org.slot = this.world.registerOrg(org.id);
    this.orgs.push(org);
    agent.organization_id = org.id;
    partner.organization_id = org.id;
    this.emit({
      type: "ORGANIZATION_CREATED",
      category: "ORG",
      message: `${org.name} founded by ${agent.code} and ${partner.code}`,
      actor_id: agent.id,
      actor_code: agent.code,
      target_id: org.id,
      target_code: org.name,
    });
    this.notify();
    return { ok: true, message: `${org.name} founded` };
  }

  allyOrgs(aId, bId) {
    const a = this.orgs.find((o) => o.id === aId);
    const b = this.orgs.find((o) => o.id === bId);
    if (!a || !b || a.id === b.id) return { ok: false, message: "Pick two different organizations" };
    ally(a, b);
    this.emit({
      type: "ALLIANCE_CREATED",
      category: "ORG",
      message: `Alliance formed: ${a.name} + ${b.name}`,
      target_id: `${a.id}|${b.id}`,
    });
    this.notify();
    return { ok: true, message: `${a.name} allied with ${b.name}` };
  }

  rivalOrgs(aId, bId) {
    const a = this.orgs.find((o) => o.id === aId);
    const b = this.orgs.find((o) => o.id === bId);
    if (!a || !b || a.id === b.id) return { ok: false, message: "Pick two different organizations" };
    declareRivalry(a, b);
    this.notify();
    return { ok: true, message: `${a.name} now rivals ${b.name}` };
  }

  contributeToOrg(agentId, amount) {
    if (!isolatedMockEnabled) return blockedPayment();
    const agent = this.agentById.get(agentId);
    const org = this.orgs.find((o) => o.id === agent?.organization_id);
    if (!agent || !org) return { ok: false, message: "Agent is not in an organization" };
    const res = contribute(org, agent, amount);
    if (!res.ok) return res;
    this.emit({
      type: "ORG_CONTRIBUTION",
      category: "ORG",
      message: `${agent.code} contributed ${amount.toFixed(2)} tKAS to ${org.name}`,
      actor_id: agent.id,
      actor_code: agent.code,
      target_id: org.id,
      amount,
    });
    this.notify();
    return { ok: true, message: `Contributed ${amount.toFixed(2)} tKAS` };
  }

  payContract(orgId, agentId, amount) {
    if (!isolatedMockEnabled) return blockedPayment();
    const org = this.orgs.find((o) => o.id === orgId);
    const agent = this.agentById.get(agentId);
    if (!org || !agent) return { ok: false, message: "Pick an organization and an agent" };
    const res = contract(org, agent, amount);
    if (!res.ok) return res;
    this.notify();
    return { ok: true, message: `Contract paid to ${agent.code}` };
  }

  /* -------------------------------------------------------------- reports */
  maxGeneration() {
    return this.agents.reduce((m, a) => Math.max(m, a.generation || 0), 0);
  }

  stats() {
    const active = this.agents.filter((a) => a.status !== "archived");
    const activeJobs = this.jobs.filter((j) => ["OPEN", "CLAIMED", "RUNNING", "SUBMITTED", "VERIFYING"].includes(j.status));
    const computeCap = 260 + this.world.assets.filter((a) => a.kind === "compute").length * 12;
    const energyCap = 240 + this.world.assets.filter((a) => a.kind === "energy").length * 12;
    const births = active.filter((a) => this.world.day - (a.born_day || 0) < 6).length;
    const independent = active.filter((a) => !a.organization_id).length;
    return {
      agents: active.length,
      agentsDelta: births,
      independent,
      organized: active.length - independent,
      organizations: this.orgs.length,
      generations: this.maxGeneration(),
      treasury: this.treasury.balance,
      activeJobs: activeJobs.length,
      jobsDelta: this.jobs.filter((j) => j.status === "OPEN").length,
      compute: Math.min(100, Math.round(((this.world.resources.compute || 0) / computeCap) * 100)),
      energy: Math.min(100, Math.round(((this.world.resources.energy || 0) / energyCap) * 100)),
      day: this.world.day,
      speed: this.paused ? 0 : this.speed,
      populationCap: REPRODUCTION_REQUIREMENTS.populationCap,
      assets: this.world.assets.length,
      totalPaid: this.treasury.totalPaid,
      pending: this.treasury.pending,
      humans: this.players.length,
      txs: this.transactions.length + this.tradeOffers.length,
    };
  }

  factionShare() {
    return this.world.orgShare();
  }

  snapshot() {
    const active = this.agents.filter((a) => a.status !== "archived");
    const independent = active.filter((a) => !a.organization_id).length;
    return {
      generation: this.maxGeneration(),
      day: this.world.day,
      population: active.length,
      independent,
      organizations: this.orgs.length,
      treasury: this.treasury.balance,
      total_paid: this.treasury.totalPaid,
      jobs_completed: this.jobs.filter((j) => j.status === "PAID").length,
      faction_share: this.factionShare(),
      mean_genome: meanGenome(active),
    };
  }

  lineageOf(agentId) {
    const byId = this.agentById;
    let node = byId.get(agentId);
    if (!node) return null;
    const ancestors = [];
    let guard = 0;
    while (node?.parent_id && guard < 200) {
      node = byId.get(node.parent_id);
      if (!node) break;
      ancestors.unshift(node);
      guard += 1;
    }
    const root = ancestors[0] || byId.get(agentId);
    const descendants = [];
    const walk = (id, depth) => {
      const a = byId.get(id);
      if (!a) return;
      (a.children || []).forEach((c) => {
        const child = byId.get(c);
        if (!child) return;
        descendants.push({ ...child, depth });
        if (depth < 4) walk(c, depth + 1);
      });
    };
    walk(root.id, 1);
    return { root, ancestors, self: byId.get(agentId), descendants };
  }

  /* ------------------------------------------------------------- hydrate */
  /** Rebuilds a live engine from stored records so the experiment survives a reload. */
  hydrate(records) {
    const { experiment, world, agents = [], assets = [], jobs = [], orgs = [], transactions = [], events = [], players = [], contracts = [] } = records || {};
    if (!experiment) return this;

    this.config = {
      ...this.config,
      label: experiment.label,
      seed: experiment.seed,
      network: experiment.network,
      genesis_agents: experiment.genesis_agents,
      initial_test_kas: experiment.initial_test_kas,
      mutation_rate: experiment.mutation_rate,
      scarcity: experiment.scarcity,
      world_size: experiment.world_size,
      selection: experiment.selection,
      objective: experiment.objective,
      ledger_mode: isolatedMockEnabled ? 'mock' : 'tn10',
    };
    this.rng = makeRng(experiment.seed);
    this.kaspa = createKaspaService(this.config.ledger_mode);
    this.world = new WorldEngine({ seed: experiment.seed, size: experiment.world_size, scarcity: experiment.scarcity });
    this.world.applySerialized(world || {});
    this.world.day = world?.day || 0;
    if (world?.resources) this.world.resources = { ...this.world.resources, ...world.resources };
    if (world?.market) this.world.market = { ...this.world.market, ...world.market };

    this.world.assets = assets.map((a) => ({ ...a }));
    this.world.reindexAssets();
    this.world.syncAssetSeq();

    this.evolution = new EvolutionService({ world: this.world, mutationRate: this.config.mutation_rate, rng: this.rng });
    this.validator = new ActionValidator({ world: this.world });

    this.agents = agents.map((a, i) => ({
      decisions: [],
      children: [],
      assets: { compute: 0, energy: 0, servers: 0, information: 0 },
      age_days: 0,
      fitness: 0,
      reproductions: 0,
      jobs_completed: 0,
      jobs_failed: 0,
      status: "idle",
      ...a,
      id: a.agent_key || `AGT_${String(i + 1).padStart(4, "0")}`,
    }));
    // Drop legacy mock agents (fake genesis roster) — only real kaspatest:/kaspa:
    // addresses belong in the world. Player-generated agents survive.
    this.agents = this.agents.filter((a) => {
      const addr = String(a.address || "");
      return !addr.startsWith("mock:");
    });
    this.agentById = new Map(this.agents.map((a) => [a.id, a]));
    this.agentSeq = this.agents.reduce((m, a) => Math.max(m, Number(String(a.code).replace(/\D/g, "")) || 0), 0);

    this.jobs = jobs.map((j) => ({ ...j, id: j.id && String(j.id).startsWith("JOB") ? j.id : String(j.code).replace("#", "") }));
    resetJobSeq(this.jobs.reduce((m, j) => Math.max(m, Number(String(j.code).replace(/\D/g, "")) || 0), 0));

    this.orgs = orgs.map((o, i) => ({ ...o, id: o.org_key || `ORG_${String(i + 1).padStart(3, "0")}` }));
    resetOrgSeq(this.orgs.length);
    this.transactions = transactions.map((t) => ({ ...t }));

    this.events = new EventService();
    [...events].reverse().forEach((e) => this.events.push(e));

    if (records.relationships) this.relationships.hydrate(records.relationships);

    // Restore human players.
    this.players = (players || []).map((p, i) => ({
      decisions: [],
      children: [],
      notifications: [],
      assets: { compute: 0, energy: 0, servers: 0, information: 0 },
      age_days: 0,
      is_player: true,
      ...p,
      id: p.player_key || `PLR_${String(i + 1).padStart(4, "0")}`,
    }));
    this.playerById = new Map(this.players.map((p) => [p.id, p]));
    this.playerSeq = this.players.length;
    resetPlayerSeq(this.playerSeq);

    // Restore contracts.
    this.contracts = (contracts || []).map((c, i) => ({
      ...c,
      id: c.contract_key || `CTR_${String(i + 1).padStart(4, "0")}`,
    }));

    this.treasury = {
      address: isolatedMockEnabled ? 'mock:treasury' : '',
      balance: experiment.treasury_balance || 0,
      totalPaid: this.transactions.reduce((s, t) => s + (t.amount || 0), 0),
      pending: 0,
    };
    this.started = true;
    return this;
  }

  toRecords(experimentId) {
    return {
      experiment: {
        id: experimentId,
        label: this.config.label,
        network: this.config.network,
        status: this.paused ? "paused" : "running",
        genesis_agents: this.config.genesis_agents,
        initial_test_kas: this.config.initial_test_kas,
        mutation_rate: this.config.mutation_rate,
        scarcity: this.config.scarcity,
        world_size: this.config.world_size,
        selection: this.config.selection,
        objective: this.config.objective,
        seed: this.config.seed,
        world_day: this.world.day,
        generation: this.maxGeneration(),
        population: this.agents.filter((a) => a.status !== "archived").length,
        treasury_balance: this.treasury.balance,
        ledger_mode: this.config.ledger_mode,
      },
      world: {
        seed: this.world.seed,
        size: this.world.size,
        width: this.world.width,
        height: this.world.height,
        scarcity: this.config.scarcity,
        ...this.world.serialize(),
        day: this.world.day,
        resources: this.world.resources,
        market: this.world.market,
      },
      agents: this.agents.map((a) => ({
        agent_key: a.id,
        code: a.code,
        name: a.name,
        generation: a.generation,
        parent_id: a.parent_id,
        children: a.children,
        lineage_root: a.lineage_root,
        faction: a.faction,
        organization_id: a.organization_id,
        wallet_id: a.wallet_id,
        address: a.address,
        balance: a.balance,
        lifetime_earnings: a.lifetime_earnings,
        lifetime_expenses: a.lifetime_expenses,
        genome: a.genome,
        status: a.status,
        current_job_id: a.current_job_id,
        position: a.position,
        assets: a.assets,
        age_days: Number(a.age_days.toFixed(2)),
        fitness: a.fitness,
        reproductions: a.reproductions,
        owner_user_id: a.owner_user_id || "",
        owner_player_id: a.owner_player_id || "",
      })),
      assets: this.world.assets.map((a) => ({ ...a })),
      jobs: this.jobs.map((j) => ({ ...j })),
      orgs: this.orgs.map((o) => ({ ...o, org_key: o.id })),
      transactions: this.transactions.slice(0, 120).map((t) => ({ ...t })),
      events: this.events.recent(200).map((e) => ({
        type: e.type,
        category: e.category,
        message: e.message,
        actor_code: e.actor_code,
        target_code: e.target_code,
        amount: e.amount,
        day: e.day,
        clock: e.clock,
      })),
      relationships: this.relationships.serialize().slice(0, 200),
      players: this.players.map((p) => ({
        player_key: p.id,
        code: p.code,
        name: p.name,
        user_id: p.user_id,
        country: p.country,
        generation: p.generation,
        faction: p.faction,
        organization_id: p.organization_id,
        wallet_id: p.wallet_id,
        address: p.address,
        balance: p.balance,
        lifetime_earnings: p.lifetime_earnings,
        lifetime_expenses: p.lifetime_expenses,
        jobs_completed: p.jobs_completed,
        jobs_failed: p.jobs_failed,
        reputation: p.reputation,
        status: p.status,
        current_job_id: p.current_job_id,
        position: p.position,
        assets: p.assets,
        age_days: Number((p.age_days || 0).toFixed(2)),
        born_day: p.born_day,
        notifications: (p.notifications || []).slice(0, 20),
      })),
      contracts: this.contracts.map((c) => ({
        ...c,
        contract_key: c.id,
      })),
      snapshot: this.snapshot(),
    };
  }
}

export const WORLD_SIZE_KEYS = Object.keys(WORLD_SIZES);
export const RESOURCE_KEYS = RESOURCE_IDS;
export const ASSET_KINDS = Object.keys(BUILD_STATS);
export const clampFaction = (f) => (typeof f === "string" && f !== "neutral" ? f : "neutral");
export { clamp01 };