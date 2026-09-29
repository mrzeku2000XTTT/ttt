import { ACTIONS } from "./constants";

/**
 * ActionValidator — the only door between agent intent and world mutation.
 * An agent (or a model) may propose anything; nothing runs unless it is registered
 * here and carries a target that exists inside the simulated world.
 */

const SIM_ID = /^SIM_[A-Z]+_\d+$/;

export const ACTION_SPEC = {
  WORK: { target: "job", mutates: true },
  CLAIM_JOB: { target: "job", mutates: true },
  SUBMIT_JOB: { target: "job", mutates: true },
  BUY: { target: "market", mutates: true },
  SELL: { target: "market", mutates: true },
  TRADE: { target: "asset", mutates: true },
  MOVE: { target: "tile", mutates: true },
  RESEARCH: { target: "none", mutates: true },
  RECON: { target: "asset", mutates: false },
  COOPERATE: { target: "agent", mutates: false },
  JOIN_ORG: { target: "org", mutates: true },
  CREATE_ORG: { target: "none", mutates: true },
  REPRODUCE: { target: "none", mutates: true },
  ATTACK_SIM_ASSET: { target: "asset", mutates: true },
  DEFEND_SIM_ASSET: { target: "asset", mutates: true },
  FORTIFY_SIM_ASSET: { target: "asset", mutates: true },
};

export const ACTION_SCHEMA = {
  type: "object",
  properties: {
    action: { type: "string", enum: ACTIONS },
    targetId: { type: "string" },
    reason: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["action", "reason", "confidence"],
};

export class ActionValidator {
  constructor({ world }) {
    this.world = world;
  }

  /** Returns { ok, reason } — never throws, so a bad proposal is just a non-event. */
  validate(proposal, actor) {
    if (!proposal || typeof proposal !== "object") return { ok: false, reason: "Empty proposal" };
    const spec = ACTION_SPEC[proposal.action];
    if (!spec) return { ok: false, reason: `Unknown action "${proposal.action}"` };
    if (typeof proposal.reason !== "string" || !proposal.reason.trim()) {
      return { ok: false, reason: "Action carries no stated reason" };
    }
    const conf = Number(proposal.confidence);
    if (!Number.isFinite(conf) || conf < 0 || conf > 1) {
      return { ok: false, reason: "Confidence outside 0..1" };
    }

    const target = proposal.targetId;
    if (spec.target === "asset") {
      if (!SIM_ID.test(String(target || ""))) {
        return { ok: false, reason: "Conflict targets must be simulated world ids" };
      }
      if (!this.world.findAsset(target)) return { ok: false, reason: `No simulated asset ${target}` };
    }
    if (spec.target === "job" && target && !String(target).startsWith("JOB")) {
      return { ok: false, reason: "Job target must be a job id" };
    }
    if (spec.target === "tile" && target) {
      const [x, y] = String(target).split(",").map(Number);
      if (!this.world.inBounds(x, y)) return { ok: false, reason: "Tile outside the world" };
    }
    if (actor && actor.status === "archived") return { ok: false, reason: "Agent is archived" };
    return { ok: true };
  }
}

export const isSimId = (id) => SIM_ID.test(String(id || ""));