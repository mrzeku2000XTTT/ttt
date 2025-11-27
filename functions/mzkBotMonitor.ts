import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * MZK Bot - Real-time fund monitoring for Pera tasks
 * Runs every 30 seconds to check if burner wallet still has funds
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return Response.json({ error: 'taskId required' }, { status: 400 });
    }

    console.log(`🤖 MZK Bot monitoring task: ${taskId}`);

    // Get task details
    const tasks = await base44.entities.PeraTask.filter({ id: taskId });
    if (tasks.length === 0) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = tasks[0];

    // Check if task is active
    if (task.status === 'voided' || task.status === 'completed') {
      return Response.json({
        success: true,
        message: 'Task already completed or voided',
        status: task.status
      });
    }

    // Check wallet balance
    const balanceResult = await fetch(`https://api.kaspa.org/addresses/${task.burner_wallet_address}/balance`);
    const balanceData = await balanceResult.json();
    
    const currentBalance = parseFloat(balanceData.balance || '0') / 100000000; // Convert from sompi
    const expectedBalance = task.tip_amount;

    console.log(`💰 Current balance: ${currentBalance} KAS, Expected: ${expectedBalance} KAS`);

    // FRAUD DETECTION
    if (currentBalance < expectedBalance) {
      console.log(`🚨 FRAUD DETECTED! Funds withdrawn from task ${taskId}`);

      // Void the task
      await base44.entities.PeraTask.update(taskId, {
        status: 'voided',
        void_reason: 'Employer withdrew funds from burner wallet',
        balance_verified: false,
        last_balance_check: new Date().toISOString()
      });

      // Penalize employer
      const employer = await base44.entities.User.filter({ id: task.employer_id });
      if (employer.length > 0) {
        const currentRep = employer[0].reputation_score || 5.0;
        await base44.entities.User.update(task.employer_id, {
          reputation_score: Math.max(0, currentRep - 10)
        });
      }

      // Notify worker if assigned
      if (task.worker_id) {
        // TODO: Send notification to worker
        console.log(`📢 Notifying worker ${task.worker_id} of voided task`);
      }

      return Response.json({
        success: true,
        fraud_detected: true,
        message: 'Task voided - funds were withdrawn',
        previous_balance: expectedBalance,
        current_balance: currentBalance
      });
    }

    // Funds still there - update last check
    await base44.entities.PeraTask.update(taskId, {
      balance_verified: true,
      last_balance_check: new Date().toISOString()
    });

    console.log(`✅ Task ${taskId} - funds verified`);

    return Response.json({
      success: true,
      fraud_detected: false,
      balance_verified: true,
      current_balance: currentBalance,
      message: 'Funds verified, task is safe'
    });

  } catch (error) {
    console.error('❌ MZK Bot error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});