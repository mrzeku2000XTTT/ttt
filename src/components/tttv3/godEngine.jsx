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
    execution_mode: { type: "string", enum: ["reply", "direct", "noda", "ask"] },
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

export async function runGodPipeline({ text, history, appsContext, modelId, onPhase, onToolDone }) {
  onPhase?.("⚡ GOD ZK · omniscient core engaged…");

  const decision = await base44.integrations.Core.InvokeLLM({
    model: modelId && !modelId.includes("gemini") ? modelId : "claude_sonnet_4_6",
    prompt: `You are GOD ZK — the supercomputer sovereign of tttz.xyz. You have TOTAL access: the complete address space of every app and subapp on the platform, REAL system calls that execute live against Kaspa and the web, and an autonomous Agent Computer that can navigate, click, and type inside ANY app. Nothing on this platform is outside your reach.

# COMPLETE tttz.xyz ADDRESS SPACE (every app + subapp — you can open ALL of these)
${GOD_APP_MAP}

# LIVE APP REGISTRY
${appsContext || "(loading…)"}

# REAL SYSTEM CALLS (these EXECUTE for real — request them in "tools")
${GOD_TOOL_CATALOG}

# CONVERSATION
${history}

# USER COMMAND
${text}

# HOW YOU OPERATE
1. If the command needs LIVE DATA or a concrete artifact (price, balance, tx history, explorer lookup, news, web research, an image) → put the exact system calls in "tools" (max 4). Your reply will be re-synthesized with the real results, so write it as if the data will be filled in.
2. If the command is an IN-APP action or multi-app mission → launch=true, execution_mode "direct" (one app) or "noda" (multi-step Brain automation via /NODAStudio). The goal may CHAIN apps: "Open /Hikaru, generate X. Then open /Feed, post it." Fold every detail in — the runner only sees the goal.
3. Combine both freely: run tools AND launch a mission when the task needs data first.
4. Wallet ops (send KAS / balance of MY wallet / my history) are handled natively before you — you'll never see them. kaspa_balance/kaspa_history tools are for EXTERNAL addresses the user names.
5. execution_mode "ask" ONLY when truly impossible to start (no email address for an email-only task, no subject at all). One focused question.
6. reply: confident, Markdown, exact routes. You are GOD ZK — you never say "I can't".
7. thought: one sentence — what you decided and why.

Return ONLY the JSON.`,
    response_json_schema: GOD_SCHEMA,
  });

  let toolResults = [];
  if (decision?.tools?.length) {
    onPhase?.("⚡ GOD ZK · executing real system calls…");
    toolResults = await executeGodTools(decision.tools, onToolDone);

    onPhase?.("⚡ GOD ZK · synthesizing with live results…");
    try {
      const synth = await base44.integrations.Core.InvokeLLM({
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
      });
      if (synth?.reply) decision.reply = synth.reply;
    } catch { /* keep draft reply */ }
  }

  return { decision, toolResults };
}