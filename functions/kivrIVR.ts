/**
 * KivR IVR Backend
 * 
 * This backend function is called by Asterisk AGI scripts via HTTP.
 * 
 * ASTERISK AGI SETUP (dialplan in extensions.conf):
 * 
 *   [kivr-ivr]
 *   exten => _X.,1,Answer()
 *   same  => n,AGI(agi://your-server/agi/kivr.agi)
 *   ; OR use EAGI over HTTP via curl:
 *   same  => n,AGI(eagi://localhost/agi-bin/kivr_bridge.sh)
 * 
 * SIMPLER APPROACH - Asterisk calls this HTTP endpoint directly via AGI script:
 * 
 *   kivr_bridge.sh (on Asterisk server):
 *   #!/bin/bash
 *   CALLERID=$(agi_callerid from stdin)
 *   curl -X POST https://<your-base44-fn-url>/ \
 *     -H "Content-Type: application/json" \
 *     -d "{\"action\":\"$1\",\"phone\":\"$2\",\"pin\":\"$3\",\"slot\":\"$4\"}"
 * 
 * ENDPOINTS / actions:
 *   POST / { action: "get_presets", phone: "+1234567890", pin: "1234" }
 *     -> returns list of active presets for IVR menu
 * 
 *   POST / { action: "broadcast", phone: "+1234567890", pin: "1234", slot: 1 }
 *     -> validates PIN, broadcasts the pre-signed tx, returns txid
 * 
 *   POST / { action: "verify_pin", phone: "+1234567890", pin: "1234" }
 *     -> returns { valid: true/false }
 * 
 * KASPA BROADCAST API:
 *   POST https://api.kaspa.org/transactions
 *   Body: { transaction: { ... } }  (raw tx hex or object)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const KASPA_API = 'https://api.kaspa.org';

// Simple PIN hash using Web Crypto (SHA-256)
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_kivr_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize phone number for consistent matching
function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

// Broadcast a raw signed transaction to Kaspa network
async function broadcastTransaction(signedTxHex) {
  // The Kaspa REST API accepts hex-encoded transactions
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
  // API returns { transactionId: "..." } or { txid: "..." }
  return data.transactionId || data.txid || data.id || null;
}

Deno.serve(async (req) => {
  // Allow CORS for Asterisk AGI HTTP requests
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

    // ── ACTION: verify_pin ──────────────────────────────────────────────────
    if (action === 'verify_pin') {
      if (!pin) return Response.json({ valid: false, error: 'Missing PIN' });

      const pinHash = await hashPin(pin);

      // Find any active preset for this phone with matching PIN
      const presets = await base44.asServiceRole.entities.KivRTransaction.filter({
        phone_number: normalizedPhone,
        status: 'active',
      });

      if (!presets || presets.length === 0) {
        return Response.json({ valid: false, error: 'No active presets for this number' });
      }

      // Check PIN against the stored hash (all presets for same phone share a PIN)
      const preset = presets[0];
      const valid = preset.pin_hash === pinHash;

      return Response.json({ valid, preset_count: valid ? presets.length : 0 });
    }

    // ── ACTION: get_presets ─────────────────────────────────────────────────
    if (action === 'get_presets') {
      if (!pin) return Response.json({ error: 'Missing PIN' }, { status: 400 });

      const pinHash = await hashPin(pin);

      const presets = await base44.asServiceRole.entities.KivRTransaction.filter({
        phone_number: normalizedPhone,
        status: 'active',
      });

      if (!presets || presets.length === 0) {
        return Response.json({ 
          valid: false,
          error: 'No active presets found for this phone number',
          presets: []
        });
      }

      // Validate PIN
      const pinValid = presets[0].pin_hash === pinHash;
      if (!pinValid) {
        return Response.json({ valid: false, error: 'Invalid PIN', presets: [] });
      }

      // Return safe preset info for IVR menu (no private data)
      const safePresets = presets
        .filter(p => p.uses_remaining !== 0)
        .sort((a, b) => (a.slot_number || 9) - (b.slot_number || 9))
        .map(p => ({
          slot: p.slot_number,
          label: p.label || `Preset ${p.slot_number}`,
          amount: p.amount,
          to_address_short: p.to_address
            ? `${p.to_address.slice(0, 6)}...${p.to_address.slice(-4)}`
            : 'unknown',
          uses_remaining: p.uses_remaining,
          id: p.id,
        }));

      return Response.json({ valid: true, presets: safePresets });
    }

    // ── ACTION: broadcast ───────────────────────────────────────────────────
    if (action === 'broadcast') {
      if (!pin) return Response.json({ error: 'Missing PIN' }, { status: 400 });
      if (!slot) return Response.json({ error: 'Missing slot number' }, { status: 400 });

      const pinHash = await hashPin(pin);
      const slotNum = parseInt(slot, 10);

      // Find the specific preset
      const presets = await base44.asServiceRole.entities.KivRTransaction.filter({
        phone_number: normalizedPhone,
        status: 'active',
        slot_number: slotNum,
      });

      if (!presets || presets.length === 0) {
        return Response.json({
          success: false,
          error: `No active preset in slot ${slotNum} for this phone number`,
        });
      }

      const preset = presets[0];

      // Validate PIN
      if (preset.pin_hash !== pinHash) {
        return Response.json({ success: false, error: 'Invalid PIN' });
      }

      // Check uses remaining
      if (preset.uses_remaining === 0) {
        return Response.json({ success: false, error: 'This preset has been used up' });
      }

      // Check signed tx exists
      if (!preset.signed_tx_hex) {
        return Response.json({
          success: false,
          error: 'No signed transaction found for this preset. Please recreate it.',
        });
      }

      // Broadcast the pre-signed transaction to Kaspa network
      let txId;
      try {
        txId = await broadcastTransaction(preset.signed_tx_hex);
      } catch (broadcastErr) {
        console.error('Broadcast failed:', broadcastErr.message);
        return Response.json({
          success: false,
          error: `Broadcast failed: ${broadcastErr.message}`,
        });
      }

      // Update preset: decrement uses, mark txid, set status if fully used
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
    console.error('KivR IVR error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});