import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Worker claims funds after task approval
 * Decrypts vault and provides seed phrase
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, mzkey } = await req.json();

    console.log(`💰 Worker claiming funds for task: ${taskId}`);

    // Get task
    const tasks = await base44.entities.PeraTask.filter({ id: taskId });
    if (tasks.length === 0) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = tasks[0];

    // Verify user is the worker
    if (task.worker_id !== user.email && task.worker_id !== user.id) {
      return Response.json({ error: 'Only assigned worker can claim' }, { status: 403 });
    }

    // Verify task is completed
    if (task.status !== 'completed') {
      return Response.json({ 
        error: `Cannot claim - task status: ${task.status}` 
      }, { status: 400 });
    }

    // Verify MZKey
    if (!task.mzkey || task.mzkey !== mzkey) {
      return Response.json({ error: 'Invalid MZKey' }, { status: 403 });
    }

    // Check MZKey expiration
    if (task.mzkey_expires && new Date(task.mzkey_expires) < new Date()) {
      return Response.json({ error: 'MZKey expired' }, { status: 403 });
    }

    // Check if already claimed
    if (task.funds_claimed) {
      return Response.json({ 
        error: 'Funds already claimed',
        message: 'You have already claimed the funds for this task'
      }, { status: 400 });
    }

    // Get vault
    const vaults = await base44.entities.PeraVault.filter({ task_id: taskId });
    if (vaults.length === 0) {
      return Response.json({ error: 'Vault not found' }, { status: 404 });
    }

    const vault = vaults[0];

    // Verify vault is unlocked
    if (vault.status !== 'unlocked') {
      return Response.json({ 
        error: 'Vault is locked',
        message: 'Employer must approve task first'
      }, { status: 400 });
    }

    // Decrypt seed phrase (reverse the encryption)
    // Layer 3: Decrypt with Master Key
    let layer2;
    try {
      const layer3Data = vault.encrypted_seed_phrase.replace('MASTER_KEY_PLACEHOLDER', '');
      layer2 = atob(layer3Data);
    } catch (err) {
      console.error('Layer 3 decryption failed:', err);
      return Response.json({ error: 'Decryption failed' }, { status: 500 });
    }

    // Layer 2: Decrypt with Task ID
    let layer1;
    try {
      const layer2Data = layer2.replace(taskId, '');
      layer1 = atob(layer2Data);
    } catch (err) {
      console.error('Layer 2 decryption failed:', err);
      return Response.json({ error: 'Decryption failed' }, { status: 500 });
    }

    // Layer 1: Decrypt with Pera Secret Key
    let seedPhrase;
    try {
      const layer1Data = layer1.replace(vault.pera_secret_key, '');
      seedPhrase = atob(layer1Data);
    } catch (err) {
      console.error('Layer 1 decryption failed:', err);
      return Response.json({ error: 'Decryption failed' }, { status: 500 });
    }

    console.log('🔓 Seed phrase decrypted successfully');

    // Mark as claimed
    await base44.entities.PeraTask.update(taskId, {
      funds_claimed: true
    });

    await base44.entities.PeraVault.update(vault.id, {
      status: 'claimed',
      claimed_by: user.email
    });

    console.log('✅ Funds claimed successfully');

    return Response.json({
      success: true,
      seedPhrase: seedPhrase,
      walletAddress: task.burner_wallet_address,
      amount: task.tip_amount,
      message: '✅ Seed phrase retrieved! Import this wallet to claim your KAS.',
      warning: '⚠️ IMPORTANT: Import this seed phrase into a Kaspa wallet immediately. This is your only chance to see it.',
      instructions: [
        '1. Copy the seed phrase below',
        '2. Open your Kaspa wallet (Kasware, Kaspium, etc.)',
        '3. Import wallet using this seed phrase',
        '4. You will see your KAS balance',
        '5. Transfer funds to your permanent wallet'
      ]
    });

  } catch (error) {
    console.error('❌ Claim error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});