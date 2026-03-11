import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';
import { HDKey } from 'npm:@scure/bip32@1.4.0';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

let walletInstance = null;

async function getWallet() {
  if (!walletInstance) {
    walletInstance = new KaspaWallet();
  }
  return walletInstance;
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
    const cleanAddress = address.startsWith('kaspa:') ? address.slice(6) : address;

    return Response.json({
      address: cleanAddress,
      privateKey,
      mnemonic,
      derivationPath: "m/44'/111111'/0'/0/0",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});