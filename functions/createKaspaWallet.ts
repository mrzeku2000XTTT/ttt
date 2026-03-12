import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';
import { bech32m } from 'npm:@scure/base@1.1.5';

let walletInstance = null;

async function getWallet() {
  if (!walletInstance) {
    walletInstance = new KaspaWallet();
  }
  return walletInstance;
}

// Properly encode Kaspa address with correct network prefix and checksum
// Kaspa uses bech32m encoding (not bech32)
function encodeKaspaAddress(addressStr, network) {
  try {
    // Remove any existing prefix (kaspa: or kaspatest:)
    const withoutPrefix = addressStr.replace(/^(kaspa|kaspatest|kaspasim|kaspadev):/, '');
    
    // Decode the bech32m address to get the raw data
    const decoded = bech32m.decode(withoutPrefix, 1000);
    
    // Re-encode with the correct network prefix
    const prefix = network === 'testnet' ? 'kaspatest' : 'kaspa';
    const encoded = bech32m.encode(prefix, decoded.words, 1000);
    
    return encoded;
  } catch (e) {
    console.error('Failed to re-encode address:', e);
    // Fallback - just replace prefix (will have wrong checksum but shows the error)
    const withoutPrefix = addressStr.replace(/^(kaspa|kaspatest|kaspasim|kaspadev):/, '');
    const prefix = network === 'testnet' ? 'kaspatest' : 'kaspa';
    return `${prefix}:${withoutPrefix}`;
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