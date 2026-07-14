/**
 * directControl — ZK's fast hands-on-the-page path.
 *
 * When the user gives a direct UI command ("click the ZK button", "type X into
 * the search"), ZK: 1) reads the LIVE page currently shown in the Agent
 * Computer, 2) matches the command against the REAL visible buttons/inputs,
 * 3) executes the click/type with the cursor, 4) re-reads the page and reports
 * exactly what happened. No plan builder, no multi-step pipeline.
 */
import { base44 } from "@/api/base44Client";
import { sendCommand } from "./agentBridge";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * observeLiveScreen — read what's ACTUALLY displayed in the Agent Computer
 * right now. Returns a compact text summary for injecting into ZK's prompts,
 * so "what page are we on?" is answered from ground truth, never from memory.
 */
export async function observeLiveScreen(getIframe) {
  try {
    const iframe = getIframe?.();
    if (!iframe) return "";
    let obs = await sendCommand(iframe, { action: "read_page" }, 3000);
    if (!obs?.ok) {
      await sleep(1200);
      obs = await sendCommand(getIframe?.(), { action: "read_page" }, 3000);
    }
    if (!obs?.ok) return "";
    const parts = [`Current URL: ${obs.url || "(unknown)"}`];
    if (obs.title) parts.push(`Page title: ${obs.title}`);
    if (obs.headings?.length) parts.push(`Headings: ${obs.headings.slice(0, 8).join(" | ")}`);
    if (obs.buttons?.length) parts.push(`Visible buttons/links: ${obs.buttons.slice(0, 30).join(" | ")}`);
    if (obs.inputs?.length) parts.push(`Input fields: ${obs.inputs.slice(0, 10).join(" | ")}`);
    if (obs.text) parts.push(`Visible text: ${String(obs.text).slice(0, 500)}`);
    return parts.join("\n");
  } catch {
    return "";
  }
}

export function looksLikeDirectControl(text) {
  return /\b(click|press|tap|type|enter|fill|scroll|select|toggle)\b/i.test(text);
}

export async function runDirectControl({ text, getIframe, setCursor, setStatus, onPhase }) {
  const iframe = getIframe?.();
  if (!iframe) return { handled: false };

  // 1. SEE — read the live page the user is looking at
  onPhase?.("👀 ZK · reading the live page…");
  setStatus?.("👀 ZK · reading the live page…");
  let obs = await sendCommand(iframe, { action: "read_page" }, 3000);
  if (!obs?.ok || ((obs.buttons || []).length === 0 && (obs.inputs || []).length === 0)) {
    await sleep(1800);
    obs = await sendCommand(getIframe?.(), { action: "read_page" }, 3000);
  }
  if (!obs?.ok) return { handled: false };

  // 2. MATCH — one focused LLM call: user command vs what's ACTUALLY visible
  onPhase?.("🧠 ZK · matching your command to what's on screen…");
  setStatus?.("🧠 ZK · matching command to screen…");
  let decision;
  try {
    decision = await base44.integrations.Core.InvokeLLM({
      prompt: `You control a live web page. The user gave a direct UI command. Below is EXACTLY what is visible on the page RIGHT NOW. Match the command to a real element and pick ONE action.

# USER COMMAND
${text}

# LIVE PAGE (what's actually on screen)
URL: ${obs.url}
Visible buttons/links (exact labels): ${(obs.buttons || []).slice(0, 40).join(" | ") || "(none)"}
Input fields: ${(obs.inputs || []).slice(0, 15).join(" | ") || "(none)"}
Headings: ${(obs.headings || []).slice(0, 6).join(" | ") || "(none)"}

# RULES
- "target" for click MUST be one of the EXACT visible button/link labels above (copy it verbatim, e.g. "ZK" not "zk button").
- Match loosely: "the zk button" → label "ZK"; "press start" → label "▶  PRESS START" (use the exact label as listed).
- type_into: "target" is the input's label/placeholder keyword from the inputs list, "text" is what to type.
- action "none" ONLY if nothing on this page can satisfy the command.
- reply: one short first-person sentence of what you're doing ("I see the ZK button — clicking it now.").

Return ONLY the JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["click", "type", "scroll", "none"] },
          target: { type: "string" },
          text: { type: "string" },
          y: { type: "number" },
          reply: { type: "string" },
        },
        required: ["action", "reply"],
      },
    });
  } catch {
    return { handled: false };
  }

  if (!decision || decision.action === "none") {
    return { handled: false };
  }

  // 3. ACT — with the visible cursor
  let actResult = { ok: false };
  if (decision.action === "click") {
    onPhase?.(`🎯 ZK · clicking "${decision.target}"…`);
    setStatus?.(`🎯 Clicking "${decision.target}"…`);
    const peek = await sendCommand(getIframe?.(), { action: "locate", text: decision.target }, 3000);
    if (peek?.ok && peek.position) {
      setCursor?.({ x: peek.position.x, y: peek.position.y, clicking: false });
      await sleep(900);
      setCursor?.((p) => ({ ...p, clicking: true }));
      await sleep(400);
      setCursor?.((p) => ({ ...p, clicking: false }));
    }
    actResult = await sendCommand(getIframe?.(), { action: "click_text", text: decision.target }, 4000);
  } else if (decision.action === "type") {
    onPhase?.(`⌨️ ZK · typing into "${decision.target}"…`);
    setStatus?.(`⌨️ Typing into "${decision.target}"…`);
    actResult = await sendCommand(
      getIframe?.(),
      { action: "type_into", label: decision.target, text: decision.text || "", charDelay: 50 },
      (decision.text?.length || 0) * 50 + 6000
    );
    if (actResult?.ok && actResult.position) setCursor?.({ x: actResult.position.x, y: actResult.position.y, clicking: false });
  } else if (decision.action === "scroll") {
    actResult = await sendCommand(getIframe?.(), { action: "scroll", y: decision.y || 400 }, 3000);
  }

  // 4. VERIFY — re-read the page and report the real outcome
  await sleep(1500);
  const after = await sendCommand(getIframe?.(), { action: "read_page" }, 3000);
  setStatus?.(actResult?.ok ? "✓ Done" : "⚠ Action failed");

  let reply;
  if (actResult?.ok) {
    const urlChanged = after?.ok && after.url !== obs.url;
    reply = `${decision.reply}\n\n✓ **Done.** ${urlChanged ? `The page moved to \`${after.url}\`.` : "Action executed on the live page."}`;
  } else {
    reply = `${decision.reply}\n\n⚠ I found the page but the action didn't land (${actResult?.error || "element not reachable"}). The exact labels I can see: ${(obs.buttons || []).slice(0, 12).join(", ")}. Tell me which one to hit.`;
  }

  return {
    handled: true,
    reply,
    thought: `Read the live page (${obs.url}), matched "${text.slice(0, 40)}" to ${decision.action} "${decision.target || ""}" — executed directly, no pipeline.`,
  };
}