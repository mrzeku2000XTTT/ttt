import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, Shield, Radio, Send, Loader2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function MachinePage() {
  const [time, setTime] = useState(new Date());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [threatProfile, setThreatProfile] = useState({
    nuclear: 45,
    economic: 78,
    natural: 30,
    prophetic: 62
  });
  const [readinessScore, setReadinessScore] = useState(62);
  const [liveThreats, setLiveThreats] = useState([]);
  const [loadingThreats, setLoadingThreats] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    loadThreats();
    const threatTimer = setInterval(loadThreats, 300000); // Refresh every 5 mins
    return () => {
      clearInterval(timer);
      clearInterval(threatTimer);
    };
  }, []);

  const loadThreats = async () => {
    try {
      setLoadingThreats(true);
      const response = await base44.functions.invoke('fetchThreatIntel');
      if (response.data.threats) {
        setLiveThreats(response.data.threats);
        
        // Update threat profile based on real data
        const nuclear = response.data.threats.find(t => t.threat_type === 'nuclear');
        const economic = response.data.threats.find(t => t.threat_type === 'economic');
        const natural = response.data.threats.find(t => t.threat_type === 'natural');
        const prophetic = response.data.threats.find(t => t.threat_type === 'prophetic');
        
        setThreatProfile({
          nuclear: nuclear ? (nuclear.severity === 'critical' ? 95 : nuclear.severity === 'high' ? 75 : nuclear.severity === 'medium' ? 50 : 25) : 45,
          economic: economic ? (economic.severity === 'critical' ? 95 : economic.severity === 'high' ? 75 : economic.severity === 'medium' ? 50 : 25) : 78,
          natural: natural ? (natural.severity === 'critical' ? 95 : natural.severity === 'high' ? 75 : natural.severity === 'medium' ? 50 : 25) : 30,
          prophetic: prophetic ? (prophetic.severity === 'critical' ? 95 : prophetic.severity === 'high' ? 75 : prophetic.severity === 'medium' ? 50 : 25) : 62
        });
      }
    } catch (error) {
      console.error('Failed to load threats:', error);
    } finally {
      setLoadingThreats(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await base44.functions.invoke('survivalAI', {
        message: input,
        conversationId: conversationId
      });

      setConversationId(response.data.conversationId);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.data.message 
      }]);
      setThreatProfile(response.data.threatProfile);
      setReadinessScore(response.data.readinessScore);
    } catch (error) {
      console.error("AI error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "System error. Try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const threats = [
    { label: "Nuclear", level: "MEDIUM", value: threatProfile.nuclear, color: "bg-yellow-500" },
    { label: "Economic", level: "HIGH", value: threatProfile.economic, color: "bg-red-500" },
    { label: "Natural", level: "LOW", value: threatProfile.natural, color: "bg-green-500" },
    { label: "Prophetic", level: "ELEVATED", value: threatProfile.prophetic, color: "bg-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-400/5 via-gray-500/10 to-gray-600/5" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Link to={createPageUrl("Gate")}>
          <Button variant="ghost" className="mb-8 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gate
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-500/20">
            <Activity className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-300 to-gray-500 mb-3 tracking-tight">
            MACHINE
          </h1>
          <p className="text-gray-500 text-lg">EndTimes Survival AI</p>
          <p className="text-gray-600 text-sm mt-2">{time.toLocaleString()}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Threat Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6 overflow-hidden"
          >
            {/* Background Image */}
            <div className="absolute inset-0 opacity-5">
              <img 
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80" 
                alt="Global Network"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-gray-400" />
                  <h2 className="text-xl font-bold text-gray-300">LIVE THREATS</h2>
                </div>
                {loadingThreats && (
                  <span className="text-xs text-gray-500 animate-pulse">Updating...</span>
                )}
              </div>

              <div className="space-y-4 mb-6">
                {threats.map((threat, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400 text-sm font-semibold">{threat.label}</span>
                      <span className={`text-xs font-bold ${threat.color.replace('bg-', 'text-')}`}>
                        {threat.level}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${threat.value}%` }}
                        transition={{ delay: i * 0.1, duration: 0.8 }}
                        className={`h-full ${threat.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Threat Details */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {liveThreats.map((threat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase ${
                        threat.severity === 'critical' ? 'text-red-400' :
                        threat.severity === 'high' ? 'text-orange-400' :
                        threat.severity === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {threat.threat_type}
                      </span>
                      <span className="text-xs text-gray-500">{threat.confidence}% conf</span>
                    </div>
                    <p className="text-xs text-gray-300 font-semibold mb-1">{threat.title}</p>
                    <p className="text-xs text-gray-500">{threat.description}</p>
                    {threat.source && (
                      <p className="text-xs text-gray-600 mt-1">Source: {threat.source}</p>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Readiness</span>
                  <span className="text-2xl font-bold text-gray-300">{readinessScore}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${readinessScore}%` }}
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                  />
                </div>
              </div>

              {/* External Resources */}
              <div className="mt-6 space-y-2">
                <p className="text-xs text-gray-500 font-semibold mb-2">MONITOR SOURCES:</p>
                <a 
                  href="https://earthquake.usgs.gov/earthquakes/map/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-gray-400 hover:text-gray-200 underline"
                >
                  → USGS Earthquake Map
                </a>
                <a 
                  href="https://www.defconlevel.com/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-gray-400 hover:text-gray-200 underline"
                >
                  → DEFCON Warning System
                </a>
                <a 
                  href="https://www.kaspa.org" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-gray-400 hover:text-gray-200 underline"
                >
                  → Kaspa Network Status
                </a>
              </div>
            </div>
          </motion.div>

          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl flex flex-col h-[600px] overflow-hidden relative"
          >
            {/* Background Image */}
            <div className="absolute inset-0 opacity-5">
              <img 
                src="https://images.unsplash.com/photo-1484589065579-248aad0d8b13?w=800&q=80" 
                alt="AI Network"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3 p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Radio className="w-6 h-6 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-300">AI WATCHMAN</h2>
              </div>
              <Button
                onClick={loadThreats}
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Refresh Intel
              </Button>
            </div>

            {/* Messages */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-12">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden border border-gray-700">
                    <img 
                      src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80" 
                      alt="AI Assistant"
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                  <p className="text-lg mb-2">Ask me anything about survival, threats, or prophecy</p>
                  <p className="text-sm mb-4">Try: "What should I do to prepare?" or "What does Revelation say?"</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <button
                      onClick={() => setInput("What's the current nuclear threat level?")}
                      className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg border border-gray-700"
                    >
                      Nuclear Status?
                    </button>
                    <button
                      onClick={() => setInput("How do I purify water without electricity?")}
                      className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg border border-gray-700"
                    >
                      Water Purification?
                    </button>
                    <button
                      onClick={() => setInput("What does Revelation say about current events?")}
                      className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg border border-gray-700"
                    >
                      Biblical Prophecy?
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-gray-700 text-gray-200' 
                        : 'bg-gray-800/50 border border-gray-700 text-gray-300'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))
              )}
              {loading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="relative z-10 p-6 border-t border-gray-700">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask the AI watchman..."
                  className="bg-gray-800/50 border-gray-700 text-gray-200 placeholder:text-gray-600"
                  disabled={loading}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                <Shield className="w-3 h-3" />
                <span>Encrypted • Real-time intel • Biblical guidance</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}