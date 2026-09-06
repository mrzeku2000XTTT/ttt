// promptoEnhance.js — Prompto-inline for NICHE Studio.
// Expands a short user input into a richly detailed animation director's brief,
// consistent with the exact topic and any pasted reference/URL. The enhanced
// brief replaces the raw input before the NICHE director builds the video.
// Returns '' on failure so the caller can fall back to the original text.

import { base44 } from '@/api/base44Client';

export async function enhanceAnimationPrompt({ text, linkContext = '', attachmentUrls = [] }) {
  const r = await base44.integrations.Core.InvokeLLM({
    prompt: `You are PROMPTO for NICHE Studio — an elite animation director and prompt engineer. Take the user's short input and expand it into a richly detailed animation brief for an explainer video.

HARD RULES:
- Preserve the EXACT topic the user gave. Do not change what the video is about. Do not swap in a different niche or subject.
- If the user pasted a link, the brief must be about that link's actual content (provided below) — never the URL or account name.
- The brief is for ANIMATION specifically: visual style direction (which animation technique fits and why), scene-by-scene pacing, on-screen caption ideas, narration tone, motion/camera direction, and a strong opening hook.
- Write it as a director's brief, 120–220 words, vivid and specific. No code blocks, no headings — just the brief prose.
- Return ONLY the brief text, nothing else.

User input: """${text}"""
${linkContext ? `Pasted reference/URL content (the video MUST be about THIS):\n"""${linkContext.slice(0, 1500)}"""` : ''}
${attachmentUrls.length ? `The user attached ${attachmentUrls.length} reference file(s) — look at them and honor their visual style and content in the brief.` : ''}`,
    add_context_from_internet: false,
    file_urls: attachmentUrls.length ? attachmentUrls : undefined,
  });
  const out = typeof r === 'string' ? r : r?.text || r?.reply || r?.content || '';
  return String(out || '').trim();
}