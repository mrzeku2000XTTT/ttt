import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { KaspaWallet } from 'npm:@okxweb3/coin-kaspa@2.4.9';
import { bech32m } from 'npm:bech32@2.0.0';

const KASPA_APIS = {
    testnet: 'https://api-tn12.kaspa.org',
    mainnet: 'https://api.kaspa.org',
};

// Properly re-encode address with correct network prefix and checksum
function normalizeAddress(addr, network) {
    // Extract the data payload from the address
    let decoded;
    try {
        // Remove any existing prefix
        const addrWithoutPrefix = addr.replace(/^(kaspa|kaspatest|kaspasim|kaspadev):/, '');
        decoded = bech32m.decode(addrWithoutPrefix, 1000);
    } catch (e) {
        // If decode fails, try with the full address
        decoded = bech32m.decode(addr, 1000);
    }
    
    // Re-encode with the correct network prefix
    const prefix = network === 'testnet' ? 'kaspatest' : 'kaspa';
    return bech32m.encode(prefix, decoded.words, 1000);
}
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

        const body = await req.json();
        const { contractCode, contractName, network = 'testnet', fromAddress, privateKey } = body;

        if (!contractCode) {
            return Response.json({ error: 'Contract code required' }, { status: 400 });
        }

        // Validate wallet credentials from request
        if (!fromAddress || !privateKey) {
            return Response.json({ 
                error: 'No wallet configured. Please set up your wallet on the Wallet page first.',
                code: 'NO_WALLET'
            }, { status: 401 });
        }

        const KASPA_API = KASPA_APIS[network] || KASPA_APIS.testnet;
        
        // Use Kaspa SDK with proper network configuration
        const networkType = network === 'testnet' ? kaspa.NetworkType.Testnet : kaspa.NetworkType.Mainnet;

        // 2. Compute contract hash = SHA256(contractCode)
        const contractHash = await sha256Hex(contractCode);

        // 3. Derive deterministic contract address using Kaspa SDK
        const contractPrivKey = new kaspa.PrivateKey(contractHash);
        const contractPubKey = contractPrivKey.toPublicKey();
        const contractAddress = contractPubKey.toAddress(networkType).toString();
        
        // Convert user's address to proper format
        const userAddress = new kaspa.Address(fromAddress);
        const normalizedFrom = userAddress.toString();

        // 4. Fetch UTXOs - strip prefix, API might not want it
        const addressWithoutPrefix = normalizedFrom.replace(/^(kaspa|kaspatest|kaspasim|kaspadev):/, '');
        console.log('Fetching UTXOs for:', addressWithoutPrefix, '(from:', normalizedFrom, ') from API:', KASPA_API);
        const utxoRes = await fetch(`${KASPA_API}/addresses/${addressWithoutPrefix}/utxos`);
        if (!utxoRes.ok) {
            const errText = await utxoRes.text();
            console.error('UTXO fetch failed:', utxoRes.status, errText);
            throw new Error(`Failed to fetch UTXOs: ${utxoRes.status} - ${errText.slice(0, 100)}`);
        }
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

        // 5. Build + sign transaction using Kaspa SDK
        const userPrivKey = new kaspa.PrivateKey(privateKey);
        
        const tx = new kaspa.Transaction();
        
        // Add inputs
        for (const u of selected) {
            const input = new kaspa.Transaction.Input({
                previousOutput: new kaspa.Transaction.Output.Point({
                    transactionId: u.outpoint.transactionId,
                    outputIndex: u.outpoint.index,
                }),
                signatureScript: new Uint8Array(0),
                sequence: 0,
            });
            tx.addInput(input);
        }
        
        // Add outputs
        tx.addOutput(new kaspa.Transaction.Output({
            value: BigInt(DEPLOY_SOMPI),
            scriptPublicKey: contractPubKey.toScriptPublicKey(),
        }));
        
        if (change > 0) {
            tx.addOutput(new kaspa.Transaction.Output({
                value: BigInt(change),
                scriptPublicKey: userAddress.toScriptPublicKey(),
            }));
        }
        
        // Sign transaction
        tx.sign([userPrivKey]);
        const rawTx = tx.toHex();

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