import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Copy, CheckCircle2, Loader2, AlertCircle, ExternalLink, Wallet as WalletIcon } from "lucide-react";

export default function RegisterTTTIDPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSealing, setIsSealing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [mySeals, setMySeals] = useState([]);
  const [mySealedWallets, setMySealedWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const seals = await base44.entities.TTTID.filter({
        created_by: currentUser.email,
        is_active: true
      }, '-verified_date', 100);
      setMySeals(seals);

      const wallets = await base44.entities.SealedWallet.filter({
        created_by: currentUser.email,
        is_active: true
      }, '-sealed_date', 100);
      setMySealedWallets(wallets);

    } catch (err) {
      console.error('Failed to load:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeal = async () => {
    if (!address || !address.startsWith('kaspa:')) {
      setError('Please enter a valid Kaspa address (starts with kaspa:)');
      return;
    }

    if (!window.kasware) {
      setError('Please install Kasware wallet extension');
      return;
    }

    setIsSealing(true);
    setError(null);
    setSuccess(null);

    try {
      const accounts = await window.kasware.getAccounts();
      if (accounts.length === 0) {
        throw new Error('Please connect Kasware wallet');
      }

      const message = `I am registering my TTT ID.\n\nAddress: ${address}\nDisplay Name: ${displayName || 'N/A'}\nTimestamp: ${Date.now()}\n\nThis is my Kaspa Seal.`;
      
      const signature = await window.kasware.signMessage(message);

      const tttId = address.substring(address.length - 8);

      await base44.entities.TTTID.create({
        kaspa_address: address,
        seal_signature: signature,
        seal_message: message,
        ttt_id: tttId,
        display_name: displayName || null,
        verified_date: new Date().toISOString(),
        is_active: true
      });

      setSuccess(`🎉 TTT ID Created! Your ID: ${tttId}`);
      setAddress("");
      setDisplayName("");
      await loadData();

    } catch (err) {
      console.error('Seal error:', err);
      setError(err.message || 'Failed to create TTT ID');
    } finally {
      setIsSealing(false);
    }
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleViewWallet = (wallet) => {
    navigate(createPageUrl("SealedWalletDetails") + `?id=${wallet.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-950 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 text-white">
              Login
            </Button>
          </CardContent>
        </Card>
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">TTT ID</h1>
              <p className="text-gray-400 text-sm">Seal your Kaspa addresses on-chain</p>
            </div>
          </div>
        </motion.div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">Create New TTT ID</h2>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Kaspa Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="kaspa:..."
                    className="bg-black border-zinc-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Display Name (Optional)</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="My Kaspa Wallet"
                    className="bg-black border-zinc-800 text-white"
                  />
                </div>

                <Button
                  onClick={handleSeal}
                  disabled={isSealing || !address}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold h-12"
                >
                  {isSealing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Seal...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Create TTT ID
                    </>
                  )}
                </Button>

                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2">How it works:</h3>
                    <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
                      <li>Enter your Kaspa address</li>
                      <li>Sign with Kasware to prove ownership</li>
                      <li>Your TTT ID is created on-chain</li>
                      <li>Use it to verify your identity</li>
                    </ol>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">My TTT IDs</h2>
              </CardHeader>
              <CardContent className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
                {mySeals.length === 0 && mySealedWallets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    <p className="text-sm">No TTT IDs yet</p>
                  </div>
                ) : (
                  <>
                    {mySeals.map((seal) => (
                      <div
                        key={seal.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono mb-2">
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
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleCopy(seal.kaspa_address, seal.id)}
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                            >
                              {copiedId === seal.id ? (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            <a
                              href={`https://kas.fyi/address/${seal.kaspa_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}

                    {mySealedWallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => handleViewWallet(wallet)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800 hover:border-purple-500/30 transition-all text-left"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                                WALLET-{wallet.wallet_address.substring(wallet.wallet_address.length - 8)}
                              </Badge>
                              <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                                {wallet.mnemonic_word_count} words
                              </Badge>
                            </div>
                            <div className="text-gray-400 text-xs font-mono break-all">{wallet.wallet_address}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <WalletIcon className="w-4 h-4 text-purple-400" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div>{new Date(wallet.sealed_date).toLocaleDateString()}</div>
                          <div className="text-purple-400 font-semibold">Click to view →</div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}