import { creditOperation, text, publicImageUrls } from '../../shared/creditOperation.ts';

export default async function(req) {
  return creditOperation(req, async (base44, input) => {
    const [photo] = publicImageUrls([input.photo], 1);
    const prefs = text(input.preferences, 'Dietary preferences', 1000, true) || 'none';
    return await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Look at this fridge/pantry photo. Identify the ingredients visible. Then suggest 3 realistic recipes the person can cook RIGHT NOW with what's visible, and a short shopping list of 2-4 missing items that would unlock more meals. Dietary preferences: ${prefs}. Respond as JSON: { "can_cook": [{ "name": string, "time": string, "steps": string[] }], "missing": string[] }. Keep recipe names short. Steps max 5 each, one sentence.`,
      file_urls: [photo],
      response_json_schema: { type: 'object', properties: { can_cook: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, time: { type: 'string' }, steps: { type: 'array', items: { type: 'string' } } } } }, missing: { type: 'array', items: { type: 'string' } } } }
    });
  });
}