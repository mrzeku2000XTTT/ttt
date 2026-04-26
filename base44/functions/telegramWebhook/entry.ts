import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public webhook — no user auth. Telegram calls this directly.
// We identify the bot via ?token= query param (the same token Telegram is using).

const sendTelegram = async (token, chatId, text) => {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error('[telegramWebhook] sendMessage failed', e);
  }
};

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) return Response.json({ ok: false, error: 'missing token' }, { status: 400 });

    const update = await req.json();
    const msg = update.message;
    if (!msg || !msg.text) return Response.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const fromName = msg.from?.first_name || 'friend';

    // Use service role since webhook has no user session
    const base44 = createClientFromRequest(req);

    // Find which user owns this bot
    const allLinks = await base44.asServiceRole.entities.TelegramBotLink.list();
    console.log(`[telegramWebhook] Total links in DB: ${allLinks.length}, looking for token: ${token.slice(0,15)}...`);
    const link = allLinks.find(l => l.bot_token === token);
    if (!link) {
      console.log(`[telegramWebhook] No match. Available tokens: ${allLinks.map(l => (l.bot_token||'').slice(0,15)).join(', ')}`);
      await sendTelegram(token, chatId, '❌ This bot is not linked to any TTT account.');
      return Response.json({ ok: true });
    }

    if (!link.is_active) {
      await sendTelegram(token, chatId, '⏸ This bot has been paused by its owner.');
      return Response.json({ ok: true });
    }

    // Update usage
    await base44.asServiceRole.entities.TelegramBotLink.update(link.id, {
      message_count: (link.message_count || 0) + 1,
      last_used: new Date().toISOString(),
    });

    // ── /start ──
    if (text === '/start') {
      const reply = `👋 Hey ${fromName}! I'm *${link.bot_username}*, connected to a Kaspa agent.\n\n` +
        (link.kaspa_address ? `🔗 Linked wallet: \`${link.kaspa_address.slice(0, 24)}...\`\n\n` : '') +
        `Send me any message to chat with the agent, or use a slash command.\n\n` +
        `Type /help to see available commands.`;
      await sendTelegram(token, chatId, reply);
      return Response.json({ ok: true });
    }

    // ── /help ──
    if (text === '/help') {
      const tools = await base44.asServiceRole.entities.TeleTool.filter({ is_active: true });
      const cmdList = tools.length
        ? tools.map(t => `${t.icon || '🔧'} /${t.command} — ${t.description}`).join('\n')
        : '_No commands defined yet._';
      const reply = `*Available Commands:*\n\n${cmdList}\n\n💬 Or just send any message to chat with the agent.`;
      await sendTelegram(token, chatId, reply);
      return Response.json({ ok: true });
    }

    // ── /command [args] ──
    if (text.startsWith('/')) {
      const [rawCmd, ...rest] = text.split(' ');
      const cmd = rawCmd.slice(1).toLowerCase();
      const args = rest.join(' ');

      const tools = await base44.asServiceRole.entities.TeleTool.filter({ command: cmd, is_active: true });
      if (tools.length === 0) {
        await sendTelegram(token, chatId, `❓ Unknown command: /${cmd}\n\nType /help for available commands.`);
        return Response.json({ ok: true });
      }
      if (link.agent_mode === 'ai_chat') {
        await sendTelegram(token, chatId, `⚠️ Slash commands are disabled on this bot. Just send a normal message.`);
        return Response.json({ ok: true });
      }

      const tool = tools[0];
      await sendTelegram(token, chatId, `${tool.icon || '⚙️'} Running /${cmd}...`);

      const filledPrompt = (tool.prompt_template || '').replace(/\{\{input\}\}/g, args);
      const aiRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: filledPrompt,
        add_context_from_internet: true,
      });
      const replyText = typeof aiRes === 'string' ? aiRes : JSON.stringify(aiRes);

      // Track tool usage
      await base44.asServiceRole.entities.TeleTool.update(tool.id, {
        usage_count: (tool.usage_count || 0) + 1,
      });

      await sendTelegram(token, chatId, replyText.slice(0, 4000));
      return Response.json({ ok: true });
    }

    // ── Free AI chat ──
    if (link.agent_mode === 'tools_only') {
      await sendTelegram(token, chatId, `💬 This bot only responds to slash commands. Type /help.`);
      return Response.json({ ok: true });
    }

    const ctx = link.kaspa_address ? `The user's Kaspa wallet is ${link.kaspa_address}. ` : '';
    const aiRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a helpful Kaspa-focused AI agent on Telegram. ${ctx}Be concise (max 3 short paragraphs) and friendly.\n\nUser asked: ${text}`,
      add_context_from_internet: true,
    });
    const replyText = typeof aiRes === 'string' ? aiRes : JSON.stringify(aiRes);
    await sendTelegram(token, chatId, replyText.slice(0, 4000));

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[telegramWebhook] error', error);
    return Response.json({ ok: true }); // Always 200 to Telegram so it doesn't retry-spam
  }
});