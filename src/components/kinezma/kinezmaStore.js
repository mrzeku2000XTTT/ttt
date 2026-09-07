// kinezmaStore.js — IndexedDB persistence for Kinezma projects.
// Scenes + cutout data URLs are far too large for entity fields, so the
// library lives in the browser's IndexedDB and survives refreshes.

const DB_NAME = "kinezma";
const STORE = "projects";
const ACTIVE_KEY = "kinezma_active_id";

const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const store = (db, mode) => db.transaction(STORE, mode).objectStore(STORE);

export const genProjectId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const setActiveId = (id) => {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {}
};

export const getActiveId = () => {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
};

export async function saveProject(project) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = store(db, "readwrite").put(project);
      req.onsuccess = () => resolve(project);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function getProject(id) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = store(db, "readonly").get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function listProjects() {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = store(db, "readonly").getAll();
      req.onsuccess = () =>
        resolve(
          (req.result || [])
            .map((p) => ({
              id: p.id,
              name: p.name,
              componentCount: (p.scene?.components || []).length,
              hasMotion: !!(p.motion?.tracks?.length),
              savedAt: p.savedAt || 0,
            }))
            .sort((a, b) => b.savedAt - a.savedAt)
        );
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function deleteProject(id) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = store(db, "readwrite").delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}