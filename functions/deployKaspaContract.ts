import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';

const KASPA_APIS = {
    testnet: 'https://api-tn12.kaspa.org',
    mainnet: 'https://api.kaspa.org',
};

// Testnet uses "kaspatest:" prefix, mainnet uses "kaspa:"
function normalizeAddress(addr, network) {
    if (network === 'testnet') {
        if (!addr.startsWith('kaspatest:')) {
            // Strip any kaspa: prefix then add kaspatest:
            const raw = addr.replace(/^kaspa:/, '');
            return `kaspatest:${raw}`;
        }
        return addr;
    }
    if (!addr.startsWith('kaspa:')) return `kaspa:${addr}`;
    return addr;
}
const DEPLOY_SOMPI = 1000000; // 0.01 KAS (10,000 satoshis) funds the contract address on testnet
const FEE_SOMPI = 5000;     // 0.00005 KAS testnet fee

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

        const { contractCode, contractName, fromAddress, fromPublicKey, network = 'testnet' } = await req.json();

        if (!contractCode || !fromAddress || !fromPublicKey) {
            return Response.json({ error: 'Missing required fields: contractCode, fromAddress, and fromPublicKey (TTT native wallet)' }, { status: 400 });
        }

        const KASPA_API = KASPA_APIS[network] || KASPA_APIS.testnet;
        const wallet = new KaspaWallet();

        // 1. Use the provided TTT wallet public key for signing (already derived by wallet)
        const signingPK = fromPublicKey;

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
        const contractAddress = normalizeAddress(rawContractAddr, network);
        const normalizedFrom = normalizeAddress(fromAddress, network);

        // 4. Fetch UTXOs from address
        const utxoRes = await fetch(`${KASPA_API}/addresses/${normalizedFrom}/utxos`);
        if (!utxoRes.ok) throw new Error(`Failed to fetch UTXOs: ${utxoRes.status}`);
        const utxos = await utxoRes.json();
        if (!utxos?.length) {
            const faucetHint = network === 'testnet' ? ' Get testnet TKAS from: https://faucet.kaspanet.io' : '';
            throw new Error(`No UTXOs found for ${normalizedFrom}. Fund wallet first.${faucetHint}`);
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

        // 5. Build + sign transaction using TTT native wallet public key
        const inputs = selected.map(u => ({
            txId: u.outpoint.transactionId,
            vOut: u.outpoint.index,
            // OKX SDK always uses kaspa: for signing regardless of network
            address: fromAddress.startsWith('kaspa') ? fromAddress : `kaspa:${fromAddress}`,
            amount: Number(u.utxoEntry.amount),
        }));
        const outputs = [{ address: contractAddress, amount: DEPLOY_SOMPI }];
        if (change > 0) outputs.push({ address: normalizedFrom, amount: change });

        const signResult = await wallet.signTransaction({
            data: { inputs, outputs, address: normalizedFrom, fee: FEE_SOMPI },
            publicKey: fromPublicKey, // Use TTT wallet's native public key
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