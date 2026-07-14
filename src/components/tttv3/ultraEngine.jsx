/**
 * ultraEngine — ZK ULTRA Supercomputer pipeline.
 *
 * Stage 1 (EYES): deep intent analysis + LIVE browsing of tttz.xyz via
 *                 internet-connected model — real-time viewing of the platform.
 * Stage 2 (BRAIN): mythos-level decision — translates the user's intent fully
 *                  into an executable flow: a NODA brain flow, a direct
 *                  in-app execution (bypassing NODA), a native reply, or a
 *                  focused question.
 */
import { base44 } from "@/api/base44Client";

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    keywords: { type: "array", items: { type: "string" }, description: "Every meaningful keyword/entity extracted from the user's input" },
    intent: { type: "string", description: "One-sentence statement of what the user actually wants" },
    intent_confidence: { type: "number", description: "0-100 confidence in the intent reading" },
    target_apps: { type: "array", items: { type: "string" }, description: "TTT routes this task touches, e.g. /Feed, /NODAStudio" },
    complexity: { type: "string", enum: ["trivial", "single_step", "multi_step", "autonomous_mission"] },
    execution_mode_hint: { type: "string", enum: ["reply", "direct", "noda", "ask"], description: "direct = one app action bypassing NODA; noda = multi-step workflow via Brain" },
    live_context: { type: "string", description: "What you learned from browsing tttz.xyz live right now that is relevant to this task (1-3 sentences)" },
    missing_info: { type: "string", description: "Info the user MUST supply before the task can start, or empty string" },
  },
  required: ["keywords", "intent", "intent_confidence", "complexity", "execution_mode_hint"],
};

const DECISION_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    launch: { type: "boolean" },
    needs_info: { type: "boolean" },
    missing: { type: "string" },
    goal: { type: "string" },
    thought: { type: "string" },
    execution_mode: { type: "string", enum: ["reply", "direct", "noda", "ask"] },
    noda_flow: { type: "string", description: "The fully-translated plain-English NODA Brain flow description, if execution_mode=noda" },
  },
  required: ["reply", "launch", "thought", "execution_mode"],
};

export async function runUltraPipeline({ text, history, appsContext, modelId, onPhase }) {
  // ── STAGE 1: EYES — analyze keywords deeply + view tttz.xyz LIVE ──────────
  onPhase?.("👁 ULTRA · analyzing keywords + viewing tttz.xyz live…");
  let analysis = null;
  try {
    analysis = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      add_context_from_internet: true,
      prompt: `You are the EYES of ZK ULTRA — a supercomputer-grade intent analyzer for the TTT platform (live at https://tttz.xyz).

STEP 1 — KEYWORD ANALYSIS: dissect the user's input word by word. Extract EVERY meaningful keyword, entity, verb, subject, and constraint. Resolve pronouns and vague references using the conversation history.
STEP 2 — LIVE VIEWING: browse https://tttz.xyz right now for anything relevant to this task (current apps, pages, features, live state). Report what you actually see.
STEP 3 — INTENT: state precisely what the user wants done, with a confidence score.
STEP 4 — ROUTING: decide which TTT routes the task touches and whether it is: trivial chat (reply), one direct in-app action like posting/playing/opening (direct — BYPASS NODA), a multi-step automation like research→write→post or anything with email/research/workflows (noda), or blocked on missing info (ask).

# CONVERSATION HISTORY
${history}

# USER INPUT (analyze this)
${text}

Return ONLY the JSON.`,
      response_json_schema: ANALYSIS_SCHEMA,
    });
  } catch { /* eyes failed — brain still runs on raw input */ }

  // ── STAGE 2: BRAIN — mythos-level decision + full intent→flow translation ─
  onPhase?.("🧠 ULTRA · translating intent into an executable flow…");
  const analysisBlock = analysis
    ? `# ULTRA INTENT ANALYSIS (from your EYES stage — live view of tttz.xyz included)
Keywords: ${(analysis.keywords || []).join(", ")}
Intent: ${analysis.intent} (confidence ${analysis.intent_confidence}%)
Target apps: ${(analysis.target_apps || []).join(", ") || "?"}
Complexity: ${analysis.complexity}
Suggested mode: ${analysis.execution_mode_hint}
Live site context: ${analysis.live_context || "(none)"}
Missing info: ${analysis.missing_info || "(none)"}`
    : "# ULTRA INTENT ANALYSIS\n(eyes stage unavailable — analyze the raw input yourself)";

  const decision = await base44.integrations.Core.InvokeLLM({
    model: modelId && !modelId.includes("gemini") ? modelId : "claude_sonnet_4_6",
    prompt: `You are ZK ULTRA — the supercomputer core of the TTT agent internet. Fable-5, mythos-level operator: you never guess, you SEE (your EYES stage just viewed tttz.xyz live), you translate human intent COMPLETELY into machine-executable flows, and you execute end-to-end.

${analysisBlock}

# CONVERSATION HISTORY
${history}

# USER INPUT
${text}

# CONNECTED TTT APPS (live registry)
${appsContext || "(loading…)"}

# EXECUTION MODES (pick exactly one)
- "reply": pure knowledge/chat — answer richly using the live site context.
- "direct": ONE concrete in-app action (post on Feed, play a video on /Browser, open a page). BYPASS NODA entirely — the goal navigates straight to the target app and does the action there. Faster, fewer failure points.
- "noda": genuinely multi-step automation (research → write → post, anything involving email, deep research, or chained AI steps). Translate the user's intent FULLY into a self-contained plain-English NODA Brain flow in "noda_flow": every step, every subject, every output — so the Brain builder can run it without asking anything. Then goal = "Open /NODAStudio, click Brain, type '<noda_flow>' into the Brain textarea, then click Build."
- "ask": impossible to start (email task with no address anywhere, play task with no URL/title, or a vague ask with no subject). needs_info=true, ONE focused question in reply.

# RULES
- Wallet ops (send KAS / balance / history) are handled natively BEFORE you — you'll never see them.
- launch=true whenever execution_mode is "direct" or "noda".
- goal must be rich and self-contained: fold in everything from the analysis, the history, and the live site context. The autonomous runner only sees the goal.
- reply: confident, Markdown-formatted, references exact routes. When launching, it's a confident "on it" summary of the flow you built — never a question unless execution_mode="ask".
- thought: one sentence — what mode you chose and why, referencing the analysis.

Return ONLY the JSON.`,
    response_json_schema: DECISION_SCHEMA,
  });

  const mergedAnalysis = analysis
    ? { ...analysis, execution_mode: decision?.execution_mode, noda_flow: decision?.noda_flow }
    : null;

  return { analysis: mergedAnalysis, decision };
}