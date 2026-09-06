import { base44 } from '@/api/base44Client';

// Second-pass accuracy edit: verifies a generated explainer script BEFORE the
// user sees anything. When the video retells pasted SOURCE content (an X post,
// an article), that source is the absolute ground truth — this pass fixes
// factual slips, it never rewrites the topic. Without a source, it verifies a
// how-to script's steps against live web research.
export async function factCheckExplainer({ topic, title, scenes, source }) {
  const listing = (scenes || [])
    .map((s, i) => `Scene ${i + 1} — action: ${s.action}\nvoiceover: ${s.voiceover}`)
    .join('\n\n');

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a strict accuracy editor for explainer videos. Topic: "${topic}".
${source ? `\nThis script retells the following SOURCE CONTENT, which is the absolute ground truth for its topic, facts and claims:\n"""${String(source).slice(0, 4000)}"""\n` : ''}
Here is the draft script:

${listing}

${source
  ? `SOURCE-GROUNDED MODE — the script must retell the SOURCE CONTENT 1:1:
- The topic NEVER changes. The script stays about exactly what the source is about. Anything you find on the web — including tools, coins or projects with SIMILAR NAMES — never replaces or expands the subject. The source wins over the web, always.
- Verify each scene against the source: anything the script claims that the source does not say gets fixed; anything central to the source that the script misses gets woven into the matching scene. Keep EXACTLY the same number of scenes, in the same order — never cut, merge or add scenes.
- A narrative source (a post, build update, story, report) STAYS a narrative — never rewrite it into a how-to tutorial with steps, buttons or commands.
- Use live web research ONLY to double-check concrete facts the script states (dates, numbers, names). If the web seems to contradict the source, the source wins. If a detail is not in the source and cannot be verified, remove it rather than guess.`
  : `Verify the script's claims with live web research. If the script is genuinely a how-to/tutorial, correct the steps so they ACTUALLY work for real: exact chronological order, real URLs, real commands, real requirements — no invented ones; if you cannot verify a detail, remove it rather than guess. If the script is narrative/explainer content instead, keep its topic and structure — only fix factual errors and vague or wrong claims; do not turn it into a tutorial.`}

Editing rules (both modes):
- Each voiceover stays 2–4 spoken sentences and 25–45 words — never shorten one below its draft length; each caption max 8 words and never empty; each action describes ONLY what is visually seen — move commands, URLs, code or step text out of the action and into the voiceover.
- Preserve each scene's "style", "app" and "camera" fields EXACTLY as given — copy them through unchanged.

Return EXACTLY the same number of scenes as the draft, in the same order — never cut, merge or add scenes; correct each scene in place. Also return a one-sentence "note" naming the most important fix you made.`,
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
              style: { type: 'string' },
              app: { type: 'string' },
              caption: { type: 'string' },
              voiceover: { type: 'string' },
              camera: { type: 'string' }
            }
          }
        }
      }
    }
  });

  const checked = Array.isArray(res.scenes) && res.scenes.length ? res.scenes : scenes;
  // Carry per-scene style/app/camera through when the model left them out
  const original = scenes || [];
  const merged = checked.map((s, i) => {
    const o = checked.length === original.length ? original[i] || {} : {};
    return { ...o, ...s, style: s.style || o.style, app: s.app || o.app, camera: s.camera || o.camera };
  });
  return { scenes: merged, note: res.note || '' };
}