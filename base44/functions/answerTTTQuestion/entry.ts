import { creditOperation, text, conversation } from '../../shared/creditOperation.ts';

export default async function(req) {
  return creditOperation(req, async (base44, input) => {
    const message = text(input.message, 'Message', 4000);
    const history = input.history?.length ? conversation(input.history, ['user', 'assistant'], 6) : [];
    const ctx = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    return await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are TTT A.I. First classify the user's latest message.
mode = "task" ONLY if it asks you to DO something inside an app: send/pay KAS, escrow funds, mint, generate or draw an image, build a site or landing page, make/edit a video, clip a stream, post/broadcast to channels, create a wallet, deploy or run something.
mode = "question" for EVERYTHING else — factual questions, current events, prices, how-tos, definitions, code help, opinions, small talk, follow-ups.
If mode is "question": answer directly using live web knowledge. Be accurate, specific and current — cite concrete numbers, names and dates where relevant. 1-4 sentences. Add "points" only if a short breakdown helps. Never invent transactions.
If mode is "task": return only { "mode": "task" }.
${ctx ? `Conversation so far:\n${ctx}\n` : ''}Latest message: ${JSON.stringify(message)}`,
      add_context_from_internet: true,
      response_json_schema: { type: 'object', properties: { mode: { type: 'string', enum: ['question', 'task'] }, title: { type: 'string' }, answer: { type: 'string' }, points: { type: 'array', items: { type: 'string' } } }, required: ['mode'] }
    });
  });
}