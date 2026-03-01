Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const address = body.address;

    if (!address) {
      return Response.json({ error: 'Address required' }, { status: 400 });
    }

    const cleanAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
    console.log('Fetching balance for:', cleanAddress);

    const response = await fetch(
      `https://api.kaspa.org/addresses/${cleanAddress}/balance`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      // Fallback: sum UTXOs
      console.warn('Balance endpoint failed, trying UTXOs...');
      const utxoRes = await fetch(
        `https://api.kaspa.org/addresses/${cleanAddress}/utxos`,
        { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
      );
      if (!utxoRes.ok) throw new Error(`UTXO endpoint error: ${utxoRes.status}`);
      const utxos = await utxoRes.json();
      const sompi = Array.isArray(utxos)
        ? utxos.reduce((acc, u) => acc + parseInt(u?.utxoEntry?.amount ?? 0), 0)
        : 0;
      return Response.json({ success: true, balanceKAS: sompi / 1e8, balanceSompi: sompi, address: cleanAddress });
    }

    const data = await response.json();
    console.log('Balance response:', JSON.stringify(data));

    // API returns { "address": "kaspa:...", "balance": <sompi as number> }
    const sompi = typeof data.balance === 'number' ? data.balance : parseInt(data.balance ?? '0') || 0;
    const balanceKAS = sompi / 1e8;

    console.log('Balance KAS:', balanceKAS);

    return Response.json({ success: true, balanceKAS, balanceSompi: sompi, address: cleanAddress });

  } catch (error) {
    console.error('getKaspaBalance error:', error.message);
    return Response.json({ success: false, balanceKAS: 0, balanceSompi: 0, error: error.message });
  }
});