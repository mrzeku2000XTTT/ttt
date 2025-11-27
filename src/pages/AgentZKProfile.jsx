import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Sparkles, Crown, Loader2, Copy, CheckCircle2, Users, Send, Bell, Edit2, CreditCard, Twitter, Github, Globe, MessageCircle, Wallet, Briefcase, X, Check } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import IDCard from "@/components/agentZK/IDCard";
import ProfileEditModal from "@/components/agentZK/ProfileEditModal";

export default function AgentZKProfilePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kaspaAddress = searchParams.get('address');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [existingConnection, setExistingConnection] = useState(null);
  const [showIDCard, setShowIDCard] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (kaspaAddress) {
      loadProfile();
    } else {
      setError('No address provided');
      setIsLoading(false);
    }
  }, [kaspaAddress]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [Profile] Loading profile for:', kaspaAddress);
      
      const user = await base44.auth.me();
      setCurrentUser(user);

      const profiles = await base44.entities.AgentZKProfile.filter({
        wallet_address: kaspaAddress
      });

      if (profiles.length === 0) {
        console.error('❌ [Profile] No profile found for address:', kaspaAddress);
        setError('Agent ZK profile not found for this address');
        setIsLoading(false);
        return;
      }

      const profile = profiles[0];
      console.log('✅ [Profile] Found profile:', profile);
      setProfileData(profile);

      try {
        const allVerifications = await base44.entities.WalletVerification.filter({
          wallet_address: kaspaAddress
        });
        setVerifications(allVerifications);
        console.log('✅ [Profile] Loaded', allVerifications.length, 'verifications');
      } catch (err) {
        console.error('⚠️ [Profile] Failed to load verifications:', err);
      }

      if (user?.created_wallet_address) {
        try {
          const outgoingConnections = await base44.entities.AgentZKConnection.filter({
            requester_email: user.email,
            target_address: kaspaAddress
          });
          
          const incomingConnections = await base44.entities.AgentZKConnection.filter({
            target_address: user.created_wallet_address,
            requester_address: kaspaAddress
          });
          
          const allConnections = [...outgoingConnections, ...incomingConnections];
          const acceptedConnection = allConnections.find(c => c.status === 'accepted');
          
          if (acceptedConnection) {
            setExistingConnection(acceptedConnection);
            console.log('✅ [Profile] Found accepted connection');
          } else if (allConnections.length > 0) {
            setExistingConnection(allConnections[0]);
            console.log('✅ [Profile] Found connection:', allConnections[0].status);
          }
        } catch (err) {
          console.error('⚠️ [Profile] Failed to check connection:', err);
        }
      }

    } catch (err) {
      console.error('❌ [Profile] Load failed:', err);
      setError('Failed to load profile: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectAndMessage = async () => {
    if (!currentUser?.created_wallet_address) {
      alert('⚠️ You need a TTT Wallet to connect. Please create one first.');
      return;
    }

    setIsConnecting(true);
    
    try {
      console.log('🔗 [Profile] Creating connection and opening chat...');

      const response = await base44.functions.invoke('createAgentConnection', {
        target_address: kaspaAddress,
        message: `Hi! I'd like to connect with you.`
      });

      console.log('📦 [Profile] Response:', response.data);

      if (response.data.success) {
        console.log('✅ [Profile] Connection created, opening messages...');
        
        // Small delay to ensure connection is saved, then navigate
        setTimeout(() => {
          navigate(createPageUrl("AgentZKChat") + "?targetAddress=" + encodeURIComponent(kaspaAddress) + "&targetName=" + encodeURIComponent(profileData.username));
        }, 500);
      } else {
        throw new Error(response.data.error || 'Failed to create connection');
      }

    } catch (err) {
      console.error('❌ [Profile] Connect failed:', err);
      alert('❌ Failed: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(kaspaAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const getTruncatedAddress = (address) => {
    if (!address) return '';
    if (address.length <= 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 5)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 p-6 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <Link to={createPageUrl("AgentZKDirectory")}>
              <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Directory
              </Button>
            </Link>

            <Card className="bg-black border-zinc-800">
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <p className="text-sm text-gray-500 font-mono mb-6 break-all">{kaspaAddress}</p>
                <Link to={createPageUrl("AgentZKDirectory")}>
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    Browse Directory
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.email === profileData?.user_email;
  const agentPhoto = profileData?.agent_zk_photo;
  const isFriends = existingConnection?.status === 'accepted';
  const hasTTTWallet = profileData?.ttt_wallet_address || currentUser?.created_wallet_address;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cyberpunk Grid Background */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
        
        {/* Radial glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-3 md:p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to={createPageUrl("AgentZKDirectory")}>
              <Button variant="ghost" size="sm" className="mb-3 md:mb-6 text-gray-400 hover:text-white hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Directory
              </Button>
            </Link>
          </motion.div>

          {/* HERO HEADER - Cyber Style */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 md:mb-12 relative"
          >
            <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/5 via-black/80 to-purple-500/5 border border-cyan-500/20 rounded-2xl overflow-hidden">
              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              
              <div className="p-4 md:p-8 lg:p-12">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                  {/* Avatar Section */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="relative w-24 h-24 md:w-40 md:h-40 cursor-pointer"
                      onClick={() => setShowQRModal(true)}
                      title="View QR Code"
                    >
                      {/* Outer ring glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                      
                      {/* Avatar frame */}
                      <div className="relative w-full h-full border-4 border-cyan-500/50 rounded-2xl overflow-hidden bg-black">
                        {agentPhoto ? (
                          <img src={agentPhoto} alt="Agent Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png"
                            alt="Agent ZK"
                            className="w-full h-full object-contain p-6"
                          />
                        )}
                      </div>

                      {/* Corner accents */}
                      <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-400" />
                      <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-400" />
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-400" />
                      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-400" />
                      
                      {/* Shield badge */}
                      <div className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center border-2 md:border-4 border-black shadow-lg shadow-cyan-500/50">
                        <Shield className="w-5 h-5 md:w-7 md:h-7 text-white" />
                      </div>
                    </div>

                    {profileData.id_card_generated && (
                      <Button
                        onClick={() => setShowIDCard(true)}
                        size="sm"
                        className="absolute -top-2 -left-2 md:-top-4 md:-left-4 w-8 h-8 md:w-10 md:h-10 p-0 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/50"
                        title="View ID Card"
                      >
                        <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </Button>
                    )}
                  </div>

                  {/* Identity Info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="mb-3 md:mb-6">
                      <div className="text-[10px] md:text-xs text-cyan-400 mb-1 md:mb-2 uppercase tracking-widest">Agent Identity</div>
                      
                      {/* Agent ZK ID - Large with glitch effect */}
                      <div className="relative mb-4">
                        {!hasTTTWallet && !isOwnProfile ? (
                          <>
                            {/* Glitching ID effect for users without TTT wallet */}
                            <motion.h1
                              animate={{
                                textShadow: [
                                  '0 0 10px rgba(6, 182, 212, 0.5)',
                                  '2px 2px 10px rgba(168, 85, 247, 0.5), -2px -2px 10px rgba(6, 182, 212, 0.5)',
                                  '0 0 10px rgba(6, 182, 212, 0.5)'
                                ],
                                x: [0, -2, 2, -1, 1, 0],
                              }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                repeatDelay: 2
                              }}
                              className="text-2xl md:text-5xl font-black text-white tracking-wider mb-2"
                              style={{ fontFamily: 'monospace' }}
                            >
                              {profileData.agent_zk_id || 'ZK-########'}
                            </motion.h1>
                            
                            {/* Chinese character glitch overlay */}
                            <motion.div
                              animate={{
                                opacity: [0, 0.3, 0, 0.5, 0],
                              }}
                              transition={{
                                duration: 0.3,
                                repeat: Infinity,
                                repeatDelay: 3
                              }}
                              className="absolute top-0 left-0 text-2xl md:text-5xl font-black text-cyan-400 tracking-wider"
                              style={{ fontFamily: 'monospace' }}
                            >
                              機密█数据█错误
                            </motion.div>
                          </>
                        ) : (
                          <h1 className="text-2xl md:text-5xl font-black text-white tracking-wider mb-2" style={{ fontFamily: 'monospace' }}>
                            {profileData.agent_zk_id || 'ZK-########'}
                          </h1>
                        )}
                      </div>

                      {/* AGENT ZK TAG # - Dual Wallet Display */}
                      <div className="mb-3 md:mb-4">
                        <div className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2 uppercase tracking-wider">Agent ZK Tag #</div>
                        <div className="flex items-center justify-center md:justify-start gap-1 md:gap-2 flex-wrap">
                          {/* Kasware L1 */}
                          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-1.5 py-1 md:px-3 md:py-1.5">
                            <div className="flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5 md:w-3 md:h-3 text-purple-400" />
                              <div>
                                <div className="text-[7px] md:text-[9px] text-purple-400 uppercase">Kasware L1</div>
                                <code className="text-[9px] md:text-xs text-purple-300 font-mono font-bold">
                                  {getTruncatedAddress(profileData.wallet_address)}
                                </code>
                              </div>
                            </div>
                          </div>

                          {/* TTT Wallet (if exists) */}
                          {profileData.ttt_wallet_address && (
                            <>
                              <div className="text-gray-600 text-xs md:text-sm">/</div>
                              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-1.5 py-1 md:px-3 md:py-1.5">
                                <div className="flex items-center gap-1">
                                  <Wallet className="w-2.5 h-2.5 md:w-3 md:h-3 text-cyan-400" />
                                  <div>
                                    <div className="text-[7px] md:text-[9px] text-cyan-400 uppercase">TTT Wallet</div>
                                    <code className="text-[9px] md:text-xs text-cyan-300 font-mono font-bold">
                                      {getTruncatedAddress(profileData.ttt_wallet_address)}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Username with glitch effect if no TTT wallet */}
                      {!hasTTTWallet && !isOwnProfile ? (
                        <motion.div
                          animate={{
                            opacity: [1, 0.7, 1, 0.5, 1],
                          }}
                          transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            repeatDelay: 4
                          }}
                          className="text-xl md:text-3xl font-bold text-cyan-400 mb-2"
                        >
                          {profileData.username || "UNKNOWN AGENT"}
                        </motion.div>
                      ) : (
                        <h2 className="text-xl md:text-3xl font-bold text-cyan-400 mb-2">
                          {profileData.username || "Agent"}
                        </h2>
                      )}

                      {/* Wallet Status Warning */}
                      {!hasTTTWallet && !isOwnProfile && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5 md:px-4 md:py-2 mb-3 md:mb-4 inline-block">
                          <p className="text-[10px] md:text-xs text-red-300 flex items-center gap-1 md:gap-2">
                            <Bell className="w-3 h-3 animate-pulse" />
                            Identity Unstable - No TTT Wallet Connected
                          </p>
                        </div>
                      )}
                    </div>

                    {profileData.role && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-3 md:mb-4 px-3 py-0.5 md:px-4 md:py-1 text-xs md:text-sm">
                        {profileData.role}
                      </Badge>
                    )}

                    {profileData.kns_domain && (
                      <div className="mb-4">
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-mono">
                          🌐 {profileData.kns_domain}
                        </Badge>
                      </div>
                    )}

                    {profileData.bio && (
                      <p className="text-gray-300 text-xs md:text-sm mb-3 md:mb-6 max-w-2xl leading-relaxed">
                        {profileData.bio}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 md:gap-2 mb-3 md:mb-6">
                      <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {profileData.availability || 'Active'}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        <Crown className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                      <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {verifications.length} Verifications
                      </Badge>
                      
                      {isFriends && (
                        <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                          <Users className="w-3 h-3 mr-1" />
                          Friends
                        </Badge>
                      )}

                      {profileData.work_type?.includes('worker') && (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          Worker
                        </Badge>
                      )}

                      {profileData.work_type?.includes('employer') && (
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          Employer
                        </Badge>
                      )}

                      {profileData.is_hireable && (
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                          ✨ Hireable
                        </Badge>
                      )}
                    </div>

                    {/* Social Links */}
                    {profileData.social_links && Object.values(profileData.social_links).some(link => link) && (
                      <div className="flex items-center gap-3 justify-center md:justify-start mb-6">
                        {profileData.social_links.twitter && (
                          <a href={profileData.social_links.twitter.startsWith('http') ? profileData.social_links.twitter : `https://twitter.com/${profileData.social_links.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
                            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                          </a>
                        )}
                        {profileData.social_links.reddit && (
                          <a href={profileData.social_links.reddit.startsWith('http') ? profileData.social_links.reddit : `https://reddit.com/${profileData.social_links.reddit}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
                            <span className="text-[#FF4500] text-lg font-bold">r/</span>
                          </a>
                        )}
                        {profileData.social_links.discord && (
                          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors border border-white/10" title={profileData.social_links.discord}>
                            <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                          </div>
                        )}
                        {profileData.social_links.github && (
                          <a href={profileData.social_links.github.startsWith('http') ? profileData.social_links.github : `https://github.com/${profileData.social_links.github}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
                            <Github className="w-5 h-5 text-white" />
                          </a>
                        )}
                        {profileData.social_links.website && (
                          <a href={profileData.social_links.website} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
                            <Globe className="w-5 h-5 text-cyan-400" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Full Wallet Address - Compact with kaspa: prefix */}
                    <div className="flex items-center gap-1.5 bg-black/60 border border-cyan-500/30 rounded-lg px-2 py-1.5 md:px-3 md:py-2 max-w-xs md:max-w-md mx-auto md:mx-0 mb-3 md:mb-6">
                      <code className="text-[9px] md:text-xs text-cyan-400 flex-1 font-mono break-all">
                        kaspa:{getTruncatedAddress(kaspaAddress)}
                      </code>
                      <Button
                        onClick={copyAddress}
                        size="sm"
                        variant="ghost"
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-6 w-6 md:h-7 md:w-7 p-0 flex-shrink-0"
                        title="Copy full address"
                      >
                        {copiedAddress ? <Check className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <Copy className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 md:gap-3 justify-center md:justify-start flex-wrap">
                      {isOwnProfile ? (
                        <Button
                          onClick={() => setShowEditModal(true)}
                          size="sm"
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-xs md:text-sm h-10 md:h-11 px-4 md:px-6"
                        >
                          <Edit2 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          {isFriends && (
                            <Button
                              onClick={() => navigate(createPageUrl("AgentZKChat") + "?targetAddress=" + encodeURIComponent(kaspaAddress) + "&targetName=" + encodeURIComponent(profileData.username))}
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-xs md:text-sm h-10 md:h-11 px-4 md:px-6"
                            >
                              <Send className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                              Send Message
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Professional Details */}
          {(profileData.role || profileData.hourly_rate_kas || profileData.skills?.length > 0 || profileData.tech_background) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 md:mb-8"
            >
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-4 md:p-8">
                  <h2 className="text-lg md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                    Career Profile
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {profileData.role && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Role</div>
                        <div className="text-white font-semibold">{profileData.role}</div>
                      </div>
                    )}

                    {profileData.hourly_rate_kas && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Hourly Rate</div>
                        <div className="text-white font-semibold">{profileData.hourly_rate_kas} KAS/hr</div>
                      </div>
                    )}
                  </div>

                  {profileData.skills && profileData.skills.length > 0 && (
                    <div className="mb-6">
                      <div className="text-sm text-gray-400 mb-3">Skills & Technologies</div>
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.map((skill, idx) => (
                          <Badge key={idx} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileData.tech_background && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Tech Background</div>
                      <p className="text-white leading-relaxed">{profileData.tech_background}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-3 md:gap-6"
          >
            <Card className="backdrop-blur-xl bg-white/5 border-cyan-500/20 hover:border-cyan-500/40 transition-all">
              <CardContent className="p-3 md:p-6">
                <div className="text-center">
                  <div className="text-2xl md:text-4xl font-black text-cyan-400 mb-1 md:mb-2">{verifications.length}</div>
                  <div className="text-[10px] md:text-sm text-gray-400">Verified</div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border-purple-500/20 hover:border-purple-500/40 transition-all">
              <CardContent className="p-3 md:p-6">
                <div className="text-center">
                  <div className="text-2xl md:text-4xl font-black text-purple-400 mb-1 md:mb-2">
                    {hasTTTWallet ? '✓' : '⚠'}
                  </div>
                  <div className="text-[10px] md:text-sm text-gray-400">Wallet</div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border-green-500/20 hover:border-green-500/40 transition-all">
              <CardContent className="p-3 md:p-6">
                <div className="text-center">
                  <div className="text-sm md:text-lg font-bold text-green-400 mb-1 md:mb-2">
                    {profileData.availability || 'Active'}
                  </div>
                  <div className="text-[10px] md:text-sm text-gray-400">Status</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {showIDCard && (
        <IDCard profile={profileData} onClose={() => setShowIDCard(false)} />
      )}

      {showEditModal && (
        <ProfileEditModal
          profile={profileData}
          onClose={() => setShowEditModal(false)}
          onUpdate={loadProfile}
        />
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-4 md:p-6 max-w-sm w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm md:text-base">Receive KAS</h3>
                    <p className="text-[10px] md:text-xs text-gray-400">{profileData.username}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowQRModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white h-7 w-7 md:h-8 md:w-8 p-0"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>

              {/* QR Code */}
              <div className="bg-white p-3 md:p-4 rounded-xl mb-3 md:mb-4 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(kaspaAddress)}`}
                  alt="Kaspa Address QR"
                  className="w-full h-auto max-w-[220px]"
                />
              </div>

              {/* Address Display with Copy */}
              <div className="bg-black/60 border border-cyan-500/30 rounded-lg p-2 md:p-3 mb-3">
                <div className="text-[10px] md:text-xs text-gray-400 mb-2">Kasware L1 Address</div>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] md:text-xs text-cyan-400 flex-1 break-all font-mono">
                    {kaspaAddress}
                  </code>
                  <Button
                    onClick={copyAddress}
                    size="sm"
                    variant="ghost"
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 w-7 md:h-8 md:w-8 p-0 flex-shrink-0"
                  >
                    {copiedAddress ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <Copy className="w-3 h-3 md:w-4 md:h-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 md:p-3">
                <p className="text-[10px] md:text-xs text-cyan-300 text-center">
                  Scan this QR code to send KAS to {profileData.username}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes glitch {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-2px, 2px);
          }
          40% {
            transform: translate(-2px, -2px);
          }
          60% {
            transform: translate(2px, 2px);
          }
          80% {
            transform: translate(2px, -2px);
          }
          100% {
            transform: translate(0);
          }
        }
      `}</style>
    </div>
  );
}