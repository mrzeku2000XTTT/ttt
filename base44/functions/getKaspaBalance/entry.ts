// v3 - longer timeout + retry
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const address = body.address;

    if (!address) {
      return Response.json({ error: 'Address required' }, { status: 400 });
    }

    const cleanAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
    
    // Validate format before calling API
    if (!/^kaspa:[a-z0-9]{61,63}$/.test(cleanAddress)) {
      console.error('[getKaspaBalance] Invalid address format:', cleanAddress.slice(0, 30), 'len=', cleanAddress.length);
      return Response.json({ success: false, balanceKAS: 0, balanceSompi: 0, error: 'Invalid address format', address: cleanAddress });
    }

    console.log('[getKaspaBalance] address:', cleanAddress);

    // Try up to 2 times with 15s timeout each
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(
          `https://api.kaspa.org/addresses/${encodeURIComponent(cleanAddress)}/balance`,
          { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000) }
        );

        if (!response.ok) {
          // Try UTXO fallback
          console.warn('[getKaspaBalance] balance endpoint returned', response.status, '- trying UTXOs...');
          const utxoRes = await fetch(
            `https://api.kaspa.org/addresses/${encodeURIComponent(cleanAddress)}/utxos`,
            { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000) }
          );
          if (!utxoRes.ok) throw new Error(`UTXO API error: ${utxoRes.status}`);
          const utxos = await utxoRes.json();
          const sompi = Array.isArray(utxos)
            ? utxos.reduce((acc, u) => acc + parseInt(u?.utxoEntry?.amount ?? 0), 0)
            : 0;
          console.log('[getKaspaBalance] UTXO-derived balance:', sompi / 1e8, 'KAS');
          return Response.json({ success: true, balanceKAS: sompi / 1e8, balanceSompi: sompi, address: cleanAddress });
        }

        const data = await response.json();
        const sompi = typeof data.balance === 'number' ? data.balance : parseInt(String(data.balance ?? '0')) || 0;
        const balanceKAS = sompi / 1e8;

        console.log('[getKaspaBalance] result:', balanceKAS, 'KAS for', cleanAddress);
        return Response.json({ success: true, balanceKAS, balanceSompi: sompi, address: cleanAddress });

      } catch (fetchErr) {
        console.warn(`[getKaspaBalance] Attempt ${attempt + 1} failed:`, fetchErr.message);
        if (attempt === 1) throw fetchErr;
        // Wait 1s before retry
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Should not reach here
    return Response.json({ success: false, balanceKAS: 0, balanceSompi: 0, error: 'Exhausted retries', address: cleanAddress });

  } catch (error) {
    console.error('[getKaspaBalance] error:', error.message);
    return Response.json({ success: false, balanceKAS: null, balanceSompi: null, error: error.message });
  }
});