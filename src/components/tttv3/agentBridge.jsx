/**
 * agentBridge — talks to the Agent Computer iframe via postMessage.
 * Returns promises that resolve when the iframe page replies.
 */
const AGENT_NS = "ttt-agent";

let pendingCalls = new Map();
let listenerAttached = false;
let readyResolvers = [];

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
      readyResolvers.forEach((r) => r(msg));
      readyResolvers = [];
    }
  });
}

export function waitForIframeReady(timeoutMs = 5000) {
  ensureListener();
  return new Promise((resolve) => {
    readyResolvers.push(resolve);
    setTimeout(() => resolve({ timeout: true }), timeoutMs);
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