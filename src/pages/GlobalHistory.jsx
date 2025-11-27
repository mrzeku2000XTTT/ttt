import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlobalTransaction } from "@/entities/GlobalTransaction";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function GlobalHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTransactions = async () => {
    try {
      const allTransactions = await GlobalTransaction.list('-timestamp', 100);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Failed to load global transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateTxHash = (hash) => {
    if (!hash) return 'N/A';
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}`;
  };

  const GOAL = 1000000000;
  const percentage = ((transactions.length / GOAL) * 100).toFixed(8);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Global Transaction History
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Road to 1 Billion Transactions - {percentage}% Complete
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-semibold">Progress to 1B</span>
                <span className="text-cyan-400 font-bold text-2xl">{transactions.length.toLocaleString()}</span>
              </div>
              <div className="h-4 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Transactions List */}
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Recent Global Transactions</h2>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr className="text-left">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">TX Hash</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">From</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">To</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Network</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx, index) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <a
                            href={`https://explorer.kaspa.org/txs/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 font-mono text-sm flex items-center gap-1"
                          >
                            {truncateTxHash(tx.tx_hash)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-mono text-sm">{tx.from_address || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300 font-mono text-sm">{tx.to_address || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className="text-white font-semibold">{tx.amount} KAS</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            {tx.network}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {format(new Date(tx.timestamp), 'MMM d, yyyy h:mm a')}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}