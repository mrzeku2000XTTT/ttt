import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function TTTAuditPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const handleDownload = async () => {
    if (!user || user.role !== 'admin') {
      alert('Admin access required');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const response = await base44.functions.invoke('generateTTTAudit');
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ttt-complete-audit.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to generate audit: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">Admin access required to view audit</p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-cyan-500 to-purple-500"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            delay: 1,
          }}
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[180px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-3xl flex items-center justify-center backdrop-blur-sm">
            <FileText className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400">
              TTT Complete Audit
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Comprehensive platform documentation in PDF format
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">What's Included:</h2>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Platform Overview</div>
                    <div className="text-gray-400 text-sm">Architecture, technologies, and key differentiators</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Core Features & Apps</div>
                    <div className="text-gray-400 text-sm">TTTV, Agent ZK, Zeku AI, AK, and 100+ more features</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">User Management</div>
                    <div className="text-gray-400 text-sm">Authentication, profiles, TTT ID, subscription system</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Blockchain Integration</div>
                    <div className="text-gray-400 text-sm">Kaspa, wallets, smart contracts, DAGKnight</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">AI & Automation</div>
                    <div className="text-gray-400 text-sm">10+ AI agents, models, features, and automations</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Social Features</div>
                    <div className="text-gray-400 text-sm">Feed, posts, comments, tips, badges, engagement</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Marketplace & Commerce</div>
                    <div className="text-gray-400 text-sm">Trading, escrow, shop, templates, NFTs</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Developer Tools</div>
                    <div className="text-gray-400 text-sm">80+ functions, APIs, SSH manager, admin hub</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Security & Authentication</div>
                    <div className="text-gray-400 text-sm">Encryption, signatures, RLS, moderation</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Data Entities & Schema</div>
                    <div className="text-gray-400 text-sm">50+ entities with complete documentation</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">Buttons & Actions</div>
                    <div className="text-gray-400 text-sm">Every button, action, and interaction documented</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">External Integrations</div>
                    <div className="text-gray-400 text-sm">APIs, services, payment processors, media</div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDownload}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 h-14 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Downloaded Successfully!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Complete Audit PDF
                  </>
                )}
              </Button>

              {success && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-green-400 text-sm mt-4"
                >
                  ✓ PDF downloaded successfully - check your downloads folder
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}