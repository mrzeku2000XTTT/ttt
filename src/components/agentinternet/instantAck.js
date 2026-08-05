/**
 * Zero-latency acknowledgment.
 * Built locally from the user's own words the moment they hit send, so the agent
 * always speaks back in the same frame as the message — no network round trip.
 */
const RULES = [
  [/\b(video|promo|trailer|ad|advert|commercial|reel|short|clip|teaser)\b/i, (s) => `On it — building your ${s} now. Locking the look first.`],
  [/\b(price|worth|market ?cap|chart)\b/i, () => `Pulling live market data right now.`],
  [/\b(wallet|address|seed|private key)\b/i, () => `Got it — handling your wallet locally on this device.`],
  [/\b(brand|logo|identity|palette)\b/i, () => `Understood — working up the brand direction now.`],
  [/\b(image|picture|render|still|thumbnail|poster)\b/i, () => `On it — rendering that image now.`],
  [/\b(research|find|search|look up|who|what|why|how|when)\b/i, () => `Looking that up for you right now.`],
  [/\b(write|copy|post|caption|email|script)\b/i, () => `On it — drafting that copy now.`],
  [/\b(app|launch|build|make|create)\b/i, () => `On it — lining up the apps needed for this.`],
];

function subject(text) {
  const t = (text || "").trim().replace(/^(please\s+|can you\s+|i want\s+|i need\s+)/i, "");
  const words = t.split(/\s+/).slice(0, 9).join(" ");
  return words.length > 60 ? `${words.slice(0, 57)}…` : words;
}

export function instantAck(text) {
  for (const [re, fn] of RULES) {
    const m = (text || "").match(re);
    if (m) return fn(m[0].toLowerCase());
  }
  return `Heard you — "${subject(text)}". Starting on it now.`;
}