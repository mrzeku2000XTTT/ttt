import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, post_id } = await req.json();

    // Get AI response as ZK with real-time internet data
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ZK, an advanced AI agent in the TTT Feed. You have access to real-time data, news, and the entire internet. You know everything about TTT apps, Kaspa blockchain, crypto markets, and more. Be concise, insightful, and helpful. Answer: ${prompt}`,
      add_context_from_internet: true,
    });

    // Create comment as ZK bot on the user's post
    const botComment = await base44.asServiceRole.entities.PostComment.create({
      post_id: post_id,
      author_name: "ZK",
      author_wallet: "zk_bot_official",
      comment: response,
    });

    // Increment post's comments count
    const post = await base44.asServiceRole.entities.Post.filter({ id: post_id });
    if (post.length > 0) {
      await base44.asServiceRole.entities.Post.update(post_id, {
        comments_count: (post[0].comments_count || 0) + 1
      });
    }

    return Response.json({ 
      success: true, 
      comment: botComment,
      message: "ZK has responded!" 
    });
  } catch (error) {
    console.error('ZK Bot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});