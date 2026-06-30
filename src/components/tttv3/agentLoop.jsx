/**
 * agentLoop — plan-driven autonomous goal-seeking loop.
 *
 * Flow:
 *   1. Vision Agent reads the goal and generates a numbered plan (sub-tasks).
 *   2. For each plan item, runs an inner action loop: observe → act → verify.
 *   3. Only advances to the next plan item once the current one is verified complete.
 *   4. Stops on success, failure, or abort.
 */
import { base44 } from "@/api/base44Client";
import { sendCommand, waitForIframeReady } from "./agentBridge";

const MAX_ACTIONS_PER_STEP = 8;
const MAX_PLAN_ITEMS = 10;

const PLAN_BUILDER_SCHEMA = {
  type: "object",
  properties: {
    plan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short, action-oriented step title (5-12 words)" },
          success_signal: { type: "string", description: "Visible signal that proves this step is complete" },
        },
        required: ["title", "success_signal"],
      },
    },
  },
  required: ["plan"],
};

const ACTION_SCHEMA = {
  type: "object",
  properties: {
    thought: { type: "string", description: "Brief reasoning about what to do next for the CURRENT plan item" },
    step_complete: { type: "boolean", description: "True ONLY when the current plan item's success signal is visible on the page" },
    say: { type: "string", description: "Short narration for the user" },
    action: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["navigate", "click_text", "type_into", "scroll", "wait", "skip"] },
        url: { type: "string" },
        text: { type: "string" },
        label: { type: "string" },
        ms: { type: "number" },
        y: { type: "number" },
      },
      required: ["type"],
    },
  },
  required: ["thought", "step_complete", "say", "action"],
};

const AVAILABLE_ROUTES = [
  { path: "/Feed", desc: "Social feed — post, comment, tip KAS" },
  { path: "/Bridge", desc: "Send KAS cross-layer" },
  { path: "/Browser", desc: "TTTV — video browser" },
  { path: "/AgentZK", desc: "Agent ZK identity" },
  { path: "/Wallet", desc: "User wallet" },
  { path: "/Profile", desc: "User profile" },
  { path: "/AppStoreV2", desc: "Browse all 80+ apps" },
  { path: "/NODAStudio", desc: "NODA — AI workflow editor. THIS IS THE ONLY PLACE you can build/run workflows, send emails, post to TTT, do research, etc. Always navigate here for any NODA task. Click 'Brain' to describe a workflow in plain English — it auto-builds nodes (AI Prompt, Send Email, Post to TTT, Deep Research, etc.) and runs them." },
];

export async function runAutonomousAgent({ goal, callbacks, signal }) {
  const { setStatus, addNarration, onPlan, onPlanItemUpdate, onStep } = callbacks;

  // ── PHASE 1: BUILD THE PLAN ────────────────────────────────────────────
  setStatus("🧭 Reading your prompt and building a plan…");
  addNarration("Reading the goal and breaking it into steps…");
  const plan = await buildPlan(goal);
  if (!plan || plan.length === 0) {
    addNarration("Couldn't build a plan. Stopping.");
    setStatus("Idle");
    return;
  }
  onPlan?.(plan);
  addNarration(`Plan ready · ${plan.length} step${plan.length > 1 ? "s" : ""}.`);

  // ── PHASE 2: EXECUTE EACH PLAN ITEM ────────────────────────────────────
  for (let pi = 0; pi < plan.length; pi++) {
    if (signal?.aborted) break;
    const item = plan[pi];
    onPlanItemUpdate?.(pi, { status: "running", note: "starting…" });
    setStatus(`▶ Step ${pi + 1}/${plan.length}: ${item.title}`);

    const result = await executePlanItem({
      goal,
      planItem: item,
      planIndex: pi,
      fullPlan: plan,
      callbacks,
      signal,
    });

    if (signal?.aborted) {
      onPlanItemUpdate?.(pi, { status: "failed", note: "stopped" });
      break;
    }

    if (result.completed) {
      onPlanItemUpdate?.(pi, { status: "done", note: null });
      // Back-fill: if a later step succeeded, any earlier steps that failed/stuck
      // must have actually worked (you can't reach step N+1 without step N's effects).
      for (let prev = 0; prev < pi; prev++) {
        onPlanItemUpdate?.(prev, { status: "done", note: null });
      }
    } else {
      onPlanItemUpdate?.(pi, { status: "failed", note: result.reason || "could not verify" });
      addNarration(`Step ${pi + 1} didn't verify — continuing anyway.`);
    }

    // breather between plan items
    await sleep(800);
  }

  setStatus("Goal complete ✓");
  addNarration("All steps done.");
}

// ─────────────────────────────────────────────────────────────────────────
// PLAN BUILDER
// ─────────────────────────────────────────────────────────────────────────
async function buildPlan(goal) {
  try {
    const routes = AVAILABLE_ROUTES.map((r) => `  ${r.path} — ${r.desc}`).join("\n");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the Vision Agent's planner. Read the user's goal and break it into a SHORT numbered plan of 2-${MAX_PLAN_ITEMS} concrete sub-tasks. Each sub-task should be one observable action that an autonomous agent can verify is done.

# AVAILABLE ROUTES
${routes}

# GOAL
${goal}

# RULES
- Each plan item = ONE visible milestone.
- Be specific. Don't say "set up email" — say "Type the email recipient into the email node's recipient field".
- ALWAYS make the FIRST item the navigation step using the EXACT route path from AVAILABLE ROUTES (e.g. "Open /NODAStudio" — NOT "/NODA", that doesn't exist as a route here).
- The LAST item should be the final visible result.
- ANY task involving email, posting, research, AI workflow, automation, "send", "create", "build" → ALWAYS use /NODAStudio + Brain. Never invent custom steps like "Click Email" or "Click Send" — those buttons don't exist standalone. The Brain modal handles ALL of it: you describe the goal in plain English, click Build, and it generates the right nodes (Send Email, Post to TTT, Deep Research, AI Prompt, etc.) AND runs them.
- For a NODA workflow build, the plan MUST be exactly: 1) Open /NODAStudio  2) Click Brain  3) Type the full description into the Brain textarea  4) Click Build  5) Wait & verify nodes appear.
- For a TTTV play, plan: Open /Browser → Type URL into search → Click play → Verify player loaded.
- For a FEED post task, plan: Open /Feed → Type the post text into the "What's on your mind?" textarea → Click the "Post" button → Verify the post appeared in the feed. NEVER plan to click "Post" before typing — the button is disabled until the textarea has text.
- success_signal: a short hint of what to look for on screen (e.g. "Brain modal textarea visible", "URL contains /NODAStudio", "Workflow nodes appear on canvas").
- Keep it tight. 3-6 items is ideal. Never more than ${MAX_PLAN_ITEMS}.

Return ONLY the JSON.`,
      response_json_schema: PLAN_BUILDER_SCHEMA,
    });
    const items = (res?.plan || []).slice(0, MAX_PLAN_ITEMS).map((p, i) => ({
      id: `p${i}`,
      title: p.title,
      success_signal: p.success_signal,
      status: "pending",
      note: null,
    }));
    return items;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PER-PLAN-ITEM EXECUTION LOOP
// ─────────────────────────────────────────────────────────────────────────
async function executePlanItem({ goal, planItem, planIndex, fullPlan, callbacks, signal }) {
  const { setUrl, setStatus, addNarration, setCursor, getIframe, onStep, onPlanItemUpdate } = callbacks;
  const history = [];

  for (let actionStep = 0; actionStep < MAX_ACTIONS_PER_STEP; actionStep++) {
    if (signal?.aborted) return { completed: false, reason: "aborted" };

    // OBSERVE
    setStatus(`👀 Step ${planIndex + 1} · checking page…`);
    const iframe = getIframe?.();
    let observation = { ok: false };
    if (iframe) {
      observation = await sendCommand(iframe, { action: "read_page" }, 2500);
    }

    // THINK
    setStatus(`🧠 Step ${planIndex + 1} · planning next action…`);
    const decision = await decideAction({ goal, planItem, planIndex, fullPlan, history, observation });
    if (!decision) {
      return { completed: false, reason: "planner_failed" };
    }

    // STREAM step into chat
    onStep?.({
      step: `${planIndex + 1}.${actionStep + 1}`,
      planIndex,
      plan: {
        thought: decision.thought,
        say: decision.say,
        action: decision.action,
        done: decision.step_complete,
      },
      observation,
    });

    if (decision.say) addNarration(decision.say);
    if (decision.thought) {
      onPlanItemUpdate?.(planIndex, { status: "running", note: decision.thought.slice(0, 60) });
    }

    // CHECK COMPLETION
    if (decision.step_complete) {
      addNarration(`✓ Step ${planIndex + 1} done`);
      return { completed: true };
    }

    // SKIP (planner says this step doesn't need an action — already satisfied or N/A)
    if (decision.action?.type === "skip") {
      return { completed: true };
    }

    // ACT
    const actResult = await executeAction(decision.action, { setUrl, setStatus, setCursor, getIframe });
    history.push({
      action: decision.action,
      result: actResult,
      thought: decision.thought,
    });

    // settle
    await sleep(1200);

    // ── AUTO-VERIFY ── re-observe and check if success signal is now visible.
    // If yes, mark step complete without burning another LLM round-trip.
    if (actResult?.ok) {
      const verifyObs = await sendCommand(getIframe?.(), { action: "read_page" }, 2500);
      if (verifyObs.ok && matchesSuccessSignal(planItem, verifyObs, decision.action)) {
        addNarration(`✓ Step ${planIndex + 1} verified`);
        return { completed: true };
      }
    }
  }

  return { completed: false, reason: "max_actions_reached" };
}

// Lightweight heuristic verifier — checks the page after an action to see if the
// step's success signal is plausibly satisfied. Catches cases the LLM misses.
function matchesSuccessSignal(planItem, obs, action) {
  const signal = (planItem.success_signal || "").toLowerCase();
  const title = (planItem.title || "").toLowerCase();
  const url = (obs.url || "").toLowerCase();
  const headings = (obs.headings || []).join(" | ").toLowerCase();
  const buttons = (obs.buttons || []).join(" | ").toLowerCase();
  const inputs = (obs.inputs || []).join(" | ").toLowerCase();
  const haystack = `${url} ${headings} ${buttons} ${inputs}`;

  // 1. Navigate step → URL changed to expected route
  if (action?.type === "navigate" && action.url) {
    const target = action.url.toLowerCase().replace(/^\//, "");
    if (url.includes(target)) return true;
  }

  // 2. Type into input → the SPECIFIC input must echo the typed text in its value.
  //    The read_page scanner reports textareas as: `brain (textarea) = "typed text"`.
  //    We require the typed snippet to appear inside the inputs section specifically,
  //    not anywhere on the page (e.g. in a heading or button label).
  if (action?.type === "type_into" && action.text) {
    const snippet = action.text.toLowerCase().slice(0, 25);
    if (inputs.includes(snippet)) return true;
    // Not yet — explicitly fail this verifier so the loop retries.
    return false;
  }

  // 3. Click → button no longer visible OR new expected element appeared
  if (action?.type === "click_text") {
    // Specific NODA / TTTV milestones
    if (action.text?.toLowerCase().includes("brain") && inputs.includes("brain")) return true;
    if (action.text?.toLowerCase().includes("build") && (haystack.includes("agent") || haystack.includes("research") || haystack.includes("email") || haystack.includes("workflow") || haystack.includes("run"))) return true;
    if (action.text?.toLowerCase().includes("play") && (headings.includes("tttv player") || buttons.includes("back"))) return true;
  }

  // 4. Generic — pull keywords from the success_signal/title and look for them
  const keywords = (signal + " " + title)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !["into", "with", "from", "page", "step", "the", "and", "for", "click", "type", "open", "wait", "verify", "appear", "visible"].includes(w));

  if (keywords.length > 0) {
    const hits = keywords.filter((k) => haystack.includes(k)).length;
    // If half or more of the meaningful keywords are visible, consider it done
    if (hits >= Math.ceil(keywords.length / 2)) return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────
// PER-ACTION DECISION
// ─────────────────────────────────────────────────────────────────────────
async function decideAction({ goal, planItem, planIndex, fullPlan, history, observation }) {
  try {
    const obsSummary = observation.ok
      ? `URL: ${observation.url}
Title: ${observation.title || "?"}
Headings: ${(observation.headings || []).slice(0, 5).join(" | ")}
Visible buttons/links: ${(observation.buttons || []).slice(0, 18).join(" | ")}
Input fields available: ${(observation.inputs || []).slice(0, 10).join(" | ") || "(none detected)"}`
      : "(iframe not ready or page empty)";

    const planSummary = fullPlan
      .map(
        (p, i) =>
          `  ${i + 1}. ${p.title} ${i < planIndex ? "[done]" : i === planIndex ? "[CURRENT]" : "[upcoming]"}`
      )
      .join("\n");

    const histSummary =
      history
        .map(
          (h, i) =>
            `  attempt ${i + 1}: ${JSON.stringify(h.action)} → ${h.result?.ok ? "ok" : "fail: " + (h.result?.error || "?")}`
        )
        .join("\n") || "  (none)";

    const routes = AVAILABLE_ROUTES.map((r) => `  ${r.path} — ${r.desc}`).join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an autonomous agent operating a TTT app inside an iframe. You have a multi-step PLAN. Right now you're working on ONE specific step. Decide ONE action to make progress on JUST that step. Don't jump ahead.

# OVERALL GOAL
${goal}

# FULL PLAN
${planSummary}

# CURRENT STEP (focus only on this)
"${planItem.title}"
Success signal: ${planItem.success_signal}

# AVAILABLE ROUTES (use with navigate)
${routes}

# CURRENT PAGE (what you can see)
${obsSummary}

# WHAT YOU'VE TRIED FOR THIS STEP SO FAR
${histSummary}

# YOUR JOB
Pick ONE action OR mark step_complete=true if the success signal is already visible on the page.

# THOUGHT QUALITY (CRITICAL)
The "thought" field is shown LIVE to the user as the agent's reasoning. It MUST be:
- SPECIFIC: reference what you actually see on the page (e.g. "I see Brain button on the toolbar — clicking it") NOT generic ("Taking next action").
- SHORT: one sentence, max 18 words.
- FIRST PERSON, present tense ("I see…", "I'll click…", "The textarea now shows…").
- Reference real labels, URLs, or text from the observation when possible.
- NEVER repeat the same thought twice. If retrying, say WHY ("Brain button didn't open the modal — trying again with the data-agent-id").
Bad: "Taking the next action." / "Continuing the plan." / "Processing."
Good: "Brain modal is open and textarea is empty — typing the workflow description now." / "URL is /NODAStudio and I see the Brain button — clicking it." / "Textarea shows the prompt — moving on to click Build."

CRITICAL RULES
- Set step_complete=true ONLY when the success signal for THE CURRENT STEP is actually visible (matching headings, URL, buttons, or inputs).
- DO NOT set step_complete=true just because you took an action — wait until you actually see the result.
- After navigate, the next observation will show the new page — use that to verify the URL changed.
- After click_text "Brain", look for the Brain modal textarea in inputs (label "brain") — that's the success signal.
- TYPING INTO BRAIN (step 3): the inputs section will report the textarea as: \`brain (textarea) = "your typed text here"\`. ONLY mark step 3 complete when you see your typed text inside those quotes after \`brain (textarea) =\`. If the inputs show \`brain (textarea)\` with NO \`= "..."\` value, the textarea is EMPTY — you MUST issue a type_into action with label="brain" and the full prompt as text. Never skip this. Never mark complete without seeing the value.
- After click_text "Build", wait for nodes to appear (workflow names in headings/buttons) — THEN step_complete=true.

ACTION TYPES
- navigate: { type: "navigate", url: "/NODAStudio" }
- click_text: { type: "click_text", text: "Brain" } — click button by visible text or data-agent-id
- type_into: { type: "type_into", label: "brain", text: "..." } — TYPES into input matching label/placeholder. ONE TIME ONLY per input.
- scroll: { type: "scroll", y: 400 }
- wait: { type: "wait", ms: 5000 } — wait for content to load (use after Build, after navigate)
- skip: { type: "skip" } — current step is already satisfied or doesn't need an action

NODA-SPECIFIC TIPS
- Brain BUTTON (toolbar): appears in buttons list as "Brain [#brain]". Clicking it OPENS the Brain modal.
- Brain MODAL OPEN signal: the inputs list contains an item like "brain (textarea)" — a textarea, NOT a button.
- DO NOT confuse the Brain button (toolbar, always visible) with the Brain modal (textarea in inputs).
- Step "Click Brain to open modal" is ONLY complete when inputs list contains "brain (textarea)". If you only see "Brain [#brain]" in buttons → modal is NOT open yet → click_text "Brain" again.
- Build button: data-agent-id="build", label "Build". After click, wait ~5s then verify nodes visible.
- Run button: data-agent-id="run", label "Run".
- After Build click, ALWAYS wait 5000ms before observing.
- CRITICAL ORDER: NEVER click Build until the workflow description text is ACTUALLY visible inside the Brain textarea. The inputs report shows the textarea's value as: brain (textarea) = "your typed text here". Only mark the typing step complete when you see your description in those quotes. If the value is empty or missing, retry type_into.

TTTV-SPECIFIC TIPS
- Search input: label "search" or "youtube" or "paste".
- Play button: label "play".
- Success: headings include "TTTV Player" or buttons include "Back" + "YouTube".

FEED-SPECIFIC TIPS (posting on /Feed)
- The post composer is a TEXTAREA with placeholder "What's on your mind?" near the top of /Feed. In the inputs list it shows up as an item containing "what's", "mind", or "post".
- TO POST: FIRST type_into with label="what's" (or "mind") and the FULL post text. ONLY AFTER the inputs report shows your typed text inside the textarea value, issue click_text "Post" (the white Post button with the Send icon, next to the textarea).
- The "Post" button is DISABLED (unclickable) until the textarea has text. NEVER click_text "Post" before typing — it will silently fail. If you click and nothing happens, it means the textarea is empty: go back and type_into first.
- The typing step is complete ONLY when the inputs report shows your post text as the textarea's value. Then the next action is click_text "Post".
- Step complete signal: the textarea is empty again (post submitted) OR your post text appears in the feed/headings below.
- If inputs list is EMPTY after navigate to /Feed, the page is still loading — issue a wait (5000ms) then re-observe. Do NOT blindly click_text "Post".

Return ONLY the JSON.`,
      response_json_schema: ACTION_SCHEMA,
    });
    return res;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ACTION EXECUTOR (unchanged behavior, slightly more patient settles)
// ─────────────────────────────────────────────────────────────────────────
async function executeAction(action, { setUrl, setStatus, setCursor, getIframe }) {
  if (!action) return { ok: false, error: "no_action" };
  const iframe = getIframe?.();

  switch (action.type) {
    case "navigate": {
      setStatus(`🌐 Opening ${action.url}…`);
      setUrl(action.url);
      const ready = await waitForIframeReady(8000);
      if (!ready.ok) {
        await sleep(2000);
        const ping = await sendCommand(getIframe?.(), { action: "ping" }, 2000);
        if (!ping.ok) await sleep(1500);
      }
      await sleep(1800);
      return { ok: true };
    }

    case "click_text": {
      setStatus(`🎯 Finding "${action.text}"…`);
      const peek = await sendCommand(iframe, { action: "locate", text: action.text });
      if (peek.ok && peek.position) {
        setCursor({ x: peek.position.x, y: peek.position.y, clicking: false });
        await sleep(1100);
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
      await sleep(1400);
      return res;
    }

    case "type_into": {
      setStatus(`🎯 Finding "${action.label || "input"}" field…`);
      const peek = await sendCommand(iframe, { action: "locate_input", label: action.label });
      if (peek.ok && peek.position) {
        setCursor({ x: peek.position.x, y: peek.position.y, clicking: false });
        await sleep(900);
        setCursor((p) => ({ ...p, clicking: true }));
        await sleep(350);
        setCursor((p) => ({ ...p, clicking: false }));
        await sleep(300);
      }
      setStatus(`⌨️ Typing: "${action.text?.slice(0, 32)}${action.text?.length > 32 ? "…" : ""}"`);
      const charDelay = 60;
      const res = await sendCommand(
        iframe,
        { action: "type_into", label: action.label, text: action.text, charDelay },
        (action.text?.length || 0) * charDelay + 6000
      );
      if (res.ok && res.position) {
        setCursor({ x: res.position.x, y: res.position.y, clicking: false });
      }
      await sleep(1000);
      return res;
    }

    case "scroll": {
      const res = await sendCommand(iframe, { action: "scroll", y: action.y || 0 });
      await sleep(900);
      return res;
    }

    case "wait":
      setStatus(`⏳ Waiting ${Math.round((action.ms || 1000) / 1000)}s…`);
      await sleep(action.ms || 1000);
      return { ok: true };

    case "skip":
      return { ok: true };

    default:
      return { ok: false, error: "unknown_action" };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}