// frameMimicStore.js — IndexedDB persistence for FrameMimic projects.
// Frames hold full HTML + image data — far too large for entity fields — so the
// library lives in the browser's IndexedDB and survives refreshes.

const DB_NAME = "framemimic";
const STORE = "projects";

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
              videoName: p.videoName,
              fps: p.fps,
              meta: p.meta,
              frameCount: (p.frames || []).length,
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