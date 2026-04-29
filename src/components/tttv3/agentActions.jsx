/**
 * Agent action executor.
 * Runs a sequence of actions and updates state via callbacks.
 *
 * Action types:
 *   { type: "navigate", url: "/Feed" }                — change iframe URL
 *   { type: "narrate", text: "Opening Feed..." }      — show narration toast
 *   { type: "wait", ms: 1500 }
 *   { type: "move_cursor", x: 50, y: 30 }             — % of computer panel
 *   { type: "click" }                                 — cursor click animation at current pos
 *   { type: "click_text", text: "Post" }              — REAL click on iframe element by text
 *   { type: "type_into", label: "title", text: "..." }— REAL type into input matching label
 *   { type: "scroll", y: 400 }                        — REAL scroll inside iframe
 *   { type: "read_page" }                             — read iframe contents (returns to caller)
 */
import { sendCommand, waitForIframeReady } from "./agentBridge";

export async function runAgentActions(actions, callbacks) {
  const { setUrl, setStatus, addNarration, setCursor, getIframe } = callbacks;
  const results = [];

  for (const action of actions) {
    switch (action.type) {
      case "navigate":
        setStatus(`Navigating to ${action.url}…`);
        setUrl(action.url);
        await waitForIframeReady(4000);
        await sleep(400);
        break;

      case "narrate":
        addNarration(action.text);
        await sleep(action.text.length * 22 + 400);
        break;

      case "wait":
        await sleep(action.ms || 1000);
        break;

      case "move_cursor":
        setCursor({ x: action.x, y: action.y, clicking: false });
        await sleep(700);
        break;

      case "click":
        setCursor((prev) => ({ ...prev, clicking: true }));
        await sleep(300);
        setCursor((prev) => ({ ...prev, clicking: false }));
        await sleep(200);
        break;

      case "click_text": {
        setStatus(`Clicking "${action.text}"…`);
        const iframe = getIframe?.();
        const res = await sendCommand(iframe, { action: "click_text", text: action.text, tagFilter: action.tagFilter });
        if (res.ok && res.position) {
          setCursor({ x: res.position.x, y: res.position.y, clicking: false });
          await sleep(500);
          setCursor((prev) => ({ ...prev, clicking: true }));
          await sleep(300);
          setCursor((prev) => ({ ...prev, clicking: false }));
        } else {
          addNarration(`Couldn't find "${action.text}" on the page.`);
        }
        results.push(res);
        await sleep(500);
        break;
      }

      case "type_into": {
        setStatus(`Typing into "${action.label}"…`);
        const iframe = getIframe?.();
        const res = await sendCommand(iframe, { action: "type_into", label: action.label, text: action.text });
        if (res.ok && res.position) {
          setCursor({ x: res.position.x, y: res.position.y, clicking: false });
        } else {
          addNarration(`Couldn't find an input for "${action.label}".`);
        }
        results.push(res);
        await sleep(500);
        break;
      }

      case "scroll": {
        const iframe = getIframe?.();
        await sendCommand(iframe, { action: "scroll", y: action.y || 0 });
        await sleep(500);
        break;
      }

      case "read_page": {
        const iframe = getIframe?.();
        const res = await sendCommand(iframe, { action: "read_page" });
        results.push(res);
        break;
      }

      default:
        break;
    }
  }
  setStatus("Idle");
  return results;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Apps the agent can use in Phase 1
export const PHASE_1_APPS = [
  { name: "Feed", path: "/Feed", description: "Social feed with posts and KAS tips" },
  { name: "Bridge", path: "/Bridge", description: "Send KAS cross-layer" },
  { name: "TTTV", path: "/Browser", description: "Ad-free video browser" },
];