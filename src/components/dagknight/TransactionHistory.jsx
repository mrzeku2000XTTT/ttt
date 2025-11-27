import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Clock, ExternalLink, Loader2, RefreshCw, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TransactionHistory({ walletAddress, getUTXOHistory, utxoHandlerReady }) {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (walletAddress && utxoHandlerReady) {
      loadTransactions();
    }
  }, [walletAddress, utxoHandlerReady]);

  const loadTransactions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📊 Loading transactions for:', walletAddress);
      
      // Try iframe first, fallback to direct API
      let data;
      try {
        data = await getUTXOHistory(walletAddress);
      } catch (iframeError) {
        console.warn('Iframe failed, trying direct API...', iframeError);
        // Fallback to direct API call
        const response = await base44.functions.invoke('getKaspaUTXOs', {
          address: walletAddress
        });
        data = response.data;
      }

      if (data && data.success) {
        console.log('✅ Received transaction data:', {
          balance: data.balance?.kas || data.balanceKAS,
          utxoCount: data.utxoCount,
          historyLength: data.history?.length
        });
        
        setBalance(data.balance || { kas: data.balanceKAS || 0 });
        setTransactions(data.history || []);
      } else {
        setError(data?.error || 'Failed to load transactions');
        setTransactions([]);
      }
      
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Unable to load transaction history. Please try again.');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAmount = (amount) => {
    if (!amount) return '0';
    const kas = Number(amount) / 100000000;
    return kas.toFixed(8);
  };

  if (!walletAddress) {
    return null;
  }

  return (
    <Card className="bg-black border-zinc-800">
      <CardHeader className="border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Transaction History</h2>
              {balance && (
                <p className="text-sm text-gray-400">
                  Balance: <span className="text-cyan-400 font-semibold">{balance.kas} KAS</span>
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={loadTransactions}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="text-cyan-400 hover:text-cyan-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <p className="text-sm">{error}</p>
            </div>
            <Button
              onClick={loadTransactions}
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <p>No transactions yet</p>
            <p className="text-xs text-gray-600 mt-2">Send 0.2 KAS from Kastle to verify your wallet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx, idx) => {
              const amount = Number(tx.amount);
              const isIncoming = amount > 0;
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isIncoming ? 'bg-green-500/20' : 'bg-orange-500/20'
                      }`}>
                        {isIncoming ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-orange-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {isIncoming ? 'Received' : 'Sent'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(tx.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        isIncoming ? 'text-green-400' : 'text-orange-400'
                      }`}>
                        {isIncoming ? '+' : ''}{formatAmount(Math.abs(amount))} KAS
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs mt-1"
                      >
                        ✓ Confirmed
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Transaction ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-400 font-mono">
                          {tx.txId?.substring(0, 16)}...
                        </code>
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://kas.fyi/transaction/${tx.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300"
                            title="View on kas.fyi"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://explorer.kaspa.org/txs/${tx.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300"
                            title="View on Kaspa Explorer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {tx.blockDaaScore && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Block DAA Score:</span>
                        <span className="text-gray-400 font-mono">{tx.blockDaaScore}</span>
                      </div>
                    )}

                    {tx.confirmations && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Confirmations:</span>
                        <div className="flex items-center gap-1 text-green-400">
                          <Zap className="w-3 h-3" />
                          <span className="font-mono">{tx.confirmations}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {transactions.length > 10 && (
          <div className="text-center mt-6">
            <Badge variant="outline" className="text-gray-400">
              Showing 10 of {transactions.length} transactions
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}