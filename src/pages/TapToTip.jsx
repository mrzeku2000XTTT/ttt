import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Search, Wallet, User as UserIcon, Copy, Check, Send, CheckCircle2 } from "lucide-react";

export default function TapToTipPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tipAmount, setTipAmount] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.created_wallet_address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Set up listener for wallet changes
      const checkWalletChange = setInterval(async () => {
        try {
          const updatedUser = await base44.auth.me();
          if (updatedUser.created_wallet_address !== user.created_wallet_address) {
            setCurrentUser(updatedUser);
            loadUsers(); // Reload users list when wallet changes
            clearInterval(checkWalletChange);
          }
        } catch (err) {
          clearInterval(checkWalletChange);
        }
      }, 3000);
      
      return () => clearInterval(checkWalletChange);
    } catch (err) {
      console.log('User not logged in');
      setCurrentUser(null);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await base44.entities.User.list('-created_date', 100);
      const usersWithWallets = allUsers.filter(u => {
        // Must have a wallet
        if (!u.created_wallet_address && !u.agent_zk_id) return false;
        
        // Exclude specific olatomiwa wallet
        if (u.username?.toLowerCase() === 'olatomiwa' && u.created_wallet_address?.toLowerCase().endsWith('x82')) {
          return false;
        }
        
        // Exclude imposter TTT wallet
        if (u.username?.toLowerCase() === 'ttt' && u.created_wallet_address?.toLowerCase().endsWith('6ft')) {
          return false;
        }
        
        // Include all other users including TTT
        return true;
      });
      
      // Load all active badges
      const allBadges = await base44.entities.UserBadge.filter({ is_active: true });
      const badgesMap = {};
      allBadges.forEach(badge => {
        if (!badgesMap[badge.username]) {
          badgesMap[badge.username] = [];
        }
        badgesMap[badge.username].push(badge);
      });
      
      // Sort users: Current user FIRST, then TTT, then priority users, then by badges
      const sortedUsers = usersWithWallets.sort((a, b) => {
        // Current user always first
        const aIsCurrentUser = currentUser && a.email === currentUser.email;
        const bIsCurrentUser = currentUser && b.email === currentUser.email;
        
        if (aIsCurrentUser && !bIsCurrentUser) return -1;
        if (!aIsCurrentUser && bIsCurrentUser) return 1;

        const aIsTTT = a.username?.toLowerCase() === 'ttt';
        const bIsTTT = b.username?.toLowerCase() === 'ttt';

        if (aIsTTT && !bIsTTT) return -1;
        if (!aIsTTT && bIsTTT) return 1;

        const priorityUsers = ['destroyer', 'esp', 'zeku'];
        const aIsPriority = priorityUsers.some(p => a.username?.toLowerCase().includes(p));
        const bIsPriority = priorityUsers.some(p => b.username?.toLowerCase().includes(p));

        if (aIsPriority && !bIsPriority) return -1;
        if (!aIsPriority && bIsPriority) return 1;

        const aBadges = badgesMap[a.username]?.length || 0;
        const bBadges = badgesMap[b.username]?.length || 0;
        return bBadges - aBadges;
      });
      
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(""), 2000);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setTipAmount("");
  };

  const handleSendTip = () => {
    if (!selectedUser || !tipAmount) return;
    
    const address = selectedUser.created_wallet_address || selectedUser.agent_zk_id;
    const kaswareUrl = `kasware://send?address=${address}&amount=${parseFloat(tipAmount)}`;
    window.location.href = kaswareUrl;
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{ 
        paddingTop: '8rem', 
        paddingBottom: '6rem'
      }}
    >
      {/* HD Background Image - No Stretch */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0e4fb0d03_image.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          filter: 'brightness(1.3) saturate(1.4) contrast(1.1)'
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-black/60 rounded-2xl overflow-hidden border border-green-500/30">
              {/* Matrix Falling Numbers Animation */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -100 }}
                  animate={{ y: 100 }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "linear"
                  }}
                  className="absolute text-green-400 font-mono text-xs opacity-70"
                  style={{ 
                    left: `${i * 12}%`,
                    textShadow: '0 0 5px rgba(34, 197, 94, 0.8)'
                  }}
                >
                  {Math.floor(Math.random() * 2)}
                </motion.div>
              ))}
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              TapToTip
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Instantly tip any user with $KAS</p>
        </motion.div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or wallet..."
              className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12"
            />
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">No Users Found</h3>
            <p className="text-gray-400">Try a different search</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user, i) => {
              const address = user.created_wallet_address || user.agent_zk_id;
              const isCopied = copiedAddress === address;
              const isCurrentUser = currentUser && user.email === currentUser.email;
              const hasActiveWallet = !!user.created_wallet_address;
              
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`bg-white/5 hover:border-cyan-500/30 transition-all ${isCurrentUser ? 'border-cyan-500/50 ring-2 ring-cyan-500/20' : 'border-white/10'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 border border-cyan-500/30 rounded-full flex items-center justify-center text-lg font-bold text-white bg-white/5 flex-shrink-0 relative">
                          {user.username ? user.username[0].toUpperCase() : user.email[0].toUpperCase()}
                          {hasActiveWallet && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-black">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold truncate">
                              {user.username || 'Anonymous'}
                            </h3>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-bold">
                                YOU
                              </span>
                            )}
                            {user.username?.toLowerCase() === 'ttt' && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded text-[10px] font-bold text-white">
                                ZEKU
                              </span>
                            )}
                            {user.username?.toLowerCase() === 'destroyer' && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-black rounded text-[10px] font-bold text-white">
                                DEATH
                              </span>
                            )}
                            {user.username?.toLowerCase() === 'esp' && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded text-[10px] font-bold text-white">
                                GOD
                              </span>
                            )}
                            {user.username?.toLowerCase() === 'hayphase' && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-600 rounded text-[10px] font-bold text-white">
                                👁️ POV
                              </span>
                            )}
                            {user.username?.toLowerCase().trim().replace(/\s+/g, '') === 'olatomiwa' && user.created_wallet_address?.toLowerCase().endsWith('du4') && (
                              <>
                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-bold">
                                  TTT
                                </span>
                                <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded text-[10px] font-bold text-white">
                                  FIRSTLADY
                                </span>
                              </>
                            )}
                            {user.username?.toLowerCase().trim().replace(/\s+/g, '') === 'ayomuiz' && user.created_wallet_address?.toLowerCase().endsWith('ygt') && (
                              <>
                                <span className="px-2 py-0.5 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 text-black border-2 border-yellow-400/80 rounded text-[10px] font-bold">
                                  👑 KING
                                </span>
                                <span className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded text-[10px] font-bold text-white">
                                  EL
                                </span>
                              </>
                            )}
                            {user.username?.toLowerCase().trim().replace(/\s+/g, '') === 'peculiar' && user.created_wallet_address?.toLowerCase().endsWith('x20') && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-slate-400 via-gray-300 to-slate-500 rounded text-[10px] font-bold text-black border border-slate-300/50">
                                ⚔️ KNIGHT
                              </span>
                            )}
                            {user.username?.toLowerCase().trim().replace(/\s+/g, '') === 'big-ayoolataiwo1' && user.created_wallet_address?.toLowerCase().endsWith('9pd') && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded text-[10px] font-bold text-black">
                                🎮 MODZ
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded text-[10px] font-bold text-white">
                              $KAS
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="p-2 bg-black/30 rounded border border-white/10">
                          <p className="text-gray-500 text-xs mb-1">Wallet</p>
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-cyan-400 text-xs truncate flex-1">
                              {address.slice(0, 12)}...{address.slice(-8)}
                            </code>
                            <button
                              onClick={() => handleCopyAddress(address)}
                              className="text-gray-400 hover:text-cyan-400 transition-colors flex-shrink-0"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleSelectUser(user)}
                          className="w-full bg-black border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Tip User
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tip Modal */}
      {selectedUser && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedUser(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200]"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md"
            >
            <Card className="bg-gradient-to-br from-zinc-900/98 to-black/98 border-cyan-500/40 shadow-2xl shadow-cyan-500/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Tip {selectedUser.username || 'User'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedUser.created_wallet_address || selectedUser.agent_zk_id)}`}
                      alt="QR Code"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="p-3 bg-black/30 rounded-lg border border-cyan-500/30">
                    <p className="text-gray-400 text-xs mb-2 text-center">Recipient Address</p>
                    <code className="text-cyan-400 text-xs break-all block text-center mb-2">
                      {selectedUser.created_wallet_address || selectedUser.agent_zk_id}
                    </code>
                    <button
                      onClick={() => handleCopyAddress(selectedUser.created_wallet_address || selectedUser.agent_zk_id)}
                      className="w-full text-sm text-gray-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
                    >
                      {copiedAddress === (selectedUser.created_wallet_address || selectedUser.agent_zk_id) ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Address
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Amount (KAS)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-black/30 border-white/10 text-white text-center text-2xl font-bold h-16"
                    />
                  </div>

                  <Button
                    onClick={handleSendTip}
                    disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 h-12"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Send {tipAmount || '0'} KAS
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    This will open Kasware to complete the transaction
                  </p>
                </div>
              </CardContent>
              </Card>
              </motion.div>
              </div>
              </>
              )}
    </div>
  );
}