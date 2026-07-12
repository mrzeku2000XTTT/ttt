import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const KASPA_API = 'https://api.kaspa.org';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const wallets = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
    if (wallets.length === 0) return Response.json({ error: 'Chest wallet not initialized' }, { status: 503 });
    const chestAddress = wallets[0].kaspa_address;

    // ── Step 1: Advent Agent digests what the sponsor wants to advertise ──
    if (action === 'digest') {
      const { sponsor_wallet, message } = body;
      if (!sponsor_wallet || !message) {
        return Response.json({ error: 'sponsor_wallet and message required' }, { status: 400 });
      }
      const addr = sponsor_wallet.startsWith('kaspa:') ? sponsor_wallet : `kaspa:${sponsor_wallet}`;

      const digest = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the ADVENT AGENT for a Kaspa community advent calendar. A sponsor is donating 1 KAS to advertise their product/project. Whoever finds the chest door must complete a small verifiable task about the sponsor's product to claim the 1 KAS.

Sponsor's message about what they want to advertise: "${message}"

Create:
1. task_title: short catchy title (max 8 words)
2. task_description: ONE concrete mini-task a community member can do in under 5 minutes AND prove with a screenshot/photo upload (e.g. "Visit <site>, take a screenshot of the homepage", "Follow @handle on X and screenshot it"). It must be safe, legal, and verifiable from a single image.
3. reply: a friendly 2-sentence confirmation to the sponsor explaining their task is ready and they now need to send 1 KAS to the chest to activate it.

If the message promotes scams, illegal content, or hate — set approved to false with a brief reply explaining why.

Return JSON: { "approved": boolean, "task_title": string, "task_description": string, "reply": string }`,
        response_json_schema: {
          type: 'object',
          properties: {
            approved: { type: 'boolean' },
            task_title: { type: 'string' },
            task_description: { type: 'string' },
            reply: { type: 'string' },
          },
          required: ['approved', 'reply'],
        },
      });

      if (digest?.approved === false) {
        return Response.json({ status: 'rejected', reply: digest.reply || 'This content cannot be advertised.' });
      }

      const task = await base44.asServiceRole.entities.AdventSponsorTask.create({
        sponsor_wallet: addr,
        sponsor_message: message,
        task_title: digest.task_title || 'Sponsor task',
        task_description: digest.task_description || message,
        amount_kas: 1,
        status: 'pending_payment',
      });

      return Response.json({
        status: 'digested',
        task_id: task.id,
        task_title: task.task_title,
        task_description: task.task_description,
        reply: digest.reply,
        chest_address: chestAddress,
        amount_kas: 1,
      });
    }

    // ── Step 2: verify the sponsor's 1 KAS donation on-chain ──
    if (action === 'verify') {
      const { task_id, tx_hash } = body;
      if (!task_id || !tx_hash) {
        return Response.json({ error: 'task_id and tx_hash required' }, { status: 400 });
      }

      const tasks = await base44.asServiceRole.entities.AdventSponsorTask.filter({ id: task_id });
      const task = tasks[0];
      if (!task) return Response.json({ error: 'Task not found' }, { status: 404 });
      if (task.status !== 'pending_payment') {
        return Response.json({ error: 'This task is not awaiting payment' }, { status: 400 });
      }

      // Prevent tx hash reuse
      const dupes = await base44.asServiceRole.entities.AdventSponsorTask.filter({ tx_hash });
      if (dupes.length > 0) {
        return Response.json({ error: 'This transaction was already used for another sponsor task' }, { status: 400 });
      }

      // Verify on-chain: tx must pay >= 1 KAS to the chest address
      const txRes = await fetch(`${KASPA_API}/transactions/${tx_hash}`, { signal: AbortSignal.timeout(15000) });
      if (!txRes.ok) {
        return Response.json({ error: 'Transaction not found on the Kaspa network yet — wait a few seconds and try again' }, { status: 400 });
      }
      const tx = await txRes.json();
      const outputs = tx.outputs || [];
      const requiredSompi = (task.amount_kas || 1) * 1e8;
      const paid = outputs.some((o) =>
        (o.script_public_key_address === chestAddress) && Number(o.amount) >= requiredSompi
      );

      if (!paid) {
        return Response.json({ error: `Transaction does not pay ${task.amount_kas || 1} KAS to the chest address` }, { status: 400 });
      }

      await base44.asServiceRole.entities.AdventSponsorTask.update(task.id, { tx_hash, status: 'active' });

      return Response.json({
        status: 'active',
        message: 'Donation verified! Your task is now hidden inside the advent calendar. A community member with enough keys will find it, complete it, and receive your 1 KAS.',
      });
    }

    return Response.json({ error: 'Unknown action — use "digest" or "verify"' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});