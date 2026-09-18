import { creditOperation, text, choice, invalid } from '../../shared/creditOperation.ts';

export default async function(req) {
  return creditOperation(req, async (base44, input) => {
    const title = text(input.title, 'Title', 300, true);
    const topic = text(input.topic, 'Topic', 12000, true);
    const tone = choice(input.tone, ['conversational', 'technical', 'inspirational', 'funny', 'educational'], 'tone');
    if (!Array.isArray(input.tags) || input.tags.length > 20) throw invalid('Use at most 20 tags.');
    const tags = input.tags.map(t => text(t, 'Tag', 100));
    return await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt: `You are a blog writing assistant inside the TTT app. Write a complete, well-structured blog post in Markdown for an everyday reader.

Title: ${title || '(suggest a fitting title and use it as the H1)'}
Topic / notes: ${topic || title || '(not specified — pick a relevant, interesting angle)'}
Tone: ${tone}
${tags.length ? `Tags: ${tags.join(', ')}` : ''}

Hard requirements:
- Begin with a single "# " H1 title (the post title).
- 250-500 words, scannable, with 2-4 "## " H2 section headings.
- Include a 1-2 sentence hook intro, 2-3 concrete sections, and a one-line takeaway at the end.
- No placeholders, no "TODO", no meta commentary. Return ONLY the Markdown post.
- Match the language the user wrote in.`
    });
  });
}