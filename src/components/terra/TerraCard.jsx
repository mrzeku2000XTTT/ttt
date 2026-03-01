import React from 'react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, ArrowRightLeft, History, AlertCircle } from 'lucide-react';

export default function TerraCard({ walletAddress, user }) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [swapAmount, setSwapAmount] = useState('');
  const [swapMode, setSwapMode] = useState('kas_to_tusd'); // kas_to_tusd or tusd_to_kas
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize card on mount and set up auto-refresh
  useEffect(() => {
    initializeCard();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      initializeCard();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [walletAddress]);

  const initializeCard = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!walletAddress) {
        setError('No wallet address provided');
        setLoading(false);
        return;
      }

      // Check for existing card by wallet address only
      const existingCards = await base44.entities.DebitCard.filter({
        linked_wallet_address: walletAddress
      });

      if (existingCards.length > 0) {
        setCard(existingCards[0]);
        loadTransactionHistory(existingCards[0].id);
      } else {
        // Approve and create card
        const res = await base44.functions.invoke('approveTerraCard', {
          wallet_address: walletAddress
        });

        if (res.data?.success) {
          // Fetch newly created card
          const cards = await base44.entities.DebitCard.filter({
            linked_wallet_address: walletAddress
          });

          if (cards.length > 0) {
            setCard(cards[0]);
            setSuccess('🎉 Terra Card Created!');
            setTimeout(() => setSuccess(null), 3000);
          } else {
            setError('Card created but unable to retrieve');
          }
        } else {
          setError(res.data?.error || 'Failed to create Terra Card');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize card');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionHistory = async (cardId) => {
    try {
      const res = await base44.functions.invoke('getTransactionHistory', {
        card_id: cardId,
        limit: 10
      });

      if (res.data?.success) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    }
  };

  const handleSwap = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      setError('Enter valid amount');
      return;
    }

    if (!card) {
      setError('Card not initialized');
      return;
    }

    setIsSwapping(true);
    setError(null);

    try {
      const amount = parseFloat(swapAmount);

      let res;
      if (swapMode === 'kas_to_tusd') {
        res = await base44.functions.invoke('swapKasToTUSD', {
          card_id: card.id,
          kas_amount: amount
        });
      } else {
        res = await base44.functions.invoke('swapTUSDToKAS', {
          card_id: card.id,
          tusd_amount: amount
        });
      }

      if (res.data?.success) {
        setCard(prev => ({
          ...prev,
          tusd_balance: res.data.tusd_balance,
          kas_balance_locked: res.data.kas_balance_locked
        }));

        setSuccess(`✅ Swapped ${amount} ${swapMode === 'kas_to_tusd' ? 'KAS → TUSD' : 'TUSD → KAS'}`);
        setSwapAmount('');
        loadTransactionHistory(card.id);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-300">Failed to initialize Terra Card</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card Display */}
      <Card className="bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Terra USD Card</p>
              <h3 className="text-white font-bold text-lg">Virtual Card</h3>
            </div>
            <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-full">
              <span className="text-cyan-300 text-xs font-semibold">{card.card_status.toUpperCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">TUSD Balance</p>
              <p className="text-white font-bold text-xl">{card.tusd_balance.toFixed(2)}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">KAS Locked</p>
              <p className="text-white font-bold text-xl">{card.kas_balance_locked.toFixed(2)}</p>
            </div>
          </div>

          <p className="text-gray-500 text-xs">All swaps and spends occur inside Terra</p>
        </CardContent>
      </Card>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"
          >
            <p className="text-green-300 text-sm">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Section */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="border-b border-zinc-800">
          <h3 className="text-white font-bold">Swap</h3>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setSwapMode('kas_to_tusd')}
              className={`${
                swapMode === 'kas_to_tusd'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-zinc-800 text-gray-400 border border-zinc-700'
              }`}
            >
              KAS → TUSD
            </Button>
            <Button
              onClick={() => setSwapMode('tusd_to_kas')}
              className={`${
                swapMode === 'tusd_to_kas'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-zinc-800 text-gray-400 border border-zinc-700'
              }`}
            >
              TUSD → KAS
            </Button>
          </div>

          {/* Amount Input */}
          <Input
            type="number"
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
            placeholder={`Enter ${swapMode === 'kas_to_tusd' ? 'KAS' : 'TUSD'} amount`}
            className="bg-black border-zinc-800 text-white"
          />

          {/* Quick Select */}
          <div className="flex gap-2">
            {[0.5, 1, 5].map(amt => (
              <Button
                key={amt}
                onClick={() => setSwapAmount(amt.toString())}
                size="sm"
                variant="outline"
                className="border-zinc-700"
              >
                {amt}
              </Button>
            ))}
          </div>

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={isSwapping || !swapAmount}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
          >
            {isSwapping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Execute Swap
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Activity
            </h3>
            <Button
              onClick={() => setShowHistory(!showHistory)}
              size="sm"
              variant="ghost"
              className="text-cyan-400"
            >
              {showHistory ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent className="p-6">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium capitalize">{tx.type.replace(/_/g, ' ')}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-cyan-400 font-mono text-sm">{tx.tusd_amount} TUSD</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}