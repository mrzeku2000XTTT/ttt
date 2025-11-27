import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, CheckCircle2, Loader2, AlertCircle, Key, Briefcase, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TermsModal from "@/components/TermsModal";

export default function WaitlistPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [kaspaAddress, setKaspaAddress] = useState("");
  const [tttWalletAddress, setTttWalletAddress] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [career, setCareer] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [createdAgentTag, setCreatedAgentTag] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsSignature, setTermsSignature] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user already has Agent ZK profile
      if (currentUser.agent_zk_access_code) {
        navigate(createPageUrl("AgentZKDirectory"));
        return;
      }

      // Check if user has accepted terms
      if (!currentUser.terms_accepted) {
        setShowTermsModal(true);
      }

      // Check if user has set up PIN
      if (currentUser.app_pin) {
        setHasPin(true);
      }

      // Auto-detect TTT Wallet if exists
      if (currentUser.created_wallet_address) {
        setTttWalletAddress(currentUser.created_wallet_address);
        console.log('✅ Auto-detected TTT Wallet:', currentUser.created_wallet_address);
      }
    } catch (err) {
      console.log("User not logged in or error:", err);
    }
  };

  const handleAcceptTerms = async (signature) => {
    try {
      await base44.auth.updateMe({
        terms_accepted: true,
        terms_accepted_date: new Date().toISOString(),
        terms_signature: signature
      });
      setTermsSignature(signature);
      setShowTermsModal(false);
      setUser({ ...user, terms_accepted: true, terms_signature: signature });
    } catch (err) {
      console.error('Failed to save terms acceptance:', err);
      alert('Failed to save terms acceptance. Please try again.');
    }
  };

  const handleDeclineTerms = () => {
    alert('You must accept the Terms of Service to claim your Agent ZK identity.');
    navigate(createPageUrl("Home"));
  };

  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      setError('Kasware wallet not installed. Please install Kasware extension first.');
      return;
    }

    try {
      const accounts = await window.kasware.requestAccounts();
      setKaspaAddress(accounts[0]);
      setError(null);
      console.log('✅ Kasware connected:', accounts[0]);
    } catch (err) {
      setError('Failed to connect Kasware: ' + err.message);
    }
  };

  const getTruncatedAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!kaspaAddress || !username.trim()) {
      setError('Please connect your Kasware wallet and enter a username');
      return;
    }

    if (!pin.trim() || pin.length < 4 || pin.length > 6) {
      setError('Please enter a 4-6 digit PIN');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!career.trim()) {
      setError('Please enter your career, skills, or background');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🚀 Creating Agent ZK profile with AI...');

      // Call backend to create profile with BOTH addresses
      const profileResponse = await base44.functions.invoke('createAgentZKProfile', {
        username: username.trim(),
        kaspaAddress: kaspaAddress,
        tttWalletAddress: tttWalletAddress || null,
        career: career.trim(),
        notes: notes.trim()
      });

      if (!profileResponse.data.success) {
        throw new Error(profileResponse.data.error || 'Failed to create profile');
      }

      console.log('✅ Profile created:', profileResponse.data);

      // Build Agent ZK Tag
      let agentTag = '';
      if (kaspaAddress && tttWalletAddress) {
        agentTag = `${getTruncatedAddress(kaspaAddress)} / ${getTruncatedAddress(tttWalletAddress)}`;
      } else if (kaspaAddress) {
        agentTag = getTruncatedAddress(kaspaAddress);
      } else if (tttWalletAddress) {
        agentTag = getTruncatedAddress(tttWalletAddress);
      }
      
      setCreatedAgentTag(agentTag);

      // Update user data with PIN
      await base44.auth.updateMe({ 
        app_pin: pin.trim(),
        agent_zk_access_code: `ZKID-${Date.now()}`, // Auto-generate code
        kasware_address: kaspaAddress,
        username: username.trim()
      });

      // Create waitlist entry
      await base44.entities.AgentZKWaitlist.create({
        kaspa_address: kaspaAddress,
        email: user?.email || 'guest',
        username: username.trim(),
        notes: notes.trim(),
        status: 'approved'
      });

      setSuccess(true);
      
      setTimeout(() => {
        navigate(createPageUrl("AgentZKDirectory"));
      }, 3000);

    } catch (err) {
      console.error('Failed to submit:', err);
      setError(err.message || 'Failed to create Agent ZK identity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinEntry = async (e) => {
    e.preventDefault();
    setPinError("");

    try {
      const currentUser = await base44.auth.me();
      
      if (currentUser.app_pin === enteredPin.trim()) {
        navigate(createPageUrl("Feed"));
      } else {
        setPinError("Incorrect PIN");
        setEnteredPin("");
      }
    } catch (err) {
      setPinError("Failed to verify PIN");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full"
        >
          <Card className="bg-black/80 backdrop-blur-xl border-cyan-500/30">
            <CardContent className="p-12 text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-white mb-3">Identity Activated! 🎉</h2>
              <p className="text-gray-400 mb-6">
                Your Agent ZK profile is now live in the directory
              </p>

              <div className="text-left space-y-3 bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                <div>
                  <div className="text-xs text-gray-500">Username</div>
                  <div className="text-white font-mono">{username}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500">Agent ZK Tag</div>
                  <div className="text-cyan-400 font-mono text-sm">
                    {createdAgentTag || getTruncatedAddress(kaspaAddress)}
                  </div>
                </div>

                {kaspaAddress && (
                  <div>
                    <div className="text-xs text-gray-500">Kasware L1</div>
                    <div className="text-purple-400 font-mono text-xs">
                      {getTruncatedAddress(kaspaAddress)}
                    </div>
                  </div>
                )}

                {tttWalletAddress && (
                  <div>
                    <div className="text-xs text-gray-500">TTT Wallet</div>
                    <div className="text-cyan-400 font-mono text-xs">
                      {getTruncatedAddress(tttWalletAddress)}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-gray-500">Career</div>
                  <div className="text-green-400 text-sm">{career.substring(0, 50)}...</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Active & Discoverable
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Redirecting to Agent ZK Directory...
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png"
                alt="Agent ZK"
                className="w-full h-full object-contain"
              />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl"
              />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Claim Your Agent ZK Identity
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              AI-powered personalized identity on Kaspa
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-red-500/20 border-red-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Auto-detected TTT Wallet Banner */}
          {tttWalletAddress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-cyan-500/10 border-cyan-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-cyan-300 font-semibold mb-1">
                      ✅ TTT Wallet Detected
                    </p>
                    <code className="text-xs text-cyan-400 font-mono">
                      {getTruncatedAddress(tttWalletAddress)}
                    </code>
                    <p className="text-xs text-gray-400 mt-1">
                      This will be automatically added to your Agent ZK profile
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Card className="bg-black/80 backdrop-blur-xl border-cyan-500/30">
            <CardHeader className="border-b border-cyan-500/20">
              <h2 className="text-2xl font-bold text-white">Agent ZK Application</h2>
              <p className="text-gray-400 text-sm">Connect wallet and create your AI-powered identity</p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Kaspa Address (Kasware) *
                  </label>
                  {kaspaAddress ? (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="text-white font-mono text-sm">
                            {getTruncatedAddress(kaspaAddress)}
                          </div>
                          <div className="text-xs text-green-400">Kasware L1 Connected</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={connectKasware}
                      className="w-full bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-white h-14"
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      Connect Kasware Wallet
                    </Button>
                  )}
                </div>

                {tttWalletAddress && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      TTT Wallet (Auto-Detected)
                    </label>
                    <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4 flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-white font-mono text-sm">
                          {getTruncatedAddress(tttWalletAddress)}
                        </div>
                        <div className="text-xs text-cyan-400">Will be added to your profile</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Choose Username *
                  </label>
                  <Input
                    placeholder="e.g., KaspaKnight"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-lg h-14"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    Career / Skills / Background *
                  </label>
                  <Textarea
                    placeholder="e.g., Full-Stack Developer with 5 years experience in React, Node.js, and blockchain development..."
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-32"
                    required
                  />
                  <p className="text-xs text-cyan-400 mt-2 flex items-start gap-1">
                    <span className="text-cyan-500">💡</span>
                    <span>Our AI will analyze your background and create a personalized profile page with custom space-themed visuals!</span>
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    Set Your PIN (4-6 digits) *
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter 4-6 digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-white/5 border-white/10 text-white text-lg h-14 font-mono"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Confirm PIN *
                  </label>
                  <Input
                    type="password"
                    placeholder="Re-enter your PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-white/5 border-white/10 text-white text-lg h-14 font-mono"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-cyan-400 mt-1">
                    This PIN will be used to access TTT and secure your account
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Additional Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Tell us more about yourself..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-24"
                  />
                </div>

                <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-cyan-200">
                      <strong className="text-white">Your Agent ZK Tag:</strong>
                      <div className="font-mono text-cyan-400 mt-2">
                        {kaspaAddress && tttWalletAddress ? (
                          <>
                            {getTruncatedAddress(kaspaAddress)} / {getTruncatedAddress(tttWalletAddress)}
                          </>
                        ) : kaspaAddress ? (
                          getTruncatedAddress(kaspaAddress)
                        ) : (
                          'Connect wallet to see your tag'
                        )}
                      </div>
                      <ul className="list-disc list-inside mt-3 space-y-1 text-xs">
                        <li>Personalized space-themed background</li>
                        <li>Custom profile based on your career</li>
                        <li>Instant discovery by other agents</li>
                        <li>P2P messaging capability</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !kaspaAddress || !username.trim() || !pin.trim() || !confirmPin.trim() || !career.trim()}
                  className="w-full h-14 text-lg font-semibold bg-black border border-black hover:bg-zinc-900 text-white disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Your AI Identity...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Create Agent ZK Identity
                    </>
                  )}
                </Button>
              </form>

              {hasPin && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <Button
                    onClick={() => navigate(createPageUrl("Browser"))}
                    className="w-full h-12 bg-black border border-white/10 hover:bg-zinc-900 text-white"
                  >
                    Enter TTT →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {!showPinEntry ? (
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <button 
                  onClick={() => setShowPinEntry(true)}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Enter with PIN
                </button>
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card className="bg-black/80 backdrop-blur-xl border-cyan-500/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    Enter Your PIN
                  </h3>
                  
                  {pinError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-300">{pinError}</p>
                    </div>
                  )}

                  <form onSubmit={handlePinEntry} className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Enter your PIN"
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="bg-white/5 border-white/10 text-white text-lg h-12 font-mono text-center"
                      maxLength={6}
                      autoFocus
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setShowPinEntry(false);
                          setEnteredPin("");
                          setPinError("");
                        }}
                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={enteredPin.length < 4}
                        className="flex-1 bg-black border border-white/10 hover:bg-zinc-900 text-white disabled:opacity-50"
                      >
                        Enter Feed →
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
    </div>
  );
}