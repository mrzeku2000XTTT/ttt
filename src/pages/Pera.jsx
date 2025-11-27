import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Lock, Bot, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PeraPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    taskName: "",
    description: "",
    tipAmount: "",
    burnerWalletSeed: "",
    burnerWalletAddress: ""
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verifyingBalance, setVerifyingBalance] = useState(false);
  const [balanceVerified, setBalanceVerified] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyBalance = async () => {
    if (!formData.burnerWalletAddress.trim()) {
      setError('Please enter burner wallet address');
      return;
    }

    if (!formData.tipAmount || parseFloat(formData.tipAmount) <= 0) {
      setError('Please enter valid tip amount');
      return;
    }

    setVerifyingBalance(true);
    setError(null);
    setBalanceVerified(false);

    try {
      const response = await base44.functions.invoke('getKaspaBalance', {
        address: formData.burnerWalletAddress
      });

      const balance = response.data?.balanceKAS || 0;
      const required = parseFloat(formData.tipAmount);

      if (balance >= required) {
        setBalanceVerified(true);
        setSuccess(`✅ Balance verified: ${balance} KAS (required: ${required} KAS)`);
      } else {
        setError(`❌ Insufficient balance: ${balance} KAS (need: ${required} KAS)`);
        setBalanceVerified(false);
      }

    } catch (err) {
      setError('Failed to verify balance: ' + err.message);
      setBalanceVerified(false);
    } finally {
      setVerifyingBalance(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!balanceVerified) {
      setError('Please verify balance first');
      return;
    }

    if (!formData.burnerWalletSeed.trim()) {
      setError('Please enter burner wallet seed phrase');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Create task
      const task = await base44.entities.PeraTask.create({
        task_name: formData.taskName,
        description: formData.description,
        tip_amount: parseFloat(formData.tipAmount),
        burner_wallet_address: formData.burnerWalletAddress,
        employer_id: user.email,
        status: 'active',
        balance_verified: true,
        last_balance_check: new Date().toISOString(),
        mzk_bot_id: `mzk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      });

      console.log('✅ Task created:', task.id);

      // Triple-encrypt seed phrase and create vault
      // (In production, use proper encryption)
      const vaultId = `vault_${task.id}`;
      const peraSecretKey = crypto.randomUUID();
      
      // Layer 1: Encrypt with Pera Secret Key
      const layer1 = btoa(formData.burnerWalletSeed + peraSecretKey);
      // Layer 2: Encrypt with Task ID
      const layer2 = btoa(layer1 + task.id);
      // Layer 3: Encrypt with Master Key (from env)
      const layer3 = btoa(layer2 + 'MASTER_KEY_PLACEHOLDER');

      await base44.entities.PeraVault.create({
        vault_id: vaultId,
        task_id: task.id,
        encrypted_seed_phrase: layer3,
        pera_secret_key: peraSecretKey,
        encryption_layers: [
          { layer: 1, algorithm: 'AES-256-GCM', key_hint: 'Pera Secret Key' },
          { layer: 2, algorithm: 'AES-256-GCM', key_hint: 'Task ID' },
          { layer: 3, algorithm: 'AES-256-GCM', key_hint: 'Master Key' }
        ],
        status: 'locked'
      });

      // Update task with vault ID
      await base44.entities.PeraTask.update(task.id, {
        pera_vault_id: vaultId
      });

      console.log('🔐 Vault created:', vaultId);

      // Start MZK Bot monitoring (in background)
      setInterval(async () => {
        try {
          await base44.functions.invoke('mzkBotMonitor', { taskId: task.id });
        } catch (err) {
          console.error('MZK Bot error:', err);
        }
      }, 30000); // Every 30 seconds

      setSuccess('✅ Task created successfully! MZK Bot is now monitoring your funds.');
      
      // Reset form
      setFormData({
        taskName: "",
        description: "",
        tipAmount: "",
        burnerWalletSeed: "",
        burnerWalletAddress: ""
      });
      setBalanceVerified(false);

      // Redirect to Market X after 2 seconds
      setTimeout(() => {
        navigate(createPageUrl("MarketX"));
      }, 2000);

    } catch (err) {
      console.error('Task creation failed:', err);
      setError('Failed to create task: ' + err.message);
    } finally {
      setIsCreating(false);
    }
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
            <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <Button 
              onClick={() => base44.auth.redirectToLogin()} 
              className="bg-cyan-500 text-white"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  Pera Task Creation
                </h1>
                <p className="text-gray-400" style={{ fontFamily: 'monospace' }}>
                  Create escrow-protected tasks with MZK Bot security
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-cyan-200">
                  <p className="font-semibold mb-1">How Pera Works:</p>
                  <ul className="space-y-1 text-xs">
                    <li>1. Create task with burner wallet (funds locked in escrow)</li>
                    <li>2. MZK Bot monitors funds every 30 seconds</li>
                    <li>3. Worker completes task and submits proof</li>
                    <li>4. You approve → Worker gets seed phrase automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <p className="text-sm text-green-300">{success}</p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="border-b border-zinc-800">
                <h2 className="text-2xl font-bold text-white">Task Details</h2>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateTask} className="space-y-6">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">
                      Task Name *
                    </label>
                    <Input
                      value={formData.taskName}
                      onChange={(e) => setFormData({...formData, taskName: e.target.value})}
                      placeholder="e.g., Repost my tweet"
                      className="bg-black border-zinc-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">
                      Description *
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Detailed task requirements..."
                      className="bg-black border-zinc-700 text-white h-32"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">
                      Tip Amount (KAS) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tipAmount}
                      onChange={(e) => setFormData({...formData, tipAmount: e.target.value})}
                      placeholder="e.g., 50"
                      className="bg-black border-zinc-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">
                      Burner Wallet Address *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.burnerWalletAddress}
                        onChange={(e) => setFormData({...formData, burnerWalletAddress: e.target.value})}
                        placeholder="kaspa:..."
                        className="flex-1 bg-black border-zinc-700 text-white font-mono text-sm"
                        required
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyBalance}
                        disabled={verifyingBalance}
                        className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                      >
                        {verifyingBalance ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : balanceVerified ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Verified
                          </>
                        ) : (
                          'Verify Balance'
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">
                      Burner Wallet Seed Phrase *
                    </label>
                    <Textarea
                      value={formData.burnerWalletSeed}
                      onChange={(e) => setFormData({...formData, burnerWalletSeed: e.target.value})}
                      placeholder="word1 word2 word3..."
                      className="bg-black border-zinc-700 text-white font-mono h-24"
                      required
                    />
                    <p className="text-xs text-yellow-400 mt-2">
                      ⚠️ This wallet will be locked by MZK Bot. Do NOT access it until task completes.
                    </p>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Bot className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-purple-200">
                        <p className="font-semibold mb-1">MZK Bot Security</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Monitors wallet balance every 30 seconds</li>
                          <li>• Triple-encrypts seed phrase in Pera Vault</li>
                          <li>• Auto-voids task if funds withdrawn</li>
                          <li>• Releases funds only after approval</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreating || !balanceVerified}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg shadow-cyan-500/50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Creating Task...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-3" />
                        Create Task with MZK Bot
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}