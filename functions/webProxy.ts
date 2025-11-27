import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized', success: false }, { status: 401 });
        }

        const { url } = await req.json();

        if (!url) {
            return Response.json({ error: 'URL required', success: false }, { status: 400 });
        }

        console.log('🌐 Fetching:', url);

        // Strategy 1: Try with full browser headers
        const fullHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Referer': 'https://www.google.com/'
        };

        // Strategy 2: Minimal headers (some sites prefer this)
        const minimalHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        };

        // Strategy 3: Mobile user agent (sometimes works better)
        const mobileHeaders = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        };

        const strategies = [
            { name: 'Full Browser', headers: fullHeaders },
            { name: 'Minimal', headers: minimalHeaders },
            { name: 'Mobile', headers: mobileHeaders }
        ];

        let lastError = null;

        // Try each strategy
        for (const strategy of strategies) {
            console.log(`🔄 Trying strategy: ${strategy.name}`);
            
            try {
                const response = await fetch(url, {
                    headers: strategy.headers,
                    redirect: 'follow',
                    method: 'GET'
                });

                if (response.ok) {
                    console.log(`✅ Success with ${strategy.name} strategy!`);
                    
                    let content = await response.text();
                    
                    console.log('✅ Fetched, size:', content.length);

                    // Fix relative URLs
                    const urlObj = new URL(url);
                    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

                    // Add base tag for proper resource loading
                    if (!content.includes('<base')) {
                        content = content.replace(
                            /<head([^>]*)>/i,
                            `<head$1><base href="${baseUrl}/">`
                        );
                    }

                    // Remove frame-busting scripts
                    content = content.replace(
                        /if\s*\(\s*(?:window\.)?top\s*!==?\s*(?:window\.)?self\s*\)/gi,
                        'if(false)'
                    );

                    content = content.replace(
                        /if\s*\(\s*(?:window\.)?parent\s*!==?\s*(?:window\.)?self\s*\)/gi,
                        'if(false)'
                    );

                    // Remove CSP and X-Frame-Options meta tags
                    content = content.replace(
                        /<meta\s+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,
                        ''
                    );

                    content = content.replace(
                        /<meta\s+http-equiv=["']?X-Frame-Options["']?[^>]*>/gi,
                        ''
                    );

                    // Fix links to open in new tab (prevent navigation inside iframe)
                    content = content.replace(
                        /<a\s+/gi,
                        '<a target="_blank" rel="noopener noreferrer" '
                    );

                    return Response.json({
                        success: true,
                        content: content,
                        strategy: strategy.name
                    }, {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }

                lastError = `HTTP ${response.status}`;
                console.log(`❌ ${strategy.name} failed: ${response.status}`);
                
                // Wait a bit before trying next strategy
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (fetchError) {
                lastError = fetchError.message;
                console.log(`❌ ${strategy.name} error:`, fetchError.message);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // All strategies failed
        console.error('❌ All strategies failed. Last error:', lastError);
        
        return Response.json({ 
            error: 'Failed to load page',
            suggestion: 'This website has strong anti-bot protection. Click "Open in New Tab" to view it.',
            success: false,
            details: lastError
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Proxy error:', error);
        return Response.json({ 
            error: error.message || 'Failed to fetch page', 
            suggestion: 'The website may be blocking automated access. Try opening in a new tab.',
            success: false 
        }, { status: 200 });
    }
});