// AGENT TOOLS — all Base44-powered tools, one-click, no API keys needed (runs on TTT's own infrastructure)
export const AGENT_TOOLS = [
  { id: "generate_image", name: "Image Generation", desc: "Create images, logos & art with AI", cost: 2 },
  { id: "build_app", name: "Product Builder", desc: "Build & launch full working apps", cost: 3 },
  { id: "web_search", name: "Web Search", desc: "Live answers from the internet", cost: 1 },
  { id: "speak", name: "Voice (TTS)", desc: "Turn text into spoken audio", cost: 2 },
  { id: "kaspa_price", name: "Live Kaspa Price", desc: "Real-time KAS market data", cost: 1 },
  { id: "kaspa_balance", name: "Balance Lookup", desc: "Query any Kaspa address on-chain", cost: 1 },
  { id: "node_status", name: "Live Node Connect", desc: "Live REST Kaspa node status & BlockDAG", cost: 1 },
  { id: "kaspa_txs", name: "Address Scanner", desc: "Scan any address — balance + latest transactions", cost: 1 },
  { id: "explain_tx", name: "TX Explainer", desc: "Paste a TX ID — get a plain-English breakdown", cost: 1 },
  { id: "file_analysis", name: "File & Image Analysis", desc: "Understand attached files, PDFs & images", cost: 1 },
];

const SETTINGS_KEY = "agent_tool_settings";

export function loadToolSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return { wallet: s.wallet || "", enabled: s.enabled || {} };
  } catch {
    return { wallet: "", enabled: {} };
  }
}

export function saveToolSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

export function isKaspaAddress(addr) {
  return /^kaspa:[a-z0-9]{50,70}$/.test((addr || "").trim());
}