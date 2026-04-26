import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const links = await base44.entities.TelegramBotLink.filter({ user_email: user.email });
    if (links.length === 0) return Response.json({ error: 'No bot linked' }, { status: 404 });

    const link = links[0];
    const res = await fetch(`https://api.telegram.org/bot${link.bot_token}/getWebhookInfo`);
    const data = await res.json();

    return Response.json({
      bot_username: link.bot_username,
      webhook_info: data.result,
      message_count: link.message_count,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});