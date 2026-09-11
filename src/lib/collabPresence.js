import { base44 } from "@/api/base44Client";

// Upsert a presence heartbeat for the given wallet.
export async function heartbeatPresence(walletAddress, displayName) {
  if (!walletAddress) return;
  const now = new Date().toISOString();
  try {
    const existing = await base44.entities.CollabPresence.filter({ wallet_address: walletAddress });
    if (existing.length > 0) {
      await base44.entities.CollabPresence.update(existing[0].id, {
        last_heartbeat: now,
        display_name: displayName || existing[0].display_name || "",
      });
    } else {
      await base44.entities.CollabPresence.create({
        wallet_address: walletAddress,
        display_name: displayName || "",
        last_heartbeat: now,
      });
    }
  } catch (e) {
    /* presence is best-effort — never block the UI */
  }
}

// Fetch all collaborators tagged live (<60s), recent (<5m), or offline.
export async function fetchOnlineCollaborators() {
  const all = await base44.entities.CollabPresence.list("-last_heartbeat", 200);
  const now = Date.now();
  return all
    .map((p) => {
      const age = now - new Date(p.last_heartbeat).getTime();
      return { ...p, status: age < 60000 ? "live" : age < 300000 ? "recent" : "offline" };
    })
    .sort((a, b) => {
      const order = { live: 0, recent: 1, offline: 2 };
      return order[a.status] - order[b.status];
    });
}