import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { comment_id, amount, token_type, krc20_ticker } = await req.json();

    if (!comment_id || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const comments = await base44.asServiceRole.entities.PostComment.filter({ id: comment_id });
    
    if (comments.length === 0) {
      return Response.json({ error: 'Comment not found' }, { status: 404 });
    }

    const comment = comments[0];

    // Update tips based on token type
    if (token_type === "KRC20" && krc20_ticker) {
      const currentKrc20Tips = comment.krc20_tips_received || {};
      const tickerAmount = currentKrc20Tips[krc20_ticker] || 0;
      
      await base44.asServiceRole.entities.PostComment.update(comment_id, {
        krc20_tips_received: {
          ...currentKrc20Tips,
          [krc20_ticker]: tickerAmount + amount
        }
      });
    } else {
      const currentTips = comment.tips_received || 0;
      await base44.asServiceRole.entities.PostComment.update(comment_id, {
        tips_received: currentTips + amount
      });
    }

    return Response.json({ 
      success: true,
      new_tips_received: token_type === "KAS" ? (comment.tips_received || 0) + amount : comment.tips_received,
      new_krc20_tips: token_type === "KRC20" ? {
        ...comment.krc20_tips_received || {},
        [krc20_ticker]: ((comment.krc20_tips_received || {})[krc20_ticker] || 0) + amount
      } : comment.krc20_tips_received
    });

  } catch (error) {
    console.error('Update comment tips error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});