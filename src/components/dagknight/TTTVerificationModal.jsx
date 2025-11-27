import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Shield, CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

function TTTVerificationModal({ walletAddress, onClose, onVerify, isVerifying }) {
  const [isChecking, setIsChecking] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [detectedTx, setDetectedTx] = useState(null);
  const [error, setError] = useState(null);
  const [lastBalance, setLastBalance] = useState(null);
  const [utxos, setUtxos] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('🎯 TTTVerificationModal mounted with address:', walletAddress);
    
    if (!walletAddress) {
      setError('No wallet address provided');
      return;
    }

    initializeCheck();
    
    const interval = setInterval(() => {
      if (isInitialized && !detectedTx) {
        checkForTransaction();
      }
    }, 3000);

    return () => {
      console.log('🔴 Cleaning up TTTVerificationModal');
      clearInterval(interval);
    };
  }, [walletAddress, isInitialized, detectedTx]);

  const initializeCheck = async () => {
    try {
      console.log('🔍 Initializing verification check...');
      setError(null);
      
      const balanceRes = await base44.functions.invoke('getKaspaBalance', { 
        address: walletAddress 
      });

      console.log('💰 Balance response:', balanceRes.data);

      if (balanceRes.data && balanceRes.data.success) {
        const initialBalance = balanceRes.data.balanceKAS || 0;
        setLastBalance(initialBalance);
        console.log('✅ Initial balance set:', initialBalance, 'KAS');
      } else {
        throw new Error('Failed to get balance from API');
      }

      await fetchUTXOs();
      setIsInitialized(true);
      console.log('✅ Initialization complete');
      
    } catch (err) {
      console.error('❌ Initialization failed:', err);
      setError(`Failed to initialize: ${err.message}. Please close and try again.`);
      setIsInitialized(false);
    }
  };

  const fetchUTXOs = async () => {
    try {
      console.log('📜 Fetching UTXOs...');
      const utxoRes = await base44.functions.invoke('getKaspaUTXOs', {
        address: walletAddress
      });

      console.log('📜 UTXO response:', utxoRes.data);

      if (utxoRes.data && utxoRes.data.success && utxoRes.data.history) {
        setUtxos(utxoRes.data.history);
        console.log('✅ Loaded', utxoRes.data.history.length, 'transactions');
      } else {
        console.warn('⚠️ No transaction history found');
        setUtxos([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch UTXOs:', err);
      setUtxos([]);
    }
  };

  const checkForTransaction = async () => {
    if (isChecking) {
      console.log('⏭️ Check already in progress, skipping');
      return;
    }

    try {
      setIsChecking(true);
      setCheckCount(prev => prev + 1);
      console.log(`🔍 Checking for transaction (attempt ${checkCount + 1})...`);

      const balanceRes = await base44.functions.invoke('getKaspaBalance', { 
        address: walletAddress 
      });

      if (balanceRes.data && balanceRes.data.success) {
        const currentBalance = balanceRes.data.balanceKAS || 0;
        console.log('💰 Current balance:', currentBalance, 'KAS (Last:', lastBalance, 'KAS)');

        if (lastBalance !== null && currentBalance !== lastBalance) {
          const difference = currentBalance - lastBalance;
          console.log(`✅ Balance changed! Difference: ${difference} KAS`);

          await fetchUTXOs();
          
          const utxoRes = await base44.functions.invoke('getKaspaUTXOs', {
            address: walletAddress
          });

          let txHash = 'auto_verified';
          if (utxoRes.data && utxoRes.data.success && utxoRes.data.history && utxoRes.data.history.length > 0) {
            const recentTx = utxoRes.data.history[0];
            txHash = recentTx.txId || recentTx.transactionId || recentTx.tx_id || 'auto_verified';
            console.log('📝 Found TX hash:', txHash);
          }

          setDetectedTx({
            amount: Math.abs(difference),
            txHash: txHash,
            type: difference > 0 ? 'received' : 'sent'
          });

          setError(null);
          return;
        }

        setLastBalance(currentBalance);
      }

    } catch (err) {
      console.error('❌ Check failed:', err);
      setError(`Check failed: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleComplete = () => {
    if (!detectedTx) {
      setError('No transaction detected yet');
      return;
    }

    console.log('✅ Completing verification with TX:', detectedTx.txHash);
    const message = `TTT Wallet Verification\n\nWallet: ${walletAddress}\nTransaction: ${detectedTx.txHash}\nAmount: ${detectedTx.amount.toFixed(8)} KAS\nType: ${detectedTx.type}\nTimestamp: ${new Date().toISOString()}`;
    
    if (onVerify) {
      onVerify(message, detectedTx.txHash);
    }
  };

  const handleManualCheck = () => {
    console.log('🔄 Manual check triggered');
    setError(null);
    checkForTransaction();
  };

  if (!walletAddress) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <Card className="bg-zinc-950 border-red-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Error</h3>
              <p className="text-gray-400 mb-4">No wallet address provided</p>
              <Button onClick={onClose} className="bg-red-500 hover:bg-red-600">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(walletAddress)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-zinc-950 border-purple-500/30">
          <CardHeader className="border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Verify TTT Wallet</h2>
                  <p className="text-sm text-gray-400">
                    {isInitialized ? 'Auto-detection active' : 'Initializing...'}
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {!detectedTx ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                  <h3 className="text-black font-semibold mb-4">Your TTT Wallet</h3>
                  <img 
                    src={qrCodeUrl} 
                    alt="Wallet QR Code" 
                    className="w-64 h-64"
                  />
                  <p className="text-xs text-gray-600 mt-3 text-center break-all font-mono px-4">
                    {walletAddress}
                  </p>
                  {lastBalance !== null && (
                    <p className="text-sm text-gray-800 mt-2 font-semibold">
                      Balance: {lastBalance.toFixed(8)} KAS
                    </p>
                  )}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Verification Status</span>
                    {!isInitialized ? (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Initializing...</span>
                      </div>
                    ) : isChecking ? (
                      <div className="flex items-center gap-2 text-cyan-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Checking...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs">Monitoring active</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Checks: {checkCount} • Auto-checking every 3 seconds
                  </div>
                </div>

                {utxos.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Recent Transactions</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {utxos.slice(0, 5).map((tx, idx) => (
                        <div key={idx} className="bg-black/50 border border-zinc-700 rounded p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-cyan-400 font-mono">
                              {tx.amount ? (Number(tx.amount) / 100000000).toFixed(8) : '0.00000000'} KAS
                            </span>
                            <span className="text-xs text-gray-500">
                              {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-600 font-mono">
                            TX: {tx.txId ? tx.txId.substring(0, 16) + '...' : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-300">{error}</p>
                      <Button
                        onClick={initializeCheck}
                        size="sm"
                        className="mt-2 bg-red-500/20 hover:bg-red-500/30 text-red-300"
                      >
                        Retry Initialization
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <p className="text-sm text-cyan-300">
                    💡 <strong>Auto-Verification:</strong> Send or receive any amount to/from this wallet. 
                    The system will automatically detect the transaction and verify your wallet.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleManualCheck}
                    disabled={isChecking || !isInitialized}
                    variant="outline"
                    className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Check Now
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-zinc-700 text-gray-400 hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Transaction Detected!</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Wallet activity verified successfully
                  </p>
                  
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount:</span>
                      <span className="text-green-400 font-semibold">{detectedTx.amount.toFixed(8)} KAS</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className={detectedTx.type === 'received' ? 'text-green-400' : 'text-blue-400'}>
                        {detectedTx.type === 'received' ? '↓ Received' : '↑ Sent'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">TX Hash:</span>
                      <code className="text-purple-400 text-xs break-all">
                        {detectedTx.txHash.substring(0, 16)}...
                      </code>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={isVerifying}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Verification...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Complete Verification
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default TTTVerificationModal;