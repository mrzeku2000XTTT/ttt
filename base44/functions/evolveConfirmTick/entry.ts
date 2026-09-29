import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { tn10Blocked } from '../../shared/evolveTn10Safety.ts';

// No timer, client TXID, or legacy CONFIRMED flag is blockchain evidence.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { intentId, readinessOnly } = await req.json();
    if (readinessOnly) return Response.json(tn10Blocked());
    if (!intentId) return Response.json({ error: 'MISSING_INTENT_ID' }, { status: 400 });
    const intent = await base44.entities.EvolvePaymentIntent.get(intentId);
    if (!intent) return Response.json({ error: 'INTENT_NOT_FOUND' }, { status: 404 });
    // Keep unresolved intents and reservations unchanged. Do not infer rejection.
    return Response.json(tn10Blocked({ intentId, status: intent.status, txId: intent.tx_id, confirmations: null }));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}