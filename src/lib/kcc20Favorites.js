// Per-user KCC20 token favorites, persisted in localStorage as a set of ticks.
// One-click add/remove from the Search Crypto KCC20 browser.

const KEY = "kcc20_favorites_v1";

export function getFavorites() {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(JSON.parse(raw || "[]"));
  } catch {
    return new Set();
  }
}

export function saveFavorites(set) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch { /* storage may be unavailable in some iframes */ }
}

export function toggleFavorite(tick) {
  const T = String(tick || "").toUpperCase();
  const s = getFavorites();
  if (s.has(T)) s.delete(T);
  else s.add(T);
  saveFavorites(s);
  return s; // returns the new set
}

export function isFavorite(tick) {
  return getFavorites().has(String(tick || "").toUpperCase());
}