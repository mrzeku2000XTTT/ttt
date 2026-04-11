// KaChing fixed 15-minute round clock (synced to UTC wall clock)
// Rounds start at :00, :15, :30, :45 of every hour UTC

const ROUND_MS = 15 * 60 * 1000; // 15 minutes in ms

/**
 * Get the end time of the current 15-minute round (UTC-aligned)
 * e.g., if now is 14:07 UTC → current round ends at 14:15 UTC
 */
export function getCurrentRoundEnd() {
  const now = Date.now();
  return new Date(Math.ceil(now / ROUND_MS) * ROUND_MS);
}

/**
 * Get the start time of the current 15-minute round
 * e.g., if now is 14:07 UTC → current round started at 14:00 UTC
 */
export function getCurrentRoundStart() {
  const now = Date.now();
  return new Date(Math.floor(now / ROUND_MS) * ROUND_MS);
}

/**
 * Get remaining milliseconds in the current round
 */
export function getRemainingMs() {
  return Math.max(0, getCurrentRoundEnd().getTime() - Date.now());
}

/**
 * Get the round end time as ISO string (for backend use)
 */
export function getCurrentRoundEndISO() {
  return getCurrentRoundEnd().toISOString();
}

export function getCurrentRoundStartISO() {
  return getCurrentRoundStart().toISOString();
}

export { ROUND_MS };