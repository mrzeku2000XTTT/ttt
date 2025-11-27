
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Crown, TrendingUp, Network, AlertCircle, Loader2, CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WalletCards from "../components/dagknight/WalletCards";
import TransactionHistory from "../components/dagknight/TransactionHistory";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DAGKnightWalletPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wallets');
  
  // Wallet states
  const [wallets, setWallets] = useState({
    kasware: null,
    ttt: null,
    zk: null
  });
  
  // Verification states
  const [verifications, setVerifications] = useState([]);
  const [dagStatus, setDagStatus] = useState({
    totalVerifications: 0,
    blueScore: 0,
    dagDepth: 0,
    crossVerifications: 0
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeVerification, setActiveVerification] = useState(null);
  
  // PIN verification for ZK wallet
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isPinVerifying, setIsPinVerifying] = useState(false);
  const [pinError, setPinError] = useState(null);
  const [pendingZKWallet, setPendingZKWallet] = useState(null);

  // TTT Wallet Verification Modal state
  const [showTTTVerifyModal, setShowTTTVerifyModal] = useState(false);

  useEffect(() => {
    loadDAGKnightStatus();
  }, []);

  const loadDAGKnightStatus = async () => {
    try {
      console.log('🔄 Loading DAGKnight status...');
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check Kasware
      if (typeof window.kasware !== 'undefined') {
        try {
          const accounts = await window.kasware.getAccounts();
          if (accounts && accounts.length > 0) {
            console.log('✅ Kasware connected:', accounts[0]);
            setWallets(prev => ({ ...prev, kasware: accounts[0] }));
            
            if (currentUser.kasware_address !== accounts[0]) {
              await base44.auth.updateMe({ kasware_address: accounts[0] });
            }
          }
        } catch (err) {
          console.error('Failed to check Kasware:', err);
        }
      }

      // Check TTT Wallet
      if (currentUser.created_wallet_address) {
        console.log('✅ TTT Wallet:', currentUser.created_wallet_address);
        setWallets(prev => ({ ...prev, ttt: currentUser.created_wallet_address }));
      }

      // Check ZK Wallets (VP Import)
      if (currentUser.vp_imported_wallets && currentUser.vp_imported_wallets.length > 0) {
        // Use the first VP imported wallet
        const zkWallet = currentUser.vp_imported_wallets[0];
        console.log('✅ ZK Wallet:', zkWallet.address);
        setWallets(prev => ({ ...prev, zk: zkWallet.address }));
      }

      // Load all verifications
      const allVerifications = await base44.entities.WalletVerification.filter({
        user_email: currentUser.email
      });

      console.log('📊 Found', allVerifications.length, 'verifications');
      setVerifications(allVerifications);

      // Calculate stats
      const blueScore = allVerifications.reduce((sum, v) => sum + (v.blue_score || 0), 0);
      const maxDepth = Math.max(...allVerifications.map(v => v.dag_depth || 0), 0);
      const crossVerifs = allVerifications.filter(v => v.verified_by && v.verified_by.length > 0).length;

      setDagStatus({
        totalVerifications: allVerifications.length,
        blueScore,
        dagDepth: maxDepth,
        crossVerifications: crossVerifs
      });

    } catch (error) {
      console.error('❌ Failed to load DAGKnight status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGenesisVerification = async (walletType, walletAddress) => {
    // For ZK wallet, require PIN verification first
    if (walletType === 'zk_wallet') {
      setPendingZKWallet({ walletType, walletAddress });
      setShowPinModal(true);
      setPinInput('');
      setPinError(null);
      return;
    }
    
    setIsVerifying(true);
    setActiveVerification(walletType);
    
    try {
      console.log(`🔐 Creating genesis for ${walletType}...`);
      
      let signature;
      let message = `🛡️ DAGKnight Genesis Verification 🛡️

I hereby verify ownership and authorize multi-wallet verification for:

Wallet Type: ${walletType}
Address: ${walletAddress}
Genesis Timestamp: ${new Date().toISOString()}

This is my official Genesis Verification Block for the DAGKnight multi-wallet security system.

By signing this message, I confirm:
- I own and control this wallet
- I authorize cross-device verification
- I understand this creates a permanent verification record

DAGKnight - Quantum-Secured Multi-Wallet Verification`;
      
      if (walletType === 'kasware_l1') {
        if (typeof window.kasware === 'undefined') {
          throw new Error('Kasware wallet not found. Please install Kasware extension.');
        }
        
        console.log('📝 Requesting Kasware signature...');
        signature = await window.kasware.signMessage(message);
        console.log('✅ Kasware signed');
      }
      
      if (!signature) {
        throw new Error('No signature received');
      }
      
      console.log('💾 Saving genesis to database...');
      
      const verificationId = `dagk_${walletType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await base44.entities.WalletVerification.create({
        verification_id: verificationId,
        user_email: user.email,
        wallet_address: walletAddress,
        wallet_type: walletType,
        signature: signature,
        message: message,
        parent_verifications: [],
        blue_score: 0,
        dag_depth: 0,
        is_genesis: true,
        verified_by: [],
        timestamp: new Date().toISOString(),
        dag_hash: signature.substring(0, 64)
      });
      
      console.log('✅ Genesis created!');
      
      // Update user's wallet address
      if (walletType === 'kasware_l1') {
        await base44.auth.updateMe({ kasware_address: walletAddress });
      }
      
      await loadDAGKnightStatus();
      
      alert('✅ Genesis verification created successfully!');
      
    } catch (error) {
      console.error('❌ Genesis failed:', error);
      
      let errorMessage = error.message || 'Verification failed';
      
      if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied') || error.code === 4001) {
        alert('⚠️ Signature request was cancelled.');
      } else if (errorMessage.includes('not found')) {
        alert('❌ ' + errorMessage);
      } else {
        alert('❌ Verification failed: ' + errorMessage);
      }
    } finally {
      setIsVerifying(false);
      setActiveVerification(null);
    }
  };

  const handlePinVerification = async () => {
    if (!pinInput || pinInput.length !== 6) {
      setPinError('Please enter a 6-digit PIN');
      return;
    }

    setIsPinVerifying(true);
    setPinError(null);

    try {
      // Hash the entered PIN
      const pinHashRes = await base44.functions.invoke('hashPin', { pin: pinInput });
      
      if (!pinHashRes.data || !pinHashRes.data.success) {
        throw new Error('Failed to hash PIN');
      }

      const enteredPinHash = pinHashRes.data.hash;
      
      // Compare with stored PIN hash
      if (!user.wallet_pin_hash) {
        throw new Error('No PIN set for TTT Wallet. Please set a PIN first.');
      }

      if (enteredPinHash !== user.wallet_pin_hash) {
        throw new Error('Incorrect PIN');
      }

      console.log('✅ PIN verified successfully');
      
      // Close modal
      setShowPinModal(false);
      setPinInput('');
      
      // Now create genesis for ZK wallet using cryptographic signature
      await createZKGenesisWithPIN(pendingZKWallet.walletAddress);
      
    } catch (error) {
      console.error('❌ PIN verification failed:', error);
      setPinError(error.message || 'PIN verification failed');
    } finally {
      setIsPinVerifying(false);
    }
  };

  const createZKGenesisWithPIN = async (walletAddress) => {
    setIsVerifying(true);
    setActiveVerification('zk_wallet');
    
    try {
      const message = `🛡️ DAGKnight Genesis Verification 🛡️

I hereby verify ownership and authorize multi-wallet verification for:

Wallet Type: zk_wallet
Address: ${walletAddress}
Genesis Timestamp: ${new Date().toISOString()}

This is my official Genesis Verification Block for the DAGKnight multi-wallet security system.

By signing this message, I confirm:
- I own and control this wallet
- I authorize cross-device verification
- I understand this creates a permanent verification record

DAGKnight - Quantum-Secured Multi-Wallet Verification`;

      // Create cryptographic signature using PIN hash + wallet address
      const encoder = new TextEncoder();
      const signatureData = encoder.encode(message + user.wallet_pin_hash + walletAddress); // Modified line
      const hashBuffer = await crypto.subtle.digest("SHA-256", signatureData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      console.log('💾 Saving ZK genesis to database...');
      
      const verificationId = `dagk_zk_wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await base44.entities.WalletVerification.create({
        verification_id: verificationId,
        user_email: user.email,
        wallet_address: walletAddress,
        wallet_type: 'zk_wallet',
        signature: signature,
        message: message,
        parent_verifications: [],
        blue_score: 0,
        dag_depth: 0,
        is_genesis: true,
        verified_by: [],
        timestamp: new Date().toISOString(),
        dag_hash: signature.substring(0, 64)
      });
      
      console.log('✅ ZK Genesis created!');
      
      await loadDAGKnightStatus();
      
      alert('✅ ZK Wallet genesis verification created successfully!');
      
    } catch (error) {
      console.error('❌ ZK Genesis failed:', error);
      alert('❌ Verification failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsVerifying(false);
      setActiveVerification(null);
      setPendingZKWallet(null);
    }
  };

  const handleVerifyTTTWallet = async (walletAddress) => {
    // Show payment/verification modal instead of navigating away
    setShowTTTVerifyModal(true);
  };

  const handleTTTVerifyComplete = async () => {
    setShowTTTVerifyModal(false);
    
    // Create genesis verification for TTT wallet
    setIsVerifying(true);
    setActiveVerification('ttt_wallet');
    
    try {
      console.log('🔐 Creating TTT Wallet genesis...');
      
      const message = `🛡️ DAGKnight Genesis Verification 🛡️

I hereby verify ownership and authorize multi-wallet verification for:

Wallet Type: ttt_wallet
Address: ${wallets.ttt}
Genesis Timestamp: ${new Date().toISOString()}

This is my official Genesis Verification Block for the DAGKnight multi-wallet security system.

By signing this message, I confirm:
- I own and control this wallet
- I authorize cross-device verification
- I understand this creates a permanent verification record

DAGKnight - Quantum-Secured Multi-Wallet Verification`;

      // Create cryptographic signature using wallet address + timestamp
      const encoder = new TextEncoder();
      const signatureData = encoder.encode(message + wallets.ttt + new Date().toISOString());
      const hashBuffer = await crypto.subtle.digest("SHA-256", signatureData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const verificationId = `dagk_ttt_wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await base44.entities.WalletVerification.create({
        verification_id: verificationId,
        user_email: user.email,
        wallet_address: wallets.ttt,
        wallet_type: 'ttt_wallet',
        signature: signature,
        message: message,
        parent_verifications: [],
        blue_score: 0,
        dag_depth: 0,
        is_genesis: true,
        verified_by: [],
        timestamp: new Date().toISOString(),
        dag_hash: signature.substring(0, 64)
      });
      
      console.log('✅ TTT Wallet genesis created!');
      
      await loadDAGKnightStatus();
      
      alert('✅ TTT Wallet genesis verification created successfully!');
      
    } catch (error) {
      console.error('❌ TTT Genesis failed:', error);
      alert('❌ Verification failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsVerifying(false);
      setActiveVerification(null);
    }
  };

  const handleDisconnectWallet = async (walletType) => {
    try {
      const updates = {};
      
      if (walletType === 'kasware') {
        updates.kasware_address = null;
        setWallets(prev => ({ ...prev, kasware: null }));
      } else if (walletType === 'ttt') {
        updates.created_wallet_address = null;
        setWallets(prev => ({ ...prev, ttt: null }));
      } else if (walletType === 'zk') {
        // Don't actually delete VP imported wallet, just clear from view
        setWallets(prev => ({ ...prev, zk: null }));
        console.log('✅ ZK Wallet disconnected from view');
        return;
      }
      
      await base44.auth.updateMe(updates);
      await loadDAGKnightStatus();
      
      console.log('✅ Wallet disconnected:', walletType);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      alert('Failed to disconnect wallet');
    }
  };

  const getWalletVerifications = (walletAddress) => {
    return verifications.filter(v => v.wallet_address === walletAddress);
  };

  const hasGenesisFor = (walletType) => {
    return verifications.some(v => v.wallet_type === walletType && v.is_genesis);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
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
            <p className="text-gray-400 mb-4">Please login to access DAGKnight</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-purple-500 text-white">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">DAGKnight Wallet</h1>
              <p className="text-gray-400 mt-1">Multi-Wallet Quantum Verification System</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Verifications</div>
                <div className="text-2xl font-bold text-white">{dagStatus.totalVerifications}</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Blue Score</div>
                <div className="text-2xl font-bold text-cyan-400">{dagStatus.blueScore}</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">DAG Depth</div>
                <div className="text-2xl font-bold text-purple-400">{dagStatus.dagDepth}</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Cross-Verify</div>
                <div className="text-2xl font-bold text-pink-400">{dagStatus.crossVerifications}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setActiveTab('wallets')}
            className={activeTab === 'wallets' 
              ? 'bg-white text-black' 
              : 'bg-zinc-900 text-gray-400 border border-zinc-800'
            }
          >
            <Network className="w-4 h-4 mr-2" />
            Wallets
          </Button>
          <Button
            onClick={() => setActiveTab('dag')}
            className={activeTab === 'dag' 
              ? 'bg-white text-black' 
              : 'bg-zinc-900 text-gray-400 border border-zinc-800'
            }
          >
            <Activity className="w-4 h-4 mr-2" />
            DAG
          </Button>
          <Button
            onClick={() => setActiveTab('certificate')}
            className={activeTab === 'certificate' 
              ? 'bg-white text-black' 
              : 'bg-zinc-900 text-gray-400 border border-zinc-800'
            }
          >
            <Crown className="w-4 h-4 mr-2" />
            Certificate
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'wallets' && (
            <motion.div
              key="wallets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WalletCards
                wallets={wallets}
                getWalletVerifications={getWalletVerifications}
                hasGenesisFor={hasGenesisFor}
                createGenesisVerification={createGenesisVerification}
                isVerifying={isVerifying}
                activeVerification={activeVerification}
                loadDAGKnightStatus={loadDAGKnightStatus}
                onVerifyTTTWallet={handleVerifyTTTWallet}
                onDisconnectWallet={handleDisconnectWallet}
              />

              <TransactionHistory verifications={verifications} />
            </motion.div>
          )}

          {activeTab === 'dag' && (
            <motion.div
              key="dag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="bg-black border-zinc-800">
                <CardContent className="p-8 text-center">
                  <Activity className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">DAG Visualization</h3>
                  <p className="text-gray-400">Coming soon - visualize your verification DAG</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'certificate' && (
            <motion.div
              key="certificate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="bg-black border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">DAGKnight Certificate</h2>
                      <p className="text-sm text-gray-400 mt-1">Your multi-wallet verification record</p>
                    </div>
                    {dagStatus.totalVerifications >= 2 && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                        <Crown className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {dagStatus.totalVerifications === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No Verifications Yet</h3>
                      <p className="text-gray-400 text-sm mb-6">
                        Create genesis verifications for your wallets to generate your certificate
                      </p>
                      <Button 
                        onClick={() => setActiveTab('wallets')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        Start Verification
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Certificate Header */}
                      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Shield className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">DAGKnight Certificate</h3>
                            <p className="text-sm text-gray-400">Multi-Wallet Verification Record</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                          <div className="bg-black/50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Verifications</div>
                            <div className="text-xl font-bold text-white">{dagStatus.totalVerifications}</div>
                          </div>
                          <div className="bg-black/50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Blue Score</div>
                            <div className="text-xl font-bold text-cyan-400">{dagStatus.blueScore}</div>
                          </div>
                          <div className="bg-black/50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">DAG Depth</div>
                            <div className="text-xl font-bold text-purple-400">{dagStatus.dagDepth}</div>
                          </div>
                          <div className="bg-black/50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Cross-Verify</div>
                            <div className="text-xl font-bold text-pink-400">{dagStatus.crossVerifications}</div>
                          </div>
                        </div>
                      </div>

                      {/* Verified Wallets */}
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Verified Wallets</h3>
                        <div className="space-y-3">
                          {verifications.filter(v => v.is_genesis).map((verification) => {
                            const walletTypeMap = {
                              'kasware_l1': { name: 'Kasware L1', color: 'orange', icon: '🟠' },
                              'ttt_wallet': { name: 'TTT Wallet', color: 'purple', icon: '💜' },
                              'zk_wallet': { name: 'ZK Wallet', color: 'cyan', icon: '🔷' }
                            };
                            
                            const info = walletTypeMap[verification.wallet_type] || { name: verification.wallet_type, color: 'gray', icon: '🔷' };
                            
                            return (
                              <div key={verification.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl">{info.icon}</span>
                                    <div>
                                      <div className="text-sm font-semibold text-white">{info.name}</div>
                                      <code className="text-xs text-gray-400 font-mono">
                                        {verification.wallet_address.substring(0, 16)}...{verification.wallet_address.substring(verification.wallet_address.length - 8)}
                                      </code>
                                    </div>
                                  </div>
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Genesis
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-black/50 rounded p-2">
                                    <div className="text-gray-500 mb-1">Verified</div>
                                    <div className="text-white">{new Date(verification.timestamp).toLocaleDateString()}</div>
                                  </div>
                                  <div className="bg-black/50 rounded p-2">
                                    <div className="text-gray-500 mb-1">Blue Score</div>
                                    <div className="text-cyan-400 font-semibold">{verification.blue_score || 0}</div>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-zinc-800">
                                  <div className="text-xs text-gray-500 mb-1">Verification ID</div>
                                  <code className="text-xs text-purple-400 font-mono break-all">
                                    {verification.verification_id}
                                  </code>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Certificate Footer */}
                      <div className="bg-black/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Certificate Owner</div>
                            <div className="text-sm text-white font-mono">{user?.email}</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                          >
                            <Activity className="w-4 h-4 mr-2" />
                            View Full DAG
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIN Verification Modal */}
        <AnimatePresence>
          {showPinModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setPinError(null);
                  setPendingZKWallet(null);
                }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                        <Lock className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Enter PIN</h3>
                        <p className="text-sm text-gray-400">Verify your TTT Wallet PIN</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">6-Digit PIN</label>
                        <Input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter PIN"
                          className="bg-black border-zinc-800 text-white text-center text-2xl tracking-widest"
                          autoFocus
                        />
                      </div>

                      {pinError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-sm text-red-300">{pinError}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            setShowPinModal(false);
                            setPinInput('');
                            setPinError(null);
                            setPendingZKWallet(null);
                          }}
                          variant="outline"
                          className="flex-1 bg-zinc-900 border-zinc-800 text-white"
                          disabled={isPinVerifying}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handlePinVerification}
                          disabled={isPinVerifying || pinInput.length !== 6}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          {isPinVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify & Create Genesis'
                          )}
                        </Button>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-xs text-blue-300">
                          🔒 This is the PIN you set when creating your TTT Wallet. It's required to create genesis verification for ZK Wallet.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* TTT Wallet Verification Modal */}
        <AnimatePresence>
          {showTTTVerifyModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowTTTVerifyModal(false);
                }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                        <Activity className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Verify TTT Wallet Ownership</h3>
                        <p className="text-sm text-gray-400">Confirm you own and control your TTT Wallet.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-gray-300">
                        By clicking "Verify TTT Wallet", you are confirming ownership of your TTT Wallet (<code>{wallets.ttt?.substring(0, 10)}...{wallets.ttt?.substring(wallets.ttt.length - 8)}</code>) and authorizing its genesis verification on the DAGKnight system.
                      </p>
                      <p className="text-sm text-gray-400">
                        This action will create a permanent, immutable record linking your TTT Wallet to your DAGKnight identity.
                      </p>

                      <div className="flex gap-3 mt-6">
                        <Button
                          onClick={() => setShowTTTVerifyModal(false)}
                          variant="outline"
                          className="flex-1 bg-zinc-900 border-zinc-800 text-white"
                          disabled={isVerifying && activeVerification === 'ttt_wallet'}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleTTTVerifyComplete}
                          disabled={isVerifying && activeVerification === 'ttt_wallet'}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          {(isVerifying && activeVerification === 'ttt_wallet') ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify TTT Wallet'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
