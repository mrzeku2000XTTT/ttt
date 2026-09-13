import { base44 } from '@/api/base44Client';

const ideaSchema = {
  type: 'object',
  properties: { title: { type: 'string' }, hook: { type: 'string' }, video_prompt: { type: 'string' } },
  required: ['title', 'hook', 'video_prompt']
};

function canonicalYouTubeUrl(value) {
  const raw = String(value || '').trim();
  const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');
  let id = host === 'youtu.be' ? parsed.pathname.split('/')[1] : parsed.searchParams.get('v');
  if (!id) id = parsed.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/)?.[1];
  if (!/^[\w-]{11}$/.test(id || '')) throw new Error('Paste a valid YouTube video, Short, live replay, or share link.');
  return `https://www.youtube.com/watch?v=${id}`;
}

export async function analyzeYouTubeStyle(value) {
  const url = canonicalYouTubeUrl(value);
  const response = await base44.functions.invoke('analyzeYouTubeForMotion', { url, focus_hint: 'Study animation grammar, pacing, transitions, easing, story beats, hook, escalation, payoff, and retention pattern.' });
  const motion = response?.data || response;
  if (motion?.error) throw new Error(motion.error);
  const learned = await base44.integrations.Core.InvokeLLM({
    prompt: `Turn this motion analysis into a reusable ORIGINAL animation language and story blueprint. Do not copy names, characters, dialogue, branding, or subject matter from the source. Analysis: ${JSON.stringify(motion).slice(0, 12000)}. Produce a memorable style name, a precise visual/motion prompt, a concise story structure, and 3 distinct viral video ideas with strong hooks and complete generation prompts.`,
    response_json_schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, story_structure: { type: 'string' }, ideas: { type: 'array', items: ideaSchema } }, required: ['name', 'description', 'story_structure', 'ideas'] }
  });
  let style = { id: `style-${Date.now()}`, name: learned.name, description: `${learned.description}\n\nStory blueprint: ${learned.story_structure}` };
  try {
    const me = await base44.auth.me();
    if (me?.email) {
      const saved = await base44.entities.NicheStyle.create({ user_email: me.email, name: style.name, description: style.description, source: 'video' });
      style = { id: saved.id, name: saved.name, description: saved.description };
    }
  } catch {}
  return { style, sourceTitle: motion.title || 'YouTube reference', summary: motion.style_summary || learned.description, storyStructure: learned.story_structure, ideas: learned.ideas.slice(0, 3) };
}