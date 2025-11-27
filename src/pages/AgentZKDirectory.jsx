import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Users, Search, Loader2, Bot, Code, Palette, 
  Briefcase, TrendingUp, MessageCircle, Target, Zap, 
  Globe, Heart, Activity, CheckCircle2, Eye, Network
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import IDCard from "@/components/agentZK/IDCard";


const roleIcons = {
  "Backend Developer": Code,
  "Frontend Developer": Palette,
  "Full Stack Developer": Code,
  "Smart Contract Developer": Shield,
  "UI/UX Designer": Palette,
  "Product Manager": Briefcase,
  "Marketing Specialist": TrendingUp,
  "Content Creator": MessageCircle,
  "Community Manager": Users,
  "Data Scientist": Activity,
  "DevOps Engineer": Network,
  "Security Researcher": Shield,
  "Blockchain Analyst": Activity,
  "Business Strategist": Target,
  "Other": Bot
};

export default function AgentZKDirectoryPage() {
  const [searchParams] = useSearchParams();
  const highlightWallet = searchParams.get('highlight') || null;
  
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showIDCard, setShowIDCard] = useState(false);
  const [onlineAgents, setOnlineAgents] = useState([]);

  useEffect(() => {
    loadData();
    updateMyOnlineStatus();
    
    const interval = setInterval(loadData, 10000);
    const onlineInterval = setInterval(updateMyOnlineStatus, 30000); // Update every 30 seconds
    
    return () => {
      clearInterval(interval);
      clearInterval(onlineInterval);
    };
  }, []);
  
  const updateMyOnlineStatus = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) return;
      
      const myProfile = await base44.entities.AgentZKProfile.filter({
        user_email: currentUser.email
      });
      
      if (myProfile.length > 0) {
        await base44.entities.AgentZKProfile.update(myProfile[0].id, {
          last_active: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to update online status:', err);
    }
  };

  useEffect(() => {
    filterAgents();
  }, [agents, searchQuery, roleFilter, user, highlightWallet]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allAgents = await base44.entities.AgentZKProfile.list('-created_date');
      setAgents(allAgents);
      
      // Filter online agents (active in last 3 minutes)
      const now = Date.now();
      const onlineThreshold = 3 * 60 * 1000; // 3 minutes
      const online = allAgents.filter(agent => {
        if (!agent.last_active) return false;
        const lastActive = new Date(agent.last_active).getTime();
        return (now - lastActive) < onlineThreshold;
      });
      setOnlineAgents(online);

      if (currentUser?.created_wallet_address) {
        const myConnections = await base44.entities.AgentZKConnection.filter({});
        const userConnections = myConnections.filter(conn => 
          conn.requester_email === currentUser.email || conn.target_email === currentUser.email
        );
        setConnections(userConnections);
      }

      console.log('✅ Loaded', allAgents.length, 'agents');
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAgents = () => {
    let filtered = [...agents];

    // Sort: highlighted profile first, then current user, then by creation date
    if (user || highlightWallet) {
      filtered.sort((a, b) => {
        const aIsHighlighted = highlightWallet && a?.wallet_address && a.wallet_address === highlightWallet;
        const bIsHighlighted = highlightWallet && b?.wallet_address && b.wallet_address === highlightWallet;
        const aIsMe = a?.user_email && a.user_email === user?.email;
        const bIsMe = b?.user_email && b.user_email === user?.email;
        
        if (aIsHighlighted && !bIsHighlighted) return -1;
        if (!aIsHighlighted && bIsHighlighted) return 1;
        if (aIsMe && !bIsMe) return -1;
        if (!aIsMe && bIsMe) return 1;
        
        return new Date(b.created_date) - new Date(a.created_date);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.username?.toLowerCase().includes(query) ||
        agent.agent_zk_id?.toLowerCase().includes(query) ||
        agent.bio?.toLowerCase().includes(query) ||
        agent.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(agent => agent.role === roleFilter);
    }

    setFilteredAgents(filtered);
  };

  const getConnectionStatus = (agentWalletAddress) => {
    const connection = connections.find(conn => 
      (conn.target_address === agentWalletAddress && conn.requester_email === user?.email) || 
      (conn.requester_address === agentWalletAddress && conn.target_email === user?.email)
    );
    return connection?.status || null;
  };

  const handleViewAgent = (agent) => {
    setSelectedAgent(agent);
    setShowIDCard(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const roles = ['all', ...new Set(agents.map(a => a.role).filter(Boolean))].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('https://evalstate-flux1-schnell.hf.space/gradio_api/file=/tmp/gradio/15fcff41331fffd0b38a3a4f68e2fd0bc0e3ea2f9b76c65804e6f5272a92c/image.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    Agent ZK Directory
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Discover verified Agent ZK identities
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Count Badge */}
            <div className="mb-6">
              <Badge className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800 text-white px-4 py-2 text-sm font-semibold">
                <Users className="w-4 h-4 inline mr-2" />
                {filteredAgents.length} Career Profiles
              </Badge>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
                <div className="mb-6">
                  <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800">
                    <CardContent className="p-4">
                      <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[250px] relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input
                            placeholder="Search agents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-black border-zinc-700 text-white"
                          />
                        </div>

                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white"
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>
                              {role === 'all' ? 'All Roles' : role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Online Now Section */}
                {onlineAgents.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      <h2 className="text-xl font-bold text-white">Online Now</h2>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        {onlineAgents.length}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {onlineAgents.slice(0, 4).map((agent) => {
                        const RoleIcon = roleIcons[agent.role] || Bot;
                        const isOwnProfile = user?.email === agent.user_email;
                        
                        return (
                          <Link key={agent.id} to={createPageUrl("AgentZKProfile") + "?address=" + encodeURIComponent(agent.wallet_address)}>
                            <Card className="backdrop-blur-xl bg-white/5 border-green-500/30 hover:border-green-500/50 hover:bg-white/10 transition-all group cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-green-500/50">
                                      {agent.agent_zk_photo ? (
                                        <img src={agent.agent_zk_photo} alt={agent.username} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                          <Shield className="w-6 h-6 text-green-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-semibold text-sm truncate group-hover:text-green-400 transition-colors">
                                      {agent.username}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      <RoleIcon className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-400 truncate">{agent.role}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Agent Cards Grid */}
                {filteredAgents.length === 0 ? (
                  <div className="text-center py-20">
                    <Users className="w-20 h-20 text-gray-700 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-4">No Agents Found</h2>
                    <p className="text-gray-400">Try adjusting your search filters</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAgents.map((agent, index) => {
                      const RoleIcon = roleIcons[agent.role] || Bot;
                      const connectionStatus = getConnectionStatus(agent.wallet_address);
                      const isOwnProfile = user?.email === agent?.user_email;
                      const isHighlighted = highlightWallet && agent?.wallet_address && agent.wallet_address === highlightWallet;

                      return (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link to={createPageUrl("AgentZKProfile") + "?address=" + encodeURIComponent(agent.wallet_address)}>
                            <Card className={`backdrop-blur-xl bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all h-full group cursor-pointer ${
                              isOwnProfile ? 'ring-2 ring-purple-500/50' : ''
                            } ${isHighlighted ? 'ring-4 ring-green-500/70 animate-pulse' : ''}`}>
                              <CardContent className="p-6">
                                {isHighlighted && (
                                  <div className="mb-3">
                                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs font-bold px-3 py-1 animate-pulse">
                                      💼 JOB POSTER
                                    </Badge>
                                  </div>
                                )}
                                {isOwnProfile && (
                                  <div className="mb-3">
                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs font-bold px-3 py-1">
                                      👤 YOU
                                    </Badge>
                                  </div>
                                )}

                                <div className="flex items-start gap-4 mb-4">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-cyan-500/50 flex-shrink-0">
                                    {agent.agent_zk_photo ? (
                                      <img src={agent.agent_zk_photo} alt={agent.username} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                        <Shield className="w-8 h-8 text-cyan-400" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-lg mb-1 truncate group-hover:text-cyan-400 transition-colors">
                                      {agent.username || "Agent"}
                                    </h3>
                                    <code className="text-xs text-cyan-400 font-mono">
                                      {agent.agent_zk_id}
                                    </code>
                                  </div>
                                </div>

                                {agent.bio && (
                                  <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                                    {agent.bio}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    <RoleIcon className="w-4 h-4 text-purple-400" />
                                  </div>
                                  <span className="text-sm text-gray-400">{agent.role || "Developer"}</span>
                                </div>

                                {agent.skills && agent.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-4">
                                    {agent.skills.slice(0, 3).map((skill, idx) => (
                                      <Badge key={idx} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {agent.skills.length > 3 && (
                                      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                        +{agent.skills.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      <span>{agent.verification_count || 0}</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${
                                      agent.availability === 'available' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                                    }`} />
                                  </div>

                                  {connectionStatus && !isOwnProfile && (
                                    <Badge className={
                                      connectionStatus === 'accepted'
                                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                        : connectionStatus === 'pending'
                                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }>
                                      {connectionStatus === 'accepted' ? 'Friend' : connectionStatus}
                                    </Badge>
                                  )}
                                </div>
                                
                                {isHighlighted && !isOwnProfile && (
                                  <Link to={createPageUrl('AgentZKChat') + `?targetAddress=${agent.wallet_address}&targetName=${encodeURIComponent(agent.username)}`}>
                                    <Button className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" onClick={(e) => e.stopPropagation()}>
                                      <MessageCircle className="w-4 h-4 mr-2" />
                                      Message About Job
                                    </Button>
                                  </Link>
                                )}
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
          </motion.div>
        </div>
      </div>

      {showIDCard && selectedAgent && (
        <IDCard 
          profile={selectedAgent}
          onClose={() => {
            setShowIDCard(false);
            setSelectedAgent(null);
          }}
        />
      )}
    </div>
  );
}