// Where did the user open Search Kaspa from? The store flow sets "store",
// the landing / guest relay sets "landing". Kept in localStorage so a refresh
// keeps the correct exit destination.
const KEY = "sk_came_from_store";

export function markSearchKaspaOrigin(fromStore) {
  try { localStorage.setItem(KEY, fromStore ? "1" : "0"); } catch {}
}

export function searchKaspaFromStore() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}