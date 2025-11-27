
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  TrendingUp,
  Users,
  ArrowUpDown,
  Loader2,
  Zap,
  CheckCircle2,
  Key,
  Copy,
  Shield,
  Bot,
  Search,
  User as UserIcon,
  RefreshCw,
  Plus,
  Eye,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function HubPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalTrades: 0,
    totalBridgeTransactions: 0,
    activeListings: 0,
    completedTrades: 0,
    totalAgents: 0,
    totalAccessCodes: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Agent ZK Management
  const [agentProfiles, setAgentProfiles] = useState([]);
  const [accessCodes, setAccessCodes] = useState([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [newCodeKaspaAddress, setNewCodeKaspaAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeTab, setActiveTab] = useState('platform');
  
  // Platform Status
  const [platformHealth, setPlatformHealth] = useState(null);
  const [isPingingHealth, setIsPingingHealth] = useState(false);
  const [healthError, setHealthError] = useState(null);

  // Health endpoint URL
  const HEALTH_ENDPOINT = 'https://nodejs-TTT.replit.app/health';

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();

      if (!currentUser || currentUser.role !== 'admin') {
        navigate(createPageUrl("Home"));
        return;
      }

      setUser(currentUser);
      await loadAllData();
    } catch (error) {
      console.error('Failed to check admin access:', error);
      navigate(createPageUrl("Home"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      // Use regular entities API - admin users can see everything via RLS
      const [users, listings, trades, bridgeTransactions, agents, codes] = await Promise.all([
        base44.entities.User.list().catch(() => []), // Fallback to empty array if fails
        base44.entities.Listing.list(),
        base44.entities.Trade.list(),
        base44.entities.BridgeTransaction.list(),
        base44.entities.AgentZKProfile.list('-created_date'),
        base44.entities.AgentZKAccessCode.list('-created_date')
      ]);

      setStats({
        totalUsers: users.length,
        totalListings: listings.length,
        totalTrades: trades.length,
        totalBridgeTransactions: bridgeTransactions.length,
        activeListings: listings.filter(l => l.status === 'open').length,
        completedTrades: trades.filter(t => t.status === 'completed').length,
        totalAgents: agents.length,
        totalAccessCodes: codes.length
      });

      setAgentProfiles(agents);
      setAccessCodes(codes);

      console.log('✅ Loaded', agents.length, 'Agent ZK profiles');
      console.log('🔑 Loaded', codes.length, 'access codes');
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const pingHealthEndpoint = async () => {
    setIsPingingHealth(true);
    setHealthError(null);
    
    try {
      console.log('📡 Pinging health endpoint:', HEALTH_ENDPOINT);
      const response = await fetch(HEALTH_ENDPOINT);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setPlatformHealth({
        ...data,
        lastChecked: new Date().toISOString()
      });
      
      console.log('✅ Health check successful:', data);
    } catch (err) {
      console.error('❌ Health check failed:', err);
      setHealthError(err.message);
      setPlatformHealth(null);
    } finally {
      setIsPingingHealth(false);
    }
  };

  const handleGenerateAccessCode = async () => {
    if (!newCodeKaspaAddress.trim()) {
      alert('Please enter a Kaspa address');
      return;
    }

    if (!newCodeKaspaAddress.startsWith('kaspa:')) {
      alert('Address must start with "kaspa:"');
      return;
    }

    setIsGeneratingCode(true);
    try {
      const timestamp = Date.now().toString().slice(-5);
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const generatedCode = `AGENTZK-${randomPart}-${timestamp}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      console.log('🔑 Creating access code:', generatedCode);
      console.log('👤 Admin:', user.email);
      console.log('📍 For address:', newCodeKaspaAddress.trim());

      // Use regular entities API - RLS now allows creation
      const newCode = await base44.entities.AgentZKAccessCode.create({
        access_code: generatedCode,
        kaspa_address: newCodeKaspaAddress.trim(),
        created_by_admin: user.email,
        expires_at: expiresAt.toISOString(),
        max_uses: 1,
        use_count: 0,
        is_used: false
      });

      console.log('✅ Access code created:', newCode);

      setNewCodeKaspaAddress('');
      await loadAllData();
      
      navigator.clipboard.writeText(generatedCode);
      alert(`✅ Access code generated and copied!\n\nCode: ${generatedCode}\nFor: ${newCodeKaspaAddress.trim().substring(0, 30)}...`);

    } catch (err) {
      console.error('❌ Failed to generate access code:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        user: user?.email,
        isAdmin: user?.role === 'admin'
      });
      alert('Failed to generate access code: ' + err.message + '\n\nCheck console for details.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) {
      alert('Please enter a Kaspa address');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const profiles = await base44.entities.AgentZKProfile.filter({
        wallet_address: searchAddress.trim()
      });

      if (profiles.length > 0) {
        const profile = profiles[0];
        
        // Try to get user data - may fail if not admin
        let userData = null;
        try {
          const users = await base44.entities.User.filter({
            email: profile.user_email
          });
          userData = users.length > 0 ? users[0] : null;
        } catch (e) {
          console.log('Could not load user data:', e);
        }

        setSearchResult({
          profile: profile,
          user: userData,
          found: true
        });
      } else {
        setSearchResult({
          found: false,
          address: searchAddress.trim()
        });
      }
    } catch (err) {
      console.error('Search failed:', err);
      alert('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Admin Hub
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Platform Control & Agent ZK Management
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-1.5 mb-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('platform')}
                className={`px-6 py-2.5 rounded-lg transition-all text-sm font-semibold whitespace-nowrap ${
                  activeTab === 'platform'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Platform Status
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-2.5 rounded-lg transition-all text-sm font-semibold whitespace-nowrap ${
                  activeTab === 'stats'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Platform Stats
              </button>
              
              <button
                onClick={() => setActiveTab('agents')}
                className={`px-6 py-2.5 rounded-lg transition-all text-sm font-semibold whitespace-nowrap ${
                  activeTab === 'agents'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bot className="w-4 h-4 inline mr-2" />
                Agent ZK ({stats.totalAgents})
              </button>
              
              <button
                onClick={() => setActiveTab('codes')}
                className={`px-6 py-2.5 rounded-lg transition-all text-sm font-semibold whitespace-nowrap ${
                  activeTab === 'codes'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Key className="w-4 h-4 inline mr-2" />
                Access Codes ({stats.totalAccessCodes})
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === 'platform' && (
              <motion.div
                key="platform"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Health Status Card */}
                <Card className="bg-zinc-950/80 backdrop-blur-xl border-cyan-500/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6 text-cyan-400" />
                        <div>
                          <h3 className="text-xl font-bold text-white">Platform Health Monitor</h3>
                          <p className="text-sm text-gray-400">
                            <code className="text-cyan-400 text-xs">{HEALTH_ENDPOINT}</code>
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={pingHealthEndpoint}
                        disabled={isPingingHealth}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        {isPingingHealth ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Ping Health
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {healthError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4"
                      >
                        <p className="text-red-300 text-sm">❌ Health check failed: {healthError}</p>
                        <p className="text-xs text-red-400 mt-2">
                          Make sure the server is running and accessible at <code className="bg-black/40 px-2 py-1 rounded">{HEALTH_ENDPOINT}</code>
                        </p>
                      </motion.div>
                    )}

                    {platformHealth ? (
                      <div className="space-y-4">
                        {/* Status Badge */}
                        <div className="flex items-center gap-3">
                          <Badge className={
                            platformHealth.status === 'healthy'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30 text-lg px-4 py-2'
                              : 'bg-red-500/20 text-red-300 border-red-500/30 text-lg px-4 py-2'
                          }>
                            {platformHealth.status === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Last checked: {new Date(platformHealth.lastChecked).toLocaleString()}
                          </span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Kaspa Node */}
                          <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Activity className="w-5 h-5 text-cyan-400" />
                              <h4 className="text-white font-semibold">Kaspa Node</h4>
                            </div>
                            <Badge className={
                              platformHealth.kaspaNode === 'connected'
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : 'bg-red-500/20 text-red-300 border-red-500/30'
                            }>
                              {platformHealth.kaspaNode === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
                            </Badge>
                          </div>

                          {/* Uptime */}
                          <div className="bg-black/40 border border-purple-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Zap className="w-5 h-5 text-purple-400" />
                              <h4 className="text-white font-semibold">Server Uptime</h4>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                              {platformHealth.uptime?.formatted || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Since: {platformHealth.uptime?.since ? new Date(platformHealth.uptime.since).toLocaleString() : 'N/A'}
                            </div>
                          </div>

                          {/* Server Info */}
                          <div className="bg-black/40 border border-blue-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Activity className="w-5 h-5 text-blue-400" />
                              <h4 className="text-white font-semibold">Server</h4>
                            </div>
                            <div className="text-sm text-gray-300 space-y-1">
                              <div>Port: {platformHealth.server?.port || 'N/A'}</div>
                              <div>Node: {platformHealth.server?.nodeVersion || 'N/A'}</div>
                              <div>Memory: {platformHealth.server?.memory?.heapUsed || 'N/A'} / {platformHealth.server?.memory?.heapTotal || 'N/A'}</div>
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Activity className="w-5 h-5 text-yellow-400" />
                              <h4 className="text-white font-semibold">Last Response</h4>
                            </div>
                            <div className="text-sm text-gray-300">
                              {platformHealth.timestamp ? new Date(platformHealth.timestamp).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Raw JSON (collapsible) */}
                        <details className="bg-black/40 border border-white/10 rounded-lg p-4">
                          <summary className="text-white font-semibold cursor-pointer mb-2">
                            View Raw Response
                          </summary>
                          <pre className="text-xs text-gray-400 overflow-auto bg-black/60 p-3 rounded">
                            {JSON.stringify(platformHealth, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Activity className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Click "Ping Health" to check platform status</p>
                        <p className="text-xs text-gray-600">
                          Endpoint: <code className="bg-black/40 px-2 py-1 rounded text-cyan-400">{HEALTH_ENDPOINT}</code>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats Overview */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Total Users</div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                  </div>

                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Agent ZK</div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.totalAgents}</div>
                  </div>

                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Access Codes</div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.totalAccessCodes}</div>
                  </div>

                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <ArrowUpDown className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Bridge Txns</div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.totalBridgeTransactions}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Total Users</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                  <div className="text-xs text-gray-600 mt-1">Registered</div>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Total Listings</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalListings}</div>
                  <div className="text-xs text-gray-600 mt-1">Created</div>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Active Listings</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.activeListings}</div>
                  <div className="text-xs text-gray-600 mt-1">Currently open</div>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <ArrowUpDown className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Total Trades</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
                  <div className="text-xs text-gray-600 mt-1">Initiated</div>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-lime-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-lime-400" />
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Completed Trades</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.completedTrades}</div>
                  <div className="text-xs text-gray-600 mt-1">Successfully done</div>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Bridge Txns</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalBridgeTransactions}</div>
                  <div className="text-xs text-gray-600 mt-1">Processed</div>
                </div>
              </motion.div>
            )}

            {activeTab === 'agents' && (
              <motion.div
                key="agents"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Address Search */}
                <Card className="bg-zinc-950/80 backdrop-blur-xl border-purple-500/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Search className="w-6 h-6 text-purple-400" />
                      <div>
                        <h3 className="text-xl font-bold text-white">Search Agent by Address</h3>
                        <p className="text-sm text-gray-400">Find Agent ZK profiles by Kaspa address</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3 mb-4">
                      <Input
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        placeholder="kaspa:qqq..."
                        className="flex-1 bg-black border-purple-500/30 text-white font-mono"
                      />
                      <Button
                        onClick={handleSearchAddress}
                        disabled={isSearching || !searchAddress.trim()}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>

                    {searchResult && (
                      <AnimatePresence>
                        {searchResult.found ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                                  <span className="text-white font-bold">{searchResult.profile.username}</span>
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                    {searchResult.profile.agent_zk_id}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-300 mb-2">{searchResult.profile.bio}</div>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <div>Email: {searchResult.profile.user_email}</div>
                                  <div>Role: {searchResult.profile.role}</div>
                                  <div>Skills: {searchResult.profile.skills?.slice(0, 3).join(', ')}</div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link to={createPageUrl("AgentMessages") + "?targetAddress=" + encodeURIComponent(searchResult.profile.wallet_address)}>
                                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Message
                                  </Button>
                                </Link>
                                <Link to={createPageUrl("AgentZKProfile") + "?address=" + encodeURIComponent(searchResult.profile.wallet_address)}>
                                  <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center"
                          >
                            <p className="text-red-300 text-sm">No Agent ZK profile found for this address</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>

                {/* Agent Profiles List */}
                <Card className="bg-zinc-950/80 backdrop-blur-xl border-purple-500/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bot className="w-6 h-6 text-purple-400" />
                        <div>
                          <h3 className="text-xl font-bold text-white">Agent ZK Directory</h3> {/* Updated title */}
                          <p className="text-sm text-gray-400">{agentProfiles.length} active agents</p>
                        </div>
                      </div>
                      <Button
                        onClick={loadAllData}
                        size="sm"
                        variant="outline"
                        className="border-purple-500/30 text-purple-400"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {agentProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="bg-black/40 border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-cyan-500/50 flex-shrink-0">
                                {profile.agent_zk_photo ? (
                                  <img src={profile.agent_zk_photo} alt={profile.username} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-cyan-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white font-bold">{profile.username}</h4>
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                    {profile.agent_zk_id}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-400 mb-2 line-clamp-2">{profile.bio}</div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                                    {profile.role}
                                  </Badge>
                                  <code className="text-xs text-gray-500">
                                    {profile.wallet_address?.substring(0, 20)}...
                                  </code>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2"> {/* Added div for button grouping */}
                              <Link to={createPageUrl("AgentMessages") + "?targetAddress=" + encodeURIComponent(profile.wallet_address)}>
                                <Button size="sm" className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30">
                                  <MessageSquare className="w-4 h-4" /> {/* Message button */}
                                </Button>
                              </Link>
                              <Link to={createPageUrl("AgentZKProfile") + "?address=" + encodeURIComponent(profile.wallet_address)}>
                                <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'codes' && (
              <motion.div
                key="codes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Code Generator */}
                <Card className="bg-zinc-950/80 backdrop-blur-xl border-green-500/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Plus className="w-6 h-6 text-green-400" />
                      <div>
                        <h3 className="text-xl font-bold text-white">Generate Access Code</h3>
                        <p className="text-sm text-gray-400">Create code using Kaspa address</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Input
                        value={newCodeKaspaAddress}
                        onChange={(e) => setNewCodeKaspaAddress(e.target.value)}
                        placeholder="kaspa:qqq..."
                        className="flex-1 bg-black border-green-500/30 text-white font-mono"
                      />
                      <Button
                        onClick={handleGenerateAccessCode}
                        disabled={isGeneratingCode || !newCodeKaspaAddress.trim()}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        {isGeneratingCode ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Key className="w-4 h-4 mr-2" />
                        )}
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-green-400 mt-3">
                      💡 Enter the user's Kaspa wallet address to generate an access code
                    </p>
                  </CardContent>
                </Card>

                {/* Access Codes List */}
                <Card className="bg-zinc-950/80 backdrop-blur-xl border-green-500/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Key className="w-6 h-6 text-green-400" />
                        <div>
                          <h3 className="text-xl font-bold text-white">Access Codes</h3>
                          <p className="text-sm text-gray-400">{accessCodes.length} total codes</p>
                        </div>
                      </div>
                      <Button onClick={loadAllData} size="sm" variant="outline" className="border-green-500/30">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {accessCodes.length === 0 ? (
                        <div className="text-center py-12">
                          <Key className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-400">No access codes generated yet</p>
                          <p className="text-xs text-gray-600 mt-2">Create one above to get started</p>
                        </div>
                      ) : (
                        accessCodes.map((code) => {
                          const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
                          const isMaxedOut = code.max_uses && code.use_count >= code.max_uses;
                          
                          // Find associated Agent ZK profile
                          const associatedProfile = agentProfiles.find(p => 
                            p.wallet_address === code.kaspa_address || 
                            p.ttt_wallet_address === code.kaspa_address
                          );
                          
                          return (
                            <div
                              key={code.id}
                              className={`bg-black/40 border rounded-lg p-4 ${
                                code.is_used || isExpired || isMaxedOut
                                  ? 'border-gray-700/30 opacity-60'
                                  : 'border-green-500/20 hover:border-green-500/40'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <code className="text-white font-mono font-bold text-lg">
                                      {code.access_code}
                                    </code>
                                    <Button
                                      onClick={() => copyCode(code.access_code)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                                    >
                                      {copiedCode === code.access_code ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Badge className={
                                      isExpired || isMaxedOut
                                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                        : code.is_used
                                        ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                        : 'bg-green-500/20 text-green-300 border-green-500/30'
                                    }>
                                      {isExpired ? 'Expired' : isMaxedOut ? 'Max Uses' : code.is_used ? 'Used' : 'Active'}
                                    </Badge>
                                  </div>

                                  {/* Agent ZK Profile Info */}
                                  {associatedProfile ? (
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-cyan-500/50 flex-shrink-0">
                                          {associatedProfile.agent_zk_photo ? (
                                            <img src={associatedProfile.agent_zk_photo} alt={associatedProfile.username} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                              <Shield className="w-5 h-5 text-cyan-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-white font-bold text-sm">{associatedProfile.username}</span>
                                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                              {associatedProfile.agent_zk_id}
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-gray-400 mt-1">
                                            {associatedProfile.role}
                                          </div>
                                        </div>
                                        <Link to={createPageUrl("AgentZKProfile") + "?address=" + encodeURIComponent(code.kaspa_address)}>
                                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                            <ExternalLink className="w-4 h-4 text-cyan-400" />
                                          </Button>
                                        </Link>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mb-2">
                                      <p className="text-xs text-yellow-300">
                                        ⏳ Waiting for user to claim Agent ZK identity
                                      </p>
                                    </div>
                                  )}

                                  <div className="text-xs text-gray-400 space-y-1">
                                    <div>
                                      <span className="text-gray-500">Address:</span>{' '}
                                      <code className="text-cyan-400">{code.kaspa_address?.substring(0, 30)}...</code>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Created by:</span> {code.created_by_admin}
                                    </div>
                                    {code.used_by_email && (
                                      <div>
                                        <span className="text-gray-500">Used by:</span> {code.used_by_email}
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-gray-500">Uses:</span> {code.use_count}/{code.max_uses || '∞'}
                                    </div>
                                    {code.expires_at && (
                                      <div>
                                        <span className="text-gray-500">Expires:</span> {new Date(code.expires_at).toLocaleDateString()}
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-gray-500">Created:</span> {new Date(code.created_date).toLocaleDateString()} at {new Date(code.created_date).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
