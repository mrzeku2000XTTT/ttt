import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, parent_post_id } = await req.json();

    // Get AI response as ZK
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ZK, an advanced AI agent living in the TTT Feed. You're knowledgeable about Kaspa, crypto, technology, and help users with insights. Be concise, friendly, and helpful. Respond to: ${prompt}`,
      add_context_from_internet: true,
    });

    // Create post as ZK bot
    const botPost = await base44.asServiceRole.entities.Post.create({
      content: response,
      author_name: "ZK Bot",
      author_wallet_address: "zk_bot_official",
      author_role: "admin",
      parent_post_id: parent_post_id || null,
      replies_count: 0,
      likes: 0,
      comments_count: 0,
    });

    // If replying to a post, increment parent's replies count
    if (parent_post_id) {
      const parentPost = await base44.asServiceRole.entities.Post.filter({ id: parent_post_id });
      if (parentPost.length > 0) {
        await base44.asServiceRole.entities.Post.update(parent_post_id, {
          replies_count: (parentPost[0].replies_count || 0) + 1
        });
      }
    }

    return Response.json({ 
      success: true, 
      post: botPost,
      message: "ZK has responded!" 
    });
  } catch (error) {
    console.error('ZK Bot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});