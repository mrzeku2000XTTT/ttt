import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

const KASPA_APIS = {
    testnet: 'https://api-tn12.kaspa.org',
    mainnet: 'https://api.kaspa.org',
};
const DEPLOY_SOMPI = 100000; // 0.001 KAS funds the contract address
const FEE_SOMPI = 10000;

async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { contractCode, contractName, fromAddress, privateKey, mnemonic, network = 'testnet' } = await req.json();

        if (!contractCode || !fromAddress || (!privateKey && !mnemonic)) {
            return Response.json({ error: 'Missing required fields: contractCode, fromAddress, and privateKey or mnemonic' }, { status: 400 });
        }

        const KASPA_API = KASPA_APIS[network] || KASPA_APIS.testnet;
        const wallet = new KaspaWallet();

        // 1. Resolve signing private key
        let signingPK = privateKey;
        if (!signingPK && mnemonic) {
            signingPK = await wallet.getDerivedPrivateKey({
                mnemonic: mnemonic.trim(),
                hdPath: "m/44'/111111'/0'/0/0",
            });
        }

        // 2. Compute contract hash = SHA256(contractCode)
        //    This is the unique fingerprint / ID of the contract on-chain
        const contractHash = await sha256Hex(contractCode);

        // 3. Derive a deterministic contract address from the hash
        //    The contract hash (32 bytes) is used as the contract's secp256k1 private key seed,
        //    giving a stable address that uniquely identifies this contract on-chain
        const addrResult = await wallet.getNewAddress({ privateKey: contractHash });
        const rawContractAddr = typeof addrResult === 'string'
            ? addrResult
            : (addrResult?.address || addrResult?.addr || String(addrResult));
        const contractAddress = rawContractAddr.startsWith('kaspa:') ? rawContractAddr : `kaspa:${rawContractAddr}`;

        const normalizedFrom = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;

        // 4. Fetch UTXOs
        const utxoRes = await fetch(`${KASPA_API}/addresses/${normalizedFrom}/utxos`);
        if (!utxoRes.ok) throw new Error(`Failed to fetch UTXOs: ${utxoRes.status}`);
        const utxos = await utxoRes.json();
        if (!utxos?.length) {
            const faucetHint = network === 'testnet' ? ' Get testnet KAS at https://faucet.kaspanet.io' : '';
            throw new Error(`No UTXOs found. Fund your wallet first.${faucetHint}`);
        }

        const needed = DEPLOY_SOMPI + FEE_SOMPI;
        utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
        let totalIn = 0;
        const selected = [];
        for (const u of utxos) {
            if (totalIn >= needed) break;
            selected.push(u);
            totalIn += Number(u.utxoEntry.amount);
        }
        if (totalIn < needed) {
            throw new Error(`Insufficient balance: need ${(needed / 1e8).toFixed(4)} KAS, have ${(totalIn / 1e8).toFixed(4)} KAS`);
        }

        const change = totalIn - DEPLOY_SOMPI - FEE_SOMPI;

        // 5. Build + sign transaction
        const inputs = selected.map(u => ({
            txId: u.outpoint.transactionId,
            vOut: u.outpoint.index,
            address: normalizedFrom,
            amount: Number(u.utxoEntry.amount),
        }));
        const outputs = [{ address: contractAddress, amount: DEPLOY_SOMPI }];
        if (change > 0) outputs.push({ address: normalizedFrom, amount: change });

        const signResult = await wallet.signTransaction({
            data: { inputs, outputs, address: normalizedFrom, fee: FEE_SOMPI },
            privateKey: signingPK,
        });
        const signed = typeof signResult === 'string' ? JSON.parse(signResult) : signResult;
        const rawTx = signed.transaction ?? signed.tx ?? signed;

        // 6. Submit to network
        const submitRes = await fetch(`${KASPA_API}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
        });
        const submitText = await submitRes.text();
        let submitData;
        try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }
        console.log('deploy submit status:', submitRes.status, submitText.slice(0, 200));

        if (!submitRes.ok) throw new Error(`Submit failed (${submitRes.status}): ${submitText.slice(0, 200)}`);

        const txHash = submitData.transactionId || submitData.txid || submitData;
        const explorerUrl = network === 'mainnet'
            ? `https://explorer.kaspa.org/txs/${txHash}`
            : `https://explorer-tn12.kaspa.org/txs/${txHash}`;

        return Response.json({
            success: true,
            txHash,
            contractAddress,
            contractHash,
            contractName: contractName || 'Contract',
            network,
            deployAmount: DEPLOY_SOMPI / 1e8,
            explorerUrl,
        });

    } catch (error) {
        console.error('deployKaspaContract error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});