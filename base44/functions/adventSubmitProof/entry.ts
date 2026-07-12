import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { wallet_address, door_number, proof_url } = body;
    if (!wallet_address || !door_number || !proof_url) {
      return Response.json({ error: 'wallet_address, door_number and proof_url required' }, { status: 400 });
    }
    const addr = wallet_address.startsWith('kaspa:') ? wallet_address : `kaspa:${wallet_address}`;
    const doorNum = String(door_number);

    const rows = await base44.asServiceRole.entities.AdventProgress.filter({ wallet_address: addr });
    const progress = rows[0];
    const door = progress?.doors?.[doorNum];
    if (!door) return Response.json({ error: 'Door not opened yet' }, { status: 404 });
    if (door.completed) return Response.json({ error: 'Task already completed' }, { status: 400 });
    if (door.type === 'fact') return Response.json({ error: 'This door has no task to prove' }, { status: 400 });

    const taskTitle = door.task_title || 'Advent task';
    const taskDesc = door.task_description || '';

    // AI verification of the uploaded proof
    const verdict = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Advent proof verifier for a Kaspa community calendar. A user uploaded proof for this task:

TASK: "${taskTitle}"
DESCRIPTION: "${taskDesc}"

Look at the attached proof file/image carefully. Decide if it genuinely demonstrates the task was completed. Be fair: reasonable evidence counts, but reject blank images, unrelated screenshots, or obvious fakes.

Return JSON: { "approved": boolean, "confidence": number between 0 and 1, "reason": "one-sentence explanation" }`,
      file_urls: [proof_url],
      response_json_schema: {
        type: 'object',
        properties: {
          approved: { type: 'boolean' },
          confidence: { type: 'number' },
          reason: { type: 'string' },
        },
        required: ['approved', 'confidence'],
      },
    });

    const approved = verdict?.approved === true;
    const confidence = verdict?.confidence ?? 0;
    const reason = verdict?.reason || '';

    // Borderline → admin review instead of hard reject
    if (approved && confidence < 0.7) {
      await base44.asServiceRole.entities.AdventProof.create({
        wallet_address: addr, door_number: Number(door_number), task_id: door.task_id || '',
        proof_url, status: 'pending_review', reason,
      });
      return Response.json({ status: 'pending_review', reason: 'Your proof looks plausible but needs an admin review. Keys will be awarded once approved.' });
    }

    if (!approved) {
      await base44.asServiceRole.entities.AdventProof.create({
        wallet_address: addr, door_number: Number(door_number), task_id: door.task_id || '',
        proof_url, status: 'rejected', reason,
      });
      return Response.json({ status: 'rejected', reason: reason || 'The proof does not show the task was completed.' });
    }

    // APPROVED
    let txHash = null;
    let keysDelta = door.keys_reward || 3;

    if (door.type === 'chest') {
      keysDelta = 5;
      const tasks = await base44.asServiceRole.entities.AdventSponsorTask.filter({ id: door.task_id });
      const task = tasks[0];
      if (!task || task.status !== 'assigned' || task.assigned_to !== addr) {
        return Response.json({ error: 'This chest task is no longer assigned to your wallet' }, { status: 400 });
      }

      // Real payout — sponsor's KAS sits in the app-controlled chest wallet
      const wallets = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
      if (wallets.length === 0) return Response.json({ error: 'Chest wallet not initialized' }, { status: 503 });
      const chest = wallets[0];

      let sendResult;
      try {
        sendResult = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
          mnemonic: chest.seed_phrase,
          fromAddress: chest.kaspa_address,
          toAddress: addr,
          amountKas: task.amount_kas || 1,
        });
      } catch (sendErr) {
        const detail = sendErr?.response?.data?.error || sendErr?.message || String(sendErr);
        return Response.json({ status: 'payout_failed', reason: `Proof approved but payout failed: ${detail}. Try again shortly.` }, { status: 500 });
      }
      txHash = sendResult?.data?.txId || sendResult?.txId;
      if (!txHash) {
        return Response.json({ status: 'payout_failed', reason: 'Proof approved but the payout transaction failed. Try again shortly.' }, { status: 500 });
      }

      await base44.asServiceRole.entities.AdventSponsorTask.update(task.id, {
        status: 'paid', proof_url, payout_tx: txHash,
      });
    }

    const newKeys = (progress.keys || 0) + keysDelta;
    await base44.asServiceRole.entities.AdventProgress.update(progress.id, {
      keys: newKeys,
      doors: { ...progress.doors, [doorNum]: { ...door, completed: true } },
    });

    await base44.asServiceRole.entities.AdventProof.create({
      wallet_address: addr, door_number: Number(door_number), task_id: door.task_id || '',
      proof_url, status: 'approved', reason, keys_awarded: keysDelta,
    });

    return Response.json({
      status: door.type === 'chest' ? 'paid' : 'keys_awarded',
      keys_awarded: keysDelta,
      keys: newKeys,
      tx_hash: txHash,
      amount_kas: door.type === 'chest' ? (door.reward_kas || 1) : 0,
      reason,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});