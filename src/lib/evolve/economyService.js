import { OPERATING_COSTS } from "./agentEngine";
import { RESOURCES } from "./constants";

/**
 * EconomyService — the simulated resource economy and every cost an agent pays.
 * Resources live in WorldEngine state; test KAS is the only settlement currency.
 */

export const resourceLabel = (id) => (RESOURCES.find((r) => r.id === id) || { label: id }).label;

/** Price moves against how much of a resource is in the world pool. */
export function priceOf(world, id) {
  const base = world.market[id] ?? 1;
  const pool = world.resources[id] ?? 0;
  const pressure = 1 + Math.max(-0.35, Math.min(0.6, (300 - pool) / 900));
  return Number((base * pressure).toFixed(3));
}

export function marketSnapshot(world) {
  return RESOURCES.map((r) => ({
    id: r.id,
    label: r.label,
    color: r.color,
    price: priceOf(world, r.id),
    pool: Number((world.resources[r.id] || 0).toFixed(1)),
  }));
}

export function buy(world, id, qty) {
  const price = priceOf(world, id);
  const cost = Number((price * qty).toFixed(2));
  if (!world.pay({ [id]: qty })) return { ok: false, reason: "World pool is short on that resource" };
  return { ok: true, cost, qty, price };
}

export function sell(world, id, qty) {
  const price = priceOf(world, id);
  const credit = Number((price * qty).toFixed(2));
  world.credit({ [id]: qty });
  return { ok: true, credit, qty, price };
}

/** An agent's running costs, charged against its test-KAS balance. */
export function charge(agent, kinds, multiplier = 1) {
  const total = kinds.reduce((s, k) => s + (OPERATING_COSTS[k] || 0) * multiplier, 0);
  const amount = Number(total.toFixed(3));
  agent.balance = Number((agent.balance - amount).toFixed(3));
  agent.lifetime_expenses = Number((agent.lifetime_expenses + amount).toFixed(3));
  return amount;
}

export function economyTotals(agents) {
  const active = agents.filter((a) => a.status !== "archived");
  const wealth = active.reduce((s, a) => s + a.balance, 0);
  const earned = active.reduce((s, a) => s + a.lifetime_earnings, 0);
  const spent = active.reduce((s, a) => s + a.lifetime_expenses, 0);
  const profitable = active.filter((a) => a.lifetime_earnings > a.lifetime_expenses).length;
  return {
    wealth: Number(wealth.toFixed(2)),
    earned: Number(earned.toFixed(2)),
    spent: Number(spent.toFixed(2)),
    profit: Number((earned - spent).toFixed(2)),
    profitable,
    population: active.length,
    median: active.length ? Number([...active.map((a) => a.balance)].sort((x, y) => x - y)[Math.floor(active.length / 2)].toFixed(2)) : 0,
  };
}