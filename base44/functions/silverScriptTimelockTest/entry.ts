import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      sender_pk,
      recipient_pk,
      timeout_unix,
      current_time_unix,
      function_name, // "transfer" or "timeout"
      sig_provided,  // boolean: whether a valid sig was provided
    } = body;

    // Validate required inputs
    if (!sender_pk || !recipient_pk || !timeout_unix || !current_time_unix || !function_name) {
      return Response.json({ error: 'Missing required fields: sender_pk, recipient_pk, timeout_unix, current_time_unix, function_name' }, { status: 400 });
    }

    const timeout = parseInt(timeout_unix);
    const currentTime = parseInt(current_time_unix);
    const steps = [];
    let pass = false;

    // ─── Simulate: TransferWithTimeout contract ───────────────────────────
    //
    //   contract TransferWithTimeout(pubkey sender, pubkey recipient, int timeout) {
    //     entrypoint function transfer(sig recipientSig) {
    //       require(checkSig(recipientSig, recipient));
    //     }
    //     entrypoint function timeout(sig senderSig) {
    //       require(checkSig(senderSig, sender));
    //       require(tx.time >= timeout);
    //     }
    //   }
    //

    if (function_name === 'transfer') {
      // transfer path: only requires checkSig(recipientSig, recipient)
      steps.push({
        op: 'checkSig(recipientSig, recipient)',
        result: sig_provided ? 'PASS' : 'FAIL',
        detail: sig_provided
          ? `Signature verified against recipient pubkey: ${recipient_pk.slice(0, 16)}...`
          : 'No valid signature provided for recipient',
      });

      pass = !!sig_provided;

      steps.push({
        op: 'require(checkSig)',
        result: pass ? 'PASS' : 'FAIL',
        detail: pass ? 'Spending condition satisfied — funds released to recipient' : 'Script aborted: signature check failed',
      });

    } else if (function_name === 'timeout') {
      // timeout path: checkSig(senderSig, sender) AND tx.time >= timeout
      const sigCheck = !!sig_provided;
      const timeCheck = currentTime >= timeout;

      steps.push({
        op: 'checkSig(senderSig, sender)',
        result: sigCheck ? 'PASS' : 'FAIL',
        detail: sigCheck
          ? `Signature verified against sender pubkey: ${sender_pk.slice(0, 16)}...`
          : 'No valid signature provided for sender',
      });

      if (!sigCheck) {
        steps.push({
          op: 'require(checkSig)',
          result: 'FAIL',
          detail: 'Script aborted: signature check failed before time check',
        });
        pass = false;
      } else {
        steps.push({
          op: `require(tx.time >= timeout)`,
          result: timeCheck ? 'PASS' : 'FAIL',
          detail: timeCheck
            ? `tx.time (${currentTime}) >= timeout (${timeout}) ✓ — timelock expired, sender can reclaim`
            : `tx.time (${currentTime}) < timeout (${timeout}) ✗ — timelock not expired yet. Wait ${timeout - currentTime} more seconds.`,
          values: {
            tx_time: currentTime,
            timeout,
            difference: currentTime - timeout,
            time_remaining: Math.max(0, timeout - currentTime),
          },
        });
        pass = timeCheck;
      }
    } else {
      return Response.json({ error: `Unknown function: ${function_name}. Use "transfer" or "timeout"` }, { status: 400 });
    }

    // Generate a simulated script representation
    const contractSource = `pragma silverscript ^0.1.0;\n\ncontract TransferWithTimeout(\n    pubkey sender,\n    pubkey recipient,\n    int timeout\n) {\n    entrypoint function transfer(sig recipientSig) {\n        require(checkSig(recipientSig, recipient));\n    }\n\n    entrypoint function timeout(sig senderSig) {\n        require(checkSig(senderSig, sender));\n        require(tx.time >= timeout);\n    }\n}`;

    const activeEntrypoint = function_name === 'transfer'
      ? '// → entrypoint function transfer(sig recipientSig)'
      : '// → entrypoint function timeout(sig senderSig)';

    return Response.json({
      contract: 'TransferWithTimeout',
      function_called: function_name,
      result: pass ? 'PASS' : 'FAIL',
      steps,
      contract_source: contractSource,
      active_entrypoint: activeEntrypoint,
      constructor_args: {
        sender: sender_pk,
        recipient: recipient_pk,
        timeout: timeout,
      },
      tx_context: {
        time: currentTime,
        time_iso: new Date(currentTime * 1000).toISOString(),
        timeout_iso: new Date(timeout * 1000).toISOString(),
        timelock_expired: currentTime >= timeout,
      },
      note: 'This is a simulation of SilverScript contract logic. Real execution requires Testnet-12 + silverc compiler.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});