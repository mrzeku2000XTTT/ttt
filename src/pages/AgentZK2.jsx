import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Terminal, Zap, Loader2, Network, Activity, CheckCircle2, AlertCircle } from "lucide-react";

export default function AgentZK2Page() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nodeStatus, setNodeStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState(null);
  const [dagInfo, setDagInfo] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser?.created_wallet_address) {
        await checkNodeStatus();
        await loadBalance(currentUser.created_wallet_address);
        await loadDagInfo();
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkNodeStatus = async () => {
    setIsConnecting(true);
    try {
      const response = await base44.functions.invoke('agentZKKaspaNode', {
        action: 'getInfo'
      });

      if (response.data?.success) {
        setNodeStatus(response.data.data);
      }
    } catch (err) {
      console.error('Failed to check node status:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadBalance = async (address) => {
    try {
      const response = await base44.functions.invoke('agentZKKaspaNode', {
        action: 'getBalance',
        address: address
      });

      if (response.data?.success) {
        setBalance(response.data);
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const loadDagInfo = async () => {
    try {
      const response = await base44.functions.invoke('agentZKKaspaNode', {
        action: 'getBlockDagInfo'
      });

      if (response.data?.success) {
        setDagInfo(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load DAG info:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user?.created_wallet_address) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Wallet Found</h2>
          <p className="text-gray-400 text-sm">Create a TTT Wallet to use Agent ZK 2</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 border border-cyan-500/30 rounded-2xl mb-4">
            <Network className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">Agent ZK 2</h1>
          <p className="text-white/50 text-lg">Kaspa Node Integration</p>
        </motion.div>

        {/* Node Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Flux Node Status</h2>
            <Button
              onClick={checkNodeStatus}
              disabled={isConnecting}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
            </Button>
          </div>

          {nodeStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/60">Status</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-white font-semibold">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/60">Network</span>
                <span className="text-white font-semibold">{nodeStatus.networkName}</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/60">Version</span>
                <span className="text-white font-semibold">{nodeStatus.serverVersion}</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/60">UTXO Index</span>
                <span className="text-white font-semibold">
                  {nodeStatus.isUtxoIndexed ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Click to connect to node</p>
            </div>
          )}
        </motion.div>

        {/* Wallet Info Card */}
        {balance && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Wallet Balance</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/60">Address</span>
                <span className="text-white font-mono text-sm">
                  {balance.address.slice(0, 8)}...{balance.address.slice(-8)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/60">Balance</span>
                <span className="text-white font-semibold text-xl">
                  {balance.balanceKAS.toFixed(2)} KAS
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* DAG Info Card */}
        {dagInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/60 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">BlockDAG Info</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/60">Block Count</span>
                <span className="text-white font-semibold">
                  {dagInfo.blockCount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/60">DAA Score</span>
                <span className="text-white font-semibold">
                  {dagInfo.virtualDaaScore.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/60">Difficulty</span>
                <span className="text-white font-semibold">
                  {dagInfo.difficulty.toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-white/60 text-sm">
              Connected to Flux Kaspa Node
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}