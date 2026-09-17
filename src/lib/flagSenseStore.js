// FlagSense local store — progress, reflection answers, and onboarding,
// kept on-device (the app is private and personal by design).

import { AXES, DAILY_LESSONS } from "@/lib/flagSenseData";

const KEY = "flagsense_state_v1";

const DEFAULT = {
  onboarded: false,
  goal: null,          // 'partner' | 'myself' | 'communication' | 'healthier' | 'curious'
  who: null,           // 'me' | 'relationship' | 'both'
  interests: [],        // category ids to prioritize
  answers: {},          // scenarioId -> 'green' | 'yellow' | 'red'
  reflect: {},          // scenarioId -> 'green' | 'yellow' | 'red' (self-reflection mode)
  lastLessonDay: null,  // 'YYYY-M-D' of last seen daily lesson
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  return state;
}

export function recordAnswer(state, id, level, mode = "answers") {
  const next = { ...state, [mode]: { ...state[mode], [id]: level } };
  return saveState(next);
}

const SCORES = { green: 100, yellow: 58, red: 18 };

// Per-category stats from answered scenarios.
export function categoryStats(state, mode = "answers") {
  const stats = {};
  for (const [id, level] of Object.entries(state[mode] || {})) {
    const cat = (state.__catById || {})[id];
    if (!cat) continue;
    stats[cat] = stats[cat] || { green: 0, yellow: 0, red: 0, total: 0 };
    stats[cat][level] = (stats[cat][level] || 0) + 1;
    stats[cat].total += 1;
  }
  return stats;
}

export function initCategoryIndex(scenarios) {
  const map = {};
  for (const s of scenarios) map[s.id] = s.category;
  return map;
}

export function attachIndex(state, catById) {
  return { ...state, __catById: catById };
}

// Axis score 0-100, or null when nothing answered on that axis yet.
export function axisScores(state, mode = "answers") {
  const stats = categoryStats(state, mode);
  return AXES.map((axis) => {
    let sum = 0, n = 0;
    for (const cat of axis.cats) {
      const s = stats[cat];
      if (!s || !s.total) continue;
      sum += ((s.green * SCORES.green + s.yellow * SCORES.yellow + s.red * SCORES.red) / s.total);
      n += 1;
    }
    return { id: axis.id, label: axis.label, value: n ? Math.round(sum / n) : null, answered: n };
  });
}

// The lowest answered axis = this week's biggest opportunity.
export function biggestOpportunity(scores) {
  const answered = scores.filter((s) => s.value != null);
  if (!answered.length) return null;
  return answered.reduce((low, s) => (s.value < low.value ? s : low), answered[0]);
}

// Personalized feed: interest categories first, then everything else.
// Skips scenarios already answered in the given mode.
export function buildFeed(scenarios, state, mode = "answers", count = 5) {
  const answered = state[mode] || {};
  const interests = new Set(state.interests || []);
  const pool = scenarios.filter((s) => !answered[s.id]);
  const priority = pool.filter((s) => interests.has(s.category));
  const rest = pool.filter((s) => !interests.has(s.category));
  return [...shuffle(priority), ...shuffle(rest)].slice(0, count);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deterministic daily lesson based on the date.
export function todayLesson() {
  const d = new Date();
  const idx = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % DAILY_LESSONS.length;
  return DAILY_LESSONS[idx % DAILY_LESSONS.length];
}