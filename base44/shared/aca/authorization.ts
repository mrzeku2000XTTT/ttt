import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { fail } from './contracts.ts';
export async function context(req) {
  const sdk = createClientFromRequest(req);
  const user = await sdk.auth.me();
  if (!user) fail('UNAUTHORIZED');
  if (user.role !== 'admin') fail('FORBIDDEN');
  return { sr: sdk.asServiceRole, user };
}
export async function scoped(ctx, computerId) {
  if (typeof computerId !== 'string') fail('INVALID_COMPUTER');
  const c = await ctx.sr.entities.AgentComputer.get(computerId);
  if (!c) fail('COMPUTER_NOT_FOUND');
  const agent = await ctx.sr.entities.EvolveAgent.get(c.agent_record_id);
  if (!agent || agent.agent_key !== c.agent_id || agent.experiment_id !== c.experiment_id || agent.status === 'archived') fail('AGENT_UNAVAILABLE');
  return {...ctx, c, agent};
}
export function assertScope(record, c) {
  if (!record || record.computer_id !== c.id || (record.agent_id && record.agent_id !== c.agent_id)) fail('WORKSPACE_FORBIDDEN');
  return record;
}