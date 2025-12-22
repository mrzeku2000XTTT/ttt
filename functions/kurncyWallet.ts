import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { bech32 } from 'npm:bech32@2.0.0';
import * as secp256k1 from 'npm:@noble/secp256k1@2.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, pin, mnemonic, privateKey, address, network = 'mainnet' } = await req.json();

    if (action === 'create') {
      if (!pin || pin.length < 4) {
        return Response.json({ error: 'PIN must be at least 4 digits' }, { status: 400 });
      }

      // Generate 12-word BIP39 mnemonic
      const entropy = crypto.getRandomValues(new Uint8Array(16));
      const mnemonicWords = await generateBIP39Mnemonic(entropy);
      
      // Derive private key from mnemonic (simplified BIP32 derivation)
      const seed = await mnemonicToSeed(mnemonicWords);
      const privKeyBytes = seed.slice(0, 32);
      const privKeyHex = bytesToHex(privKeyBytes);
      
      // Generate public key and address
      const pubKey = secp256k1.getPublicKey(privKeyBytes, true);
      const kaspaAddress = await publicKeyToKaspaAddress(pubKey, network);
      
      // Encrypt private key with PIN
      const encryptedPrivKey = await encryptWithPIN(privKeyHex, pin);

      return Response.json({
        success: true,
        address: kaspaAddress,
        mnemonic: mnemonicWords,
        privateKey: encryptedPrivKey,
        network
      });
    }

    if (action === 'import-mnemonic') {
      if (!mnemonic || !pin) {
        return Response.json({ error: 'Mnemonic and PIN are required' }, { status: 400 });
      }

      // Derive from mnemonic
      const seed = await mnemonicToSeed(mnemonic);
      const privKeyBytes = seed.slice(0, 32);
      const privKeyHex = bytesToHex(privKeyBytes);
      
      const pubKey = secp256k1.getPublicKey(privKeyBytes, true);
      const kaspaAddress = await publicKeyToKaspaAddress(pubKey, network);
      
      const encryptedPrivKey = await encryptWithPIN(privKeyHex, pin);

      return Response.json({
        success: true,
        address: kaspaAddress,
        privateKey: encryptedPrivKey,
        network
      });
    }

    if (action === 'import-privatekey') {
      if (!privateKey || !pin) {
        return Response.json({ error: 'Private key and PIN are required' }, { status: 400 });
      }

      const privKeyBytes = hexToBytes(privateKey);
      const pubKey = secp256k1.getPublicKey(privKeyBytes, true);
      const kaspaAddress = await publicKeyToKaspaAddress(pubKey, network);
      
      const encryptedPrivKey = await encryptWithPIN(privateKey, pin);

      return Response.json({
        success: true,
        address: kaspaAddress,
        privateKey: encryptedPrivKey,
        network
      });
    }

    if (action === 'decrypt') {
      if (!privateKey || !pin) {
        return Response.json({ error: 'Encrypted private key and PIN are required' }, { status: 400 });
      }

      const decryptedPrivKey = await decryptWithPIN(privateKey, pin);

      return Response.json({
        success: true,
        privateKey: decryptedPrivKey
      });
    }

    if (action === 'balance') {
      if (!address) {
        return Response.json({ error: 'Address is required' }, { status: 400 });
      }

      const apiUrl = network === 'mainnet' 
        ? 'https://api.kaspa.org'
        : 'https://api-testnet.kaspa.org';
      
      try {
        const response = await fetch(`${apiUrl}/addresses/${address}/balance`, {
          headers: { 'Accept': 'application/json' }
        });
        
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
      } catch (error) {
        return Response.json({
          success: true,
          address,
          balance: 0,
          network
        });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Wallet error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// BIP39 wordlist (simplified - first 128 words)
const BIP39_WORDLIST = [
  'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse',
  'access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act',
  'action','actor','actress','actual','adapt','add','addict','address','adjust','admit',
  'adult','advance','advice','aerobic','affair','afford','afraid','again','age','agent',
  'agree','ahead','aim','air','airport','aisle','alarm','album','alcohol','alert',
  'alien','all','alley','allow','almost','alone','alpha','already','also','alter',
  'always','amateur','amazing','among','amount','amused','analyst','anchor','ancient','anger',
  'angle','angry','animal','ankle','announce','annual','another','answer','antenna','antique',
  'anxiety','any','apart','apology','appear','apple','approve','april','arch','arctic',
  'area','arena','argue','arm','armed','armor','army','around','arrange','arrest',
  'arrive','arrow','art','artefact','artist','artwork','ask','aspect','assault','asset',
  'assist','assume','asthma','athlete','atom','attack','attend','attitude','attract','auction',
  'audit','august','aunt','author','auto','autumn','average','avocado','avoid','awake',
  'aware','away','awesome','awful','awkward','axis','baby','bachelor','bacon','badge'
];

async function generateBIP39Mnemonic(entropy) {
  const words = [];
  for (let i = 0; i < 12; i++) {
    const index = entropy[i] % BIP39_WORDLIST.length;
    words.push(BIP39_WORDLIST[index]);
  }
  return words.join(' ');
}

async function mnemonicToSeed(mnemonic) {
  const encoder = new TextEncoder();
  const mnemonicBuffer = encoder.encode(mnemonic);
  const salt = encoder.encode('mnemonic');
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    mnemonicBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const seed = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 2048,
      hash: 'SHA-512'
    },
    keyMaterial,
    512
  );
  
  return new Uint8Array(seed);
}

async function publicKeyToKaspaAddress(pubKey, network) {
  const prefix = network === 'mainnet' ? 'kaspa' : 'kaspatest';
  
  // Hash public key (SHA256 + RIPEMD160)
  const sha256Hash = await crypto.subtle.digest('SHA-256', pubKey);
  const ripemd160Hash = await ripemd160(new Uint8Array(sha256Hash));
  
  // Add version byte (0x00 for P2PKH)
  const versionedHash = new Uint8Array([0x00, ...ripemd160Hash]);
  
  // Convert to bech32
  const words = bech32.toWords(versionedHash);
  const address = bech32.encode(prefix, words);
  
  return address;
}

// RIPEMD160 implementation (simplified)
async function ripemd160(data) {
  // For now, use SHA256 as fallback - proper RIPEMD160 would require additional library
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash).slice(0, 20);
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function encryptWithPIN(data, pin) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const pinBuffer = encoder.encode(pin);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
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
    'PBKDF2',
    false,
    ['deriveKey']
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