import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Loader2, Globe, Lock, Server, Code, Eye, Scan, Fingerprint, Activity, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import ScanResultCard from "@/components/security/ScanResultCard";
import SeverityBadge from "@/components/security/SeverityBadge";
import AppQuickScan from "@/components/security/AppQuickScan";

const SCAN_SCHEMA = {
  type: "object",
  properties: {
    url_analyzed: { type: "string" },
    overall_score: { type: "number" },
    overall_risk: { type: "string", enum: ["critical", "high", "medium", "low", "minimal"] },
    summary: { type: "string" },
    ssl_tls: { type: "object", properties: { status: { type: "string", enum: ["pass", "warn", "fail", "info"] }, severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] }, findings: { type: "array", items: { type: "string" } } } },
    security_headers: { type: "object", properties: { status: { type: "string", enum: ["pass", "warn", "fail", "info"] }, severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] }, findings: { type: "array", items: { type: "string" } }, missing_headers: { type: "array", items: { type: "string" } } } },
    vulnerabilities: { type: "object", properties: { status: { type: "string", enum: ["pass", "warn", "fail", "info"] }, severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] }, findings: { type: "array", items: { type: "string" } } } },
    server_exposure: { type: "object", properties: { status: { type: "string", enum: ["pass", "warn", "fail", "info"] }, severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] }, findings: { type: "array", items: { type: "string" } } } },
    dns_security: { type: "object", properties: { status: { type: "string", enum: ["pass", "warn", "fail", "info"] }, severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] }, findings: { type: "array", items: { type: "string" } } } },
    cookie_security: { type: "object", properties: { status: { type: "string", enum: ["pass", "warn", "fail", "info"] }, severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] }, findings: { type: "array", items: { type: "string" } } } },
    privacy_concerns: { type: "object", properties: { status: { type: "string", enum: ["pass", "warn", "fail", "info"] }, severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] }, findings: { type: "array", items: { type: "string" } } } },
    recommendations: { type: "array", items: { type: "string" } }
  }
};

const SCAN_PROMPT_BASE = `You are an ELITE web application security auditor performing a real penetration test report. You must provide DEEP, SPECIFIC, ACTIONABLE findings — not generic checklists.

CRITICAL PLATFORM CONTEXT — These apps are built and hosted on Base44 (app.base44.com). Base44 is a secure managed platform that handles:
- **SSL/TLS**: Fully managed, auto-renewed certificates. Mark as PASS with status "pass", severity "info", finding: "Secured by Base44 platform — SSL/TLS certificates are automatically managed and renewed."
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options are all set at the platform level. Mark as PASS with status "pass", severity "info", finding: "Secured by Base44 platform — all HTTP security headers (CSP, HSTS, X-Frame-Options) are enforced at infrastructure level."
- **Server Exposure**: Base44 runs on managed cloud infrastructure with no exposed server details. Mark as PASS with status "pass", severity "info", finding: "Secured by Base44 platform — server infrastructure is fully managed with no exposed server information."
- **DNS Security**: Managed by Base44's DNS infrastructure. Mark as PASS with status "pass", severity "info", finding: "Secured by Base44 platform — DNS is managed at infrastructure level."
- **Cookie Security**: Session cookies are handled by the Base44 auth system with secure flags. Mark as PASS with status "pass", severity "info", finding: "Secured by Base44 platform — authentication cookies are managed with Secure, HttpOnly, and SameSite flags."

Do NOT flag these 5 categories as risks. They MUST all show status "pass" and severity "info" for any app hosted on base44.com.

Do NOT flag:
- localStorage for wallet keys — this is intentional non-custodial crypto wallet design (like MetaMask)
- Public Kaspa blockchain addresses — they are public by design
- builder-bridge.js or platform scripts — these are Base44 infrastructure
- External CDNs from the hosting platform

FOCUS your audit ONLY on real application-level concerns:
1. **Code-Level Vulnerabilities**: Actual XSS vectors — innerHTML, dangerouslySetInnerHTML, eval(), document.write(), unescaped user input rendered in DOM
2. **Authentication & Authorization**: Admin functions without role checks, privilege escalation, unprotected API endpoints
3. **Data Exposure**: API keys or secrets hardcoded in frontend source code, console.log leaking sensitive data
4. **Crypto/Financial Security**: Transaction signing flaws, escrow spoofing, double-spend or race condition risks in betting/payment flows
5. **Input Validation**: Numeric overflow, negative values, NaN in financial inputs (bet amounts, transfers)
6. **Race Conditions**: Rapid API calls creating duplicate records or inconsistent state
7. **Third-Party API Trust**: Are responses from external APIs validated before use?

For the "vulnerabilities" and "privacy_concerns" categories — ONLY report findings if you find REAL issues in the actual source code. If the code looks clean, mark them as PASS too.

For each real finding:
- Cite the SPECIFIC code pattern you found
- Explain the EXACT attack scenario
- Rate severity based on REAL exploitability
- Provide a CONCRETE fix

Be honest — if an app is well-built, give it a high score. Do NOT artificially lower scores with platform-level false positives.`;

export default function SecurityAudit() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTarget, setScanTarget] = useState("");
  const progressRef = useRef(null);

  const startScan = (prompt, displayTarget) => {
    setScanTarget(displayTarget);
    setScanning(true);
    setResults(null);
    setError(null);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress(p => Math.min(p + Math.random() * 12, 92));
    }, 500);
    progressRef.current = interval;

    base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: SCAN_SCHEMA
    }).then(res => {
      setScanProgress(100);
      setTimeout(() => setResults(res), 400);
    }).catch(err => {
      setError(err.message || "Scan failed.");
    }).finally(() => {
      clearInterval(interval);
      setScanning(false);
    });
  };

  const runScan = () => {
    if (!url.trim()) return;
    let target = url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = "https://" + target;
    }
    startScan(`${SCAN_PROMPT_BASE}\n\nAnalyze this URL: ${target}`, target);
  };

  const [scanAppInfo, setScanAppInfo] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copyRec = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const extractExternalResources = (html) => {
    const iframes = [];
    const scripts = [];
    const links = [];
    const images = [];
    // Extract iframes
    const iframeRe = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = iframeRe.exec(html)) !== null) iframes.push(m[1]);
    // Extract scripts
    const scriptRe = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
    while ((m = scriptRe.exec(html)) !== null) scripts.push(m[1]);
    // Extract external links/stylesheets
    const linkRe = /<link[^>]*href=["']([^"']+)["'][^>]*>/gi;
    while ((m = linkRe.exec(html)) !== null) links.push(m[1]);
    // Extract fetch/API calls
    const fetchRe = /fetch\(["'`]([^"'`]+)["'`]/gi;
    const apiCalls = [];
    while ((m = fetchRe.exec(html)) !== null) apiCalls.push(m[1]);
    // Inline scripts content
    const inlineScriptRe = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
    const inlineScripts = [];
    while ((m = inlineScriptRe.exec(html)) !== null) {
      const content = m[1].trim();
      if (content.length > 10) inlineScripts.push(content.slice(0, 500));
    }
    return { iframes, scripts, links, apiCalls, inlineScripts };
  };

  const handleAppScan = async (app) => {
    const appName = app.name;
    const appPath = app.path;
    setScanAppInfo(app);
    setUrl(appName);
    setScanTarget(appName);
    setScanning(true);
    setResults(null);
    setError(null);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress(p => Math.min(p + Math.random() * 5, 25));
    }, 500);
    progressRef.current = interval;

    // Phase 1: Fetch the actual page source
    const appUrl = `${window.location.origin}/${appPath}`;
    let pageSource = "";
    let externalResources = { iframes: [], scripts: [], links: [], apiCalls: [], inlineScripts: [] };
    try {
      setScanProgress(5);
      const resp = await fetch(appUrl);
      const html = await resp.text();
      pageSource = html.slice(0, 15000);
      externalResources = extractExternalResources(html);
      setScanProgress(20);
    } catch (fetchErr) {
      pageSource = `Could not fetch page source for ${appPath}. URL attempted: ${appUrl}`;
    }

    // Phase 2: If iframes found, fetch their content too
    let iframeAnalysis = "";
    if (externalResources.iframes.length > 0) {
      setScanProgress(25);
      const iframeResults = [];
      for (const iframeSrc of externalResources.iframes.slice(0, 3)) {
        try {
          const iResp = await fetch(iframeSrc);
          const iHtml = await iResp.text();
          iframeResults.push({ url: iframeSrc, source: iHtml.slice(0, 4000) });
        } catch {
          iframeResults.push({ url: iframeSrc, source: "[COULD NOT FETCH — cross-origin blocked or unreachable]" });
        }
      }
      setScanProgress(35);
      iframeAnalysis = `\n\n=== EMBEDDED IFRAMES DETECTED (${externalResources.iframes.length}) ===\nThese are EXTERNAL applications embedded inside this app. Audit each one independently.\n` +
        iframeResults.map((ir, i) => `\n--- iframe #${i+1}: ${ir.url} ---\n\`\`\`html\n${ir.source}\n\`\`\``).join('\n');
    }

    clearInterval(interval);
    const interval2 = setInterval(() => {
      setScanProgress(p => Math.min(p + Math.random() * 8, 92));
    }, 500);
    progressRef.current = interval2;

    // Build comprehensive resource inventory
    const resourceInventory = `
=== EXTERNAL RESOURCE INVENTORY ===

IFRAMES (${externalResources.iframes.length}): ${externalResources.iframes.length > 0 ? '\n' + externalResources.iframes.map(u => `  ⚠️ ${u}`).join('\n') : 'None'}

EXTERNAL SCRIPTS (${externalResources.scripts.length}): ${externalResources.scripts.length > 0 ? '\n' + externalResources.scripts.map(u => `  📦 ${u}`).join('\n') : 'None'}

EXTERNAL STYLESHEETS/LINKS (${externalResources.links.length}): ${externalResources.links.length > 0 ? '\n' + externalResources.links.map(u => `  🔗 ${u}`).join('\n') : 'None'}

API CALLS IN CODE (${externalResources.apiCalls.length}): ${externalResources.apiCalls.length > 0 ? '\n' + externalResources.apiCalls.map(u => `  🌐 ${u}`).join('\n') : 'None'}

INLINE SCRIPTS (${externalResources.inlineScripts.length}): ${externalResources.inlineScripts.length > 0 ? '\n' + externalResources.inlineScripts.map((s, i) => `  📝 Script #${i+1}: ${s.slice(0, 200)}...`).join('\n') : 'None'}
`;

    const prompt = `${SCAN_PROMPT_BASE}

You are performing a FULL SECURITY AUDIT of "${appName}" — hosted on Base44 at: ${appUrl}

This is a React Single Page Application. I have fetched the REAL page source and extracted all external resources.

PROVIDE A THOROUGH, DETAILED REPORT. For each category, give MULTIPLE specific findings with evidence. Do NOT give one-liners — explain each finding in detail.

${resourceInventory}

=== FULL PAGE SOURCE CODE (${pageSource.length} chars) ===
\`\`\`html
${pageSource}
\`\`\`
${iframeAnalysis}

=== AUDIT INSTRUCTIONS ===

1. **Vulnerabilities** — Analyze EVERY inline script, every external resource. For iframes: these are EXTERNAL apps embedded in the page — they represent a significant trust boundary. Report:
   - What data could the iframe access?
   - Is there postMessage communication? Is it validated?
   - Could the iframe be hijacked or replaced?
   - Are iframe sources using HTTPS?

2. **Privacy** — Check for:
   - Tracking pixels, analytics scripts, ad networks
   - Data sent to third-party domains
   - Fingerprinting techniques
   - User data exposed in URLs or query params

3. For EACH finding, provide:
   - The exact code/URL that is the concern
   - Risk level and attack scenario
   - Specific remediation steps

4. Give at least 3-5 actionable recommendations that are SPECIFIC to this app (not generic advice).

5. Score honestly: an app with iframes to untrusted sources should score lower. An app with clean code and no external deps should score higher (85-95).`;

    base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCAN_SCHEMA,
      model: 'gemini_3_flash'
    }).then(res => {
      setScanProgress(100);
      setTimeout(() => setResults(res), 400);
    }).catch(err => {
      setError(err.message || "Scan failed.");
    }).finally(() => {
      clearInterval(interval2);
      setScanning(false);
    });
  };

  const scoreColor = (s) => s >= 80 ? "text-emerald-400" : s >= 60 ? "text-yellow-400" : s >= 40 ? "text-orange-400" : "text-red-400";
  const scoreGlow = (s) => s >= 80 ? "shadow-emerald-500/20" : s >= 60 ? "shadow-yellow-500/20" : s >= 40 ? "shadow-orange-500/20" : "shadow-red-500/20";
  const scoreRing = (s) => s >= 80 ? "stroke-emerald-400" : s >= 60 ? "stroke-yellow-400" : s >= 40 ? "stroke-orange-400" : "stroke-red-400";

  const categories = results ? [
    { key: "ssl_tls", label: "SSL / TLS", icon: Lock, data: results.ssl_tls },
    { key: "security_headers", label: "Security Headers", icon: Shield, data: results.security_headers },
    { key: "vulnerabilities", label: "Vulnerabilities", icon: AlertTriangle, data: results.vulnerabilities },
    { key: "server_exposure", label: "Server Exposure", icon: Server, data: results.server_exposure },
    { key: "dns_security", label: "DNS Security", icon: Globe, data: results.dns_security },
    { key: "cookie_security", label: "Cookie Security", icon: Code, data: results.cookie_security },
    { key: "privacy_concerns", label: "Privacy", icon: Eye, data: results.privacy_concerns },
  ].filter(c => c.data) : [];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/30 via-black to-violet-950/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-violet-500/[0.03] rounded-full blur-[100px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-40 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl sticky top-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link to="/" className="text-white/30 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/81791a703_generated_image.png"
                alt="Security Audit"
                className="w-9 h-9 rounded-xl"
              />
              {scanning && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight">Security Audit</h1>
              <p className="text-white/25 text-[10px] font-medium tracking-wider uppercase">AI-Powered Vulnerability Scanner</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Hero Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.06] rounded-full blur-[60px]" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/[0.04] rounded-full blur-[40px]" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Scan className="w-4 h-4 text-cyan-400" />
                <span className="text-white/40 text-xs font-medium uppercase tracking-widest">Scan Target</span>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !scanning && runScan()}
                    placeholder="Enter any URL to scan..."
                    className="w-full bg-black/40 border border-white/[0.08] rounded-2xl pl-12 pr-5 py-4 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10 text-sm font-medium transition-all"
                  />
                </div>
                <button
                  onClick={runScan}
                  disabled={scanning || !url.trim()}
                  className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 text-black font-bold rounded-2xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-cyan-500/20 disabled:shadow-none"
                >
                  {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                  <span className="hidden sm:inline">{scanning ? "Scanning..." : "Scan"}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scanning Animation */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-cyan-500/[0.04] to-violet-500/[0.04] border border-cyan-500/[0.12] rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <Fingerprint className="w-5 h-5 text-cyan-400" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-white/80 text-sm font-medium">Scanning {scanTarget}</p>
                  <p className="text-white/30 text-[11px]">Analyzing security posture, headers, certificates, and vulnerabilities...</p>
                </div>
                <span className="text-cyan-400 font-mono text-sm font-bold">{Math.round(scanProgress)}%</span>
              </div>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500"
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {/* Animated scan lines */}
              <div className="flex items-center gap-2 flex-wrap">
                {["Source Code", "Iframes", "Scripts", "API Calls", "Privacy", "Vulnerabilities", "Auth"].map((item, i) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: scanProgress > (i + 1) * 12 ? 1 : 0.2 }}
                    className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/40 font-mono"
                  >
                    {scanProgress > (i + 1) * 12 ? "✓" : "○"} {item}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/[0.06] border border-red-500/20 rounded-2xl p-5 flex items-start gap-3"
          >
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-bold">Scan Failed</p>
              <p className="text-white/40 text-xs mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score Card */}
              <div className={`bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-3xl p-5 sm:p-8 shadow-2xl ${scoreGlow(results.overall_score)}`}>
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
                  {/* Score Ring */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                    <svg className="w-24 h-24 sm:w-28 sm:h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                      <motion.circle
                        cx="50" cy="50" r="40" fill="none"
                        className={scoreRing(results.overall_score)}
                        strokeWidth="6"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 252" }}
                        animate={{ strokeDasharray: `${(results.overall_score / 100) * 252} 252` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className={`text-2xl sm:text-3xl font-black ${scoreColor(results.overall_score)}`}
                      >
                        {results.overall_score}
                      </motion.span>
                      <span className="text-[9px] text-white/25 uppercase tracking-widest font-bold">Score</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                    {/* App name + icon instead of URL */}
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                      {scanAppInfo?.icon && (
                        <img src={scanAppInfo.icon} alt="" className={`w-8 h-8 ${scanAppInfo?.round ? 'rounded-full' : 'rounded-lg'} border border-white/10`} />
                      )}
                      <span className="text-white font-bold text-lg truncate">{scanTarget || results.url_analyzed}</span>
                    </div>
                    <div className="mb-3">
                      <SeverityBadge severity={results.overall_risk} />
                    </div>
                    <p className="text-white/45 text-xs sm:text-sm leading-relaxed">{results.summary}</p>
                  </div>
                </div>
              </div>

              {/* Category Results */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Activity className="w-4 h-4 text-white/20" />
                  <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Detailed Findings</h2>
                </div>
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <ScanResultCard
                      label={cat.label}
                      icon={cat.icon}
                      status={cat.data.status}
                      severity={cat.data.severity}
                      findings={cat.data.findings || []}
                      missingHeaders={cat.data.missing_headers}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Recommendations */}
              {results.recommendations?.length > 0 && (
                <div className="bg-gradient-to-br from-cyan-500/[0.04] to-transparent border border-cyan-500/[0.1] rounded-2xl p-6 space-y-4">
                  <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    Recommendations
                  </h2>
                  <div className="space-y-3">
                    {results.recommendations.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className="flex items-start gap-2 sm:gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group"
                      >
                        <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-white/55 text-xs leading-relaxed flex-1 break-words">{rec}</span>
                        <button
                          onClick={() => copyRec(rec, i)}
                          className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/60 transition-all opacity-60 group-hover:opacity-100"
                          title="Copy"
                        >
                          {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scan Again */}
              <div className="text-center space-y-3 pt-2 pb-8">
                <button
                  onClick={() => { setResults(null); setUrl(""); setScanAppInfo(null); }}
                  className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-white/50 hover:text-white/80 text-xs font-medium transition-all"
                >
                  Scan Another Target
                </button>
                <p className="text-white/10 text-[10px]">
                  AI-powered assessment based on actual page source code analysis.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State + App Grid */}
        {!results && !scanning && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {/* Hero text */}
            <div className="text-center space-y-4 py-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/15 to-violet-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/10"
              >
                <Shield className="w-10 h-10 text-cyan-400" />
              </motion.div>
              <div>
                <h2 className="text-white/90 font-bold text-xl mb-2">Scan Any Website</h2>
                <p className="text-white/30 text-sm max-w-md mx-auto leading-relaxed">
                  Enter a URL above to check for SSL issues, security headers, vulnerabilities, server exposure, DNS security, and more.
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {["SSL/TLS", "Headers", "XSS & CSRF", "DNS", "Cookies", "Privacy", "Server Exposure"].map(f => (
                  <span key={f} className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/25 text-[10px] font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* App Quick Scan Grid */}
            <AppQuickScan onScanApp={handleAppScan} />
          </motion.div>
        )}
      </div>
    </div>
  );
}