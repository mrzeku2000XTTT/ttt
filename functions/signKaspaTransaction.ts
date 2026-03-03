import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    // Import OKX Kaspa SDK for signing
    const kaspa = await import('npm:okx-kaspa-sdk@0.1.7');
    
    // Create signer from private key
    const signer = new kaspa.PrivateSigner(privateKey);
    
    // Build transaction with proper structure
    const txBuilder = new kaspa.TransactionBuilder({
      inputs: transaction.inputs || [],
      outputs: transaction.outputs || [],
      changeAddress: transaction.change_address,
      feeRate: transaction.fee_rate || 1,
    });

    // Sign the transaction
    const signedTx = await txBuilder.sign(signer);

    // Return the signed transaction hex
    return Response.json({ 
      signedTx: signedTx.toHex(),
      txId: signedTx.id,
      status: 'success'
    });

  } catch (error) {
    console.error('Transaction signing error:', error);
    return Response.json({ 
      error: error.message || 'Failed to sign transaction' 
    }, { status: 500 });
  }
});