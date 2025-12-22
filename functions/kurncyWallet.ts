import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Mnemonic, PrivateKey, Address } from 'npm:@kaspa/wallet@0.1.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, pin, mnemonic, privateKey, network = 'mainnet' } = await req.json();

    if (action === 'create') {
      if (!pin) {
        return Response.json({ error: 'PIN is required for encryption' }, { status: 400 });
      }

      // Generate 12-word mnemonic
      const mnemonicPhrase = Mnemonic.random(12).phrase;
      
      // Derive private key from mnemonic
      const privKey = new PrivateKey(mnemonicPhrase);
      const publicKey = privKey.toPublicKey();
      const address = Address.fromPublicKey(publicKey, network);

      // Encrypt private key
      const encryptedPrivateKey = await encryptWithPIN(privKey.toString(), pin);

      return Response.json({
        success: true,
        address: address.toString(),
        mnemonic: mnemonicPhrase,
        privateKey: encryptedPrivateKey,
        publicKey: publicKey.toString(),
        network
      });
    }

    if (action === 'import-mnemonic') {
      if (!mnemonic || !pin) {
        return Response.json({ error: 'Mnemonic and PIN are required' }, { status: 400 });
      }

      const privKey = new PrivateKey(mnemonic);
      const publicKey = privKey.toPublicKey();
      const address = Address.fromPublicKey(publicKey, network);

      const encryptedPrivateKey = await encryptWithPIN(privKey.toString(), pin);

      return Response.json({
        success: true,
        address: address.toString(),
        privateKey: encryptedPrivateKey,
        publicKey: publicKey.toString(),
        network
      });
    }

    if (action === 'import-privatekey') {
      if (!privateKey || !pin) {
        return Response.json({ error: 'Private key and PIN are required' }, { status: 400 });
      }

      const privKey = new PrivateKey(privateKey);
      const publicKey = privKey.toPublicKey();
      const address = Address.fromPublicKey(publicKey, network);

      const encryptedPrivateKey = await encryptWithPIN(privateKey, pin);

      return Response.json({
        success: true,
        address: address.toString(),
        privateKey: encryptedPrivateKey,
        publicKey: publicKey.toString(),
        network
      });
    }

    if (action === 'decrypt') {
      if (!privateKey || !pin) {
        return Response.json({ error: 'Encrypted private key and PIN are required' }, { status: 400 });
      }

      const decryptedPrivateKey = await decryptWithPIN(privateKey, pin);

      return Response.json({
        success: true,
        privateKey: decryptedPrivateKey
      });
    }

    if (action === 'balance') {
      if (!privateKey) {
        return Response.json({ error: 'Private key or address is required' }, { status: 400 });
      }

      // Get address from private key
      let address;
      if (privateKey.startsWith('kaspa:')) {
        address = privateKey;
      } else {
        const privKey = new PrivateKey(privateKey);
        const pubKey = privKey.toPublicKey();
        address = Address.fromPublicKey(pubKey, network).toString();
      }

      // Fetch balance from Kaspa API
      const apiUrl = network === 'mainnet' 
        ? 'https://api.kaspa.org'
        : 'https://api-testnet.kaspa.org';
      
      const response = await fetch(`${apiUrl}/addresses/${address}/balance`);
      const data = await response.json();

      return Response.json({
        success: true,
        address,
        balance: data.balance || 0,
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

  const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptWithPIN(encryptedData, pin) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);

  // Decode base64
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

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
    ['decrypt']
  );

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return decoder.decode(decryptedData);
}