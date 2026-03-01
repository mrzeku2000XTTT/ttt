// v2 - fixed address caching issue
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const address = body.address;

    if (!address) {
      return Response.json({ error: 'Address required' }, { status: 400 });
    }

    const cleanAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
    console.log('[getKaspaBalance] address:', cleanAddress);

    const response = await fetch(
      `https://api.kaspa.org/addresses/${encodeURIComponent(cleanAddress)}/balance`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      // Fallback: sum UTXOs
      console.warn('[getKaspaBalance] balance endpoint failed, trying UTXOs...');
      const utxoRes = await fetch(
        `https://api.kaspa.org/addresses/${encodeURIComponent(cleanAddress)}/utxos`,
        { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
      );
      if (!utxoRes.ok) throw new Error(`API error: ${utxoRes.status}`);
      const utxos = await utxoRes.json();
      const sompi = Array.isArray(utxos)
        ? utxos.reduce((acc, u) => acc + parseInt(u?.utxoEntry?.amount ?? 0), 0)
        : 0;
      console.log('[getKaspaBalance] UTXO-derived balance:', sompi / 1e8, 'KAS');
      return Response.json({ success: true, balanceKAS: sompi / 1e8, balanceSompi: sompi, address: cleanAddress });
    }

    const data = await response.json();
    console.log('[getKaspaBalance] raw response:', JSON.stringify(data));

    // API returns { "address": "kaspa:...", "balance": <sompi as number> }
    const sompi = typeof data.balance === 'number' ? data.balance : parseInt(String(data.balance ?? '0')) || 0;
    const balanceKAS = sompi / 1e8;

    console.log('[getKaspaBalance] result:', balanceKAS, 'KAS for', cleanAddress);

    return Response.json({ success: true, balanceKAS, balanceSompi: sompi, address: cleanAddress });

  } catch (error) {
    console.error('[getKaspaBalance] error:', error.message);
    return Response.json({ success: false, balanceKAS: 0, balanceSompi: 0, error: error.message });
  }
});