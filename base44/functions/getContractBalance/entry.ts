import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { ethers } from 'npm:ethers@5.7.2';

// CONTRACT ADDRESSES
const CONTRACT_ADDRESSES = {
    mainnet: "0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194",
    testnet: "0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194" // TESTNET CONTRACT
};

// RPC URLS
const RPC_URLS = {
    mainnet: "https://evmrpc.kasplex.org",
    testnet: "https://evmrpc-testnet.kasplex.org"
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Allow unauthenticated access - this is public information
        const user = await base44.auth.me().catch(() => null);

        // Get network from query params or default to mainnet
        const url = new URL(req.url);
        const network = url.searchParams.get('network') || 'mainnet';
        
        const CONTRACT_ADDRESS = CONTRACT_ADDRESSES[network] || CONTRACT_ADDRESSES.mainnet;
        const RPC_URL = RPC_URLS[network] || RPC_URLS.mainnet;

        console.log('Fetching balance for contract:', CONTRACT_ADDRESS, `(${network})`);

        // Create provider
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

        // Get balance
        const balanceWei = await provider.getBalance(CONTRACT_ADDRESS);
        const balanceKAS = ethers.utils.formatEther(balanceWei);

        console.log('Contract balance:', balanceKAS, 'KAS');

        return Response.json({
            success: true,
            balance: parseFloat(balanceKAS).toFixed(4),
            balanceWei: balanceWei.toString(),
            contractAddress: CONTRACT_ADDRESS,
            network: network
        });

    } catch (error) {
        console.error('Failed to get contract balance:', error);
        return Response.json({ 
            success: false,
            error: error.message,
            balance: '0.00'
        }, { status: 500 });
    }
});