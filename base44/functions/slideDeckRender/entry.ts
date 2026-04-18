import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const AGENT_ID = '69e00a3b3c4957544571e863';
const AGENT_API_KEY = '7d4e7751d1ac406dae4df07533c5e566';
const AGENT_BASE_URL = `https://app.base44.com/api/agents/${AGENT_ID}`;

async function createConversation(title) {
  const res = await fetch(`${AGENT_BASE_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api_key': AGENT_API_KEY },
    body: JSON.stringify({ title: title || 'Slide Deck Render' }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Create conversation failed ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.id || data.conversation_id;
}

async function sendMessage(conversation_id, content) {
  const res = await fetch(`${AGENT_BASE_URL}/conversations/${conversation_id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api_key': AGENT_API_KEY },
    body: JSON.stringify({ role: "user", content }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Send message failed ${res.status}: ${errText.slice(0, 300)}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { deck_id } = await req.json();
    if (!deck_id) return Response.json({ error: 'deck_id required' }, { status: 400 });

    // Load deck + slides
    const deck = await base44.entities.SlideDeck.get(deck_id);
    if (!deck) return Response.json({ error: 'Deck not found' }, { status: 404 });

    const slides = await base44.entities.Slide.filter({ deck_id });
    const sorted = [...slides].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (sorted.length === 0) {
      return Response.json({ error: 'No slides in this deck' }, { status: 400 });
    }

    const totalDuration = sorted.reduce((sum, s) => sum + (s.duration || 5), 0);

    // Update deck: rendering
    await base44.entities.SlideDeck.update(deck_id, {
      status: 'rendering',
      total_slides: sorted.length,
      total_duration: totalDuration,
      render_log: '🎬 Render queued — Superagent processing...',
    });

    // Create Superagent conversation
    let conversation_id;
    try {
      conversation_id = await createConversation(`Deck: ${deck.title}`);
    } catch (err) {
      await base44.entities.SlideDeck.update(deck_id, {
        status: 'error',
        render_log: `Failed to create conversation: ${err.message}`,
      });
      return Response.json({ error: err.message }, { status: 500 });
    }

    const payload = {
      deck_id: deck.id,
      deck_title: deck.title,
      style: deck.style,
      slides: sorted.map(s => ({
        id: s.id,
        order: s.order,
        prompt: s.prompt,
        voiceover: s.voiceover,
        duration: s.duration || 5,
        style: s.style || deck.style,
      })),
    };

    const content = `SLIDE_RENDER_JOB: ${JSON.stringify(payload)}`;

    // Fire-and-forget — Superagent processes and updates the deck record back
    sendMessage(conversation_id, content).catch(err => console.error('sendMessage error:', err?.message || err));

    return Response.json({
      success: true,
      conversation_id,
      total_slides: sorted.length,
      total_duration: totalDuration,
    });
  } catch (err) {
    console.error('slideDeckRender error:', err?.message || err);
    return Response.json({ error: err.message || 'unknown error' }, { status: 500 });
  }
});