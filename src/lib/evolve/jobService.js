import { JOB_TYPES } from "./constants";

/**
 * JobService — the real work marketplace.
 * A job is a genuine task with a brief, a verification method and a payout that
 * only clears once verification passes.
 */

export const JOB_TEMPLATES = {
  RESEARCH: [
    ["Research Kaspa Data", "Survey the supplied on-chain dataset and return five verified findings with the evidence for each."],
    ["Consensus Survey", "Compare three published consensus approaches and report which assumptions break under high throughput."],
    ["Market Structure Brief", "Map the simulated compute market and identify where supply is concentrated."],
  ],
  SUMMARIZATION: [
    ["Summarize Research Paper", "Reduce the supplied paper to five verified findings, each one sentence, with no claim absent from the source."],
    ["Digest Weekly Signals", "Condense the week's world events into a short brief an agent can act on."],
  ],
  DATA_EXTRACTION: [
    ["Extract Ledger Rows", "Pull every settlement entry into a normalized table with amounts and counterparties."],
    ["Normalize Job Records", "Extract job id, reward and outcome from unstructured logs."],
  ],
  CLASSIFICATION: [
    ["Classify Agent Behaviour", "Label each decision trace as WORK, TRADE, RESEARCH, COOPERATE or CONFLICT."],
    ["Tag World Events", "Assign each event a category and a severity."],
  ],
  SANDBOXED_CODING: [
    ["Code Trading Bot", "Write a small bot that buys low and sells high in the simulated market. Must pass the sandbox test suite."],
    ["Repair Simulation Tick", "Fix the provided simulation module so the test suite passes without changing its public interface."],
  ],
  DOCUMENT_GENERATION: [
    ["Draft Alliance Terms", "Produce the operating agreement for a two-party simulated alliance."],
    ["Write Treasury Report", "Generate the period report from the treasury ledger."],
  ],
  VERIFICATION: [
    ["Verify Peer Submission", "Independently check another agent's submission and report pass or fail with reasons."],
  ],
};

const VERIFY_BY_TYPE = {
  SANDBOXED_CODING: "TESTS",
  DATA_EXTRACTION: "SCHEMA",
  CLASSIFICATION: "SCHEMA",
  RESEARCH: "MULTI_MODEL",
  SUMMARIZATION: "MULTI_MODEL",
  DOCUMENT_GENERATION: "SCHEMA",
  VERIFICATION: "HUMAN",
};

const DIFFICULTY_REWARD = { LOW: [1.2, 3.4], MEDIUM: [2.6, 7.5], HIGH: [6.0, 18.0] };

let seq = 0;
export const resetJobSeq = (n = 0) => { seq = n; };
export const nextJobCode = () => `JOB ${++seq}`;

export function createJob(rng, day = 0, forcedType) {
  const type = forcedType || JOB_TYPES[Math.floor(rng() * JOB_TYPES.length)];
  const options = JOB_TEMPLATES[type] || JOB_TEMPLATES.RESEARCH;
  const [title, brief] = options[Math.floor(rng() * options.length)];
  const difficulty = rng() < 0.28 ? "LOW" : rng() < 0.72 ? "MEDIUM" : "HIGH";
  const [lo, hi] = DIFFICULTY_REWARD[difficulty];
  return {
    id: nextJobCode(),
    code: `JOB #${seq}`,
    type,
    title,
    brief,
    reward: Number((lo + rng() * (hi - lo)).toFixed(2)),
    difficulty,
    status: "OPEN",
    verification: VERIFY_BY_TYPE[type] || "SCHEMA",
    claimed_by: "",
    submission: "",
    verification_notes: "",
    progress: 0,
    created_day: day,
  };
}

/** Every transition is a real state change and callers emit an event for it. */
export const nextStatus = (status, outcome) => {
  if (status === "OPEN") return "CLAIMED";
  if (status === "CLAIMED") return "RUNNING";
  if (status === "RUNNING") return "SUBMITTED";
  if (status === "SUBMITTED") return "VERIFYING";
  if (status === "VERIFYING") return outcome === false ? "FAILED" : "VERIFIED";
  if (status === "VERIFIED") return "PAYMENT_PENDING";
  if (status === "PAYMENT_PENDING") return "PAID";
  return status;
};

/**
 * Verification. Coding jobs are checked by tests and are only ever run in an
 * isolated sandbox — never against the EVOLVE host environment.
 */
export function verifySubmission(job, agent, rng) {
  const skill = agent.genome?.specialization ?? 0.5;
  const diligence = agent.genome?.information ?? 0.5;
  const care = agent.genome?.saving ?? 0.5;
  let base = 0.42 + skill * 0.26 + diligence * 0.22 + care * 0.1;
  if (job.difficulty === "LOW") base += 0.16;
  if (job.difficulty === "HIGH") base -= 0.18;
  if (job.verification === "TESTS") base -= 0.05;
  if (job.verification === "HUMAN") base += 0.05;
  const passed = rng() < Math.max(0.12, Math.min(0.96, base));

  const notes = passed
    ? `${job.verification} check passed — submission matches the brief.`
    : job.verification === "TESTS"
    ? "Sandbox test suite failed — submission does not meet the acceptance criteria."
    : job.verification === "SCHEMA"
    ? "Output did not validate against the required schema."
    : "Independent review could not confirm the submitted findings.";
  return { passed, notes };
}

export function jobProgressPerTick(job, agent) {
  const speed = 0.09 + (agent.genome?.specialization ?? 0.5) * 0.16 + (agent.genome?.investment ?? 0.5) * 0.06;
  return job.difficulty === "HIGH" ? speed * 0.7 : job.difficulty === "LOW" ? speed * 1.35 : speed;
}