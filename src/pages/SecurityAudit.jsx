import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, ExternalLink, ArrowLeft, Loader2, Globe, Lock, Unlock, Server, Code, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import ScanResultCard from "@/components/security/ScanResultCard";
import SeverityBadge from "@/components/security/SeverityBadge";
import AppQuickScan from "@/components/security/AppQuickScan";

export default function SecurityAudit() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);

  const runScan = async () => {
    if (!url.trim()) return;
    let target = url.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = "https://" + target;
    }

    setScanning(true);
    setResults(null);
    setError(null);
    setScanProgress(0);

    const progressInterval = setInterval(() => {
      setScanProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 600);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a web security auditor. Analyze the following URL for potential security vulnerabilities and risks. URL: ${target}

Perform a comprehensive security assessment covering:
1. SSL/TLS Configuration - Check if HTTPS is enforced, certificate validity concerns
2. HTTP Security Headers - Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, X-XSS-Protection, Referrer-Policy, Permissions-Policy
3. Common Vulnerabilities - XSS potential, CSRF risks, SQL injection indicators, open redirects, clickjacking
4. Server Information Exposure - Server header leaks, technology stack exposure, version disclosure
5. DNS & Domain Security - DNSSEC, SPF, DMARC, domain reputation
6. Cookie Security - Secure flag, HttpOnly, SameSite attributes
7. Mixed Content - HTTP resources loaded on HTTPS pages
8. API Security - Exposed endpoints, authentication concerns
9. Privacy Concerns - Tracking scripts, data collection practices
10. Overall Risk Assessment

For each category, provide a severity rating and specific findings. Be thorough but realistic - only flag actual concerns, not hypothetical ones. Base your analysis on the URL structure, domain reputation, and common patterns.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            url_analyzed: { type: "string" },
            overall_score: { type: "number", description: "Security score 0-100, higher is better" },
            overall_risk: { type: "string", enum: ["critical", "high", "medium", "low", "minimal"] },
            summary: { type: "string", description: "2-3 sentence overall assessment" },
            ssl_tls: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["pass", "warn", "fail", "info"] },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            security_headers: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["pass", "warn", "fail", "info"] },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                findings: { type: "array", items: { type: "string" } },
                missing_headers: { type: "array", items: { type: "string" } }
              }
            },
            vulnerabilities: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["pass", "warn", "fail", "info"] },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            server_exposure: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["pass", "warn", "fail", "info"] },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            dns_security: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["pass", "warn", "fail", "info"] },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            cookie_security: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["pass", "warn", "fail", "info"] },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            privacy_concerns: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["pass", "warn", "fail", "info"] },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setScanProgress(100);
      setTimeout(() => setResults(res), 300);
    } catch (err) {
      setError(err.message || "Scan failed. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setScanning(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const scoreRingColor = (score) => {
    if (score >= 80) return "stroke-emerald-400";
    if (score >= 60) return "stroke-yellow-400";
    if (score >= 40) return "stroke-orange-400";
    return "stroke-red-400";
  };

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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Shield className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-bold">Security Audit</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="space-y-3">
          <p className="text-white/50 text-sm">Enter any URL to scan for security vulnerabilities and misconfigurations.</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !scanning && runScan()}
                placeholder="example.com or https://example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 text-sm"
              />
            </div>
            <button
              onClick={runScan}
              disabled={scanning || !url.trim()}
              className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30 text-black font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {scanning ? "Scanning..." : "Scan"}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/30">
                <span>Analyzing security posture...</span>
                <span>{Math.round(scanProgress)}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Scan Failed</p>
              <p className="text-white/50 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Score Overview */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="flex items-start gap-5">
                  {/* Score Circle */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        className={scoreRingColor(results.overall_score)}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(results.overall_score / 100) * 264} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-black ${scoreColor(results.overall_score)}`}>{results.overall_score}</span>
                      <span className="text-[9px] text-white/30 uppercase tracking-wider">Score</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm truncate">{results.url_analyzed}</span>
                      <a href={results.url_analyzed} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/40">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <SeverityBadge severity={results.overall_risk} />
                    <p className="text-white/50 text-xs mt-2 leading-relaxed">{results.summary}</p>
                  </div>
                </div>
              </div>

              {/* Category Results */}
              <div className="space-y-3">
                <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest">Detailed Findings</h2>
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
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
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-3">
                  <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                    Recommendations
                  </h2>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/60 text-xs leading-relaxed">
                        <span className="text-cyan-400/60 font-bold mt-px">{i + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-white/15 text-[10px] text-center">
                This scan provides an AI-powered assessment based on publicly available information. It does not perform active penetration testing. Results should be verified by a professional security auditor.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State + Quick Scan */}
        {!results && !scanning && !error && (
          <div className="space-y-8">
            <div className="text-center py-10 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-white/60 font-bold text-sm">Scan Any Website</h2>
              <p className="text-white/25 text-xs max-w-sm mx-auto">
                Enter a URL above to check for SSL issues, missing security headers, vulnerabilities, server exposure, and more.
              </p>
            </div>
            <AppQuickScan onScanApp={(appName) => {
              setUrl(appName + " website");
              // Trigger scan with app name as context
              const target = appName;
              setScanning(true);
              setResults(null);
              setError(null);
              setScanProgress(0);
              const progressInterval = setInterval(() => {
                setScanProgress(p => Math.min(p + Math.random() * 15, 90));
              }, 600);
              base44.integrations.Core.InvokeLLM({
                prompt: `You are a web security auditor. Analyze the app/service called "${target}" for potential security vulnerabilities and risks. Search for the app online and analyze its web presence, domain, and any publicly available security information.\n\nPerform a comprehensive security assessment covering:\n1. SSL/TLS Configuration\n2. HTTP Security Headers\n3. Common Vulnerabilities\n4. Server Information Exposure\n5. DNS & Domain Security\n6. Cookie Security\n7. Mixed Content\n8. API Security\n9. Privacy Concerns\n10. Overall Risk Assessment`,
                add_context_from_internet: true,
                response_json_schema: {
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
                }
              }).then(res => {
                setScanProgress(100);
                setTimeout(() => setResults(res), 300);
              }).catch(err => {
                setError(err.message || "Scan failed.");
              }).finally(() => {
                clearInterval(progressInterval);
                setScanning(false);
              });
            }} />
          </div>
        )}
      </div>
    </div>
  );
}