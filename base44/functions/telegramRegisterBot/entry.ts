import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bot_token, kaspa_address, agent_mode } = await req.json();
    if (!bot_token) return Response.json({ error: 'bot_token required' }, { status: 400 });

    // 1. Validate token via getMe
    const meRes = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) {
      return Response.json({ error: 'Invalid bot token: ' + (meData.description || 'unknown') }, { status: 400 });
    }
    const bot = meData.result;

    // 2. Build webhook URL pointing to telegramWebhook function
    const appId = Deno.env.get('BASE44_APP_ID');
    const webhookUrl = `https://app.base44.com/api/apps/${appId}/functions/telegramWebhook?token=${bot_token}`;

    // 3. Register the webhook with Telegram
    const hookRes = await fetch(`https://api.telegram.org/bot${bot_token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: true,
      }),
    });
    const hookData = await hookRes.json();
    if (!hookData.ok) {
      return Response.json({ error: 'Webhook setup failed: ' + (hookData.description || 'unknown') }, { status: 400 });
    }

    // 4. Upsert link in DB (one bot per user — replace if exists)
    const existing = await base44.entities.TelegramBotLink.filter({ user_email: user.email });
    const payload = {
      user_email: user.email,
      kaspa_address: kaspa_address || user.created_wallet_address || '',
      bot_token,
      bot_username: bot.username,
      bot_id: String(bot.id),
      webhook_status: 'active',
      agent_mode: agent_mode || 'both',
      is_active: true,
    };

    let link;
    if (existing.length > 0) {
      link = await base44.entities.TelegramBotLink.update(existing[0].id, payload);
    } else {
      link = await base44.entities.TelegramBotLink.create(payload);
    }

    // 5. Send a welcome message so user knows it works
    try {
      // We don't know the user's chat_id yet — they'll discover it on first /start
      console.log(`[TelegramRegisterBot] Registered @${bot.username} for ${user.email}`);
    } catch {}

    return Response.json({
      success: true,
      bot: { username: bot.username, id: bot.id, first_name: bot.first_name },
      link,
      next_step: `Open https://t.me/${bot.username} and send /start to begin.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});