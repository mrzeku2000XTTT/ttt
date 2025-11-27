import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowLeft, Link as LinkIcon, AlertTriangle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";

export default function LinkCheckerPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkLink = async () => {
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('checkLinkSecurity', { url: url.trim() });
      setResult(response.data);
    } catch (err) {
      console.error('Link check failed:', err);
      alert('Failed to check link. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950/30 via-black to-blue-900/25 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate(createPageUrl('Singularity'))}
          variant="ghost"
          className="text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Singularity
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">
            Link Checker
          </h1>
          <p className="text-white/50 text-lg">AI-powered scam & phishing detection</p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/60 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 mb-8"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkLink()}
                placeholder="Enter URL to check (e.g., https://example.com)"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 pl-12 h-12"
              />
            </div>
            <Button
              onClick={checkLink}
              disabled={isChecking || !url.trim()}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-12 px-6 font-semibold disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Check Link
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-black/60 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  {/* Risk Level Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`px-4 py-2 rounded-lg border ${getRiskColor(result.risk_level)} font-bold flex items-center gap-2`}>
                      {result.is_safe ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                      Risk Level: {result.risk_level}
                    </div>

                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm"
                      >
                        View Link
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Threat Type */}
                  {result.threat_type && (
                    <div className="mb-4">
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Threat Detected
                      </h3>
                      <p className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        {result.threat_type}
                      </p>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="mb-4">
                    <h3 className="text-white font-semibold mb-2">Analysis</h3>
                    <p className="text-white/70 leading-relaxed">{result.explanation}</p>
                  </div>

                  {/* Red Flags */}
                  {result.red_flags && result.red_flags.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        Red Flags Detected
                      </h3>
                      <ul className="space-y-2">
                        {result.red_flags.map((flag, idx) => (
                          <li key={idx} className="text-white/70 bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-2">
                            <span className="text-orange-400 mt-0.5">⚠️</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Security Checks Performed */}
                  {result.checks_performed && (
                    <div className="mb-4">
                      <h3 className="text-white font-semibold mb-2">Security Checks</h3>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                        {Object.entries(result.checks_performed).map(([check, status]) => (
                          <div key={check} className="flex items-center justify-between text-sm">
                            <span className="text-white/60 capitalize">{check.replace(/_/g, ' ')}</span>
                            <span className="text-white/90 font-mono">{status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h3 className="text-blue-400 font-semibold mb-2">Recommendations</h3>
                      <p className="text-white/70 leading-relaxed">{result.recommendations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Section */}
        {!result && !isChecking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/40 text-sm"
          >
            <p className="mb-2">Enter a URL above to check for:</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <span className="bg-white/5 px-3 py-1 rounded-full">Phishing</span>
              <span className="bg-white/5 px-3 py-1 rounded-full">Scams</span>
              <span className="bg-white/5 px-3 py-1 rounded-full">Malware</span>
              <span className="bg-white/5 px-3 py-1 rounded-full">Suspicious Domains</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}