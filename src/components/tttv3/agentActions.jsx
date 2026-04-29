/**
 * Agent action executor.
 * Runs a sequence of actions (navigate, narrate, wait, highlight) and updates state via callbacks.
 *
 * Actions:
 *   { type: "navigate", url: "/Feed" }
 *   { type: "narrate", text: "Opening Feed..." }
 *   { type: "wait", ms: 1500 }
 *   { type: "move_cursor", x: 50, y: 30 }   (% of computer panel)
 *   { type: "click" }                        (triggers cursor click animation at current pos)
 */
export async function runAgentActions(actions, callbacks) {
  const { setUrl, setStatus, addNarration, setCursor } = callbacks;
  for (const action of actions) {
    switch (action.type) {
      case "navigate":
        setStatus(`Navigating to ${action.url}…`);
        setUrl(action.url);
        await sleep(800);
        break;
      case "narrate":
        addNarration(action.text);
        await sleep(action.text.length * 25 + 400);
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
      default:
        break;
    }
  }
  setStatus("Idle");
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