import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

const KASPA_API = 'https://api.kaspa.org';
const FEE_SOMPI = 10000;

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_kivr_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Look up presets by wallet address (in-app) OR phone number (IVR)
async function findPresets(base44, identifier) {
  // Try by from_address first (in-app call uses wallet address)
  let presets = await base44.asServiceRole.entities.KivRTransaction.filter({
    from_address: identifier,
    status: 'active',
  });
  if (presets && presets.length > 0) return presets;

  // Fallback: try phone number (external IVR)
  const normalizedPhone = identifier.replace(/\D/g, '');
  presets = await base44.asServiceRole.entities.KivRTransaction.filter({
    phone_number: normalizedPhone,
    status: 'active',
  });
  return presets || [];
}

// Build and broadcast a Kaspa transaction via REST API
async function sendKaspaTransaction(fromAddress, toAddress, amountKas) {
  const sompi = Math.round(amountKas * 1e8);

  // 1. Get UTXOs for sender
  const utxoRes = await fetch(`${KASPA_API}/addresses/${fromAddress}/utxos`);
  if (!utxoRes.ok) throw new Error(`Failed to fetch UTXOs: ${utxoRes.status}`);
  const utxos = await utxoRes.json();
  if (!utxos || utxos.length === 0) throw new Error('No UTXOs available. Insufficient balance.');

  // 2. Build transaction via kaspa API transaction builder
  const txPayload = {
    inputs: [],
    outputs: [{ address: toAddress, amount: sompi }],
    change_address: fromAddress,
    fee_rate: 1,
  };

  let totalInput = 0;
  for (const utxo of utxos) {
    txPayload.inputs.push({
      previous_outpoint: {
        transaction_id: utxo.outpoint.transactionId,
        index: utxo.outpoint.index,
      },
      sequence: 0,
      sig_op_count: 1,
    });
    totalInput += utxo.utxoEntry.amount;
    if (totalInput >= sompi + 10000) break; // include a small fee buffer
  }

  if (totalInput < sompi) {
    throw new Error(`Insufficient balance. Have ${totalInput / 1e8} KAS, need ${amountKas} KAS.`);
  }

  // 3. Submit transaction — note: without private key we can't sign here server-side
  // The preset must have been pre-signed. If not, return a helpful error.
  throw new Error('SERVER_SIGN_REQUIRED');
}

// Direct broadcast of pre-signed hex
async function broadcastSigned(signedTxHex) {
  const res = await fetch(`${KASPA_API}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signedTxHex }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Broadcast failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.transactionId || data.txid || data.id || null;
}

// Use the sendKaspaTransaction backend function to actually send
async function sendViaFunction(base44, fromAddress, toAddress, amountKas) {
  const res = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
    from_address: fromAddress,
    to_address: toAddress,
    amount: amountKas,
  });
  if (res?.error) throw new Error(res.error);
  return res?.txid || res?.transaction_id || res?.tx_id || 'sent';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, phone, pin, slot, privateKey } = body;

    if (!action) return Response.json({ error: 'Missing action' }, { status: 400 });
    if (!phone) return Response.json({ error: 'Missing identifier (phone or wallet address)' }, { status: 400 });

    const base44 = createClientFromRequest(req);

    // ── verify_pin ─────────────────────────────────────────────────────────
    if (action === 'verify_pin') {
      if (!pin) return Response.json({ valid: false, error: 'Missing PIN' });
      const pinHash = await hashPin(pin);
      const presets = await findPresets(base44, phone);
      if (!presets.length) return Response.json({ valid: false, error: 'No active presets found' });
      const valid = presets[0].pin_hash === pinHash;
      return Response.json({ valid, preset_count: valid ? presets.length : 0 });
    }

    // ── get_presets ────────────────────────────────────────────────────────
    if (action === 'get_presets') {
      if (!pin) return Response.json({ error: 'Missing PIN' }, { status: 400 });
      const pinHash = await hashPin(pin);
      const presets = await findPresets(base44, phone);
      if (!presets.length) return Response.json({ valid: false, error: 'No active presets found', presets: [] });
      if (presets[0].pin_hash !== pinHash) return Response.json({ valid: false, error: 'Invalid PIN', presets: [] });

      const safePresets = presets
        .filter(p => p.uses_remaining !== 0)
        .sort((a, b) => (a.slot_number || 9) - (b.slot_number || 9))
        .map(p => ({
          slot: p.slot_number,
          label: p.label || `Preset ${p.slot_number}`,
          amount: p.amount,
          to_address: p.to_address,
          to_address_short: p.to_address ? `${p.to_address.slice(0, 10)}...${p.to_address.slice(-6)}` : 'unknown',
          uses_remaining: p.uses_remaining,
          id: p.id,
        }));
      return Response.json({ valid: true, presets: safePresets });
    }

    // ── broadcast ──────────────────────────────────────────────────────────
    if (action === 'broadcast') {
      if (!pin) return Response.json({ error: 'Missing PIN' }, { status: 400 });
      if (!slot) return Response.json({ error: 'Missing slot number' }, { status: 400 });

      const pinHash = await hashPin(pin);
      const slotNum = parseInt(slot, 10);

      const allPresets = await findPresets(base44, phone);
      if (!allPresets.length) return Response.json({ success: false, error: 'No active presets found' });

      const preset = allPresets.find(p => p.slot_number === slotNum);
      if (!preset) return Response.json({ success: false, error: `No active preset in slot ${slotNum}` });
      if (preset.pin_hash !== pinHash) return Response.json({ success: false, error: 'Invalid PIN' });
      if (preset.uses_remaining === 0) return Response.json({ success: false, error: 'Preset already used up' });
      if (!preset.to_address) return Response.json({ success: false, error: 'Preset has no recipient address' });
      if (!preset.from_address) return Response.json({ success: false, error: 'Preset has no sender address' });

      let txId;

      if (!privateKey) {
        return Response.json({ success: false, error: 'No private key provided. Import your wallet to send transactions.' });
      }

      // Send transaction using private key via sendKaspaTransaction function
      try {
        const res = await base44.asServiceRole.functions.invoke('sendKaspaTransaction', {
          fromAddress: preset.from_address,
          toAddress: preset.to_address,
          amountKas: preset.amount,
          privateKey: privateKey,
        });
        if (res?.error) throw new Error(res.error);
        txId = res?.txId || res?.txid || res?.transaction_id || 'sent';
      } catch (sendErr) {
        return Response.json({ success: false, error: `Transaction failed: ${sendErr.message}` });
      }

      const newUses = preset.uses_remaining === -1 ? -1 : preset.uses_remaining - 1;
      const newStatus = newUses === 0 ? 'used' : 'active';

      await base44.asServiceRole.entities.KivRTransaction.update(preset.id, {
        status: newStatus,
        uses_remaining: newUses,
        broadcast_tx_id: txId,
        broadcast_at: new Date().toISOString(),
      });

      return Response.json({
        success: true,
        tx_id: txId,
        amount: preset.amount,
        label: preset.label,
        to_address: preset.to_address,
        from_address: preset.from_address,
        uses_remaining: newUses,
        message: `Successfully sent ${preset.amount} KAS to ${preset.to_address}`,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});