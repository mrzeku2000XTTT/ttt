import { creditOperation, text, choice } from '../../shared/creditOperation.ts';

export default async function(req) {
  return creditOperation(req, async (base44, input) => {
    const gist = text(input.gist, 'Message gist', 5000);
    const to = text(input.to, 'Recipient description', 300, true) || 'general';
    const tone = choice(input.tone, ['friendly', 'formal', 'firm', 'apologetic'], 'tone');
    return await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Write this message 3 ways. The gist: "${gist}". Recipient: ${to}. Primary tone: ${tone}. Respond as JSON: { "versions": [{ "tone": string, "subject": string, "message": string }] }. First version uses the primary tone; the other two use different sensible tones. Messages are short, natural and ready to send — email-style with a subject. No placeholders.`,
      response_json_schema: { type: 'object', properties: { versions: { type: 'array', items: { type: 'object', properties: { tone: { type: 'string' }, subject: { type: 'string' }, message: { type: 'string' } } } } } }
    });
  });
}