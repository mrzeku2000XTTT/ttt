import { base44 } from "@/api/base44Client";
import { TOOLS, TOOL_MENU } from "@/components/agentinternet/agentTools";

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

/**
 * Plans a real multi-app run, executes each app in order, narrating every step
 * back into the chat, then synthesises the deliverable.
 * onStep(steps) receives the full live step array after every change.
 */
export async function runAgent({ text, history, onStep }) {
  const ctx = {};
  const convo = (history || [])
    .slice(-6)
    .map((m) => (m.role === "user" ? `User: ${m.text}` : `Assistant: ${m.output?.title || ""}`))
    .join("\n");

  const planRes = await base44.integrations.Core.InvokeLLM({
    prompt: `You are KAI, the superagent of the TTT Agent Internet. You fulfil requests by calling the app's REAL tools below, in order. Never invent tools.

TOOLS:
${TOOL_MENU}

Rules:
- Pick only the tools the request genuinely needs, in a sensible order (capture/research first, prompt_lab before any render, storyboard before video for anything narrative).
- Always pass concrete args. If the user named a website, pass its url to brand_capture.
- A "launch video" / "promo" means: brand_capture → deep_research → storyboard → prompt_lab → generate_video (and generate_image for a poster if useful).
- Set "question" ONLY if a required detail is truly missing and unguessable. Otherwise make a confident choice and proceed.
- Labels are what the user reads live, so make them specific and human.

${convo ? `Conversation so far:\n${convo}\n` : ""}Request: "${text}"`,
    response_json_schema: PLAN_SCHEMA,
    model: "gemini_3_flash",
  });
  const plan = typeof planRes === "string" ? JSON.parse(planRes) : planRes;

  if (plan.question && !(plan.steps || []).length) {
    return { skill: "KAI · clarifying", plan: [], question: plan.question, output: { type: "text", title: "Need one detail", detail: plan.question } };
  }

  const steps = (plan.steps || [])
    .filter((s) => TOOLS[s.tool])
    .map((s) => ({ ...s, app: TOOLS[s.tool].app, status: "pending" }));

  if (!steps.length) return null; // nothing runnable — let the caller fall back

  onStep?.([...steps]);

  for (const step of steps) {
    step.status = "running";
    onStep?.([...steps]);
    try {
      const result = await TOOLS[step.tool].run(step.args || {}, ctx);
      step.status = "done";
      step.result = typeof result === "string" ? result.slice(0, 400) : "";
    } catch (e) {
      step.status = "failed";
      step.result = e?.message?.slice(0, 140) || "failed";
    }
    onStep?.([...steps]);
  }

  const finalRes = await base44.integrations.Core.InvokeLLM({
    prompt: `You just executed a real multi-app run for the request "${text}".
Goal: ${plan.goal}
Steps and their real results:
${steps.map((s) => `- ${s.app} [${s.status}]: ${s.result || ""}`).join("\n")}
Brand captured: ${JSON.stringify(ctx.brand || {}).slice(0, 1200)}
Beats: ${JSON.stringify(ctx.beats || []).slice(0, 1200)}
Final prompt used: ${ctx.prompt || "none"}
Rendered video: ${ctx.video ? "yes" : "no"} · rendered still: ${ctx.image ? "yes" : "no"}

Report the actual deliverable. "points" = the beat sheet if there is one, else the key deliverables. Be specific — use the brand's real name and details. If a step failed, say so plainly. Add next_question only if there's an obvious next move worth offering.`,
    response_json_schema: FINAL_SCHEMA,
    model: "gemini_3_flash",
  });
  const fin = typeof finalRes === "string" ? JSON.parse(finalRes) : finalRes;

  const type = ctx.video ? "video" : ctx.image ? "image" : (fin.points || []).length ? "research" : "text";
  return {
    skill: fin.skill || "KAI · multi-app run",
    plan: [],
    steps,
    question: fin.next_question || "",
    image: ctx.image,
    output: {
      type,
      title: fin.title,
      detail: fin.detail,
      meta: {
        ...(ctx.video ? { url: ctx.video, duration: "0:06" } : {}),
        ...(ctx.prompt ? { prompt: ctx.prompt } : {}),
        ...((fin.points || []).length ? { points: fin.points } : {}),
      },
    },
  };
}