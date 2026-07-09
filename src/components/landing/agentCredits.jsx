import { base44 } from "@/api/base44Client";

// Tasks users can complete to earn AGENT K-CREDITS (verified by the agent via proof screenshots)
export const EARN_TASKS = [
  { id: "follow_x", label: "Follow @TTTPlatform on X", reward: 25 },
  { id: "post_x", label: "Post about AGENT. on X and tag us", reward: 40 },
  { id: "join_telegram", label: "Join the TTT Telegram community", reward: 20 },
];

const LOCAL_KEY = "agent_kcredits_guest";
const LOCAL_TASKS_KEY = "agent_kcredits_guest_tasks";

export async function loadCreditState() {
  try {
    const me = await base44.auth.me();
    if (me) {
      return {
        loggedIn: true,
        isAdmin: me.role === "admin",
        credits: me.kcredits ?? 20,
        completedTasks: me.kcredit_tasks || [],
      };
    }
  } catch {}
  let credits = 10;
  let completedTasks = [];
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (s != null) credits = JSON.parse(s);
    completedTasks = JSON.parse(localStorage.getItem(LOCAL_TASKS_KEY) || "[]");
  } catch {}
  return { loggedIn: false, isAdmin: false, credits, completedTasks };
}

export async function saveCredits(state, credits, completedTasks) {
  if (state.loggedIn) {
    try { await base44.auth.updateMe({ kcredits: credits, kcredit_tasks: completedTasks }); } catch {}
  } else {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(credits));
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(completedTasks));
    } catch {}
  }
}

// Price per call: base model cost + 1 per attached file + 1 for web search
export function computeCost(model, { fileCount = 0, webSearch = false } = {}) {
  return (model.cost || 1) + fileCount + (webSearch ? 1 : 0);
}