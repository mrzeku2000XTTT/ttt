import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { tn10Blocked } from '../../shared/evolveTn10Safety.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { intentId } = await req.json();
    if (!intentId) return Response.json({ error: 'MISSING_INTENT_ID' }, { status: 400 });
    const intent = await base44.entities.EvolvePaymentIntent.get(intentId);
    if (!intent) return Response.json({ error: 'INTENT_NOT_FOUND' }, { status: 404 });
    // Legacy CONFIRMED/SETTLED flags may originate from the deleted timer.
    // Do not replay, transfer resources, or certify these as real settlement.
    return Response.json(tn10Blocked({ intentId, status: intent.status }), { status: 503 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}