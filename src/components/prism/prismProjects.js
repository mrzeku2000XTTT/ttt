/**
 * PRISM project store.
 *
 * An analysis is expensive to produce, so it is kept in this browser and comes
 * back after a refresh. A local file cannot be re-opened after a reload — its
 * object URL dies with the tab — so the measurements, thumbnails and read are
 * what we keep, plus the link itself when the source was a remote URL.
 */

const KEY = 'prism_projects_v1';
const MAX = 6;

const keyOf = (name, duration, bytes) => `${name || 'video'}|${Math.round(duration || 0)}|${bytes || 0}`;

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const write = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
};

/** Lightweight list for the picker — no payloads. */
export function listProjects() {
  return read().map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    savedAt: p.savedAt,
    duration: p.facts?.duration || 0,
    hasRead: !!p.report,
  }));
}

export function loadProject(id) {
  return read().find((p) => p.id === id) || null;
}

export function deleteProject(id) {
  write(read().filter((p) => p.id !== id));
}

export function clearProjects() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to do
  }
}

/**
 * Saves (or updates) a project. If the browser's storage is full the thumbnails
 * are dropped rather than losing the analysis itself.
 */
export function saveProject(project) {
  const id = keyOf(project.name, project.facts?.duration, project.bytes);
  const entry = { ...project, id, savedAt: new Date().toISOString() };

  const rest = read().filter((p) => p.id !== id);
  const full = [entry, ...rest].slice(0, MAX);
  if (write(full)) return entry;

  const lean = full.map((p) => (p.id === id ? { ...p, sheet: [] } : { ...p, sheet: [] }));
  if (write(lean)) return { ...entry, sheet: [] };

  if (write([{ ...entry, sheet: [] }])) return { ...entry, sheet: [] };
  return entry;
}