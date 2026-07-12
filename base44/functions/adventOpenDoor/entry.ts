import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const FACTS = [
  "◆ KASPA FACT ◆\nKaspa mines one block every single second — the fastest proof-of-work network on Earth.",
  "◆ KASPA FACT ◆\nGHOSTDAG lets Kaspa keep parallel blocks instead of orphaning them. Nothing is wasted.",
  "◆ KASPA FACT ◆\nKaspa had no premine, no ICO, and no founder allocation — a fair launch like Bitcoin.",
  "◆ KASPA FACT ◆\nkHeavyHash, Kaspa's mining algorithm, is optical-mining ready and energy efficient.",
  "◆ KASPA FACT ◆\n1 KAS = 100,000,000 sompi. Sompi is Kaspa's smallest unit, like Bitcoin's satoshi.",
  "◆ KASPA FACT ◆\nKaspa nodes prune old data automatically — you can run a full node on modest hardware.",
  "✦ TIP ✦\nSmall consistent tips build community faster than big one-time gifts. Tap to tip!",
  "✦ ADVICE ✦\nNever share your seed phrase with anyone. Advent keys are reputation points — never private keys.",
  "✦ TIP ✦\nCome back tomorrow! More advent keys = higher chance of finding a sponsor chest with real KAS.",
  "✦ ADVICE ✦\nDonate 1 KAS to the chest and the Advent Agent will turn your product into a community task.",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { wallet_address, door_number } = body;
    if (!wallet_address || !door_number) {
      return Response.json({ error: 'wallet_address and door_number required' }, { status: 400 });
    }
    const addr = wallet_address.startsWith('kaspa:') ? wallet_address : `kaspa:${wallet_address}`;
    const doorNum = String(door_number);

    let isAdmin = false;
    try {
      const u = await base44.auth.me();
      isAdmin = u?.role === 'admin';
    } catch { /* anonymous user — allowed */ }

    // Load or create wallet-based progress
    const rows = await base44.asServiceRole.entities.AdventProgress.filter({ wallet_address: addr });
    let progress = rows[0];
    if (!progress) {
      progress = await base44.asServiceRole.entities.AdventProgress.create({ wallet_address: addr, keys: 0, doors: {} });
    }

    const doors = progress.doors || {};
    if (doors[doorNum]) {
      return Response.json({ door: doors[doorNum], keys: progress.keys || 0, already_opened: true });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!isAdmin && progress.last_opened_date === today) {
      return Response.json({
        status: 'locked',
        message: 'One door per day. Come back tomorrow to earn more keys!',
      }, { status: 429 });
    }

    // 1. Admin-configured door content takes priority
    let door = null;
    const configs = await base44.asServiceRole.entities.AdventDoor.filter({ door_number: Number(door_number), is_active: true });
    if (configs.length > 0) {
      const c = configs[0];
      door = {
        type: c.type || 'fact',
        content: c.content || '',
        task_description: c.task_description || '',
        keys_reward: c.keys_reward ?? (c.type === 'task' ? 3 : 1),
      };
    }

    // 2. Otherwise: chest roll (weighted by keys) or random fact
    if (!door) {
      const available = await base44.asServiceRole.entities.AdventSponsorTask.filter({ status: 'active' });
      const chance = Math.min(0.10 + (progress.keys || 0) * 0.03, 0.6);
      if (available.length > 0 && Math.random() < chance) {
        const task = available[0];
        await base44.asServiceRole.entities.AdventSponsorTask.update(task.id, { status: 'assigned', assigned_to: addr });
        door = {
          type: 'chest',
          task_id: task.id,
          task_title: task.task_title,
          task_description: task.task_description,
          reward_kas: task.amount_kas || 1,
        };
      } else {
        door = { type: 'fact', content: FACTS[Math.floor(Math.random() * FACTS.length)], keys_reward: 1 };
      }
    }

    door.opened_at = today;

    // Admin preview mode — see any date without consuming a day or earning keys
    if (isAdmin && body.preview) {
      return Response.json({ door, keys: progress.keys || 0, preview: true });
    }

    const newKeys = (progress.keys || 0) + 1; // +1 key for opening a door
    await base44.asServiceRole.entities.AdventProgress.update(progress.id, {
      doors: { ...doors, [doorNum]: door },
      keys: newKeys,
      last_opened_date: isAdmin ? progress.last_opened_date : today,
    });

    return Response.json({ door, keys: newKeys });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});