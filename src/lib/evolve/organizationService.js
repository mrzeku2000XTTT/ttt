/**
 * OrganizationService — persistent groups with their own treasury, territory,
 * reputation, alliances and enemies.
 */

const NAME_A = ["Meridian", "Cinder", "Halcyon", "Iron", "Solace", "Vantage", "Obsidian", "Lattice", "Pale", "Orbital"];
const NAME_B = ["Compact", "Guild", "Syndicate", "Concord", "Directorate", "Collective", "Bloc", "Assembly", "Trust", "Union"];

let seq = 0;
export const resetOrgSeq = (n = 0) => { seq = n; };

import { orgColor } from "./constants";

export function createOrganization({ rng, name, founderId, day = 0, treasury = 0, members = [] }) {
  seq += 1;
  const id = `ORG_${String(seq).padStart(3, "0")}`;
  const founder = founderId || members[0] || "";
  const initialMembers = members.length ? [...members] : founder ? [founder] : [];
  return {
    id,
    name: name || `${NAME_A[Math.floor(rng() * NAME_A.length)]} ${NAME_B[Math.floor(rng() * NAME_B.length)]}`,
    color: orgColor(id),
    slot: 0, // assigned by WorldEngine.registerOrg
    founder_id: founder,
    members: initialMembers,
    treasury: Number(treasury.toFixed(2)),
    resources: { compute: 0, energy: 0, storage: 0, data: 0, information: 0, materials: 0 },
    territory: 0,
    jobs_completed: 0,
    reputation: 50,
    alliances: [],
    enemies: [],
    founded_day: day,
  };
}

export function joinOrganization(org, agent) {
  if (org.members.includes(agent.id)) return { ok: false, reason: "Already a member" };
  org.members.push(agent.id);
  agent.organization_id = org.id;
  return { ok: true };
}

export function leaveOrganization(org, agent) {
  org.members = org.members.filter((m) => m !== agent.id);
  agent.organization_id = "";
  return { ok: true };
}

export function contribute(org, agent, amount) {
  if (agent.balance < amount) return { ok: false, reason: "Insufficient balance" };
  agent.balance = Number((agent.balance - amount).toFixed(2));
  org.treasury = Number((org.treasury + amount).toFixed(2));
  org.reputation = Math.min(100, org.reputation + 1);
  return { ok: true, amount };
}

export function ally(a, b) {
  if (!a.alliances.includes(b.id)) a.alliances.push(b.id);
  if (!b.alliances.includes(a.id)) b.alliances.push(a.id);
  a.enemies = a.enemies.filter((e) => e !== b.id);
  b.enemies = b.enemies.filter((e) => e !== a.id);
  return { ok: true };
}

export function declareRivalry(a, b) {
  if (!a.enemies.includes(b.id)) a.enemies.push(b.id);
  if (!b.enemies.includes(a.id)) b.enemies.push(a.id);
  a.alliances = a.alliances.filter((e) => e !== b.id);
  b.alliances = b.alliances.filter((e) => e !== a.id);
  return { ok: true };
}

/** Contracts are how orgs pay their own members for completed work. */
export function contract(org, agent, amount) {
  if (org.treasury < amount) return { ok: false, reason: "Organization treasury is short" };
  org.treasury = Number((org.treasury - amount).toFixed(2));
  agent.balance = Number((agent.balance + amount).toFixed(2));
  agent.lifetime_earnings = Number((agent.lifetime_earnings + amount).toFixed(2));
  return { ok: true, amount };
}

export function organizationStanding(org, agents) {
  const members = agents.filter((a) => org.members.includes(a.id));
  const wealth = members.reduce((s, a) => s + a.balance, 0);
  return {
    memberCount: members.length,
    wealth: Number(wealth.toFixed(2)),
    standing: Number((org.reputation + Math.log10(1 + wealth) * 4).toFixed(2)),
  };
}