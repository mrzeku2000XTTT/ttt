import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';
import { bech32 } from 'npm:bech32@2.0.0';

let walletInstance = null;

async function getWallet() {
  if (!walletInstance) {
    walletInstance = new KaspaWallet();
  }
  return walletInstance;
}

// Properly encode address with correct network prefix and checksum
function encodeKaspaAddress(publicKeyHash, network) {
  // Remove any existing prefix
  const cleanHash = publicKeyHash.replace(/^(kaspa|kaspatest|kaspasim|kaspadev):/, '');
  
  // Decode the bech32 address to get the raw data
  try {
    const decoded = bech32.decode(cleanHash, 1000);
    const words = decoded.words;
    
    // Re-encode with the correct prefix
    const prefix = network === 'testnet' ? 'kaspatest' : 'kaspa';
    const encoded = bech32.encode(prefix, words, 1000);
    
    return encoded;
  } catch (e) {
    // If decode fails, the hash might already be in the correct format
    const prefix = network === 'testnet' ? 'kaspatest' : 'kaspa';
    return `${prefix}:${cleanHash}`;
  }
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    let mnemonic;
    if (body.importMode && body.mnemonic) {
      mnemonic = body.mnemonic.trim();
      if (!bip39.validateMnemonic(mnemonic, wordlist)) {
        return Response.json({ error: 'Invalid mnemonic phrase' }, { status: 400 });
      }
    } else {
      const strength = body.wordCount === 24 ? 256 : 128;
      mnemonic = bip39.generateMnemonic(wordlist, strength);
    }

    const wallet = await getWallet();
    const privateKey = await wallet.getDerivedPrivateKey({
      mnemonic,
      hdPath: "m/44'/111111'/0'/0/0",
    });

    const { address } = await wallet.getNewAddress({ privateKey });
    
    // Apply network prefix with proper bech32 encoding
    const network = body.network || 'testnet';
    const finalAddress = encodeKaspaAddress(address, network);

    return Response.json({
      address: finalAddress,
      privateKey,
      mnemonic,
      derivationPath: "m/44'/111111'/0'/0/0",
      network,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});