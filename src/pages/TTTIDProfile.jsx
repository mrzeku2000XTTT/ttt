import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Loader2, FileCheck, Award, Network, ExternalLink, Copy, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TTTIDProfilePage() {
  const navigate = useNavigate();
  const [tttId, setTttId] = useState("");
  const [profile, setProfile] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [seals, setSeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setTttId(id);
      loadProfile(id);
    }
  }, []);

  const loadProfile = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const sealsData = await base44.entities.TTTID.filter({ ttt_id: id, is_active: true });
      
      if (sealsData.length === 0) {
        setError('TTT ID not found');
        return;
      }

      const seal = sealsData[0];
      setSeals(sealsData);

      const userData = await base44.entities.User.filter({ email: seal.created_by }, '', 1);
      if (userData.length > 0) {
        setProfile(userData[0]);
      }

      const certData = await base44.entities.DAGKnightCertificate.filter({
        ttt_id: id,
        is_public: true
      }, '-issued_date', 1);

      if (certData.length > 0) {
        setCertificate(certData[0]);
      }

    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (tttId.trim()) {
      loadProfile(tttId.trim());
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            TTT ID Profiles
          </h1>

          <Card className="bg-black border-zinc-800 mb-6">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tttId}
                  onChange={(e) => setTttId(e.target.value)}
                  placeholder="Enter TTT ID (e.g., qpu461h)"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder:text-gray-600"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  className="bg-cyan-500 text-white hover:bg-cyan-600"
                >
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <Card className="bg-black border-red-500/30 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-black border-zinc-800 mb-6">
              <CardHeader className="border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{profile.username || 'Anonymous'}</h2>
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 mt-2">
                      {tttId}
                    </Badge>
                  </div>
                  {profile.profile_photo && (
                    <img 
                      src={profile.profile_photo} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full border-2 border-cyan-500/50"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {profile.bio && (
                  <p className="text-gray-400 mb-4">{profile.bio}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Trades Completed</div>
                    <div className="text-lg font-bold text-white">{profile.trades_completed || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Reputation</div>
                    <div className="text-lg font-bold text-yellow-400">{profile.reputation_score || 5.0} ⭐</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {certificate && certificate.is_stamped && (
              <Card className="bg-black border-zinc-800 mb-6">
                <CardHeader className="border-b border-zinc-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-yellow-400" />
                    3FA Certificate
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 ml-2">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Stamped
                    </Badge>
                  </h2>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Verified Wallets</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-orange-400" />
                            <span className="text-xs text-gray-400">Kasware L1:</span>
                            <code className="text-xs text-orange-400 font-mono">{certificate.kasware_address.substring(0, 20)}...</code>
                            <button onClick={() => handleCopy(certificate.kasware_address)}>
                              <Copy className="w-3 h-3 text-gray-500 hover:text-gray-400" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-gray-400">TTT Wallet:</span>
                            <code className="text-xs text-purple-400 font-mono">{certificate.ttt_wallet_address.substring(0, 20)}...</code>
                            <button onClick={() => handleCopy(certificate.ttt_wallet_address)}>
                              <Copy className="w-3 h-3 text-gray-500 hover:text-gray-400" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-gray-400">MetaMask L2:</span>
                            <code className="text-xs text-cyan-400 font-mono">{certificate.metamask_address.substring(0, 20)}...</code>
                            <button onClick={() => handleCopy(certificate.metamask_address)}>
                              <Copy className="w-3 h-3 text-gray-500 hover:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Blue Score</div>
                          <div className="text-lg font-bold text-cyan-400">{certificate.total_blue_score}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">DAG Depth</div>
                          <div className="text-lg font-bold text-purple-400">{certificate.total_dag_depth}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Cross-Verifs</div>
                          <div className="text-lg font-bold text-orange-400">{certificate.cross_verifications_count}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Issued</div>
                        <div className="text-sm text-white">{new Date(certificate.issued_date).toLocaleString()}</div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Certificate Hash</div>
                        <code className="text-xs text-cyan-400 font-mono break-all">{certificate.certificate_hash}</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {seals.length > 0 && (
              <Card className="bg-black border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <h2 className="text-xl font-bold text-white">TTT ID Seals</h2>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {seals.map((seal) => (
                    <div key={seal.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-mono mb-2">
                            {seal.ttt_id}
                          </Badge>
                          {seal.display_name && (
                            <div className="text-white font-semibold mb-1">{seal.display_name}</div>
                          )}
                          <div className="text-gray-400 text-xs font-mono break-all">{seal.kaspa_address}</div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 ml-3" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div>{new Date(seal.verified_date).toLocaleDateString()}</div>
                        <a
                          href={`https://kas.fyi/address/${seal.kaspa_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}