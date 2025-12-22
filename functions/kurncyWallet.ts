import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, pin, mnemonic, privateKey, network = 'mainnet' } = await req.json();

    if (action === 'create') {
      // Create new wallet with mnemonic
      if (!pin) {
        return Response.json({ error: 'PIN is required for encryption' }, { status: 400 });
      }

      // Generate random mnemonic (12 words)
      const { Mnemonic } = await import('npm:@kaspa/bip32@0.1.0');
      const mnemonicObj = new Mnemonic();
      const mnemonic = mnemonicObj.phrase;

      // Derive wallet from mnemonic
      const { PrivateKey, PublicKey, Address } = await import('npm:@kaspa/core-lib@0.1.0');
      const privateKey = PrivateKey.fromMnemonic(mnemonic);
      const publicKey = privateKey.toPublicKey();
      const address = Address.fromPublicKey(publicKey, network);

      // Encrypt private key with PIN
      const encryptedPrivateKey = await encryptWithPIN(privateKey.toString(), pin);

      return Response.json({
        success: true,
        address: address.toString(),
        mnemonic,
        privateKey: encryptedPrivateKey,
        network
      });
    }

    if (action === 'import-mnemonic') {
      if (!mnemonic || !pin) {
        return Response.json({ error: 'Mnemonic and PIN are required' }, { status: 400 });
      }

      const { PrivateKey, PublicKey, Address } = await import('npm:@kaspa/core-lib@0.1.0');
      const privateKey = PrivateKey.fromMnemonic(mnemonic);
      const publicKey = privateKey.toPublicKey();
      const address = Address.fromPublicKey(publicKey, network);

      const encryptedPrivateKey = await encryptWithPIN(privateKey.toString(), pin);

      return Response.json({
        success: true,
        address: address.toString(),
        privateKey: encryptedPrivateKey,
        network
      });
    }

    if (action === 'import-privatekey') {
      if (!privateKey || !pin) {
        return Response.json({ error: 'Private key and PIN are required' }, { status: 400 });
      }

      const { PrivateKey, PublicKey, Address } = await import('npm:@kaspa/core-lib@0.1.0');
      const privKey = new PrivateKey(privateKey);
      const publicKey = privKey.toPublicKey();
      const address = Address.fromPublicKey(publicKey, network);

      const encryptedPrivateKey = await encryptWithPIN(privateKey, pin);

      return Response.json({
        success: true,
        address: address.toString(),
        privateKey: encryptedPrivateKey,
        network
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Wallet error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function encryptWithPIN(data, pin) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const pinBuffer = encoder.encode(pin);

  // Derive key from PIN using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}