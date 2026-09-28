// The studio's work is kept in the browser, so a refresh never loses a scene.
// One project is saved automatically as you go, and named snapshots are kept in
// a short history you can reopen at any time.

const CURRENT_KEY = "talkstick.project.v1";
const HISTORY_KEY = "talkstick.projects.v1";
const PENDING_KEY = "talkstick.pending-character";
const HISTORY_LIMIT = 12;

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // Storage can be full or blocked; the session still works, it just will not
    // be there next time.
    return false;
  }
}

export const loadCurrent = () => read(CURRENT_KEY, null);
export const saveCurrent = (project) => write(CURRENT_KEY, project);

export const listHistory = () => read(HISTORY_KEY, []);

/** Saves a named snapshot, replacing any earlier one with the same name. */
export function saveHistory(name, project) {
  const label = name.trim() || "Untitled scene";
  const entry = {
    id: `${Date.now()}`,
    name: label,
    savedAt: new Date().toISOString(),
    project,
  };
  const next = [entry, ...listHistory().filter((item) => item.name !== label)].slice(0, HISTORY_LIMIT);
  write(HISTORY_KEY, next);
  return next;
}

export function deleteHistory(id) {
  const next = listHistory().filter((item) => item.id !== id);
  write(HISTORY_KEY, next);
  return next;
}

// The landing page hands the artwork it was dropped to the studio through here.
export function stashPendingCharacter(url) {
  try {
    window.sessionStorage.setItem(PENDING_KEY, url);
  } catch (error) {
    /* nothing to do — the studio simply opens empty */
  }
}

export function takePendingCharacter() {
  try {
    const url = window.sessionStorage.getItem(PENDING_KEY);
    if (url) window.sessionStorage.removeItem(PENDING_KEY);
    return url;
  } catch (error) {
    return null;
  }
}