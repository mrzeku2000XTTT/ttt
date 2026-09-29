/**
 * PlayerService — human player actors in the persistent AI world.
 *
 * Players share the same economic system as AI agents but:
 *  - do NOT reproduce or mutate (evolution is AI-only)
 *  - are directly controlled by the human, not by the decision policy
 *  - persist per user (returning player = same actor)
 *  - start INDEPENDENT with no faction, no territory, no infrastructure
 *
 * The engine treats players and agents uniformly for trade, jobs, orgs and
 * contracts — they are all "actors" in the same economy.
 */

let playerSeq = 0;
export const resetPlayerSeq = (n = 0) => {
  playerSeq = n;
};

export function createPlayer({
  userId,
  experimentId,
  country,
  position,
  wallet,
  balance = 15,
  name = "Player",
  day = 0,
}) {
  playerSeq += 1;
  const id = `PLR_${String(playerSeq).padStart(4, "0")}`;
  const code = `P#${String(playerSeq).padStart(3, "0")}`;
  return {
    id,
    code,
    name,
    user_id: userId,
    experiment_id: experimentId || "",
    country: country || "",
    generation: 0,
    faction: "neutral",
    organization_id: "",
    wallet_id: wallet?.walletId || "",
    address: wallet?.address || "",
    balance: Number(balance.toFixed(2)),
    lifetime_earnings: Number(balance.toFixed(2)),
    lifetime_expenses: 0,
    jobs_completed: 0,
    jobs_failed: 0,
    reputation: 50,
    status: "idle",
    current_job_id: "",
    position: position || { x: 0, y: 0 },
    assets: { compute: 0, energy: 0, servers: 0, information: 0 },
    age_days: 0,
    born_day: day,
    is_player: true,
    decisions: [],
    notifications: [],
  };
}

/** Starting resources are deliberately small — the player needs the economy. */
export const PLAYER_START = {
  balance: 15,
  compute: 3,
  energy: 3,
  storage: 2,
};

export function applyStartingInventory(player) {
  player.assets.compute = PLAYER_START.compute;
  player.assets.energy = PLAYER_START.energy;
  player.assets.storage = PLAYER_START.storage;
  return player;
}

/** Notify the player of a relevant event (not every world event). */
export function notifyPlayer(player, notification) {
  if (!player.notifications) player.notifications = [];
  player.notifications.unshift({
    id: `${player.id}-${Date.now()}-${player.notifications.length}`,
    ...notification,
    day: player.born_day,
    read: false,
  });
  if (player.notifications.length > 30) player.notifications.length = 30;
}

export function markNotificationsRead(player) {
  if (!player.notifications) return;
  player.notifications.forEach((n) => {
    n.read = true;
  });
}

/** Economic reputation — based on reliability, not morality. */
export function adjustReputation(player, delta) {
  player.reputation = Math.max(0, Math.min(100, Number((player.reputation + delta).toFixed(1))));
}

/** A player is insolvent when balance goes deeply negative. They can recover. */
export function checkInsolvency(player) {
  if (player.balance < -5 && player.status !== "insolvent") {
    player.status = "insolvent";
    return true;
  }
  if (player.balance >= 0 && player.status === "insolvent") {
    player.status = "idle";
    return false;
  }
  return player.status === "insolvent";
}