// Sector VI playground agents — Roblox-style NPCs
export const NPC_AGENTS = [
  { id: "zk", name: "Agent ZK", role: "Verifier", color: "#22d3ee", pants: "#0e7490", kas: 1250, status: "Patrolling", speed: 2.2 },
  { id: "ying", name: "Agent Ying", role: "Vision AI", color: "#a78bfa", pants: "#5b21b6", kas: 840, status: "Scanning", speed: 1.6 },
  { id: "kai", name: "KAI", role: "Feed Bot", color: "#34d399", pants: "#065f46", kas: 420, status: "Idle walk", speed: 1.9 },
  { id: "zeku", name: "Zeku", role: "Trader", color: "#fbbf24", pants: "#92400e", kas: 3100, status: "Negotiating", speed: 2.6 },
  { id: "tree", name: "Tree", role: "Ad Agent", color: "#f472b6", pants: "#9d174d", kas: 96, status: "Creating", speed: 1.4 },
];

export const ROOM_SIZE = 24; // half-extent of walkable area is ROOM_SIZE/2 - 2