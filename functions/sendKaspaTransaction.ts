// Real Kaspa transaction: fetch UTXOs → sign with OKX SDK → submit to REST API
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

const KASPA_API = 'https://api.kaspa.org';
const FEE_SOMPI = 10000; // 0.0001 KAS minimum fee

Deno.serve(async (req) => {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }
    
    const { mnemonic, fromAddress, toAddress, amountKas } = body;

    if (!mnemonic || !fromAddress || !toAddress || !amountKas) {
      return Response.json({ error: 'Missing required fields: mnemonic, fromAddress, toAddress, amountKas' }, { status: 400 });
    }
    
    if (typeof amountKas !== 'number' || amountKas <= 0) {
      return Response.json({ error: 'amountKas must be a positive number' }, { status: 400 });
    }
    
    if (typeof mnemonic !== 'string' || mnemonic.trim().split(/\s+/).length < 12) {
      return Response.json({ error: 'Invalid mnemonic phrase' }, { status: 400 });
    }

    // Ensure addresses have kaspa: prefix
    const normalizedFromAddress = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;
    const normalizedToAddress = toAddress.startsWith('kaspa:') ? toAddress : `kaspa:${toAddress}`;

    const amountSompi = Math.round(parseFloat(amountKas) * 1e8);
    if (amountSompi <= 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    // 1. Derive private key
    let wallet, privateKey;
    try {
     wallet = new KaspaWallet();
     privateKey = await wallet.getDerivedPrivateKey({
       mnemonic: mnemonic.trim(),
       hdPath: "m/44'/111111'/0'/0/0",
     });
    } catch (e) {
     throw new Error(`Failed to derive private key: ${e.message}`);
    }

    // 2. Fetch UTXOs
    const utxoRes = await fetch(`${KASPA_API}/addresses/${normalizedFromAddress}/utxos`);
    if (!utxoRes.ok) {
      const txt = await utxoRes.text();
      throw new Error(`Failed to fetch UTXOs: ${utxoRes.status} ${txt}`);
    }
    const utxos = await utxoRes.json();
    if (!utxos || utxos.length === 0) throw new Error('No UTXOs. Your balance may be 0 or unconfirmed.');

    // 3. Greedy UTXO selection
    const needed = amountSompi + FEE_SOMPI;
    let totalIn = 0;
    const selectedUtxos = [];
    utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
    for (const utxo of utxos) {
      if (totalIn >= needed) break;
      selectedUtxos.push(utxo);
      totalIn += Number(utxo.utxoEntry.amount);
    }
    if (totalIn < needed) {
      throw new Error(`Insufficient balance. Need ${(needed / 1e8).toFixed(4)} KAS (incl. fee), have ${(totalIn / 1e8).toFixed(4)} KAS`);
    }

    const change = totalIn - amountSompi - FEE_SOMPI;

    // 4. Build inputs for OKX SDK
    const inputs = selectedUtxos.map(u => ({
      txId: u.outpoint.transactionId,
      vOut: u.outpoint.index,
      address: normalizedFromAddress,
      amount: Number(u.utxoEntry.amount),
    }));

    // 5. Build outputs
    const outputs = [{ address: normalizedToAddress, amount: amountSompi }];
    if (change > 0) outputs.push({ address: normalizedFromAddress, amount: change });

    // 6. Build transaction for Kaspa network
    // Kaspa transaction format expects: inputs with scriptPublicKey, outputs
    const txIns = selectedUtxos.map((u, idx) => ({
      previousOutpoint: {
        transactionId: u.outpoint.transactionId,
        index: u.outpoint.index,
      },
      signatureScript: '', // Will be filled after signing
    }));

    const txOuts = outputs.map(o => ({
      value: o.amount.toString(),
      scriptPublicKey: {
        version: 0,
        script: o.address, // Kaspa expects address in script field for now
      },
    }));

    // 7. Sign transaction with OKX SDK
    const signResult = await wallet.signTransaction({
      data: { inputs, outputs, address: normalizedFromAddress, fee: FEE_SOMPI },
      privateKey,
    });

    // Parse OKX result
    const signed = typeof signResult === 'string' ? JSON.parse(signResult) : signResult;
    const signedTx = signed.transaction || signed.tx || signed;

    // 8. Submit to Kaspa API
    const submitRes = await fetch(`${KASPA_API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signedTx),
    });

    const submitText = await submitRes.text();
    let submitData;
    try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }
    console.log('submit status:', submitRes.status, 'body:', submitText.slice(0, 300));

    if (!submitRes.ok) {
      throw new Error(`Submit failed (${submitRes.status}): ${submitText.slice(0, 200)}`);
    }

    return Response.json({
      success: true,
      txId: submitData.transactionId || submitData.txid || submitData,
      amountKas: parseFloat(amountKas),
      fee: FEE_SOMPI / 1e8,
    });

  } catch (error) {
    console.error('sendKaspaTransaction error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});