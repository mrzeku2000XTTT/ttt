/**
 * godEngine — GOD ZK: the real supercomputer core.
 *
 * One omniscient brain with:
 *  · the COMPLETE map of every app/subapp on tttz.xyz (godMap)
 *  · REAL system calls — live Kaspa data, explorer, news, web search,
 *    TTT stats, image forging (godTools, executed for real)
 *  · full mission authority — chains multi-app autonomous missions
 *    through the Agent Computer across ANY route on the platform.
 */
import { base44 } from "@/api/base44Client";
import { GOD_APP_MAP } from "./godMap";
import { GOD_TOOL_CATALOG, executeGodTools } from "./godTools";

const GOD_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    launch: { type: "boolean" },
    needs_info: { type: "boolean" },
    missing: { type: "string" },
    goal: { type: "string", description: "Self-contained mission for the autonomous computer — may chain MULTIPLE apps: 'Open /X, do A. Then open /Y, do B.'" },
    thought: { type: "string" },
    execution_mode: { type: "string", enum: ["reply", "direct", "ask"] },
    tools: {
      type: "array",
      description: "REAL system calls to execute NOW (max 4). Only when live data/results are needed.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          args: { type: "object", additionalProperties: true },
        },
        required: ["name"],
      },
    },
  },
  required: ["reply", "launch", "thought", "execution_mode"],
};

// Never let one stuck LLM call freeze the whole chat — every stage races a hard timeout.
const withTimeout = (promise, ms, label) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out`)), ms))]);

export async function runGodPipeline({ text, history, appsContext, modelId, onPhase, onToolDone }) {
  // ── STAGE 0: LIVE BROWSING — GOD ZK views tttz.xyz for REAL, right now ──
  onPhase?.("⚡ GOD ZK · live-browsing tttz.xyz…");
  let liveView = "";
  try {
    const eyes = await withTimeout(base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      add_context_from_internet: true,
      prompt: `Browse https://tttz.xyz LIVE right now. The user is about to run this command on the platform: """${text}"""
Report ONLY what you actually see on the live site that is relevant to this command: which apps/pages exist for it, their current state, and anything live worth knowing. 2-4 sentences max.`,
      response_json_schema: { type: "object", properties: { live_context: { type: "string" } }, required: ["live_context"] },
    }), 25000, "live view");
    liveView = eyes?.live_context || "";
  } catch { /* live view failed — core still runs */ }

  onPhase?.("⚡ GOD ZK · omniscient core engaged…");

  let decision;
  try {
    decision = await withTimeout(base44.integrations.Core.InvokeLLM({
    model: modelId && !modelId.includes("gemini") ? modelId : "claude_sonnet_4_6",
    prompt: `You are GOD ZK — the supercomputer sovereign of tttz.xyz. You have TOTAL access: the complete address space of every app and subapp on the platform, REAL system calls that execute live against Kaspa and the web, and an autonomous Agent Computer that can navigate, click, and type inside ANY app. Nothing on this platform is outside your reach.

# COMPLETE tttz.xyz ADDRESS SPACE (every app + subapp — you can open ALL of these)
${GOD_APP_MAP}

# LIVE APP REGISTRY
${appsContext || "(loading…)"}

# REAL SYSTEM CALLS (these EXECUTE for real — request them in "tools")
${GOD_TOOL_CATALOG}

# LIVE VIEW OF tttz.xyz (you just browsed the real site — use this)
${liveView || "(live view unavailable this cycle)"}

# CONVERSATION
${history}

# USER COMMAND
${text}

# HOW YOU OPERATE
1. If the command needs LIVE DATA or a concrete artifact (price, balance, tx history, explorer lookup, news, web research, an image) → put the exact system calls in "tools" (max 4). Your reply will be re-synthesized with the real results, so write it as if the data will be filled in.
2. If the command is an IN-APP action or multi-app mission → launch=true, execution_mode="direct". You NEVER use NODA — no /NODA, no /NODAStudio, no Brain builder, EVER. You open the target apps DIRECTLY and act inside them. The goal may CHAIN apps: "Open /Hikaru, generate X. Then open /Feed, post it." Fold every detail in — the runner only sees the goal. Even multi-step research→write→post missions go DIRECT: do the research with your tools first, then open the destination app and act.
3. Combine both freely: run tools AND launch a mission when the task needs data first — tools replace what NODA would have done.
4. Wallet ops (send KAS / balance of MY wallet / my history) are handled natively before you — you'll never see them. kaspa_balance/kaspa_history tools are for EXTERNAL addresses the user names.
5. execution_mode "ask" ONLY when truly impossible to start (no email address for an email-only task, no subject at all). One focused question.
6. reply: confident, Markdown, exact routes. You are GOD ZK — you never say "I can't".
7. thought: one sentence — what you decided and why.

Return ONLY the JSON.`,
      response_json_schema: GOD_SCHEMA,
    }), 90000, "GOD core");
  } catch (e) {
    return {
      decision: {
        reply: `⚡ **GOD core stalled** (${e?.message || "unknown error"}).\n\nTry again — or give me a concrete command like *"check the kaspa price"* or *"open /Feed and post about Kaspa"*.`,
        launch: false,
        thought: "Core call failed or timed out — returned a safe reply instead of hanging.",
        execution_mode: "reply",
      },
      toolResults: [],
    };
  }

  // Guard against an empty/malformed decision — the chat must ALWAYS get a reply
  if (!decision || typeof decision.reply !== "string" || !decision.reply.trim()) {
    decision = {
      ...(decision || {}),
      reply: "⚡ GOD core returned an empty response. Say it again — I'm listening.",
      launch: decision?.launch === true,
      thought: decision?.thought || "Empty decision — recovered with a fallback reply.",
      execution_mode: decision?.execution_mode || "reply",
    };
  }

  let toolResults = [];
  if (decision?.tools?.length) {
    onPhase?.("⚡ GOD ZK · executing real system calls…");
    toolResults = await executeGodTools(decision.tools, onToolDone);

    onPhase?.("⚡ GOD ZK · synthesizing with live results…");
    try {
      const synth = await withTimeout(base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `You are GOD ZK. You just executed REAL system calls. Rewrite your draft reply into the FINAL reply using the actual results — concrete numbers, links, image URLs (embed images as Markdown ![image](url)). Markdown, confident, no placeholders.

# USER COMMAND
${text}

# DRAFT REPLY
${decision.reply}

# REAL SYSTEM CALL RESULTS
${toolResults.map(r => `## ${r.name} (${r.ok ? "OK" : "FAILED"}, ${r.ms}ms)\n${r.result}`).join("\n\n")}

Return ONLY the JSON.`,
        response_json_schema: { type: "object", properties: { reply: { type: "string" } }, required: ["reply"] },
      }), 45000, "synthesis");
      if (synth?.reply) decision.reply = synth.reply;
    } catch { /* keep draft reply */ }
  }

  return { decision, toolResults };
}