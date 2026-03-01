// Real Kaspa transaction: fetch UTXOs → sign with OKX SDK → submit to REST API
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

const KASPA_API = 'https://api.kaspa.org';
const FEE_SOMPI = 10000; // 0.0001 KAS minimum fee

Deno.serve(async (req) => {
  try {
    const { mnemonic, fromAddress, toAddress, amountKas } = await req.json();

    if (!mnemonic || !fromAddress || !toAddress || !amountKas) {
      return Response.json({ error: 'Missing required fields: mnemonic, fromAddress, toAddress, amountKas' }, { status: 400 });
    }

    const amountSompi = Math.round(parseFloat(amountKas) * 1e8);
    if (amountSompi <= 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    // 1. Derive private key
    const wallet = new KaspaWallet();
    const privateKey = await wallet.getDerivedPrivateKey({
      mnemonic: mnemonic.trim(),
      hdPath: "m/44'/111111'/0'/0/0",
    });

    // 2. Fetch UTXOs for sender
    const utxoRes = await fetch(`${KASPA_API}/addresses/${fromAddress}/utxos`);
    if (!utxoRes.ok) throw new Error(`Failed to fetch UTXOs: ${utxoRes.statusText}`);
    const utxos = await utxoRes.json();

    if (!utxos || utxos.length === 0) throw new Error('No UTXOs available. Balance may be 0.');

    // 3. Select UTXOs (greedy selection)
    const needed = amountSompi + FEE_SOMPI;
    let totalIn = 0;
    const selectedUtxos = [];

    // Sort by amount descending for efficiency
    utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));

    for (const utxo of utxos) {
      if (totalIn >= needed) break;
      selectedUtxos.push(utxo);
      totalIn += Number(utxo.utxoEntry.amount);
    }

    if (totalIn < needed) {
      throw new Error(`Insufficient balance. Need ${needed / 1e8} KAS (including fee), have ${totalIn / 1e8} KAS`);
    }

    const change = totalIn - amountSompi - FEE_SOMPI;

    // 4. Build inputs for OKX SDK
    const inputs = selectedUtxos.map(u => ({
      txId: u.outpoint.transactionId,
      vOut: u.outpoint.index,
      address: fromAddress,
      amount: Number(u.utxoEntry.amount),
    }));

    // 5. Build outputs
    const outputs = [{ address: toAddress, amount: amountSompi }];
    if (change > 0) outputs.push({ address: fromAddress, amount: change });

    // 6. Sign transaction with OKX SDK
    const signParams = {
      data: { inputs, outputs, address: fromAddress, fee: FEE_SOMPI },
      privateKey,
    };
    const signedTx = await wallet.signTransaction(signParams);
    const txData = typeof signedTx === 'string' ? JSON.parse(signedTx) : signedTx;

    // 7. Submit to Kaspa REST API
    const submitBody = {
      transaction: txData.transaction || txData,
      allowOrphan: false,
    };

    const submitRes = await fetch(`${KASPA_API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitBody),
    });

    const submitData = await submitRes.json();

    if (!submitRes.ok) {
      throw new Error(`Submit failed: ${JSON.stringify(submitData)}`);
    }

    return Response.json({
      success: true,
      txId: submitData.transactionId || submitData.txid || submitData,
      amountKas: parseFloat(amountKas),
      fee: FEE_SOMPI / 1e8,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});