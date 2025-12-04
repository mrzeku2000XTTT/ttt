import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Users, Copy, CheckCircle2, Loader2, Crown, Zap } from "lucide-react";

export default function DuelLobbyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lobbies, setLobbies] = useState([]);
  const [myLobby, setMyLobby] = useState(null);
  const [lobbyCode, setLobbyCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [betAmount, setBetAmount] = useState(1);
  const [selectedGameType, setSelectedGameType] = useState('quick_draw');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(loadLobbies, 3000);
    const checkInterval = setInterval(checkMyLobbyStatus, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(checkInterval);
    };
  }, [myLobby, user]);

  const checkMyLobbyStatus = async () => {
    if (!myLobby || !user) return;
    
    try {
      const updated = await base44.entities.DuelLobby.filter({ id: myLobby.id }, '', 1);
      if (updated.length > 0) {
        const updatedLobby = updated[0];
        // Host: Navigate when guest joins and status changes to ready
        if (user.email === updatedLobby.host_email && 
            updatedLobby.status === 'ready' && 
            updatedLobby.guest_email &&
            myLobby.status === 'waiting') {
          console.log('Host: Guest joined, navigating to game...');
          navigate(createPageUrl('Duel') + `?lobby=${myLobby.id}`);
        }
      }
    } catch (err) {
      console.error('Failed to check lobby status:', err);
    }
  };

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Get username and wallet from TTT Feed posts
      const userPosts = await base44.entities.Post.filter({
        created_by: currentUser.email
      }, '-created_date', 1);

      if (userPosts.length > 0) {
        setUsername(userPosts[0].author_name || currentUser.username || currentUser.email);
        setWalletAddress(userPosts[0].author_wallet_address || currentUser.created_wallet_address || "");
      } else {
        setUsername(currentUser.username || currentUser.email);
        setWalletAddress(currentUser.created_wallet_address || "");
      }

      await loadLobbies();
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLobbies = async () => {
    try {
      const allLobbies = await base44.entities.DuelLobby.filter({
        status: 'waiting'
      }, '-created_date', 20);
      
      setLobbies(allLobbies);
      
      // Check if I have a lobby
      const mine = allLobbies.find(l => l.host_email === user?.email);
      setMyLobby(mine);
    } catch (err) {
      console.error('Failed to load lobbies:', err);
    }
  };

  const createLobby = async () => {
    if (!user) return;
    
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const lobby = await base44.entities.DuelLobby.create({
        lobby_code: code,
        host_email: user.email,
        host_username: username,
        host_wallet: walletAddress,
        guest_email: null,
        guest_username: null,
        guest_wallet: null,
        status: 'waiting',
        game_type: selectedGameType,
        bet_amount: betAmount
      });
      
      setMyLobby(lobby);
      await loadLobbies();
    } catch (err) {
      console.error('Failed to create lobby:', err);
      alert('Failed to create lobby');
    }
  };

  const joinLobby = async (lobby) => {
    if (!user || !lobby) return;
    
    try {
      await base44.entities.DuelLobby.update(lobby.id, {
        guest_email: user.email,
        guest_username: username,
        guest_wallet: walletAddress,
        status: 'ready'
      });
      
      navigate(createPageUrl('Duel') + `?lobby=${lobby.id}`);
    } catch (err) {
      console.error('Failed to join lobby:', err);
      alert('Failed to join lobby');
    }
  };

  const startDuel = () => {
    if (!myLobby) return;
    navigate(createPageUrl('Duel') + `?lobby=${myLobby.id}`);
  };

  const cancelLobby = async () => {
    if (!myLobby) return;
    
    try {
      await base44.entities.DuelLobby.delete(myLobby.id);
      setMyLobby(null);
      await loadLobbies();
    } catch (err) {
      console.error('Failed to cancel lobby:', err);
    }
  };

  const copyCode = () => {
    if (myLobby) {
      navigator.clipboard.writeText(myLobby.lobby_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Swords className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Duel Lobby</h1>
              <p className="text-gray-400">Challenge opponents in split-screen battles</p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-400">Playing as</p>
                <p className="text-white font-bold">{username}</p>
              </div>
              {walletAddress && (
                <div className="flex-1">
                  <p className="text-sm text-gray-400">Wallet</p>
                  <p className="text-white font-mono text-xs">{walletAddress.substring(0, 20)}...</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create/My Lobby */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    Host Lobby
                  </h2>
                </div>

                {!myLobby ? (
                  <div className="space-y-4">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4">
                      <label className="text-sm text-gray-400 mb-2 block">Game Type</label>
                      <select
                        value={selectedGameType}
                        onChange={(e) => setSelectedGameType(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="quick_draw">⚡ Quick Draw</option>
                        <option value="reaction_time">⏱️ Reaction Time</option>
                        <option value="math_battle">🧮 Math Battle</option>
                      </select>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4">
                      <label className="text-sm text-gray-400 mb-2 block">Bet Amount (KAS)</label>
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={betAmount}
                        onChange={(e) => setBetAmount(parseFloat(e.target.value) || 1)}
                        className="bg-black/50 border-white/10 text-white"
                      />
                    </div>
                    <Button
                      onClick={createLobby}
                      className="w-full h-16 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-lg font-bold"
                    >
                      <Zap className="w-6 h-6 mr-2" />
                      Create Lobby ({betAmount} KAS)
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-2">Game Type</p>
                      <p className="text-white font-bold">
                        {myLobby.game_type === 'quick_draw' && '⚡ Quick Draw'}
                        {myLobby.game_type === 'reaction_time' && '⏱️ Reaction Time'}
                        {myLobby.game_type === 'math_battle' && '🧮 Math Battle'}
                      </p>
                    </div>

                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-2">Lobby Code</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/50 rounded-lg px-4 py-3">
                          <p className="text-2xl font-bold text-cyan-400 tracking-wider">{myLobby.lobby_code}</p>
                        </div>
                        <Button onClick={copyCode} variant="outline" size="icon">
                          {copied ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-2">Status</p>
                      {myLobby.status === 'waiting' ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                          <span className="text-white">Waiting for opponent...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">Ready to start!</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {myLobby.status === 'ready' && (
                        <Button onClick={startDuel} className="flex-1 bg-green-500 hover:bg-green-600 h-12">
                          Start Duel
                        </Button>
                      )}
                      <Button onClick={cancelLobby} variant="outline" className="flex-1 h-12">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Join Lobby */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Available Lobbies
                  </h2>
                  <Button onClick={loadLobbies} variant="ghost" size="sm">
                    Refresh
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {lobbies.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No lobbies available</p>
                    </div>
                  ) : (
                    lobbies.map((lobby) => (
                      <motion.div
                        key={lobby.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-white font-bold">{lobby.host_username}</p>
                            <p className="text-xs text-gray-400">
                              {lobby.game_type === 'quick_draw' && '⚡ Quick Draw'}
                              {lobby.game_type === 'reaction_time' && '⏱️ Reaction Time'}
                              {lobby.game_type === 'math_battle' && '🧮 Math Battle'}
                            </p>
                            <p className="text-xs text-gray-400">Code: {lobby.lobby_code}</p>
                            <p className="text-xs text-yellow-400 mt-1">💰 {lobby.bet_amount || 1} KAS</p>
                          </div>
                          {lobby.host_email !== user?.email && (
                            <Button
                              onClick={() => joinLobby(lobby)}
                              size="sm"
                              className="bg-cyan-500 hover:bg-cyan-600"
                            >
                              Join
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}