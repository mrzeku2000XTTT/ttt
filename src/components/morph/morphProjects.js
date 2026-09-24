// Projects + version history for Morph, kept in localStorage.
// One store object holds every project; each project carries its own scene and
// a capped list of history snapshots. Pure functions — the studio owns the state.

const KEY = 'morph_projects_v1';
const HISTORY_LIMIT = 12;

export const newId = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 8)}`;

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};

export function persist(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage full or unavailable — the session still works in memory */
  }
}

/** Load the store, seeding the first project from the scene already on disk. */
export function loadStore(fallbackScene) {
  const raw = read();
  if (raw?.projects?.length && raw.activeId) return raw;
  const project = {
    id: newId('P'),
    name: fallbackScene?.name || 'Untitled project',
    updated: Date.now(),
    scene: fallbackScene,
    history: [],
  };
  return { activeId: project.id, projects: [project] };
}

export const activeProject = (store) =>
  store.projects.find((p) => p.id === store.activeId) || store.projects[0];

export function updateActiveScene(store, scene) {
  return {
    ...store,
    projects: store.projects.map((p) => (p.id === store.activeId ? { ...p, scene, updated: Date.now() } : p)),
  };
}

export function activate(store, id) {
  return store.projects.some((p) => p.id === id) ? { ...store, activeId: id } : store;
}

export function createProject(store, name, scene) {
  const project = {
    id: newId('P'),
    name: (name || '').trim() || 'Untitled project',
    updated: Date.now(),
    scene,
    history: [],
  };
  return { store: { activeId: project.id, projects: [project, ...store.projects] }, project };
}

export function deleteProject(store, id) {
  if (store.projects.length <= 1) return store;
  const projects = store.projects.filter((p) => p.id !== id);
  return { activeId: store.activeId === id ? projects[0].id : store.activeId, projects };
}

/** Snapshot the active project's current scene. */
export function pushHistory(store, label, scene) {
  const snap = { id: newId('H'), t: Date.now(), label, scene };
  return {
    ...store,
    projects: store.projects.map((p) =>
      p.id === store.activeId
        ? { ...p, history: [snap, ...(p.history || [])].slice(0, HISTORY_LIMIT) }
        : p,
    ),
  };
}

/** The scene stored in a history entry, or null if it is gone. */
export function restoreVersion(store, entryId) {
  const entry = (activeProject(store).history || []).find((h) => h.id === entryId);
  return entry ? entry.scene : null;
}