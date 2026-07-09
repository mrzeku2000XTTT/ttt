// v4 — cross-checks zero balances against UTXOs to defeat stale /balance responses.
// The Kaspa /balance endpoint can return { balance: 0 } (200 OK) while the UTXO
// set still holds funds — a known API quirk during sync/hiccups. We never trust a
// zero from /balance without verifying against UTXOs first.
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
      return Response.json({ success: false, balanceKAS: null, balanceSompi: null, error: 'Invalid address format', address: cleanAddress });
    }

    console.log('[getKaspaBalance] address:', cleanAddress);

    // Helper: sum UTXOs for an address (used as both fallback and zero-verification)
    const getUtxoBalance = async () => {
      const utxoRes = await fetch(
        `https://api.kaspa.org/addresses/${encodeURIComponent(cleanAddress)}/utxos`,
        { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000) }
      );
      if (!utxoRes.ok) throw new Error(`UTXO API error: ${utxoRes.status}`);
      const utxos = await utxoRes.json();
      return Array.isArray(utxos)
        ? utxos.reduce((acc, u) => acc + BigInt(u?.utxoEntry?.amount ?? 0), 0n)
        : 0n;
    };

    // Try up to 2 times with 15s timeout each
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(
          `https://api.kaspa.org/addresses/${encodeURIComponent(cleanAddress)}/balance`,
          { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000) }
        );

        if (response.ok) {
          const data = await response.json();
          const sompi = typeof data.balance === 'number'
            ? BigInt(data.balance)
            : BigInt(String(data.balance ?? '0') || '0');
          const balanceKAS = Number(sompi) / 1e8;

          // CRITICAL: The /balance endpoint can return 0 (200 OK) while the UTXO
          // set still holds funds (stale sync). Cross-check any zero against UTXOs
          // before returning it — this is what was causing the "0 balance" bug.
          if (sompi === 0n) {
            console.warn('[getKaspaBalance] /balance returned 0 — verifying against UTXOs...');
            try {
              const utxoSompi = await getUtxoBalance();
              if (utxoSompi > 0n) {
                console.log('[getKaspaBalance] ✓ UTXO cross-check recovered balance:', Number(utxoSompi) / 1e8, 'KAS (stale /balance was 0)');
                return Response.json({ success: true, balanceKAS: Number(utxoSompi) / 1e8, balanceSompi: Number(utxoSompi), address: cleanAddress, verified: 'utxo' });
              }
              console.log('[getKaspaBalance] UTXO cross-check also 0 — balance is genuinely empty');
            } catch (utxoErr) {
              console.warn('[getKaspaBalance] UTXO cross-check failed:', utxoErr.message);
            }
          }

          console.log('[getKaspaBalance] result:', balanceKAS, 'KAS for', cleanAddress);
          return Response.json({ success: true, balanceKAS, balanceSompi: Number(sompi), address: cleanAddress });
        }

        // /balance returned non-200 — fall through to UTXO fallback
        console.warn('[getKaspaBalance] /balance endpoint returned', response.status, '- falling back to UTXOs...');
        const utxoSompi = await getUtxoBalance();
        console.log('[getKaspaBalance] UTXO-derived balance:', Number(utxoSompi) / 1e8, 'KAS');
        return Response.json({ success: true, balanceKAS: Number(utxoSompi) / 1e8, balanceSompi: Number(utxoSompi), address: cleanAddress, verified: 'utxo' });

      } catch (fetchErr) {
        console.warn(`[getKaspaBalance] Attempt ${attempt + 1} failed:`, fetchErr.message);
        if (attempt === 1) {
          // Last resort: try UTXOs once more before giving up
          try {
            const utxoSompi = await getUtxoBalance();
            console.log('[getKaspaBalance] final UTXO fallback balance:', Number(utxoSompi) / 1e8, 'KAS');
            return Response.json({ success: true, balanceKAS: Number(utxoSompi) / 1e8, balanceSompi: Number(utxoSompi), address: cleanAddress, verified: 'utxo' });
          } catch (finalErr) {
            throw finalErr;
          }
        }
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