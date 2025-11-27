
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Users, TrendingUp, Search, Loader2, Filter } from "lucide-react";

export default function AIAnalyticsPage() {
  const [conversations, setConversations] = useState([]);
  const [filteredConvos, setFilteredConvos] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery, filterType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        alert('Admin access required');
        return;
      }

      // Load all conversations
      const allConvos = await base44.entities.AIConversation.list('-created_date', 200);
      setConversations(allConvos);

      // Calculate stats
      const totalUsers = new Set(allConvos.map(c => c.user_email)).size;
      const topicCounts = {};
      const typeCounts = {};

      allConvos.forEach(convo => {
        convo.topics?.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
        typeCounts[convo.conversation_type] = (typeCounts[convo.conversation_type] || 0) + 1;
      });

      const topTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      setStats({
        totalConversations: allConvos.length,
        totalUsers: totalUsers,
        topTopics: topTopics,
        conversationTypes: typeCounts
      });

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterConversations = () => {
    let filtered = conversations;

    if (searchQuery) {
      filtered = filtered.filter(convo => 
        convo.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        convo.topics?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        convo.messages?.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(convo => convo.conversation_type === filterType);
    }

    setFilteredConvos(filtered);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Admin access required</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'monospace' }}>AI Analytics</h1>
                <p className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>All User Conversations & Learning Data</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
                    {stats.totalConversations}
                  </div>
                  <div className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>Total Conversations</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2" style={{ fontFamily: 'monospace' }}>
                    {stats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>Active Users</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-purple-400 mb-2" style={{ fontFamily: 'monospace' }}>
                    {stats.topTopics.length}
                  </div>
                  <div className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>Unique Topics</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-green-400 mb-2" style={{ fontFamily: 'monospace' }}>
                    {Object.keys(stats.conversationTypes).length}
                  </div>
                  <div className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>Conversation Types</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Topics */}
          {stats && (
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 mb-8">
              <CardHeader>
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  <TrendingUp className="w-5 h-5 inline mr-2" />
                  Top Trending Topics
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.topTopics.map(([topic, count], i) => (
                    <Badge
                      key={i}
                      className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-sm"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {topic} ({count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 text-white rounded-lg px-4 py-2"
              style={{ 
                fontFamily: 'monospace',
                colorScheme: 'dark'
              }}
            >
              <option value="all" className="bg-[#1a1a1a] text-white">All Types</option>
              <option value="market_analysis" className="bg-[#1a1a1a] text-white">Market Analysis</option>
              <option value="technical_help" className="bg-[#1a1a1a] text-white">Technical Help</option>
              <option value="whale_tracking" className="bg-[#1a1a1a] text-white">Whale Tracking</option>
              <option value="news" className="bg-[#1a1a1a] text-white">News</option>
              <option value="general_question" className="bg-[#1a1a1a] text-white">General</option>
            </select>

            <Button
              onClick={loadData}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Search className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Conversations List */}
          <div className="space-y-4">
            {filteredConvos.map((convo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1" style={{ fontFamily: 'monospace' }}>
                          {convo.user_email}
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30" style={{ fontFamily: 'monospace' }}>
                            {convo.conversation_type}
                          </Badge>
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30" style={{ fontFamily: 'monospace' }}>
                            {convo.sentiment}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
                        {new Date(convo.created_date).toLocaleString()}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>Topics:</div>
                      <div className="flex flex-wrap gap-2">
                        {convo.topics?.map((topic, j) => (
                          <Badge key={j} variant="outline" className="text-xs" style={{ fontFamily: 'monospace' }}>
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-gray-300" style={{ fontFamily: 'monospace' }}>
                      {convo.messages?.length} messages
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
