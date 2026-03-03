import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const KASPA_API = 'https://api.kaspa.org';

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_kivr_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

async function broadcastTransaction(signedTxHex) {
  const res = await fetch(`${KASPA_API}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signedTxHex }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Kaspa broadcast failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.transactionId || data.txid || data.id || null;
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
    const { action, phone, pin, slot } = body;

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 });
    }
    if (!phone) {
      return Response.json({ error: 'Missing phone number' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const normalizedPhone = normalizePhone(phone);

    // verify_pin
    if (action === 'verify_pin') {
      if (!pin) return Response.json({ valid: false, error: 'Missing PIN' });
      const pinHash = await hashPin(pin);
      const presets = await base44.asServiceRole.entities.KivRTransaction.filter({
        phone_number: normalizedPhone,
        status: 'active',
      });
      if (!presets || presets.length === 0) {
        return Response.json({ valid: false, error: 'No active presets for this number' });
      }
      const valid = presets[0].pin_hash === pinHash;
      return Response.json({ valid, preset_count: valid ? presets.length : 0 });
    }

    // get_presets
    if (action === 'get_presets') {
      if (!pin) return Response.json({ error: 'Missing PIN' }, { status: 400 });
      const pinHash = await hashPin(pin);
      const presets = await base44.asServiceRole.entities.KivRTransaction.filter({
        phone_number: normalizedPhone,
        status: 'active',
      });
      if (!presets || presets.length === 0) {
        return Response.json({ valid: false, error: 'No active presets found', presets: [] });
      }
      if (presets[0].pin_hash !== pinHash) {
        return Response.json({ valid: false, error: 'Invalid PIN', presets: [] });
      }
      const safePresets = presets
        .filter(p => p.uses_remaining !== 0)
        .sort((a, b) => (a.slot_number || 9) - (b.slot_number || 9))
        .map(p => ({
          slot: p.slot_number,
          label: p.label || `Preset ${p.slot_number}`,
          amount: p.amount,
          to_address_short: p.to_address ? `${p.to_address.slice(0, 6)}...${p.to_address.slice(-4)}` : 'unknown',
          uses_remaining: p.uses_remaining,
          id: p.id,
        }));
      return Response.json({ valid: true, presets: safePresets });
    }

    // broadcast
    if (action === 'broadcast') {
      if (!pin) return Response.json({ error: 'Missing PIN' }, { status: 400 });
      if (!slot) return Response.json({ error: 'Missing slot number' }, { status: 400 });
      const pinHash = await hashPin(pin);
      const slotNum = parseInt(slot, 10);
      const presets = await base44.asServiceRole.entities.KivRTransaction.filter({
        phone_number: normalizedPhone,
        status: 'active',
        slot_number: slotNum,
      });
      if (!presets || presets.length === 0) {
        return Response.json({ success: false, error: `No active preset in slot ${slotNum}` });
      }
      const preset = presets[0];
      if (preset.pin_hash !== pinHash) {
        return Response.json({ success: false, error: 'Invalid PIN' });
      }
      if (preset.uses_remaining === 0) {
        return Response.json({ success: false, error: 'This preset has been used up' });
      }
      if (!preset.signed_tx_hex) {
        return Response.json({ success: false, error: 'No signed transaction found. Please recreate this preset.' });
      }

      let txId;
      try {
        txId = await broadcastTransaction(preset.signed_tx_hex);
      } catch (broadcastErr) {
        return Response.json({ success: false, error: `Broadcast failed: ${broadcastErr.message}` });
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
        uses_remaining: newUses,
        message: `Successfully sent ${preset.amount} KAS`,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});