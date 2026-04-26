import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.log('[telegramRegisterBot] user:', JSON.stringify({ email: user.email, id: user.id }));

    const { bot_token, kaspa_address, agent_mode } = await req.json();
    if (!bot_token) return Response.json({ error: 'bot_token required' }, { status: 400 });

    const trimmed = String(bot_token).trim();

    // Format check: Telegram tokens look like "123456789:AAH-xxxx..."
    if (!/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(trimmed)) {
      return Response.json({
        error: 'Token format looks wrong. It should look like "123456789:AAH-xxxxx..." — copy the FULL token from @BotFather (the line right after "Use this token to access the HTTP API"). Make sure you didn\'t copy the bot link or username by mistake.',
      }, { status: 400 });
    }

    // 1. Validate token via getMe
    let meData;
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${trimmed}/getMe`);
      meData = await meRes.json();
    } catch (e) {
      return Response.json({ error: 'Could not reach Telegram: ' + e.message }, { status: 400 });
    }

    if (!meData.ok) {
      const desc = meData.description || 'unknown';
      let hint = '';
      if (desc.toLowerCase().includes('not found') || desc.toLowerCase().includes('unauthorized')) {
        hint = ' This usually means the token was revoked, mistyped, or the bot was deleted. In @BotFather, send /mybots → pick your bot → API Token to get a fresh token.';
      }
      return Response.json({ error: `Telegram rejected the token: ${desc}.${hint}` }, { status: 400 });
    }
    const bot = meData.result;

    // 2. Build webhook URL pointing to telegramWebhook function
    // Telegram needs a public URL. Use the request's own host to derive the correct base44.app domain.
    const appId = Deno.env.get('BASE44_APP_ID');
    const reqUrl = new URL(req.url);
    let host = reqUrl.host;
    // If called from a custom domain (e.g. tttz.xyz), fall back to default base44.app domain pattern
    if (!host.endsWith('.base44.app')) {
      host = `app--6901295fa9bcfaa0f5ba2c2a.base44.app`;
    }
    const webhookUrl = `https://${host}/api/apps/${appId}/functions/telegramWebhook?token=${trimmed}`;
    console.log('[telegramRegisterBot] Setting webhook URL:', webhookUrl);

    // 3. Register the webhook with Telegram
    const hookRes = await fetch(`https://api.telegram.org/bot${trimmed}/setWebhook`, {
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
    const db = base44.entities.TelegramBotLink;
    const existing = await db.filter({ user_email: user.email });
    const payload = {
      user_email: user.email,
      kaspa_address: kaspa_address || user.created_wallet_address || '',
      bot_token: trimmed,
      bot_username: bot.username,
      bot_id: String(bot.id),
      webhook_status: 'active',
      agent_mode: agent_mode || 'both',
      is_active: true,
    };

    let link;
    if (existing.length > 0) {
      link = await db.update(existing[0].id, payload);
    } else {
      link = await db.create(payload);
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