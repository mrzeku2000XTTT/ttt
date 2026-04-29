/**
 * agentLoop — autonomous goal-seeking loop.
 * Repeatedly: observe iframe page state → ask LLM for next action → execute → observe again.
 * Stops when the agent declares the goal complete, hits max steps, or fails.
 */
import { base44 } from "@/api/base44Client";
import { sendCommand, waitForIframeReady } from "./agentBridge";

const MAX_STEPS = 12;

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    thought: { type: "string", description: "Brief reasoning about what to do next" },
    done: { type: "boolean", description: "True when the goal is fully achieved" },
    say: { type: "string", description: "What to narrate to the user about this step" },
    action: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["navigate", "click_text", "type_into", "scroll", "wait", "finish"],
        },
        url: { type: "string" },
        text: { type: "string" },
        label: { type: "string" },
        ms: { type: "number" },
        y: { type: "number" },
      },
    },
  },
};

const AVAILABLE_ROUTES = [
  { path: "/Feed", desc: "Social feed — post, comment, tip KAS" },
  { path: "/Bridge", desc: "Send KAS cross-layer" },
  { path: "/Browser", desc: "TTTV — video browser" },
  { path: "/AgentZK", desc: "Agent ZK identity" },
  { path: "/Wallet", desc: "User wallet" },
  { path: "/Profile", desc: "User profile" },
  { path: "/AppStoreV2", desc: "Browse all 80+ apps" },
];

export async function runAutonomousAgent({ goal, callbacks, signal }) {
  const { setUrl, setStatus, addNarration, setCursor, getIframe, onStep } = callbacks;
  const history = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    if (signal?.aborted) {
      addNarration("Stopped.");
      break;
    }

    // 1. OBSERVE — read the current page
    setStatus(`Observing page (step ${step + 1})…`);
    const iframe = getIframe?.();
    let observation = { ok: false };
    if (iframe) {
      observation = await sendCommand(iframe, { action: "read_page" }, 2500);
    }

    // 2. THINK — ask LLM for next action
    setStatus("Thinking…");
    const plan = await planNextStep({ goal, history, observation });
    if (!plan) {
      addNarration("Lost my train of thought. Stopping.");
      break;
    }

    onStep?.({ step: step + 1, plan, observation });

    // 3. NARRATE
    if (plan.say) addNarration(plan.say);

    // 4. CHECK DONE
    if (plan.done || plan.action?.type === "finish") {
      setStatus("Goal complete ✓");
      break;
    }

    // 5. ACT
    const result = await executeAction(plan.action, { setUrl, setStatus, setCursor, getIframe });
    history.push({
      step: step + 1,
      thought: plan.thought,
      action: plan.action,
      result,
      observed: observation.ok ? { url: observation.url, headings: observation.headings?.slice(0, 3), buttons: observation.buttons?.slice(0, 8) } : null,
    });

    // small breather between steps
    await sleep(600);
  }
  setStatus("Idle");
}

async function planNextStep({ goal, history, observation }) {
  try {
    const obsSummary = observation.ok
      ? `URL: ${observation.url}\nTitle: ${observation.title || "?"}\nHeadings: ${(observation.headings || []).slice(0, 5).join(" | ")}\nVisible buttons/links: ${(observation.buttons || []).slice(0, 15).join(" | ")}`
      : "(iframe not ready or page empty)";

    const histSummary = history
      .map(
        (h) =>
          `Step ${h.step}: thought="${h.thought}" → action=${JSON.stringify(h.action)} → ${h.result?.ok ? "ok" : "failed: " + (h.result?.error || "?")}`
      )
      .join("\n") || "(none)";

    const routes = AVAILABLE_ROUTES.map((r) => `  ${r.path} — ${r.desc}`).join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an autonomous agent operating a TTT app inside an iframe browser. You can navigate, click buttons, type into inputs, and scroll. Decide ONE action to take next to make progress on the user's goal.

# GOAL
${goal}

# AVAILABLE ROUTES (use with navigate)
${routes}

# CURRENT PAGE (what you can see)
${obsSummary}

# HISTORY OF YOUR ACTIONS SO FAR
${histSummary}

# YOUR JOB
Decide ONE next action. Be efficient — pick the most useful action.

Action types:
- navigate: { type: "navigate", url: "/Feed" } — go to a route
- click_text: { type: "click_text", text: "Post" } — click button/link by visible text (must match what's in "Visible buttons/links")
- type_into: { type: "type_into", label: "what's on your mind", text: "hello" } — type into input matching placeholder/label
- scroll: { type: "scroll", y: 500 } — scroll the page
- wait: { type: "wait", ms: 1500 } — wait for content to load
- finish: { type: "finish" } — goal is complete or impossible

Rules:
- After navigate, you should usually wait for the page to load before clicking.
- Only use click_text values that appear in the visible buttons list above.
- If the goal is done, set done=true and use finish.
- If you've tried the same action 2x and it failed, try a different approach or finish.
- Keep "say" short and conversational (1 sentence).

Return ONLY the JSON.`,
      response_json_schema: PLAN_SCHEMA,
    });
    return res;
  } catch {
    return null;
  }
}

async function executeAction(action, { setUrl, setStatus, setCursor, getIframe }) {
  if (!action) return { ok: false, error: "no_action" };
  const iframe = getIframe?.();

  switch (action.type) {
    case "navigate":
      setStatus(`Navigating to ${action.url}…`);
      setUrl(action.url);
      await waitForIframeReady(4000);
      await sleep(800);
      return { ok: true };

    case "click_text": {
      setStatus(`Clicking "${action.text}"…`);
      // First peek at where the element is so cursor can travel BEFORE clicking
      const peek = await sendCommand(iframe, { action: "locate", text: action.text });
      if (peek.ok && peek.position) {
        setCursor({ x: peek.position.x, y: peek.position.y, clicking: false });
        await sleep(700); // let cursor glide there
      }
      const res = await sendCommand(iframe, { action: "click_text", text: action.text });
      if (res.ok && res.position) {
        setCursor({ x: res.position.x, y: res.position.y, clicking: false });
        await sleep(200);
        setCursor((p) => ({ ...p, clicking: true }));
        await sleep(350);
        setCursor((p) => ({ ...p, clicking: false }));
      }
      await sleep(500);
      return res;
    }

    case "type_into": {
      setStatus(`Typing "${action.text?.slice(0, 24)}…"`);
      // Move cursor to the input FIRST so user sees it travel there
      const peek = await sendCommand(iframe, { action: "locate_input", label: action.label });
      if (peek.ok && peek.position) {
        setCursor({ x: peek.position.x, y: peek.position.y, clicking: false });
        await sleep(700);
        setCursor((p) => ({ ...p, clicking: true }));
        await sleep(250);
        setCursor((p) => ({ ...p, clicking: false }));
      }
      // Now stream the typing — bridge animates char-by-char (60ms each)
      const charDelay = 70;
      const res = await sendCommand(
        iframe,
        { action: "type_into", label: action.label, text: action.text, charDelay },
        (action.text?.length || 0) * charDelay + 4000
      );
      if (res.ok && res.position) {
        setCursor({ x: res.position.x, y: res.position.y, clicking: false });
      }
      await sleep(400);
      return res;
    }

    case "scroll": {
      const res = await sendCommand(iframe, { action: "scroll", y: action.y || 0 });
      await sleep(500);
      return res;
    }

    case "wait":
      await sleep(action.ms || 1000);
      return { ok: true };

    case "finish":
      return { ok: true };

    default:
      return { ok: false, error: "unknown_action" };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}