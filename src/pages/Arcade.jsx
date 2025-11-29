import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gamepad2, Trophy, Zap, Grid3x3, Lock, Plus, Loader2, Sparkles, Shield, Trash2, AlertCircle, ArrowLeft, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BingoWallet from "@/components/arcade/BingoWallet";

export default function ArcadePage() {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState(null);
  const [user, setUser] = useState(null);
  const [showCreateBingo, setShowCreateBingo] = useState(false);
  const [prizeAmount, setPrizeAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [previewWords, setPreviewWords] = useState([]);
  const [existingGames, setExistingGames] = useState([]);
  const [isDeletingGame, setIsDeletingGame] = useState(null);
  const [gameMode, setGameMode] = useState('lobby');
  const [numCards, setNumCards] = useState(10);
  const [callInterval, setCallInterval] = useState(10); // New state variable

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadExistingGames();
    }
  }, [user]);

  useEffect(() => {
    if (seedPhrase.trim()) {
      const words = seedPhrase.trim().toLowerCase().split(/\s+/).filter(w => w);
      setPreviewWords(words.slice(0, 24));
    } else {
      setPreviewWords([]);
    }
  }, [seedPhrase]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log('User not logged in');
    }
  };

  const loadExistingGames = async () => {
    try {
      if (!user) return;
      
      const games = await base44.entities.BingoGame.filter({
        created_by: user.email,
        $or: [
          { status: 'active' },
          { status: 'waiting' }
        ]
      });
      setExistingGames(games);
    } catch (err) {
      console.error('Failed to load existing games:', err);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm('Delete this game? This cannot be undone.')) return;

    setIsDeletingGame(gameId);
    try {
      await base44.entities.BingoGame.delete(gameId);
      setExistingGames(prev => prev.filter(g => g.id !== gameId));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setIsDeletingGame(null);
    }
  };

  const handleCreateBingoGame = async () => {
    if (!prizeAmount || parseFloat(prizeAmount) <= 0) {
      alert('Please enter a valid prize amount');
      return;
    }

    const words = seedPhrase.trim().toLowerCase().split(/\s+/).filter(w => w);

    if (words.length !== 24) {
      alert('Seed phrase must be exactly 24 words');
      return;
    }

    if (gameMode === 'single' && !walletAddress.trim()) {
      alert('Please enter the wallet address');
      return;
    }

    setIsCreating(true);

    try {
      let response;

      if (gameMode === 'lobby') {
        response = await base44.functions.invoke('createBingoLobby', {
          prize_amount: parseFloat(prizeAmount),
          seed_phrase: words.join(' '),
          num_cards: numCards,
          call_interval: callInterval // Added call_interval
        });

        if (response.data.success) {
          // Updated confirm message to include Call Interval
          const confirmGo = confirm(`Lobby Created!\n\nGame Code: ${response.data.game_code}\nPrize: ${prizeAmount} KAS\nCards: ${response.data.total_cards}\nCall Interval: ${callInterval}s\n\nShare this code with players!\n\nView lobby now?`);

          if (confirmGo) {
            navigate(createPageUrl("BingoLobbyBrowser"));
          }
        }
      } else {
        response = await base44.functions.invoke('createBingoGame', {
          prize_amount: parseFloat(prizeAmount),
          seed_phrase: words.join(' '),
          wallet_address: walletAddress.trim()
        });

        if (response.data.success) {
          alert(`Game Created!\n\nPrize: ${prizeAmount} KAS\nWallet: ${walletAddress}\nCard ID: ${response.data.card_id}`);
        }
      }

      setPrizeAmount('');
      setSeedPhrase('');
      setWalletAddress('');
      setShowCreateBingo(false);
      await loadExistingGames();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsCreating(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isAgentZK = user?.agent_zk_id || user?.created_wallet_address;

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-3">TTT Arcade</h1>
            <p className="text-gray-400">Blockchain Gaming & Competitions</p>
          </motion.div>

          {activeGame === 'bingo' && existingGames.length > 0 && (
            <Card className="bg-zinc-950/90 border-zinc-800 mb-6">
              <CardContent className="p-6">
                <h3 className="text-white font-bold mb-4">Your Games ({existingGames.length})</h3>
                <div className="space-y-3">
                  {existingGames.map(game => {
                    const isLobby = game.game_type === 'lobby';
                    const canDelete = game.created_by === user?.email;
                    return (
                      <div key={game.id} className="bg-black/50 rounded-lg p-4 flex items-center justify-between border border-zinc-800">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isLobby && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Lobby</Badge>}
                            <code className="text-cyan-400">{isLobby ? game.game_code : game.wallet_address?.slice(-8)}</code>
                            <Badge className={`${
                              game.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                              game.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {game.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400">
                            {game.prize_amount} KAS {isLobby && `• ${game.players?.length || 0} players`}
                          </div>
                        </div>
                        {canDelete && (
                          <Button
                            onClick={() => handleDeleteGame(game.id)}
                            disabled={isDeletingGame === game.id}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Delete game"
                          >
                            {isDeletingGame === game.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <AnimatePresence mode="wait">
            {activeGame === 'bingo' ? (
              <motion.div key="bingo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button onClick={() => setActiveGame(null)} variant="ghost" className="text-gray-400 mb-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-all"
                        onClick={() => navigate(createPageUrl("BingoLobbyBrowser"))}>
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-white mb-2">Join Lobby</h2>
                      <p className="text-gray-400 text-sm mb-4">Play with friends</p>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Multi-Player</Badge>
                    </CardContent>
                  </Card>

                  {(isAdmin || isAgentZK) && (
                    <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 cursor-pointer hover:border-cyan-500/50 transition-all"
                          onClick={() => setShowCreateBingo(true)}>
                      <CardContent className="p-8 text-center">
                        <Plus className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Create Game</h2>
                        <p className="text-gray-400 text-sm mb-4">Host your own</p>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">New Lobby</Badge>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {showCreateBingo && (
                  <Card className="bg-zinc-950/90 border-zinc-800 mb-6">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-white font-bold text-lg">Create New Game</h3>

                      <div className="grid grid-cols-2 gap-3">
                        {['lobby', 'single'].map(mode => (
                          <button key={mode} onClick={() => setGameMode(mode)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              gameMode === mode ? 'bg-purple-500/20 border-purple-500' : 'bg-black/30 border-zinc-700'
                            }`}>
                            <div className="text-2xl mb-2">{mode === 'lobby' ? '🎮' : '🎯'}</div>
                            <div className="font-bold text-white">{mode === 'lobby' ? 'Multi-Player' : 'Solo'}</div>
                          </button>
                        ))}
                      </div>

                      {gameMode === 'lobby' && (
                        <>
                          <div>
                            <label className="text-sm text-gray-400 mb-2 block">Cards (1-30)</label>
                            <Input type="number" min="1" max="30" value={numCards}
                              onChange={(e) => setNumCards(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                              className="bg-black border-zinc-800 text-white" />
                          </div>

                          <div>
                            <label className="text-sm text-gray-400 mb-2 block">
                              AI Call Interval (seconds)
                            </label>
                            <Input type="number" min="5" max="60" value={callInterval}
                              onChange={(e) => setCallInterval(Math.min(60, Math.max(5, parseInt(e.target.value) || 10)))}
                              className="bg-black border-zinc-800 text-white" />
                            <p className="text-xs text-gray-500 mt-1">
                              How often AI calls new numbers (5-60 seconds)
                            </p>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Seed Phrase</label>
                        <textarea value={seedPhrase} onChange={(e) => setSeedPhrase(e.target.value)}
                          placeholder="24 words..." rows={3}
                          className="w-full bg-black border-zinc-800 text-white rounded-lg p-3 font-mono text-sm" />
                        {previewWords.length > 0 && (
                          <Badge className="mt-2 bg-cyan-500/20 text-cyan-300">{previewWords.length} words</Badge>
                        )}
                      </div>

                      {gameMode === 'single' && (
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Wallet Address</label>
                          <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="kaspa:qqq..." className="bg-black border-zinc-800 text-white font-mono" />
                        </div>
                      )}

                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Prize (KAS)</label>
                        <Input type="number" step="0.01" value={prizeAmount}
                          onChange={(e) => setPrizeAmount(e.target.value)}
                          className="bg-black border-zinc-800 text-white text-lg" />
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={handleCreateBingoGame}
                          disabled={isCreating || !prizeAmount || previewWords.length !== 24 || (gameMode === 'single' && !walletAddress.trim())}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 h-12">
                          {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                        </Button>
                        <Button onClick={() => setShowCreateBingo(false)} variant="outline" className="border-zinc-700">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <BingoWallet />
              </motion.div>
            ) : (
              <motion.div key="selection" className="grid md:grid-cols-3 gap-6">
                {[
                  { id: 'bingo', name: 'Wallet Bingo', desc: 'Seed phrase puzzle', icon: Grid3x3, color: 'from-purple-500 to-pink-500', emoji: '🎰' },
                  { id: 'locked1', name: 'KAS Shooter', desc: 'Coming soon', icon: Zap, color: 'from-cyan-500 to-blue-500', emoji: '🎯', locked: true },
                  { id: 'locked2', name: 'Trading Arena', desc: 'Coming soon', icon: Trophy, color: 'from-green-500 to-emerald-500', emoji: '🏆', locked: true }
                ].map((g, i) => (
                  <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card onClick={() => !g.locked && setActiveGame(g.id)}
                      className={`bg-zinc-950/90 border-zinc-800 hover:border-purple-500/50 transition-all ${g.locked ? 'opacity-50' : 'cursor-pointer hover:scale-105'}`}>
                      <CardContent className="p-8">
                        <div className="text-center">
                          <div className="text-6xl mb-4">{g.emoji}</div>
                          <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${g.color} rounded-xl flex items-center justify-center relative`}>
                            <g.icon className="w-8 h-8 text-white" />
                            {g.locked && <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                              <Lock className="w-6 h-6 text-white" />
                            </div>}
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">{g.name}</h3>
                          <p className="text-gray-400 mb-4">{g.desc}</p>
                          <Badge className={g.locked ? 'bg-gray-700 text-gray-400' : 'bg-green-500/20 text-green-300 border-green-500/30'}>
                            {g.locked ? 'Coming Soon' : 'Play Now'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}