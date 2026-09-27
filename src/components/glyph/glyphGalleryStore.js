// GLYPH — the gallery, kept on the device.
//
// A piece is stored as the render itself plus the settings that made it, so a
// refresh brings the shelf back exactly as it was and any piece can be opened
// in the studio again. Each user gets their own shelf, keyed by wallet.

const LIMIT = 30;

// Storage can be full or switched off; when it is, the shelf still works for
// the session rather than throwing.
const memory = {};

const shelfKey = (owner) => `glyph_gallery_v2::${owner || 'guest'}`;
const seededKey = (owner) => `glyph_gallery_seeded_v2::${owner || 'guest'}`;

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

/** The settings that make a piece unique — used to avoid keeping it twice. */
export function signature(work) {
  return `${work.style}|${work.palette}|${work.seed}`;
}

export function readGallery(owner) {
  const stored = read(shelfKey(owner));
  if (Array.isArray(stored)) return stored;
  return memory[owner || 'guest'] || [];
}

function persist(owner, works) {
  memory[owner || 'guest'] = works;
  if (write(shelfKey(owner), works)) return works;
  // Out of room: keep the newest half rather than losing the shelf entirely.
  const trimmed = works.slice(0, Math.max(4, Math.floor(LIMIT / 2)));
  memory[owner || 'guest'] = trimmed;
  write(shelfKey(owner), trimmed);
  return trimmed;
}

/** Newest first, no duplicates, bounded — a shelf, not an archive. */
export function addWorks(owner, incoming) {
  const current = readGallery(owner);
  const seen = new Set(current.map(signature));
  const fresh = [];
  for (const w of incoming || []) {
    if (!w || !w.url) continue;
    const sig = signature(w);
    // no piece twice, whether it was already on the shelf or arrives in this batch
    if (seen.has(sig)) continue;
    seen.add(sig);
    fresh.push(w);
  }
  return persist(owner, [...fresh, ...current].slice(0, LIMIT));
}

export function removeWork(owner, id) {
  return persist(owner, readGallery(owner).filter((w) => w.id !== id));
}

export function isSeeded(owner) {
  return read(seededKey(owner)) === true;
}

export function markSeeded(owner) {
  write(seededKey(owner), true);
}