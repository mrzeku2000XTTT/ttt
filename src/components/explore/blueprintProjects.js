// Blueprint project persistence — localStorage-backed so sites survive refresh.
// Each project stores: pages, landingHtml, landingMode, currentPageId, name, concept, idea.

const STORAGE_KEY = 'blueprint_projects_v1';
const ACTIVE_KEY = 'blueprint_active_project_v1';

function safeParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function listProjects() {
  if (typeof window === 'undefined') return [];
  const all = safeParse(window.localStorage.getItem(STORAGE_KEY), []);
  return Array.isArray(all)
    ? all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    : [];
}

export function getProject(id) {
  if (!id || typeof window === 'undefined') return null;
  const all = listProjects();
  return all.find(p => p.id === id) || null;
}

export function saveProject(project) {
  if (typeof window === 'undefined') return null;
  const all = listProjects();
  const idx = all.findIndex(p => p.id === project.id);
  const record = {
    ...project,
    updatedAt: Date.now(),
  };
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.unshift(record);
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.localStorage.setItem(ACTIVE_KEY, project.id);
  } catch (e) {
    // storage full — drop oldest until it fits
    while (all.length > 1) {
      all.pop();
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        window.localStorage.setItem(ACTIVE_KEY, project.id);
        return record;
      } catch {}
    }
  }
  return record;
}

export function deleteProject(id) {
  if (typeof window === 'undefined') return;
  const all = listProjects().filter(p => p.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  const active = window.localStorage.getItem(ACTIVE_KEY);
  if (active === id) {
    window.localStorage.removeItem(ACTIVE_KEY);
  }
}

export function getActiveProjectId() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProjectId(id) {
  if (typeof window === 'undefined') return;
  if (id) window.localStorage.setItem(ACTIVE_KEY, id);
  else window.localStorage.removeItem(ACTIVE_KEY);
}

export function genProjectId() {
  return 'bp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function deriveProjectName(concept, idea) {
  if (concept?.name) return concept.name;
  if (idea) return idea.slice(0, 48);
  return 'Untitled site';
}