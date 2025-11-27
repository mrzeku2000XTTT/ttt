import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function GlobalCounter({ refreshTrigger }) {
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const GOAL = 1000000000; // 1 billion transactions

  useEffect(() => {
    loadGlobalStats();
    
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(loadGlobalStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Watch for external refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 External refresh triggered for GlobalCounter');
      loadGlobalStats();
    }
  }, [refreshTrigger]);

  const loadGlobalStats = async () => {
    try {
      console.log('📊 Loading global stats...');
      const transactions = await base44.entities.GlobalTransaction.list('', 10000);
      
      const count = transactions.length;
      const volume = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      console.log('✅ Global stats loaded:', { count, volume });
      
      setTotalTransactions(count);
      setTotalVolume(volume);
    } catch (error) {
      console.error('Failed to load global stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const percentage = ((totalTransactions / GOAL) * 100).toFixed(8);
  const remainingToGoal = GOAL - totalTransactions;

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Global Challenge</h3>
            <p className="text-xs text-zinc-500">Road to 1 Billion Transactions</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-500">Progress</span>
              <span className="text-sm font-semibold text-cyan-400">{percentage}%</span>
            </div>
            <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-zinc-500">Total TX</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {totalTransactions.toLocaleString()}
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-zinc-500">Volume</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {totalVolume.toFixed(2)} KAS
              </div>
            </div>
          </div>

          {/* Remaining */}
          <div className="text-center pt-3 border-t border-zinc-800">
            <div className="text-sm text-zinc-500 mb-1">Remaining to Goal</div>
            <div className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text">
              {remainingToGoal.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}