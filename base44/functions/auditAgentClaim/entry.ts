import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * auditAgentClaim — the Auditor half of agent-to-agent consensus.
 *
 * Takes a claim (a summary produced by another agent) about a Kaspa
 * transaction, fetches the REAL on-chain facts, and returns a verdict.
 * Deterministic numeric checks first, then an LLM cross-read for wording.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { txId, claim, auditCriteria } = await req.json();
    if (!txId || !claim) return Response.json({ error: 'txId and claim are required' }, { status: 400 });

    const txRes = await base44.functions.invoke('getKaspaTransactionDetails', { txId });
    const tx = txRes?.data || txRes;
    if (!tx || tx.error) return Response.json({ error: tx?.error || 'Transaction not found on chain' });

    const totalOut = (tx.outputs || []).reduce((s, o) => s + (Number(o.amount) || 0), 0);
    const addresses = [
      ...(tx.inputs || []).map((i) => i.previous_outpoint_address),
      ...(tx.outputs || []).map((o) => o.script_public_key_address),
    ].filter(Boolean);

    const facts = {
      transaction_id: tx.transaction_id,
      is_accepted: tx.is_accepted !== false,
      block_time: tx.block_time ? new Date(Number(tx.block_time)).toISOString() : null,
      blue_score: tx.accepting_block_blue_score ?? null,
      input_count: (tx.inputs || []).length,
      output_count: (tx.outputs || []).length,
      total_output_kas: Number(totalOut.toFixed(8)),
      outputs: (tx.outputs || []).map((o) => ({
        amount_kas: Number(Number(o.amount || 0).toFixed(8)),
        address: o.script_public_key_address || null,
      })),
      addresses: [...new Set(addresses)],
    };

    // --- Deterministic checks (cannot be talked around) ---
    const mismatches = [];
    const checks = [];

    const claimIds = claim.match(/\b[0-9a-f]{64}\b/gi) || [];
    if (claimIds.length && !claimIds.some((id) => id.toLowerCase() === String(facts.transaction_id).toLowerCase())) {
      mismatches.push(`Claim references transaction id ${claimIds[0].slice(0, 16)}… but the audited tx is ${String(facts.transaction_id).slice(0, 16)}…`);
    } else if (claimIds.length) {
      checks.push('Transaction id in claim matches the on-chain transaction');
    }

    const claimAddrs = claim.match(/kaspa:[a-z0-9]{20,}/gi) || [];
    const badAddrs = claimAddrs.filter(
      (a) => !facts.addresses.some((f) => String(f).toLowerCase() === a.toLowerCase())
    );
    if (badAddrs.length) mismatches.push(`Address ${badAddrs[0].slice(0, 24)}… does not appear in this transaction`);
    else if (claimAddrs.length) checks.push('All addresses named in the claim appear on-chain');

    // Strip tx ids and addresses first — their hex/bech32 characters contain digits
    // that would otherwise be read as claimed amounts.
    const proseOnly = claim
      .replace(/\b[0-9a-f]{64}\b/gi, ' ')
      .replace(/kaspa:[a-z0-9]{20,}/gi, ' ');
    const claimNums = (proseOnly.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter((n) => n > 0);
    const factNums = [
      facts.total_output_kas,
      facts.input_count,
      facts.output_count,
      Number(facts.blue_score) || 0,
      ...facts.outputs.map((o) => o.amount_kas),
    ];
    const amountLike = claimNums.filter((n) => n > 1);
    if (amountLike.length) {
      const matched = amountLike.some((n) =>
        factNums.some((f) => f > 0 && Math.abs(f - n) / Math.max(f, n) < 0.01)
      );
      if (matched) checks.push('At least one figure in the claim matches an on-chain value');
      else mismatches.push(`No figure in the claim (${amountLike.slice(0, 3).join(', ')}) matches the on-chain values (total output ${facts.total_output_kas} KAS, ${facts.input_count} inputs, ${facts.output_count} outputs)`);
    }

    if (/\b(rejected|not accepted|unconfirmed|pending)\b/i.test(claim) && facts.is_accepted) {
      mismatches.push('Claim says the transaction is not accepted, but the chain shows it as accepted');
    }

    // --- LLM cross-read for wording / omissions ---
    let llmNotes = [];
    let llmVerdict = 'verified';
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AUDITOR agent. Compare a claim against verified on-chain facts.

ON-CHAIN FACTS (ground truth):
${JSON.stringify(facts, null, 2)}

CLAIM MADE BY ANOTHER AGENT:
"""
${claim}
"""

${auditCriteria ? `EXTRA AUDIT CRITERIA: ${auditCriteria}` : ''}

Reject only if the claim states something that contradicts the facts, or invents data not present in the facts. Vagueness alone is not grounds for rejection.`,
        response_json_schema: {
          type: 'object',
          properties: {
            verdict: { type: 'string', enum: ['verified', 'rejected'] },
            notes: { type: 'array', items: { type: 'string' } },
          },
          required: ['verdict', 'notes'],
        },
      });
      llmVerdict = res?.verdict === 'rejected' ? 'rejected' : 'verified';
      llmNotes = Array.isArray(res?.notes) ? res.notes.slice(0, 5) : [];
    } catch (e) {
      llmNotes = ['LLM cross-read unavailable — verdict based on deterministic checks only'];
    }

    const verdict = mismatches.length || llmVerdict === 'rejected' ? 'rejected' : 'verified';

    return Response.json({
      verdict,
      facts,
      mismatches,
      reasons: [...checks, ...llmNotes],
    });
  } catch (error) {
    console.error('auditAgentClaim error:', error);
    return Response.json({ error: error.message || 'Audit failed' }, { status: 500 });
  }
}