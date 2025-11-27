
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, CheckCircle2, XCircle, Loader2, Share2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

export default function RecentTransactions({ transactions, onShareToGlobal, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      setRefreshError(null);
      
      try {
        await onRefresh();
        setTimeout(() => setIsRefreshing(false), 500);
      } catch (error) {
        console.error('Failed to refresh:', error);
        setRefreshError('Failed to refresh transactions');
        setIsRefreshing(false);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    if (addr.length <= 20) return addr;
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}`;
  };

  const truncateTxHash = (hash) => {
    if (!hash) return 'N/A';
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}`;
  };

  // Sort transactions by created_date (most recent first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
  });

  if (sortedTransactions.length === 0) {
    return (
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Transfers</h3>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              disabled={isRefreshing}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-16">
          {refreshError ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 font-medium mb-2">{refreshError}</p>
              <Button
                onClick={handleRefresh}
                size="sm"
                className="bg-red-500/20 border border-red-500 hover:bg-red-500/30 text-red-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                <ArrowRight className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-medium">No transfers yet</p>
              <p className="text-sm text-zinc-600 mt-2">Your transfer history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Recent Transfers</h3>
            <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {sortedTransactions.length} Total
            </Badge>
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6 max-h-[600px] overflow-y-auto">
        {sortedTransactions.slice(0, 20).map((tx, index) => {
          console.log(`Transaction #${index}:`, tx);
          
          let cleanTxHash = tx.tx_hash;
          if (tx.tx_hash && typeof tx.tx_hash === 'object') {
            cleanTxHash = tx.tx_hash.id || tx.tx_hash.txid || tx.tx_hash.hash || '';
            console.warn('⚠️ TX Hash was an object, extracted:', cleanTxHash);
          } else if (typeof tx.tx_hash === 'string') {
            cleanTxHash = tx.tx_hash;
          }
          
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {tx.from_network} → {tx.to_network}
                  </div>
                  <div className="text-xs text-zinc-500" title={format(new Date(tx.created_date), 'PPpp')}>
                    {formatDistanceToNow(new Date(tx.created_date), { addSuffix: true })}
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(tx.status)}>
                  <span className="flex items-center gap-1 font-semibold text-xs">
                    {getStatusIcon(tx.status)}
                    {tx.status}
                  </span>
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Amount</span>
                  <span className="text-base font-bold text-white">{tx.amount} KAS</span>
                </div>
                
                {tx.fee && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-600">Fee</span>
                    <span className="text-xs text-zinc-400 font-medium">{tx.fee.toFixed(6)} KAS</span>
                  </div>
                )}

                {cleanTxHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-600">TX ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-cyan-400 font-mono">
                        {truncateTxHash(cleanTxHash)}
                      </code>
                      <div className="flex items-center gap-1">
                        <a
                          href={`https://kas.fyi/transaction/${cleanTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 transition-colors"
                          title="View on kas.fyi"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={`https://explorer.kaspa.org/txs/${cleanTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                          title="View on Kaspa Explorer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {tx.from_address && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-600">From</span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {truncateAddress(tx.from_address)}
                    </span>
                  </div>
                )}

                {tx.to_address && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-600">To</span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {truncateAddress(tx.to_address)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500">
                    {format(new Date(tx.created_date), 'MMM d, h:mm a')}
                  </span>
                  
                  {tx.status === 'completed' && onShareToGlobal && (
                    <Button
                      onClick={() => onShareToGlobal(tx)}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share to Global
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
