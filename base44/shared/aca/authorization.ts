import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { fail } from './contracts.ts';
export async function context(req) {
  const sdk = createClientFromRequest(req);
  const user = await sdk.auth.me();
  if (!user) fail('UNAUTHORIZED');
  if (user.role !== 'admin') fail('FORBIDDEN');
  return { sr: sdk.asServiceRole, user };
}
// Bounded lookup: a missing record is an expected domain failure, never INTERNAL_ERROR.
export async function find(sr, entity, id, code) {
  if (typeof id !== 'string' || !id) fail(code);
  const client = sr.entities[entity];
  if (!client) throw new Error('Unknown entity: ' + entity);
  let record = null;
  try { record = await client.get(id); } catch { record = null; }
  if (!record) fail(code);
  return record;
}
export async function scoped(ctx, computerId) {
  if (typeof computerId !== 'string') fail('INVALID_COMPUTER');
  const c = await find(ctx.sr, 'AgentComputer', computerId, 'COMPUTER_NOT_FOUND');
  const agent = await find(ctx.sr, 'EvolveAgent', c.agent_record_id, 'AGENT_UNAVAILABLE');
  if (agent.agent_key !== c.agent_id || agent.experiment_id !== c.experiment_id || agent.status === 'archived') fail('AGENT_UNAVAILABLE');
  return {...ctx, c, agent};
}
export function assertScope(record, c, notFound = 'WORKSPACE_FORBIDDEN') {
  if (!record) fail(notFound);
  if (record.computer_id !== c.id || (record.agent_id && record.agent_id !== c.agent_id)) fail('WORKSPACE_FORBIDDEN');
  return record;
}