import { base44 } from '@/api/base44Client';

// Second-pass fact-check: verifies a generated explainer script against live
// web sources and returns corrected scenes BEFORE the user sees anything.
export async function factCheckExplainer({ topic, title, scenes }) {
  const listing = (scenes || [])
    .map((s, i) => `Scene ${i + 1} — action: ${s.action}\nvoiceover: ${s.voiceover}`)
    .join('\n\n');

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a strict technical fact-checker for explainer videos. Topic: "${topic}". Here is the draft script:

${listing}

Research the topic live on the web and verify every technical claim. Then correct the script so it ACTUALLY teaches the viewer how to do the thing for real:
- Exact steps in chronological order: which website to open, which buttons or menus to click, which commands to run.
- Real URLs, real command lines, real requirements (RAM, disk, versions) — no invented ones. If you cannot verify a detail, remove it rather than guess.
- Each voiceover stays 2–4 spoken sentences; each caption stays max 8 words; each action stays one clear stick-figure visual moment.
- Fix or cut anything vague, generic, or wrong.

Return the corrected scenes (same count or fewer if a scene had to be cut) and a one-sentence "note" naming the most important fix you made.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        note: { type: 'string' },
        scenes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              caption: { type: 'string' },
              voiceover: { type: 'string' }
            }
          }
        }
      }
    }
  });

  const checked = Array.isArray(res.scenes) && res.scenes.length ? res.scenes : scenes;
  return { scenes: checked, note: res.note || '' };
}