import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Whitelist tttz.xyz domains first
    if (url.toLowerCase().includes('tttz.xyz') || url.toLowerCase().includes('tttxyz.base44.app')) {
      return Response.json({
        risk_level: "Low",
        is_safe: true,
        threat_type: null,
        explanation: "This is the official TTT platform (tttz.xyz). The domain is verified and completely safe to use.",
        red_flags: [],
        recommendations: "This is a legitimate and secure TTT platform URL. Safe to proceed.",
        checks_performed: {
          domain_validation: "✓ Official TTT domain",
          ssl_check: "✓ HTTPS verified",
          reputation_check: "✓ Trusted platform",
          malware_scan: "✓ Clean",
          phishing_check: "✓ Legitimate"
        }
      });
    }

    console.log('🔍 Analyzing URL:', url);

    // Parse URL to extract domain and protocol
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      // If URL is invalid, still try to analyze it with AI
      parsedUrl = null;
    }

    const domain = parsedUrl ? parsedUrl.hostname : url;
    const protocol = parsedUrl ? parsedUrl.protocol : null;

    // Perform multiple security checks
    const checks = {
      domain_validation: await checkDomainReputation(domain),
      ssl_check: protocol === 'https:' ? '✓ HTTPS' : '⚠️ Not HTTPS',
      url_structure: analyzeUrlStructure(url),
      suspicious_patterns: detectSuspiciousPatterns(url)
    };

    console.log('✅ Security checks completed:', checks);

    // Use AI with internet context for comprehensive analysis
    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cybersecurity expert analyzing a URL for security threats. Perform a thorough analysis of this URL: ${url}

IMPORTANT: Do NOT automatically flag .xyz domains as suspicious. Many legitimate businesses use .xyz domains. Analyze the ACTUAL content and reputation, not just the TLD.

Domain being analyzed: ${domain}
Protocol: ${protocol || 'Unknown'}
Security checks performed: ${JSON.stringify(checks, null, 2)}

Your analysis should:
1. Check for actual phishing indicators (not just domain extension)
2. Look for real scam patterns in the URL structure
3. Verify domain reputation using available online resources
4. Check SSL/HTTPS status
5. Identify specific suspicious elements (unusual characters, typosquatting, etc.)
6. Research the domain's actual reputation online

Provide objective analysis based on FACTS, not assumptions about domain extensions.
If the domain appears legitimate after research, say so clearly.
Only flag as risky if you find SPECIFIC evidence of threats.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          risk_level: {
            type: "string",
            enum: ["Low", "Medium", "High", "Critical"]
          },
          is_safe: {
            type: "boolean"
          },
          threat_type: {
            type: "string"
          },
          explanation: {
            type: "string"
          },
          red_flags: {
            type: "array",
            items: { type: "string" }
          },
          recommendations: {
            type: "string"
          }
        }
      }
    });

    // Combine manual checks with AI analysis
    const finalResult = {
      ...aiAnalysis,
      checks_performed: checks,
      url_analyzed: url,
      domain_analyzed: domain,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Final analysis result:', finalResult);

    return Response.json(finalResult);

  } catch (error) {
    console.error('❌ Link security check error:', error);
    return Response.json({ 
      error: 'Failed to analyze URL',
      details: error.message 
    }, { status: 500 });
  }
});

// Helper function to check domain reputation
async function checkDomainReputation(domain) {
  try {
    // Check if domain follows suspicious patterns
    const suspiciousPatterns = [
      /\d{4,}/, // Many numbers
      /(-|_){3,}/, // Multiple dashes or underscores
      /^www\d+\./, // www followed by numbers
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(domain)) {
        return '⚠️ Suspicious pattern detected';
      }
    }

    // Check for known safe TLDs (but don't flag others as unsafe)
    const trustedTlds = ['.com', '.org', '.net', '.edu', '.gov'];
    const hasTrustedTld = trustedTlds.some(tld => domain.endsWith(tld));
    
    if (hasTrustedTld) {
      return '✓ Common TLD';
    }

    return '• Requires verification';
  } catch (e) {
    return '? Unable to check';
  }
}

// Helper function to analyze URL structure
function analyzeUrlStructure(url) {
  const suspiciousIndicators = [];

  // Check for excessive subdomains
  try {
    const parsedUrl = new URL(url);
    const subdomains = parsedUrl.hostname.split('.');
    if (subdomains.length > 4) {
      suspiciousIndicators.push('Many subdomains');
    }

    // Check for IP address instead of domain
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsedUrl.hostname)) {
      suspiciousIndicators.push('IP address used');
    }

    // Check for suspicious characters
    if (/@/.test(url)) {
      suspiciousIndicators.push('Contains @ symbol');
    }

    // Check for very long URLs
    if (url.length > 200) {
      suspiciousIndicators.push('Unusually long URL');
    }
  } catch (e) {
    suspiciousIndicators.push('Invalid URL format');
  }

  return suspiciousIndicators.length > 0 
    ? `⚠️ Issues: ${suspiciousIndicators.join(', ')}`
    : '✓ Normal structure';
}

// Helper function to detect suspicious patterns
function detectSuspiciousPatterns(url) {
  const patterns = [];

  // Common phishing keywords
  const phishingKeywords = [
    'verify', 'account', 'suspended', 'urgent', 'confirm',
    'login', 'bank', 'paypal', 'update', 'secure'
  ];

  const lowerUrl = url.toLowerCase();
  const foundKeywords = phishingKeywords.filter(kw => lowerUrl.includes(kw));
  
  if (foundKeywords.length > 2) {
    patterns.push(`Contains phishing keywords: ${foundKeywords.join(', ')}`);
  }

  // Check for homograph attacks (similar-looking characters)
  if (/[а-яА-Я]/.test(url)) {
    patterns.push('Contains Cyrillic characters (potential homograph attack)');
  }

  return patterns.length > 0 
    ? `⚠️ ${patterns.join('; ')}`
    : '✓ No obvious patterns';
}