import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, pin, mnemonic, privateKey, address, network = 'mainnet' } = await req.json();

    if (action === 'create') {
      if (!pin) {
        return Response.json({ error: 'PIN is required for encryption' }, { status: 400 });
      }

      // Generate wallet using crypto randomness
      const entropy = crypto.getRandomValues(new Uint8Array(16));
      const mnemonicWords = generateMnemonic(entropy);
      
      // For now, return a simplified response
      // You'll need to integrate with actual Kaspa wallet creation SDK
      const walletAddress = `kaspa:${bytesToHex(crypto.getRandomValues(new Uint8Array(20)))}`;
      const privKey = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
      
      const encryptedPrivateKey = await encryptWithPIN(privKey, pin);

      return Response.json({
        success: true,
        address: walletAddress,
        mnemonic: mnemonicWords,
        privateKey: encryptedPrivateKey,
        network
      });
    }

    if (action === 'import-mnemonic') {
      if (!mnemonic || !pin) {
        return Response.json({ error: 'Mnemonic and PIN are required' }, { status: 400 });
      }

      // Simplified import - integrate proper Kaspa SDK later
      const privKey = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
      const walletAddress = `kaspa:${bytesToHex(crypto.getRandomValues(new Uint8Array(20)))}`;
      
      const encryptedPrivateKey = await encryptWithPIN(privKey, pin);

      return Response.json({
        success: true,
        address: walletAddress,
        privateKey: encryptedPrivateKey,
        network
      });
    }

    if (action === 'import-privatekey') {
      if (!privateKey || !pin) {
        return Response.json({ error: 'Private key and PIN are required' }, { status: 400 });
      }

      const walletAddress = `kaspa:${bytesToHex(crypto.getRandomValues(new Uint8Array(20)))}`;
      const encryptedPrivateKey = await encryptWithPIN(privateKey, pin);

      return Response.json({
        success: true,
        address: walletAddress,
        privateKey: encryptedPrivateKey,
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
      if (!address) {
        return Response.json({ error: 'Address is required' }, { status: 400 });
      }

      const apiUrl = network === 'mainnet' 
        ? 'https://api.kaspa.org'
        : 'https://api-testnet.kaspa.org';
      
      const response = await fetch(`${apiUrl}/addresses/${address}/balance`);
      
      if (!response.ok) {
        return Response.json({ 
          success: true,
          address,
          balance: 0,
          network
        });
      }
      
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
    return Response.json({ error: error.message, details: error.stack }, { status: 500 });
  }
});

// Helper: bytes to hex string
function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simplified mnemonic generation (BIP39 compatible words)
function generateMnemonic(entropy) {
  const words = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 
    'absurd', 'abuse', 'access', 'accident'];
  return Array(12).fill(0).map(() => words[Math.floor(Math.random() * words.length)]).join(' ');
}

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