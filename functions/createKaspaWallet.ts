import * as bip39 from 'npm:@scure/bip39@1.3.0';
import { wordlist } from 'npm:@scure/bip39@1.3.0/wordlists/english';

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

    const network = body.network || 'testnet';
    
    // Use Terra Protocol API for proper address generation
    const terraEndpoint = network === 'testnet' 
      ? 'https://api.terraprotocol.io/v1/kaspa/testnet/wallet/derive'
      : 'https://api.terraprotocol.io/v1/kaspa/mainnet/wallet/derive';
    
    const terraRes = await fetch(terraEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mnemonic,
        derivationPath: "m/44'/111111'/0'/0/0"
      })
    });
    
    if (!terraRes.ok) {
      throw new Error('Terra Protocol derivation failed');
    }
    
    const terraData = await terraRes.json();
    const finalAddress = terraData.address;
    const privateKey = terraData.privateKey;

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