import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Increments tip counters on a Post after a successful tip.
 * Tippers are NOT the post author, so they can't update the Post directly
 * (RLS restricts updates to the author/admin). This runs with service role
 * to bump the counters safely. It ONLY ever increments tip fields.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // NOTE: No auth required — tipping is open to guests (wallet-only users).
    // This function only ever increments tip counters on a post.
    const { postId, amount, tokenType, ticker } = await req.json();

    if (!postId || typeof amount !== 'number' || amount <= 0) {
      return Response.json({ error: 'Invalid postId or amount' }, { status: 400 });
    }

    const post = await base44.asServiceRole.entities.Post.get(postId);
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    let updates;
    if (tokenType === 'KRC20' && ticker) {
      const current = post.krc20_tips_received || {};
      const t = String(ticker).toUpperCase();
      updates = {
        krc20_tips_received: { ...current, [t]: (current[t] || 0) + amount },
      };
    } else {
      updates = { tips_received: (post.tips_received || 0) + amount };
    }

    await base44.asServiceRole.entities.Post.update(postId, updates);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});