// Local Igra agent wallets — private keys live ONLY in this browser's localStorage.
// Reusable for any AI agents that need a local EVM wallet on Igra.
const KEY = "igra_local_agent_wallets";

export function listLocalAgents() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function saveLocalAgent(agent) {
  const all = listLocalAgents().filter((a) => a.name?.toLowerCase() !== agent.name?.toLowerCase());
  all.push({ ...agent, created: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}

export function getLocalAgent(name) {
  return listLocalAgents().find((a) => a.name?.toLowerCase() === String(name || "").toLowerCase());
}