import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Flame } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CHALLENGE_START = new Date('2025-11-04T00:00:00Z');
const CHALLENGE_END = new Date('2025-11-07T00:00:00Z');

export default function ContributorHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const addr = urlParams.get('address');
    if (addr) {
      setAddress(addr);
      loadTransactions(addr);
    }
  }, []);

  const loadTransactions = async (addr) => {
    setIsLoading(true);
    try {
      const allTransactions = await base44.entities.GlobalTransaction.list('-timestamp', 10000);
      const filtered = allTransactions.filter(tx => tx.from_address === addr);
      setTransactions(filtered);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isChallengeTx = (timestamp) => {
    const txDate = new Date(timestamp);
    return txDate >= CHALLENGE_START && txDate < CHALLENGE_END;
  };

  const truncateTxHash = (hash) => {
    if (!hash) return 'N/A';
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}`;
  };

  const challengeTxCount = transactions.filter(tx => isChallengeTx(tx.timestamp)).length;
  const totalVolume = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to={createPageUrl("Countdown")}>
              <button className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back to Countdown
              </button>
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <span className="text-white font-bold text-xl">#</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Contributor History
                </h1>
                <p className="text-gray-400 text-sm mt-1 font-mono">{address}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Transactions</div>
                  <div className="text-3xl font-bold text-white">{transactions.length}</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-orange-500/20 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <div className="text-sm text-orange-300">Challenge TXs</div>
                  </div>
                  <div className="text-3xl font-bold text-orange-400">{challengeTxCount}</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Volume</div>
                  <div className="text-3xl font-bold text-white">{totalVolume.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">KAS</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Transaction History</h2>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr className="text-left">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">TX Hash</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">To</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Challenge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx, index) => {
                      const isChallenge = isChallengeTx(tx.timestamp);
                      
                      return (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`hover:bg-white/5 transition-colors ${
                            isChallenge ? 'bg-orange-500/10' : ''
                          }`}
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
                          <td className="px-6 py-4 text-gray-300 font-mono text-sm">{tx.to_address || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className="text-white font-semibold">{tx.amount} KAS</span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {format(new Date(tx.timestamp), 'MMM d, yyyy h:mm a')}
                          </td>
                          <td className="px-6 py-4">
                            {isChallenge && (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                <Flame className="w-3 h-3 mr-1" />
                                Challenge TX
                              </Badge>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
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