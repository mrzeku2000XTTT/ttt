/**
 * agentBridge — talks to the Agent Computer iframe via postMessage.
 * Tracks ready state per iframe so navigations resolve reliably.
 */
const AGENT_NS = "ttt-agent";

let pendingCalls = new Map();
let listenerAttached = false;
let lastReadyAt = 0; // timestamp of most recent 'ready' event from iframe
let readyResolvers = []; // { resolve, since }  — resolved when a 'ready' fires AFTER `since`

function ensureListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  window.addEventListener("message", (e) => {
    const msg = e.data;
    if (!msg || msg.ns !== AGENT_NS) return;
    if (msg.type === "response" && pendingCalls.has(msg.id)) {
      const resolve = pendingCalls.get(msg.id);
      pendingCalls.delete(msg.id);
      resolve(msg.payload);
    } else if (msg.type === "ready") {
      lastReadyAt = Date.now();
      // Resolve every queued waiter that started BEFORE this ready event
      const stillWaiting = [];
      readyResolvers.forEach((w) => {
        if (w.since <= lastReadyAt) {
          w.resolve({ ok: true, url: msg.url });
        } else {
          stillWaiting.push(w);
        }
      });
      readyResolvers = stillWaiting;
    }
  });
}

/**
 * Wait for the iframe to fire its 'ready' event AFTER this call started.
 * If a ready event already arrived very recently (within 200ms), resolve immediately
 * (handles tiny race where iframe loaded just before we asked).
 */
export function waitForIframeReady(timeoutMs = 5000) {
  ensureListener();
  const since = Date.now();
  return new Promise((resolve) => {
    // If a ready event arrived within the last 200ms, count it
    if (lastReadyAt && since - lastReadyAt < 200) {
      resolve({ ok: true, recent: true });
      return;
    }
    const waiter = { resolve, since };
    readyResolvers.push(waiter);
    setTimeout(() => {
      const idx = readyResolvers.indexOf(waiter);
      if (idx !== -1) {
        readyResolvers.splice(idx, 1);
        resolve({ ok: false, timeout: true });
      }
    }, timeoutMs);
  });
}

export function sendCommand(iframe, command, timeoutMs = 4000) {
  ensureListener();
  if (!iframe || !iframe.contentWindow) {
    return Promise.resolve({ ok: false, error: "no_iframe" });
  }
  const id = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return new Promise((resolve) => {
    pendingCalls.set(id, resolve);
    iframe.contentWindow.postMessage({ ns: AGENT_NS, type: "command", id, command }, "*");
    setTimeout(() => {
      if (pendingCalls.has(id)) {
        pendingCalls.delete(id);
        resolve({ ok: false, error: "timeout" });
      }
    }, timeoutMs);
  });
}

/** Reset state — useful when computer panel closes/reopens */
export function resetAgentBridge() {
  pendingCalls.clear();
  readyResolvers = [];
  lastReadyAt = 0;
}