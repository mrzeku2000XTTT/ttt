import { base44 } from "@/api/base44Client";
import { TOOLS, TOOL_MENU } from "@/components/agentinternet/agentTools";
import { isVideoRequest, resolveSpec, missingSpec, specQuestion } from "@/components/agentinternet/videoSpec";
import { getLinkedAddress } from "@/lib/localKaspaWallet";

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    question: { type: "string", description: "set ONLY if you genuinely cannot start without one missing detail" },
    goal: { type: "string", description: "one line restating what you're about to build" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tool: { type: "string" },
          label: { type: "string", description: "present-tense narration shown to the user, e.g. 'Capturing kaspa.org brand'" },
          args: { type: "object" },
        },
        required: ["tool", "label"],
      },
    },
  },
  required: ["goal"],
};

const FINAL_SCHEMA = {
  type: "object",
  properties: {
    skill: { type: "string" },
    title: { type: "string" },
    detail: { type: "string", description: "what was actually produced, 2-4 sentences, concrete" },
    points: { type: "array", items: { type: "string" }, description: "the beat sheet / key deliverables" },
    next_question: { type: "string", description: "optional single follow-up offering the obvious next move" },
  },
  required: ["title", "detail"],
};

// No step may hang the whole run. Renders get longer than thinking steps.
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ]);

/**
 * Plans a real multi-app run, executes each app in order, narrating every step
 * back into the chat, then synthesises the deliverable.
 * onStep(steps) receives the full live step array after every change.
 */
export async function runAgent({ text, history, onStep }) {
  const ctx = {};

  // Never burn a render on guesses — settle size, length, background and cuts first.
  if (isVideoRequest(text)) {
    const spec = resolveSpec(text, history);
    const missing = missingSpec(spec);
    if (missing.length) {
      return {
        skill: "Motion · spec check",
        plan: [],
        output: { type: "text", title: "Spec check", detail: specQuestion(missing) },
      };
    }
    ctx.spec = spec;
  }
  const convo = (history || [])
    .slice(-6)
    .map((m) => (m.role === "user" ? `User: ${m.text}` : `Assistant: ${m.output?.title || ""}`))
    .join("\n");

  const linkedAddr = getLinkedAddress();
  const walletLine = linkedAddr
    ? `LINKED WALLET: ${linkedAddr} (read access granted — balance/UTXOs/history). Use this address for wallet lookups. Sends need the user's local sign-off.`
    : `LINKED WALLET: none — if the user asks about their wallet, tell them to tap the wallet button → "Link to AgentInternet".`;

  const planRes = await withTimeout(base44.integrations.Core.InvokeLLM({
    prompt: `You are KAI, the superagent of the TTT Agent Internet. You fulfil requests by calling the app's REAL tools below, in order. Never invent tools.

${walletLine}

TOOLS:
${TOOL_MENU}

Rules:
- Pick only the tools the request genuinely needs, in a sensible order (capture/research first, prompt_lab before any render, storyboard before video for anything narrative).
- Always pass concrete args. If the user named a website, pass its url to brand_capture.
- A "launch video" / "promo" means: brand_capture → deep_research → storyboard → prompt_lab → generate_image (pass "prompts": an array of 3 background plate / key frame prompts, one per major beat) → motion_launcher.
- NEVER try to render video here. Every video/motion request ends with motion_launcher, which hands the brief to the K6ix app so the user generates it inside the chat.
- Set "question" ONLY if a required detail is truly missing and unguessable. Otherwise make a confident choice and proceed.
- Labels are what the user reads live, so make them specific and human.

${ctx.spec ? `Locked video spec (obey exactly — pass these to generate_video as aspect_ratio and duration, and write the cut style into every prompt): ${JSON.stringify(ctx.spec)}\n` : ""}${convo ? `Conversation so far:\n${convo}\n` : ""}Request: "${text}"`,
    response_json_schema: PLAN_SCHEMA,
    model: "gemini_3_flash",
  }), 30000, "Planner");
  const plan = typeof planRes === "string" ? JSON.parse(planRes) : planRes;

  if (plan.question && !(plan.steps || []).length) {
    return { skill: "KAI · clarifying", plan: [], question: plan.question, output: { type: "text", title: "Need one detail", detail: plan.question } };
  }

  const steps = (plan.steps || [])
    .filter((s) => TOOLS[s.tool])
    .slice(0, 6)
    .map((s) => ({ ...s, app: TOOLS[s.tool].app, status: "pending" }));

  if (!steps.length) return null; // nothing runnable — let the caller fall back

  onStep?.([...steps]);

  for (const step of steps) {
    step.status = "running";
    onStep?.([...steps]);
    const before = (ctx.images || []).length;
    try {
      const result = await withTimeout(
        TOOLS[step.tool].run(step.args || {}, ctx),
        step.tool === "generate_image" ? 75000 : 40000,
        step.app
      );
      step.status = "done";
      step.result = typeof result === "string" ? result.slice(0, 400) : "";
      const fresh = (ctx.images || []).slice(before);
      if (fresh.length) step.images = fresh;
    } catch (e) {
      step.status = "failed";
      step.result = e?.message?.slice(0, 140) || "failed";
    }
    onStep?.([...steps]);
  }

  const finalRes = await withTimeout(base44.integrations.Core.InvokeLLM({
    prompt: `You just executed a real multi-app run for the request "${text}".
Goal: ${plan.goal}
Steps and their real results:
${steps.map((s) => `- ${s.app} [${s.status}]: ${s.result || ""}`).join("\n")}
Brand captured: ${JSON.stringify(ctx.brand || {}).slice(0, 1200)}
Beats: ${JSON.stringify(ctx.beats || []).slice(0, 1200)}
Final prompt used: ${ctx.prompt || "none"}
Motion brief handed to K6ix: ${ctx.k6ix ? "yes — the user opens the K6ix motion launcher in this chat to generate the clip" : "no"} · rendered still: ${ctx.image ? "yes" : "no"}

Report the actual deliverable. "points" = the beat sheet if there is one, else the key deliverables. Be specific — use the brand's real name and details. If a step failed, say so plainly. Add next_question only if there's an obvious next move worth offering.`,
    response_json_schema: FINAL_SCHEMA,
    model: "gemini_3_flash",
  }), 30000, "Report");
  const fin = typeof finalRes === "string" ? JSON.parse(finalRes) : finalRes;

  const type = ctx.k6ix ? "k6ix" : ctx.image ? "image" : (fin.points || []).length ? "research" : "text";
  return {
    skill: fin.skill || "KAI · multi-app run",
    plan: [],
    steps,
    question: fin.next_question || "",
    image: ctx.image,
    gallery: ctx.images || [],
    output: {
      type,
      title: fin.title,
      detail: fin.detail,
      meta: {
        ...(ctx.k6ix || {}),
        ...(ctx.prompt && !ctx.k6ix ? { prompt: ctx.prompt } : {}),
        ...((fin.points || []).length ? { points: fin.points } : {}),
      },
    },
  };
}