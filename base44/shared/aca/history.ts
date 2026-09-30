import { assertScope } from './authorization.ts';
import { fail } from './contracts.ts';
export async function history(ctx, sessionId, beforeSequence) {
  const session = assertScope(await ctx.sr.entities.AgentComputerSession.get(sessionId),ctx.c);
  const query = {computer_id:ctx.c.id,session_id:session.id};
  if (beforeSequence != null) query.sequence = {$lt:Number(beforeSequence)};
  const rows = await ctx.sr.entities.ACAActionEvent.filter(query,'-sequence',200);
  const checkpoints = await ctx.sr.entities.ACASessionCheckpoint.filter({computer_id:ctx.c.id,session_id:session.id},'sequence',200);
  return {session,events:rows.reverse(),checkpoints,hasMore:rows.length === 200};
}