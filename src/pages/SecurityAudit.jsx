import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, ExternalLink, ArrowLeft, Loader2, Globe, Lock, Server, Code, Eye, Scan, Fingerprint, Activity } from "lucide-react";
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

const SCAN_PROMPT_BASE = `You are a web security auditor. Perform a comprehensive security assessment covering:
1. SSL/TLS Configuration
2. HTTP Security Headers - CSP, X-Frame-Options, HSTS, etc.
3. Common Vulnerabilities - XSS, CSRF, SQL injection, clickjacking
4. Server Information Exposure
5. DNS & Domain Security
6. Cookie Security
7. Privacy Concerns
8. Overall Risk Assessment
Be thorough but realistic - only flag actual concerns.`;

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

  const handleAppScan = async (app) => {
    const appName = app.name;
    const appPath = app.path;
    setUrl(appName);
    setScanTarget(appName);
    setScanning(true);
    setResults(null);
    setError(null);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress(p => Math.min(p + Math.random() * 8, 40));
    }, 500);
    progressRef.current = interval;

    // Build the internal app URL to fetch the actual page source
    const appUrl = `${window.location.origin}/${appPath}`;
    let pageSource = "";
    try {
      setScanProgress(10);
      const resp = await fetch(appUrl);
      const html = await resp.text();
      // Extract meaningful content (first 8000 chars to stay within limits)
      pageSource = html.slice(0, 8000);
      setScanProgress(35);
    } catch (fetchErr) {
      pageSource = `Could not fetch page source for ${appPath}. URL attempted: ${appUrl}`;
    }

    clearInterval(interval);
    const interval2 = setInterval(() => {
      setScanProgress(p => Math.min(p + Math.random() * 12, 92));
    }, 500);
    progressRef.current = interval2;

    const prompt = `${SCAN_PROMPT_BASE}

You are auditing an INTERNAL web application page called "${appName}" hosted at: ${appUrl}

This is a Single Page Application (React). Below is the actual HTML source of this app page. Analyze it for:
- Inline scripts and their security implications
- External resources loaded (CDNs, APIs, third-party scripts)
- Data exposure risks (API keys, tokens, secrets in source)
- DOM-based XSS vulnerabilities
- Content Security Policy compliance
- Authentication/authorization patterns visible in code
- Sensitive data in local storage or cookies usage patterns
- Third-party tracking or analytics scripts
- Insecure resource loading (HTTP vs HTTPS)
- Input handling and sanitization patterns

ACTUAL PAGE SOURCE:
\`\`\`html
${pageSource}
\`\`\`

Base your findings ONLY on what you can see in the actual source code above. Do NOT guess or make up external URLs. Report real findings from the code.`;

    base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCAN_SCHEMA
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
                {["SSL/TLS", "Headers", "DNS", "Cookies", "Privacy", "Vulnerabilities"].map((item, i) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: scanProgress > (i + 1) * 14 ? 1 : 0.2 }}
                    className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/40 font-mono"
                  >
                    {scanProgress > (i + 1) * 14 ? "✓" : "○"} {item}
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
              <div className={`bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl ${scoreGlow(results.overall_score)}`}>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Score Ring */}
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
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
                        className={`text-3xl font-black ${scoreColor(results.overall_score)}`}
                      >
                        {results.overall_score}
                      </motion.span>
                      <span className="text-[9px] text-white/25 uppercase tracking-widest font-bold">Score</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <span className="text-white font-bold text-lg truncate">{results.url_analyzed}</span>
                      <a href={results.url_analyzed} target="_blank" rel="noopener noreferrer" className="text-white/15 hover:text-white/40 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="mb-3">
                      <SeverityBadge severity={results.overall_risk} />
                    </div>
                    <p className="text-white/45 text-sm leading-relaxed">{results.summary}</p>
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
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                      >
                        <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-white/55 text-xs leading-relaxed">{rec}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scan Again */}
              <div className="text-center space-y-3 pt-2">
                <button
                  onClick={() => { setResults(null); setUrl(""); }}
                  className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-white/50 hover:text-white/80 text-xs font-medium transition-all"
                >
                  Scan Another Target
                </button>
                <p className="text-white/10 text-[10px]">
                  AI-powered assessment based on public information. Does not perform active penetration testing.
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