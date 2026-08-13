// Verifies that the caller really owns a KNS domain, then records the site /
// X-profile claim so a "talk to the real deal" KACHAT button can appear.
//
// Two independent checks must both pass:
//   1. KNS registry says `address` currently owns `kns_domain`
//   2. `signature` is a valid Schnorr signature over the challenge, made by the
//      x-only pubkey encoded inside that same Kaspa address
//
// GET-style action "challenge" returns the exact string the wallet must sign.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { schnorr } from 'npm:@noble/curves@1.9.7/secp256k1';
import { blake2b } from 'npm:@noble/hashes@1.8.0/blake2b';
import { sha256 } from 'npm:@noble/hashes@1.8.0/sha256';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/** Decode a kaspa: bech32m address to its payload bytes (version + pubkey). */
function decodeAddress(addr: string): Uint8Array | null {
  const clean = addr.includes(':') ? addr.split(':')[1] : addr;
  const data: number[] = [];
  for (const ch of clean.toLowerCase()) {
    const v = CHARSET.indexOf(ch);
    if (v === -1) return null;
    data.push(v);
  }
  const payload = data.slice(0, -8); // drop checksum
  // 5-bit -> 8-bit
  let acc = 0, bits = 0;
  const out: number[] = [];
  for (const v of payload) {
    acc = (acc << 5) | v;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

/** x-only pubkey for a standard schnorr (type 0) kaspa address. */
function pubkeyFromAddress(addr: string): Uint8Array | null {
  const payload = decodeAddress(addr);
  if (!payload || payload.length < 33) return null;
  if (payload[0] !== 0) return null; // only schnorr addresses can sign messages
  return payload.slice(1, 33);
}

/** Candidate message hashes — wallets differ slightly in personal-message hashing. */
function candidateHashes(message: string): Uint8Array[] {
  const msg = new TextEncoder().encode(message);
  const keyed = blake2b(msg, { dkLen: 32, key: new TextEncoder().encode('PersonalMessageSigningHash') });
  const plain = blake2b(msg, { dkLen: 32 });
  return [keyed, plain, sha256(msg), sha256(sha256(msg))];
}

function hexToBytes(hex: string): Uint8Array | null {
  const h = hex.trim().replace(/^0x/, '');
  if (h.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(h)) return null;
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Ask the KNS registry who currently owns the domain. */
async function knsOwner(domain: string): Promise<string | null> {
  const name = domain.trim().toLowerCase().replace(/^@/, '');
  const res = await fetch(`https://api.knsdomains.org/mainnet/api/v1/${encodeURIComponent(name)}/owner`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.data?.owner || json?.owner || null;
}

function challengeFor(siteUrl: string, domain: string, nonce: string) {
  return `TTT KACHAT ownership proof\nSite: ${siteUrl}\nKNS: ${domain}\nNonce: ${nonce}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, site_url, site_name, kns_domain, address, signature, challenge, owner_display } = body;

    if (!site_url || !kns_domain) {
      return Response.json({ success: false, error: 'site_url and kns_domain required' }, { status: 400, headers: CORS });
    }

    // Step 1 — hand back the exact string the wallet must sign.
    if (action === 'challenge') {
      const owner = await knsOwner(kns_domain);
      if (!owner) {
        return Response.json({ success: false, error: `KNS domain "${kns_domain}" not found` }, { status: 404, headers: CORS });
      }
      const nonce = crypto.randomUUID();
      return Response.json(
        { success: true, owner, challenge: challengeFor(site_url, kns_domain, nonce) },
        { headers: CORS },
      );
    }

    // Step 2 — verify the signed challenge and store the claim.
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Sign in to claim' }, { status: 401, headers: CORS });
    if (!address || !signature || !challenge) {
      return Response.json({ success: false, error: 'address, signature and challenge required' }, { status: 400, headers: CORS });
    }

    const owner = await knsOwner(kns_domain);
    if (!owner) {
      return Response.json({ success: false, error: 'KNS domain not found' }, { status: 404, headers: CORS });
    }
    if (owner.trim().toLowerCase() !== String(address).trim().toLowerCase()) {
      return Response.json(
        { success: false, error: `That wallet does not own ${kns_domain}. Owner is ${owner.slice(0, 18)}…` },
        { status: 403, headers: CORS },
      );
    }

    const pubkey = pubkeyFromAddress(address);
    if (!pubkey) {
      return Response.json({ success: false, error: 'Address must be a standard kaspa: schnorr address' }, { status: 400, headers: CORS });
    }
    const sigBytes = hexToBytes(signature) || (() => {
      try { return Uint8Array.from(atob(signature), c => c.charCodeAt(0)); } catch { return null; }
    })();
    if (!sigBytes || sigBytes.length < 64) {
      return Response.json({ success: false, error: 'Malformed signature' }, { status: 400, headers: CORS });
    }
    const sig64 = sigBytes.slice(sigBytes.length - 64);

    const ok = candidateHashes(challenge).some((h) => {
      try { return schnorr.verify(sig64, h, pubkey); } catch { return false; }
    });
    if (!ok) {
      return Response.json({ success: false, error: 'Signature did not match that wallet' }, { status: 403, headers: CORS });
    }

    // Replace any earlier claim for this site so there is exactly one owner.
    const existing = await base44.asServiceRole.entities.SiteOwnerClaim.filter({ site_url });
    for (const c of existing) {
      await base44.asServiceRole.entities.SiteOwnerClaim.delete(c.id);
    }

    const claim = await base44.asServiceRole.entities.SiteOwnerClaim.create({
      site_url,
      site_name: site_name || '',
      kns_domain: kns_domain.trim().toLowerCase(),
      owner_address: address,
      owner_email: user.email,
      owner_display: owner_display || kns_domain,
      verified: true,
      verified_at: new Date().toISOString(),
      challenge,
      signature,
    });

    return Response.json({ success: true, claim }, { headers: CORS });
  } catch (error) {
    console.error('claimKnsOwnership error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500, headers: CORS });
  }
});