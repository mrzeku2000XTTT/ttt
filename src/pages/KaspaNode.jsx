
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Network, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  RefreshCw,
  Activity,
  Database,
  Zap,
  TrendingUp,
  Server
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REPLIT_BASE_URL = 'https://tttxxx.live';

export default function KaspaNodePage() {
  const [user, setUser] = useState(null);
  const [nodeInfo, setNodeInfo] = useState(null);
  const [dagInfo, setDagInfo] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [userUtxos, setUserUtxos] = useState([]);
  const [estimatedFee, setEstimatedFee] = useState(null);
  
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState(null);
  
  const [iframeReady, setIframeReady] = useState(false);
  const signIframeRef = useRef(null);

  useEffect(() => {
    loadUser();
    loadNodeStats();

    const handleMessage = (event) => {
      if (event.origin !== REPLIT_BASE_URL) return;
      if (!event.data?.type) return;

      switch(event.data.type) {
        case 'kaspaPOSReady':
          setIframeReady(true);
          console.log('✅ Signing iframe ready');
          break;
        case 'transactionSigned':
          if (event.data.signedTransaction) {
            handleSignedTransaction(event.data.signedTransaction);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser.created_wallet_address) {
        loadUserBalance(currentUser.created_wallet_address);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const loadNodeStats = async () => {
    setIsLoadingStats(true);
    try {
      console.log('🔄 Loading node stats...');
      
      // Get node info
      try {
        const nodeResponse = await base44.functions.invoke('kaspaNodeConnection', {
          action: 'getInfo'
        });
        
        console.log('Node response:', nodeResponse);
        
        if (nodeResponse.data?.success) {
          setNodeInfo(nodeResponse.data.data);
        } else {
          console.error('Node info failed:', nodeResponse.data?.error);
        }
      } catch (err) {
        console.error('Node info error:', err);
      }

      // Get DAG info
      try {
        const dagResponse = await base44.functions.invoke('kaspaNodeConnection', {
          action: 'getBlockDagInfo'
        });
        
        console.log('DAG response:', dagResponse);
        
        if (dagResponse.data?.success) {
          setDagInfo(dagResponse.data.data);
        } else {
          console.error('DAG info failed:', dagResponse.data?.error);
        }
      } catch (err) {
        console.error('DAG info error:', err);
      }

      // Get fee estimate
      try {
        const feeResponse = await base44.functions.invoke('kaspaNodeConnection', {
          action: 'estimateFee'
        });
        
        console.log('Fee response:', feeResponse);
        
        if (feeResponse.data?.success) {
          setEstimatedFee(feeResponse.data);
        } else {
          console.error('Fee estimate failed:', feeResponse.data?.error);
        }
      } catch (err) {
        console.error('Fee estimate error:', err);
      }

    } catch (err) {
      console.error('Failed to load node stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadUserBalance = async (address) => {
    try {
      console.log('🔄 Loading balance for:', address);
      
      // Get balance
      try {
        const balanceResponse = await base44.functions.invoke('kaspaNodeConnection', {
          action: 'getBalance',
          address: address
        });
        
        console.log('Balance response:', balanceResponse);
        
        if (balanceResponse.data?.success) {
          setUserBalance(balanceResponse.data);
        } else {
          console.error('Balance failed:', balanceResponse.data?.error);
        }
      } catch (err) {
        console.error('Balance error:', err);
      }

      // Get UTXOs
      try {
        const utxoResponse = await base44.functions.invoke('kaspaNodeConnection', {
          action: 'getUtxos',
          address: address
        });
        
        console.log('UTXO response:', utxoResponse);
        
        if (utxoResponse.data?.success) {
          setUserUtxos(utxoResponse.data.utxos || []);
        } else {
          console.error('UTXO failed:', utxoResponse.data?.error);
        }
      } catch (err) {
        console.error('UTXO error:', err);
      }
    } catch (err) {
      console.error('Failed to load user balance:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNodeStats();
    if (user?.created_wallet_address) {
      await loadUserBalance(user.created_wallet_address);
    }
    setIsRefreshing(false);
  };

  const handleSendTransaction = async () => {
    if (!user?.created_wallet_address) {
      setTxError('Please create a TTT Wallet first');
      return;
    }

    if (!recipientAddress || !amount) {
      setTxError('Please enter recipient address and amount');
      return;
    }

    if (!recipientAddress.startsWith('kaspa:')) {
      setTxError('Recipient address must start with kaspa:');
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      setTxError('Amount must be greater than 0');
      return;
    }

    if (userBalance && amountValue > userBalance.balanceKAS) {
      setTxError('Insufficient balance');
      return;
    }

    setIsSending(true);
    setTxError(null);
    setTxResult(null);

    try {
      console.log('📤 Creating transaction...');
      
      // Get fresh UTXOs
      const utxoResponse = await base44.functions.invoke('kaspaNodeConnection', {
        action: 'getUtxos',
        address: user.created_wallet_address
      });

      if (!utxoResponse.data?.success || !utxoResponse.data.utxos?.length) {
        throw new Error('No UTXOs available');
      }

      const utxos = utxoResponse.data.utxos;
      const amountInSompi = Math.floor(amountValue * 100000000);

      console.log('💰 Amount in sompi:', amountInSompi);
      console.log('📦 Available UTXOs:', utxos.length);

      // Request signing from iframe
      if (!iframeReady) {
        throw new Error('Signing system not ready. Please refresh the page.');
      }

      signIframeRef.current?.contentWindow?.postMessage({
        type: 'signTransaction',
        transaction: {
          from: user.created_wallet_address,
          to: recipientAddress,
          amount: amountInSompi,
          utxos: utxos
        }
      }, REPLIT_BASE_URL);

      console.log('⏳ Waiting for signature...');

    } catch (err) {
      console.error('❌ Transaction error:', err);
      setTxError(err.message || 'Failed to create transaction');
      setIsSending(false);
    }
  };

  const handleSignedTransaction = async (signedTx) => {
    try {
      console.log('📤 Submitting signed transaction...');

      // Submit to network via Forbole
      const submitResponse = await base44.functions.invoke('kaspaNodeConnection', {
        action: 'submitTransaction',
        signedTransaction: signedTx
      });

      if (submitResponse.data?.success) {
        console.log('✅ Transaction submitted!');
        setTxResult({
          success: true,
          txId: submitResponse.data.transactionId,
          message: 'Transaction submitted successfully!'
        });
        
        // Clear form
        setRecipientAddress("");
        setAmount("");
        
        // Refresh balance
        setTimeout(() => {
          loadUserBalance(user.created_wallet_address);
        }, 2000);
      } else {
        throw new Error(submitResponse.data?.error || 'Submission failed');
      }
    } catch (err) {
      console.error('❌ Submission error:', err);
      setTxError(err.message || 'Failed to submit transaction');
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-950 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center">
            <Network className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <p className="text-gray-400 mb-6">Please login to access Kaspa Node</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 text-white">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Hidden signing iframe */}
      <iframe ref={signIframeRef} src={REPLIT_BASE_URL} style={{ display: 'none' }} />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Network className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Kaspa Node</h1>
                  <p className="text-sm text-gray-400">Direct RPC connection via Forbole</p>
                </div>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                <Server className="w-3 h-3 mr-1" />
                Forbole WebSocket
              </Badge>
            </div>
          </motion.div>

          {/* Node Stats Grid */}
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {/* Node Info */}
              <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {nodeInfo?.serverVersion || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Node Version</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Block Count */}
              <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {dagInfo?.blockCount ? dagInfo.blockCount.toLocaleString() : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Block Count</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Difficulty */}
              <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {dagInfo?.difficulty ? parseFloat(dagInfo.difficulty).toFixed(2) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Difficulty</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estimated Fee */}
              <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {estimatedFee?.estimatedFeePerInput || '0.0001'}
                      </div>
                      <div className="text-xs text-gray-500">Fee (KAS/input)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Send Transaction Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Send className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold text-white">Send Transaction</h2>
                  </div>
                  {!user.created_wallet_address && (
                    <p className="text-sm text-yellow-400 mt-2">
                      ⚠️ Please create a TTT Wallet first
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {user.created_wallet_address ? (
                    <>
                      {/* User Balance */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Your Balance</div>
                        <div className="text-2xl font-bold text-white">
                          {userBalance?.balanceKAS?.toFixed(8) || '0.00000000'} KAS
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {userUtxos.length} UTXOs available
                        </div>
                      </div>

                      {/* Recipient Address */}
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Recipient Address (kaspa:...)
                        </label>
                        <Input
                          placeholder="kaspa:qqq..."
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
                          disabled={isSending}
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Amount (KAS)</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-zinc-900 border-zinc-700 text-white text-lg font-bold"
                            disabled={isSending}
                            min="0"
                            step="0.01"
                          />
                          <Button
                            onClick={() => setAmount(userBalance?.balanceKAS?.toString() || "0")}
                            variant="outline"
                            className="border-zinc-700 text-white hover:bg-zinc-800"
                            disabled={isSending}
                          >
                            MAX
                          </Button>
                        </div>
                      </div>

                      {/* Transaction Info */}
                      {amount && parseFloat(amount) > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Amount</span>
                            <span className="text-white font-semibold">{amount} KAS</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Est. Fee</span>
                            <span className="text-white font-semibold">
                              {estimatedFee?.estimatedFeePerInput || '0.0001'} KAS
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Total</span>
                            <span className="text-cyan-400 font-semibold">
                              {(parseFloat(amount) + (estimatedFee?.estimatedFeePerInput || 0.0001)).toFixed(8)} KAS
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <Button
                        onClick={handleSendTransaction}
                        disabled={isSending || !recipientAddress || !amount || parseFloat(amount) <= 0}
                        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Signing & Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Send {amount || '0'} KAS
                          </>
                        )}
                      </Button>

                      {/* Result Messages */}
                      <AnimatePresence>
                        {txError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3"
                          >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-100">{txError}</p>
                          </motion.div>
                        )}

                        {txResult?.success && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-green-500/20 border border-green-500/30 rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3 mb-2">
                              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-green-100 font-semibold mb-1">
                                  {txResult.message}
                                </p>
                                <p className="text-xs text-green-300 font-mono break-all">
                                  TX: {txResult.txId}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`https://kas.fyi/txs/${txResult.txId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                            >
                              View on Explorer →
                            </a>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Network className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No TTT Wallet found</p>
                      <Button
                        onClick={() => window.location.href = '/Wallet'}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        Create Wallet
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* DAG Info & Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold text-white">Network Details</h2>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {dagInfo && (
                    <>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">Network Name</div>
                        <div className="text-lg font-semibold text-white">
                          {dagInfo.networkName || 'Kaspa Mainnet'}
                        </div>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">Virtual DAA Score</div>
                        <div className="text-lg font-semibold text-white font-mono">
                          {dagInfo.virtualDaaScore?.toLocaleString() || 'N/A'}
                        </div>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">Tip Hashes</div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {dagInfo.tipHashes?.slice(0, 3).map((hash, i) => (
                            <div key={i} className="font-mono break-all">{hash}</div>
                          ))}
                          {dagInfo.tipHashes?.length > 3 && (
                            <div className="text-gray-600">
                              + {dagInfo.tipHashes.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {nodeInfo && (
                    <>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">Server Version</div>
                        <div className="text-lg font-semibold text-white">
                          {nodeInfo.serverVersion || 'N/A'}
                        </div>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2">Is Synced</div>
                        <div className="flex items-center gap-2">
                          {nodeInfo.isSynced ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                              <span className="text-lg font-semibold text-green-400">Yes</span>
                            </>
                          ) : (
                            <>
                              <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                              <span className="text-lg font-semibold text-yellow-400">Syncing</span>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
