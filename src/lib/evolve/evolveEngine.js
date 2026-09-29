import { WorldEngine } from "./worldEngine";
import { EventService } from "./eventService";
import { createKaspaService } from "./kaspaService";
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
import { FACTIONS, TOOLS, RESOURCE_IDS, WORLD_SIZES, BUILD_STATS } from "./constants";

const ACTIONS_PER_TICK = 48;
const TICKS_PER_DAY = 8;
const TREASURY_SEED_MULTIPLIER = 3;

export const DEFAULT_CONFIG = {
  label: "EVOLVE-01",
  seed: 20260929,
  network: "kaspa-tn10",
  genesis_agents: 10,
  initial_test_kas: 60,
  mutation_rate: 0.05,
  scarcity: "medium",
  world_size: "medium",
  selection: "economic",
  objective: "Maximize long-term economic survival",
  ledger_mode: "mock",
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
    this.treasury = { address: "", balance: 0, totalPaid: 0, pending: 0 };

    this.agentSeq = 0;
    this.tickCount = 0;
    this.paused = false;
    this.speed = 5;
    this.selection = null;
    this.tool = "OBSERVE";
    this.paintBiome = "PLAINS";
    this.paintFaction = "blue";
    this.pendingTarget = null;
    this.started = false;
    this.genesisStage = "";
    this.window = { births: 0, jobs: 0, from: 0 };
    this.listeners = new Set();
    this.dirty = false;
  }

  /* ------------------------------------------------------------- plumbing */
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  notify(soft = false) {
    if (soft) {
      this.dirty = true;
      return;
    }
    this.dirty = false;
    this.listeners.forEach((fn) => fn());
  }

  code(seq) {
    return `A#${String(seq).padStart(3, "0")}`;
  }

  /* -------------------------------------------------------------- genesis */
  async bootstrap(onStage = () => {}) {
    const cfg = this.config;
    const stage = async (label) => {
      this.genesisStage = label;
      this.notify();
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

    const spots = this.spawnSpots(cfg.genesis_agents);
    for (let i = 0; i < cfg.genesis_agents; i += 1) {
      const faction = FACTIONS[i % FACTIONS.length].id;
      const spot = spots[i] || this.randomLandTile();
      const agent = this.newAgent({
        generation: 0,
        genome: randomGenome(this.rng),
        faction,
        position: spot,
        balance: cfg.initial_test_kas,
      });
      this.agents.push(agent);
      this.agentById.set(agent.id, agent);
      this.world.claim(spot.x, spot.y, faction);
    }

    await stage("Founding organizations");
    for (let i = 0; i < 5; i += 1) {
      const faction = FACTIONS[i].id;
      const founder = this.agents.find((a) => a.faction === faction);
      const org = createOrganization({
        rng: this.rng,
        faction,
        founderId: founder?.id,
        day: this.world.day,
        treasury: 40 + this.rng() * 60,
      });
      this.orgs.push(org);
      if (founder) founder.organization_id = org.id;
    }

    await stage("Seeding the job market");
    for (let i = 0; i < 23; i += 1) this.jobs.push(createJob(this.rng, this.world.day));

    await stage("Running generations");
    this.quiet = true;
    for (let i = 0; i < 1024; i += 1) this.tick(true);
    this.quiet = false;

    await stage("Recording snapshot");
    this.snapshot();
    this.started = true;
    this.events.push({
      type: "WORLD_ONLINE",
      category: "WORLD",
      message: `World online — ${this.agents.length} agents across ${this.maxGeneration()} generations`,
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
      if (this.world.tile(x, y).buildable) return { x, y };
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

  /* ------------------------------------------------------------ main tick */
  tick(quiet = false) {
    this.tickCount += 1;
    const rng = this.rng;
    this.world.produce(rng);

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
    this.rebalanceFactions();

    if (this.world.dayTicks === 0 && !quiet) {
      this.maybePostJob();
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
      const proposal = decide(agent, {
        jobs: this.jobs,
        orgs: this.orgs,
        rng: this.rng,
        foreignPool,
        myAsset: mine || null,
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
      this.emit(
        { type: "JOB_FAILED", category: "JOB", message: `${job.code} failed verification — no payment`, actor_id: agent.id, actor_code: agent.code, target_id: job.id, target_code: job.code },
        quiet
      );
      this.maybeReplaceJob(job, quiet);
    }
  }

  /** Verified work is the only thing the treasury pays for. */
  payJob(job, agent, quiet) {
    job.status = "PAYMENT_PENDING";
    const amount = Math.min(job.reward, this.treasury.balance);
    const tx = this.kaspa.sendPayment({
      from: this.treasury.address,
      to: agent.address,
      amount,
      note: job.code,
    });
    this.treasury.balance = Number((this.treasury.balance - amount).toFixed(2));
    this.treasury.totalPaid = Number((this.treasury.totalPaid + amount).toFixed(2));
    this.treasury.pending = Number((this.treasury.pending + amount).toFixed(2));
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
    if (result.success) {
      this.world.damageAsset(asset.sim_id, result.damage);
      if (asset.damage >= asset.value) {
        this.world.destroyAsset(asset.sim_id, actor.faction);
        this.world.claim(asset.x, asset.y, actor.faction);
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
  selectTile(x, y) {
    this.selection = this.world.tile(x, y);
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

    switch (tool) {
      case "OBSERVE":
        this.selectTile(x, y);
        return { ok: true, message: `Inspecting ${tile.label} at ${x},${y}` };

      case "TERRAIN":
      case "WATER":
      case "FOREST":
      case "MOUNTAIN": {
        this.world.sculptTile(x, y, sculpt[tool]);
        this.selectTile(x, y);
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
        if (tile.owner !== "neutral" && tile.owner !== this.paintFaction) {
          return { ok: false, message: `${tile.label} already held by ${tile.owner.toUpperCase()}` };
        }
        this.world.claim(x, y, this.paintFaction);
        this.selectTile(x, y);
        this.emit({
          type: "TERRITORY_CLAIMED",
          category: "WORLD",
          message: `Faction ${this.paintFaction.toUpperCase()} claimed ${x},${y}`,
          target_code: `${x},${y}`,
        });
        this.notify();
        return { ok: true, message: `Claimed for ${this.paintFaction.toUpperCase()}` };
      }

      case "SERVER":
      case "COMPUTE":
      case "ENERGY":
      case "CITY":
      case "RESOURCE": {
        const kind = tool === "RESOURCE" ? "deposit" : tool.toLowerCase();
        const res = this.world.placeAsset(kind, x, y, {
          ownerId: opts.ownerId || "",
          faction: opts.faction || this.paintFaction,
        });
        if (!res.ok) return { ok: false, message: res.reason };
        this.selectTile(x, y);
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
        this.selectTile(x, y);
        this.notify();
        return { ok: true, message: `Selected ${asset.sim_id}` };
      }

      default:
        this.selectTile(x, y);
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

  formOrg(agentId, name) {
    const agent = this.agentById.get(agentId);
    if (!agent) return { ok: false, message: "Agent not found" };
    if (agent.organization_id) return { ok: false, message: "Agent already belongs to an organization" };
    const org = createOrganization({ rng: this.rng, name, faction: agent.faction, founderId: agent.id, day: this.world.day });
    this.orgs.push(org);
    agent.organization_id = org.id;
    this.emit({
      type: "ORGANIZATION_CREATED",
      category: "ORG",
      message: `${org.name} founded by ${agent.code}`,
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
    return {
      agents: active.length,
      agentsDelta: births,
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
    };
  }

  factionShare() {
    return this.world.factionShare();
  }

  snapshot() {
    const active = this.agents.filter((a) => a.status !== "archived");
    return {
      generation: this.maxGeneration(),
      day: this.world.day,
      population: active.length,
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
    const { experiment, world, agents = [], assets = [], jobs = [], orgs = [], transactions = [], events = [] } = records || {};
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
      ledger_mode: experiment.ledger_mode || "mock",
    };
    this.rng = makeRng(experiment.seed);
    this.kaspa = createKaspaService(this.config.ledger_mode);
    this.world = new WorldEngine({ seed: experiment.seed, size: experiment.world_size, scarcity: experiment.scarcity });
    this.world.applySerialized(world || {});
    this.world.day = world?.day || 0;
    if (world?.resources) this.world.resources = { ...this.world.resources, ...world.resources };
    if (world?.market) this.world.market = { ...this.world.market, ...world.market };

    this.world.assets = assets.map((a) => ({ ...a }));
    this.world.assetById = new Map(this.world.assets.map((a) => [a.sim_id, a]));
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
    this.agentById = new Map(this.agents.map((a) => [a.id, a]));
    this.agentSeq = this.agents.reduce((m, a) => Math.max(m, Number(String(a.code).replace(/\D/g, "")) || 0), 0);

    this.jobs = jobs.map((j) => ({ ...j, id: j.id && String(j.id).startsWith("JOB") ? j.id : String(j.code).replace("#", "") }));
    resetJobSeq(this.jobs.reduce((m, j) => Math.max(m, Number(String(j.code).replace(/\D/g, "")) || 0), 0));

    this.orgs = orgs.map((o, i) => ({ ...o, id: o.org_key || `ORG_${String(i + 1).padStart(3, "0")}` }));
    resetOrgSeq(this.orgs.length);
    this.transactions = transactions.map((t) => ({ ...t }));

    this.events = new EventService();
    [...events].reverse().forEach((e) => this.events.push(e));

    this.treasury = {
      address: "kaspatest:treasury",
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
      snapshot: this.snapshot(),
    };
  }
}

export const WORLD_SIZE_KEYS = Object.keys(WORLD_SIZES);
export const RESOURCE_KEYS = RESOURCE_IDS;
export const ASSET_KINDS = Object.keys(BUILD_STATS);
export const clampFaction = (f) => (FACTIONS.some((x) => x.id === f) ? f : "neutral");
export { clamp01 };