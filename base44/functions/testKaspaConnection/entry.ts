import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🧪 Testing Kaspa Backend Connection...');
    
    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    try {
        const base44 = createClientFromRequest(req);
        
        // Test 1: Check if user is authenticated
        try {
            const user = await base44.auth.me();
            results.tests.push({
                name: 'User Authentication',
                status: 'PASS',
                details: `User: ${user.email}`
            });
        } catch (e) {
            results.tests.push({
                name: 'User Authentication',
                status: 'FAIL',
                error: e.message
            });
        }

        // Test 2: Check if API key is set
        const API_KEY = Deno.env.get('KASPA_API_KEY');
        if (API_KEY) {
            results.tests.push({
                name: 'KASPA_API_KEY Environment Variable',
                status: 'PASS',
                details: `Key present (length: ${API_KEY.length})`
            });
        } else {
            results.tests.push({
                name: 'KASPA_API_KEY Environment Variable',
                status: 'FAIL',
                error: 'KASPA_API_KEY not found in environment variables'
            });
        }

        // Test 3: Check if Node.js backend is reachable
        const KASPA_API_URL = 'https://nodejs-TTT.replit.app';
        try {
            console.log('🔍 Testing backend health check...');
            const healthResponse = await fetch(`${KASPA_API_URL}/health`);
            
            if (healthResponse.ok) {
                const healthText = await healthResponse.text();
                results.tests.push({
                    name: 'Node.js Backend Health',
                    status: 'PASS',
                    details: `Response: ${healthText}`
                });
            } else {
                results.tests.push({
                    name: 'Node.js Backend Health',
                    status: 'FAIL',
                    error: `HTTP ${healthResponse.status}: ${healthResponse.statusText}`
                });
            }
        } catch (e) {
            results.tests.push({
                name: 'Node.js Backend Health',
                status: 'FAIL',
                error: e.message
            });
        }

        // Test 4: Try to fetch KAS price (public endpoint)
        try {
            console.log('🔍 Testing price endpoint...');
            const priceResponse = await fetch(`${KASPA_API_URL}/kas-price`);
            
            if (priceResponse.ok) {
                const priceData = await priceResponse.json();
                results.tests.push({
                    name: 'KAS Price Endpoint',
                    status: 'PASS',
                    details: `Price: $${priceData.price || priceData}`
                });
            } else {
                results.tests.push({
                    name: 'KAS Price Endpoint',
                    status: 'FAIL',
                    error: `HTTP ${priceResponse.status}: ${priceResponse.statusText}`
                });
            }
        } catch (e) {
            results.tests.push({
                name: 'KAS Price Endpoint',
                status: 'FAIL',
                error: e.message
            });
        }

        // Test 5: Try to fetch balance for a test address (needs API key)
        if (API_KEY) {
            try {
                console.log('🔍 Testing balance endpoint with API key...');
                const testAddress = 'kaspa:qz7ulu4c25dh7fzec9zjyrmlhnkzrg4wmf89q7gzr3gfrsj3uz6xjceef60sd';
                const balanceResponse = await fetch(`${KASPA_API_URL}/balance/${testAddress}`, {
                    headers: {
                        'X-API-Key': API_KEY,
                        'Accept': 'application/json'
                    }
                });
                
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    results.tests.push({
                        name: 'Balance Endpoint (with API Key)',
                        status: 'PASS',
                        details: `Balance: ${(balanceData.balance || balanceData) / 100000000} KAS`
                    });
                } else {
                    const errorText = await balanceResponse.text();
                    results.tests.push({
                        name: 'Balance Endpoint (with API Key)',
                        status: 'FAIL',
                        error: `HTTP ${balanceResponse.status}: ${errorText}`
                    });
                }
            } catch (e) {
                results.tests.push({
                    name: 'Balance Endpoint (with API Key)',
                    status: 'FAIL',
                    error: e.message
                });
            }
        }

        // Test 6: Try to create a wallet (needs API key)
        if (API_KEY) {
            try {
                console.log('🔍 Testing wallet creation endpoint with API key...');
                const walletResponse = await fetch(`${KASPA_API_URL}/wallet/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': API_KEY,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ wordCount: 12 })
                });
                
                if (walletResponse.ok) {
                    const walletData = await walletResponse.json();
                    results.tests.push({
                        name: 'Wallet Creation Endpoint (with API Key)',
                        status: 'PASS',
                        details: `Created ${walletData.wordCount}-word wallet`
                    });
                } else {
                    const errorText = await walletResponse.text();
                    results.tests.push({
                        name: 'Wallet Creation Endpoint (with API Key)',
                        status: 'FAIL',
                        error: `HTTP ${walletResponse.status}: ${errorText}`
                    });
                }
            } catch (e) {
                results.tests.push({
                    name: 'Wallet Creation Endpoint (with API Key)',
                    status: 'FAIL',
                    error: e.message
                });
            }
        }

        // Summary
        const passCount = results.tests.filter(t => t.status === 'PASS').length;
        const failCount = results.tests.filter(t => t.status === 'FAIL').length;
        
        results.summary = {
            total: results.tests.length,
            passed: passCount,
            failed: failCount,
            allPassed: failCount === 0
        };

        console.log('✅ Test completed:', JSON.stringify(results.summary));

        return Response.json(results);

    } catch (error) {
        console.error('❌ Test failed:', error);
        return Response.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});