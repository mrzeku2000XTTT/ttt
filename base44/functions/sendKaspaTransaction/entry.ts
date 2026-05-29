// Real Kaspa transaction: fetch UTXOs → sign with OKX SDK → submit to REST API
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

const KASPA_API = 'https://api.kaspa.org';
const FEE_SOMPI = 10000; // 0.0001 KAS minimum fee

Deno.serve(async (req) => {
  try {
    const { mnemonic, privateKey: inputPrivateKey, fromAddress, toAddress, amountKas, sendAll } = await req.json();

    if ((!mnemonic && !inputPrivateKey) || !fromAddress || !toAddress || (!amountKas && !sendAll)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure addresses have kaspa: prefix
    const normalizedFromAddress = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;
    const normalizedToAddress = toAddress.startsWith('kaspa:') ? toAddress : `kaspa:${toAddress}`;

    let amountSompi = amountKas ? Math.round(parseFloat(amountKas) * 1e8) : 0;
    if (!sendAll && amountSompi <= 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    // 1. Get private key — either directly or derive from mnemonic
    let privateKey = inputPrivateKey;
    const wallet = new KaspaWallet();
    if (!privateKey) {
      privateKey = await wallet.getDerivedPrivateKey({
        mnemonic: mnemonic.trim(),
        hdPath: "m/44'/111111'/0'/0/0",
      });
    }

    const derived = await wallet.getNewAddress({ privateKey });
    const derivedAddress = (derived.address || derived).startsWith('kaspa:') ? (derived.address || derived) : `kaspa:${derived.address || derived}`;
    if (derivedAddress !== normalizedFromAddress) {
      throw new Error('This wallet key does not match the selected sending address. Re-import the wallet seed phrase and try again.');
    }

    // 2. Fetch UTXOs (private key is now verified above)
    const utxoRes = await fetch(`${KASPA_API}/addresses/${normalizedFromAddress}/utxos`);
    if (!utxoRes.ok) {
      const txt = await utxoRes.text();
      throw new Error(`Failed to fetch UTXOs: ${utxoRes.status} ${txt}`);
    }
    const utxos = await utxoRes.json();
    if (!utxos || utxos.length === 0) throw new Error('No UTXOs. Your balance may be 0 or unconfirmed.');

    // 3. Greedy UTXO selection — prefer largest UTXOs first to minimize storage mass
    // Max ~80 UTXOs to stay well under the 100000 storage mass limit
    const MAX_UTXOS = 80;
    let totalIn = 0;
    const selectedUtxos = [];
    utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));

    if (sendAll) {
      // Send ALL: use all UTXOs (up to limit), send everything minus fee
      for (const utxo of utxos) {
        if (selectedUtxos.length >= MAX_UTXOS) break;
        selectedUtxos.push(utxo);
        totalIn += Number(utxo.utxoEntry.amount);
      }
      amountSompi = totalIn - FEE_SOMPI;
      if (amountSompi <= 0) throw new Error('Balance too low to cover fee');
    } else {
      const needed = amountSompi + FEE_SOMPI;
      for (const utxo of utxos) {
        if (totalIn >= needed) break;
        if (selectedUtxos.length >= MAX_UTXOS) break;
        selectedUtxos.push(utxo);
        totalIn += Number(utxo.utxoEntry.amount);
      }
      if (totalIn < needed) {
        throw new Error(`Insufficient balance. Need ${(needed / 1e8).toFixed(4)} KAS (incl. fee), have ${(totalIn / 1e8).toFixed(4)} KAS`);
      }
    }

    const change = sendAll ? 0 : (totalIn - amountSompi - FEE_SOMPI);

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

    // 6. Sign with OKX SDK
    const signResult = await wallet.signTransaction({
      data: { inputs, outputs, address: normalizedFromAddress, fee: FEE_SOMPI },
      privateKey,
    });

    // The OKX SDK may return a string or object
    const signed = typeof signResult === 'string' ? JSON.parse(signResult) : signResult;
    console.log('OKX sign result keys:', Object.keys(signed));

    // 7. Extract the raw transaction object and submit
    // OKX SDK wraps result – handle both shapes
    const rawTx = signed.transaction ?? signed.tx ?? signed;
    console.log('rawTx keys:', Object.keys(rawTx));

    const submitRes = await fetch(`${KASPA_API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
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
    const msg = error?.message || String(error) || 'Unknown error';
    console.error('sendKaspaTransaction error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
});