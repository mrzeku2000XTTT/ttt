// TTT Agent 1 orchestration — plans a build, then dispatches as many
// specialist subagents as the job needs, one file-group each.
import { base44 } from "@/api/base44Client";
import { applyFileOps, FILE_OPS_SCHEMA, norm } from "./projectFiles";

/** Models sometimes wrap structured output in `response`, or return JSON with trailing junk. */
export function parseResult(raw) {
  let result = raw;
  if (result && !Array.isArray(result.files) && result.response !== undefined) {
    result = result.response;
  }
  if (typeof result === "string") {
    const cleaned = result.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
    try {
      result = JSON.parse(cleaned);
    } catch {
      // Trailing characters after the JSON object — slice to the balanced end.
      const start = cleaned.indexOf("{");
      let depth = 0, inStr = false, esc = false, end = -1;
      for (let i = start; i < cleaned.length; i++) {
        const c = cleaned[i];
        if (esc) { esc = false; continue; }
        if (c === "\\") { esc = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === "{") depth++;
        else if (c === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
      }
      if (end === -1) throw new Error("The model returned malformed JSON. Try again with a shorter prompt.");
      result = JSON.parse(cleaned.slice(start, end));
    }
  }
  return result;
}

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    plan: { type: "string", description: "One short sentence describing the overall build plan" },
    agents: {
      type: "array",
      description: "One entry per specialist subagent. Use as many as the job genuinely needs (2 for a small change, 10+ for a large app). Order them so dependencies come first.",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short agent name, e.g. 'Wallet Engineer', 'Design System', 'Send Flow'" },
          goal: { type: "string", description: "One sentence describing what this agent must deliver" },
          files: { type: "array", items: { type: "string" }, description: "Exact file paths this agent owns and will write" },
          instructions: { type: "string", description: "Detailed build instructions for this agent: behaviour, data sources, exported names, styling" },
        },
        required: ["name", "goal", "files", "instructions"],
      },
    },
    contract: { type: "string", description: "The shared contract every agent must respect: file names, global/exported function names, CSS class prefixes, state shape, design tokens." },
  },
  required: ["plan", "agents", "contract"],
};

export async function orchestrateBuild({ baseRules, userPrompt, history, files, model, onProgress }) {
  const projectDump = files.length
    ? `Existing project files (paths only):\n${files.map(f => f.path).join("\n")}`
    : "No existing files — this is a new project.";

  // 1. PLAN
  onProgress?.({ type: "plan" });
  const planRaw = await base44.integrations.Core.InvokeLLM({
    prompt: `${baseRules}

You are TTT Agent 1, the ORCHESTRATOR. Do NOT write code now. Break this build into specialist subagents that each own a small set of files.

Rules for the plan:
- Split by concern (markup/shell, design system, data layer, each feature flow, wiring/entry point). Never give one agent more than ~3 files.
- Use as many agents as the job needs — no upper limit — but every agent must produce real, needed files.
- The "contract" is law: exact file paths, exact global/exported function names, CSS variable + class naming, and the shared state shape, so the separately-written files fit together perfectly.
- Put shared foundations (styles, state, api layer) before the features that consume them, and the entry point (index.html / src/main.jsx) last.

${projectDump}

${history ? `Conversation so far:\n${history}\n` : ""}
User request: ${userPrompt}`,
    model,
    response_json_schema: PLAN_SCHEMA,
  });

  const plan = parseResult(planRaw);
  const agents = (plan?.agents || []).filter(a => a?.name && Array.isArray(a.files));
  if (!agents.length) throw new Error("The orchestrator produced no plan. Try again.");

  onProgress?.({ type: "planned", plan: plan.plan, agents: agents.map(a => ({ name: a.name, goal: a.goal, files: a.files, status: "queued" })) });

  // 2. DISPATCH
  let working = files;
  const touched = [];
  const log = [];

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    onProgress?.({ type: "agent_start", index: i, name: agent.name });

    const context = working
      .filter(f => f.path !== "scripts/kaspa-wallet.js")
      .map(f => `--- FILE: ${f.path} ---\n${f.content.slice(0, 3500)}`)
      .join("\n\n");

    const raw = await base44.integrations.Core.InvokeLLM({
      prompt: `${baseRules}

You are "${agent.name}", a specialist subagent inside TTT Agent 1's build team.

OVERALL BUILD: ${plan.plan}
USER REQUEST: ${userPrompt}

SHARED CONTRACT — obey it exactly, other agents depend on it:
${plan.contract}

YOUR ASSIGNMENT: ${agent.goal}
YOU OWN ONLY THESE FILES — return their FULL final content and nothing else:
${agent.files.join("\n")}

INSTRUCTIONS:
${agent.instructions}

${context ? `Files written so far by the team (reference only — do NOT rewrite them):\n${context}` : ""}

Return the file operations for YOUR files only. Complete, production-ready, no placeholders, no TODOs.`,
      model,
      response_json_schema: FILE_OPS_SCHEMA,
    });

    let ops;
    try {
      ops = parseResult(raw);
    } catch (err) {
      onProgress?.({ type: "agent_done", index: i, status: "failed", files: [] });
      log.push(`${agent.name}: failed (${err.message})`);
      continue;
    }

    working = applyFileOps(working, ops);
    const wrote = (ops?.files || []).map(f => norm(f.path));
    wrote.forEach(p => { if (!touched.includes(p)) touched.push(p); });
    log.push(`${agent.name}: ${ops?.summary || "done"}`);
    onProgress?.({ type: "agent_done", index: i, status: "done", files: wrote });
  }

  return {
    files: working,
    touched,
    summary: plan.plan,
    thinking: log,
    agents: agents.map(a => ({ name: a.name, goal: a.goal, files: a.files })),
  };
}