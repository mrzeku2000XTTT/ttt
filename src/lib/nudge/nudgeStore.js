// Everything NUDGE keeps lives in this browser and nowhere else.
// No entity, no backend function, no upload — just localStorage under one key.

const KEY = "ttt_nudge_v1";

const EMPTY = { briefs: [], activeId: null };

export function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!parsed || !Array.isArray(parsed.briefs)) return { ...EMPTY };
    return {
      briefs: parsed.briefs.filter((b) => b && b.id && Array.isArray(b.notifications)),
      activeId: parsed.activeId ?? parsed.briefs[0]?.id ?? null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveStore(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked — the app keeps working for this session.
  }
}

export function makeId() {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** One brief as plain text, so it can leave the browser by the user's own hand. */
export function briefToText(brief) {
  if (!brief) return "";
  const lines = [`${brief.headline}  ·  ${brief.dateLabel}`];
  brief.notifications.forEach((n) => {
    lines.push("");
    lines.push(`${n.time} — ${n.title}`);
    lines.push(n.body);
    if (n.detail) lines.push(n.detail);
  });
  return lines.join("\n");
}