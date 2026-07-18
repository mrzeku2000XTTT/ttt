// Slobz chat / testnet demo-gig poster. Lets any logged-in user post a
// verifiable TESTNET demo gig to the Momentum Track (SlobMicroTask has
// admin-only create RLS, so this goes through service role, always tagged).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const CATEGORIES = ['data_cleanup', 'image_tagging', 'basic_editing', 'content_moderation', 'transcription'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please log in to post a demo gig.' }, { status: 401 });

    const { title, description, category, payout_tkas, estimated_minutes } = await req.json();
    if (!title || !description) {
      return Response.json({ error: 'Title and description are required.' }, { status: 400 });
    }

    const gig = await base44.asServiceRole.entities.SlobMicroTask.create({
      title: `[TESTNET] ${String(title).slice(0, 80)}`,
      description: String(description).slice(0, 500),
      category: CATEGORIES.includes(category) ? category : 'data_cleanup',
      payout_usd: Math.min(Math.max(Number(payout_tkas) || 5, 1), 100),
      estimated_minutes: Math.min(Math.max(Number(estimated_minutes) || 30, 5), 240),
      status: 'available',
      description_field: `Testnet demo gig posted by ${user.email} via Slobz Chat. Payout in TKAS (testnet Kaspa).`,
    });

    return Response.json({ success: true, gig: { id: gig.id, title: gig.title, description: gig.description, category: gig.category, payout_tkas: gig.payout_usd, estimated_minutes: gig.estimated_minutes } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});