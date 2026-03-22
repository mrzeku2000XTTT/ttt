import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

/**
 * Employer approves completed task
 * Generates MZKey and grants Pera Secret Key to worker
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await req.json();

    console.log(`✅ Approving task: ${taskId}`);

    // Get task
    const tasks = await base44.entities.PeraTask.filter({ id: taskId });
    if (tasks.length === 0) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = tasks[0];

    // Verify user is the employer
    if (task.employer_id !== user.email && task.employer_id !== user.id) {
      return Response.json({ error: 'Only employer can approve' }, { status: 403 });
    }

    // Verify task is awaiting approval
    if (task.status !== 'awaiting_approval') {
      return Response.json({ 
        error: `Task cannot be approved (status: ${task.status})` 
      }, { status: 400 });
    }

    // FINAL balance check
    const balanceResult = await fetch(`https://api.kaspa.org/addresses/${task.burner_wallet_address}/balance`);
    const balanceData = await balanceResult.json();
    const currentBalance = parseFloat(balanceData.balance || '0') / 100000000;

    if (currentBalance < task.tip_amount) {
      // Void task - funds gone
      await base44.entities.PeraTask.update(taskId, {
        status: 'voided',
        void_reason: 'Funds withdrawn before approval',
        balance_verified: false
      });

      return Response.json({
        success: false,
        error: 'Cannot approve - funds were withdrawn'
      }, { status: 400 });
    }

    // Generate MZKey (one-time authorization key)
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const mzkey = `mzkey_${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;

    // MZKey expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log(`🔑 Generated MZKey for task ${taskId}`);

    // Get vault
    const vaults = await base44.entities.PeraVault.filter({ task_id: taskId });
    if (vaults.length === 0) {
      return Response.json({ error: 'Vault not found' }, { status: 404 });
    }

    const vault = vaults[0];

    // Grant Pera Secret Key to worker
    // (In production, this would be encrypted with worker's public key)
    const workerSecretEntry = {
      taskId: taskId,
      peraSecretKey: vault.pera_secret_key,
      grantedAt: new Date().toISOString()
    };

    // Store in worker's AgentZK secrets
    const workerUsers = await base44.entities.User.filter({ 
      email: task.worker_id 
    });
    
    if (workerUsers.length > 0) {
      const worker = workerUsers[0];
      const currentSecrets = worker.agent_zk_secrets || [];
      
      await base44.entities.User.update(worker.id, {
        agent_zk_secrets: [
          ...currentSecrets,
          {
            id: `pera_${taskId}`,
            key: `PERA_SECRET_${taskId}`,
            value: vault.pera_secret_key,
            description: `Pera Secret Key for task: ${task.task_name}`,
            created: new Date().toISOString()
          }
        ]
      });

      console.log(`🔐 Granted Pera Secret Key to worker: ${task.worker_id}`);
    }

    // Update task
    await base44.entities.PeraTask.update(taskId, {
      status: 'completed',
      mzkey: mzkey,
      mzkey_expires: expiresAt.toISOString(),
      pera_secret_key_granted: true
    });

    // Update vault
    await base44.entities.PeraVault.update(vault.id, {
      status: 'unlocked',
      unlock_timestamp: new Date().toISOString()
    });

    // Update reputations
    const employerUsers = await base44.entities.User.filter({ email: user.email });
    if (employerUsers.length > 0) {
      const currentRep = employerUsers[0].reputation_score || 5.0;
      await base44.entities.User.update(employerUsers[0].id, {
        reputation_score: Math.min(10, currentRep + 0.5)
      });
    }

    if (workerUsers.length > 0) {
      const worker = workerUsers[0];
      const currentRep = worker.reputation_score || 5.0;
      await base44.entities.User.update(worker.id, {
        reputation_score: Math.min(10, currentRep + 1),
        trades_completed: (worker.trades_completed || 0) + 1
      });
    }

    return Response.json({
      success: true,
      message: 'Task approved! Worker can now claim funds.',
      mzkey: mzkey,
      expiresAt: expiresAt.toISOString(),
      worker_notified: true
    });

  } catch (error) {
    console.error('❌ Approval error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});