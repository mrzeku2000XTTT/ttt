/**
 * agentLoop — autonomous goal-seeking loop.
 * Repeatedly: observe iframe page state → ask LLM for next action → execute → observe again.
 * Stops when the agent declares the goal complete, hits max steps, or fails.
 */
import { base44 } from "@/api/base44Client";
import { sendCommand, waitForIframeReady } from "./agentBridge";

const MAX_STEPS = 18;

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
  { path: "/NODA", desc: "NODA landing — overview of the workflow engine" },
  { path: "/NODAStudio", desc: "NODA workflow studio — build and run AI workflows (use 'Brain' to describe a workflow in plain English, then it auto-builds and runs)" },
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
    setStatus(`👀 Looking at the page (step ${step + 1})…`);
    const iframe = getIframe?.();
    let observation = { ok: false };
    if (iframe) {
      observation = await sendCommand(iframe, { action: "read_page" }, 2500);
    }

    // 2. THINK — ask LLM for next action
    setStatus("🧠 Planning next move…");
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

    // breather between steps — let DOM/page settle before observing again
    await sleep(1500);
  }
  setStatus("Idle");
}

async function planNextStep({ goal, history, observation }) {
  try {
    const obsSummary = observation.ok
      ? `URL: ${observation.url}
Title: ${observation.title || "?"}
Headings: ${(observation.headings || []).slice(0, 5).join(" | ")}
Visible buttons/links: ${(observation.buttons || []).slice(0, 18).join(" | ")}
Input fields available: ${(observation.inputs || []).slice(0, 10).join(" | ") || "(none detected)"}`
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
- Only use click_text values that appear in the visible buttons list above. If a button has [#agent-id], you can use that id as text (e.g. "play").
- For type_into, the "label" must match part of an input's placeholder/aria-label/name from the "Input fields available" list. e.g. if you see "Paste YouTube URL... (input:text)", use label: "youtube" or "paste".
- YOU CAN TYPE into ANY input field shown in "Input fields available". The system simulates real typing — the user sees each character appear in the input one at a time. NEVER say "I can't type" or "you'll need to type it yourself" — if an input exists in the list, use type_into to fill it.

# TTTV (/Browser) — playing a YouTube video
- Search input: placeholder "Paste YouTube URL...", data-agent-id="search". Use label: "search".
- Play button: data-agent-id="play". Use click_text: "play".
- Flow: navigate /Browser → type_into label "search" with the YouTube URL → click_text "play".
- SUCCESS SIGNAL: when headings include "TTTV Player" or buttons include "Back" + "YouTube" (the player view), the video is playing — call finish with done=true.

# NODA Studio (/NODAStudio) — building & running a workflow
- Brain button: data-agent-id="brain", visible label "Brain". Use click_text: "brain".
- After clicking Brain, a modal opens with a textarea (data-agent-id="brain", aria-label="brain"). Use type_into label "brain" to fill it with a clear plain-English description.
- Build button: data-agent-id="build", visible label "Build". Use click_text: "build". This generates and auto-runs the workflow (~5 seconds).
- For a quick demo: click_text: "example" instead of brain.
- Run button: data-agent-id="run". Use click_text: "run".
- After clicking Build, WAIT ~5 seconds (use { type: "wait", ms: 5000 }) for the workflow to generate, then read the page — you should see node names like "Web Research", "AI Agent", or "Email" in the headings/buttons.
- SUCCESS SIGNAL: once nodes appear on the canvas (visible in headings/buttons) AND a Run button is present (or auto-run already triggered), call finish with done=true. The user can see the workflow built — that's the goal.
- NODA branded loading animation plays automatically when navigating to /NODA or /NODAStudio — wait ~2.5 seconds after navigate before clicking anything.

# General
- CRITICAL: type_into REPLACES the input's value entirely (it does not append). Only use type_into ONCE per input. After typing, your next action should be to click play/submit — DO NOT type_into the same input again.
- If your previous step already typed the correct text into an input, DO NOT type_into it again. Move on (usually click_text "play" or the submit button).
- ALWAYS finish once the visible result of the goal is on screen. Don't keep clicking after success — declare done.
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
    case "navigate": {
      setStatus(`🌐 Opening ${action.url}…`);
      setUrl(action.url);
      // Wait for the iframe page to announce ready, then a real settle pause
      const ready = await waitForIframeReady(8000);
      if (!ready.ok) {
        await sleep(2000);
        const ping = await sendCommand(getIframe?.(), { action: "ping" }, 2000);
        if (!ping.ok) await sleep(1500);
      }
      // Let React finish hydrating + animations + lazy content
      await sleep(1500);
      return { ok: true };
    }

    case "click_text": {
      setStatus(`🎯 Finding "${action.text}" button…`);
      // First peek at where the element is so cursor can travel BEFORE clicking
      const peek = await sendCommand(iframe, { action: "locate", text: action.text });
      if (peek.ok && peek.position) {
        setCursor({ x: peek.position.x, y: peek.position.y, clicking: false });
        await sleep(1100); // let cursor glide there
      }
      setStatus(`👆 Clicking "${action.text}"…`);
      const res = await sendCommand(iframe, { action: "click_text", text: action.text });
      if (res.ok && res.position) {
        setCursor({ x: res.position.x, y: res.position.y, clicking: false });
        await sleep(300);
        setCursor((p) => ({ ...p, clicking: true }));
        await sleep(500);
        setCursor((p) => ({ ...p, clicking: false }));
      }
      // Let click side-effects (navigation, state updates, modals) fully resolve
      await sleep(1200);
      return res;
    }

    case "type_into": {
      setStatus(`🎯 Finding the "${action.label || "input"}" field…`);
      // Move cursor to the input FIRST so user sees it travel there
      const peek = await sendCommand(iframe, { action: "locate_input", label: action.label });
      if (peek.ok && peek.position) {
        setCursor({ x: peek.position.x, y: peek.position.y, clicking: false });
        await sleep(1000);
        setCursor((p) => ({ ...p, clicking: true }));
        await sleep(350);
        setCursor((p) => ({ ...p, clicking: false }));
        await sleep(300);
      }
      setStatus(`⌨️ Typing into Vision Chat: "${action.text?.slice(0, 32)}${action.text?.length > 32 ? "…" : ""}"`);
      // Now stream the typing — bridge animates char-by-char
      const charDelay = 70;
      const res = await sendCommand(
        iframe,
        { action: "type_into", label: action.label, text: action.text, charDelay },
        (action.text?.length || 0) * charDelay + 6000
      );
      if (res.ok && res.position) {
        setCursor({ x: res.position.x, y: res.position.y, clicking: false });
      }
      // Pause so the typed value visibly registers before next action
      await sleep(900);
      return res;
    }

    case "scroll": {
      const res = await sendCommand(iframe, { action: "scroll", y: action.y || 0 });
      await sleep(1000);
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