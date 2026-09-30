import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Kaspa transaction signing.
 *
 * This previously imported `npm:okx-kaspa-sdk@0.1.7`, a package that does not
 * exist on npm — so the function never bundled and the whole deployment failed.
 * No Kaspa transaction-builder SDK is available in this runtime, and the Kaspa
 * WASM runtime is not supported here either, so the transaction cannot be
 * assembled server-side.
 *
 * The app's working Kaspa sends (sendKaspaTransaction, krc20Transfer,
 * slobzTestnetSend, splitChestUTXO) build and sign their transactions locally
 * with @noble/curves and submit them to the Kaspa REST API directly. Use those
 * instead of this endpoint.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (req.method !== 'POST') {
      return Response.json({ error: 'POST required' }, { status: 400 });
    }

    const { privateKey, transaction } = await req.json();

    if (!privateKey || !transaction) {
      return Response.json({ error: 'Missing privateKey or transaction' }, { status: 400 });
    }

    return Response.json(
      {
        error:
          'Server-side transaction signing is unavailable: no Kaspa transaction-builder SDK exists for this runtime. Use the sendKaspaTransaction function, which builds and signs the transaction locally.',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Transaction signing error:', error);
    return Response.json({
      error: error.message || 'Failed to sign transaction',
    }, { status: 500 });
  }
});