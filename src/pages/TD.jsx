import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Loader2, Heart, TrendingUp, Sparkles, History, Plus, MessageCircle, BarChart3, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TDPage() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [view, setView] = useState('chat'); // chat, sessions, insights
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
    loadSessions();
    loadInsights();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user:', err);
      base44.auth.redirectToLogin();
    }
  };

  const loadSessions = async () => {
    try {
      const userSessions = await base44.entities.TherapySession.list('-created_date', 50);
      setSessions(userSessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadInsights = async () => {
    try {
      const allInsights = await base44.entities.TherapyInsight.list('-success_rate', 20);
      setInsights(allInsights);
    } catch (err) {
      console.error('Failed to load insights:', err);
    }
  };

  const startNewSession = () => {
    setActiveSession(null);
    setMessages([]);
    setView('chat');
  };

  const loadSession = (session) => {
    setActiveSession(session);
    setMessages(session.messages || []);
    setView('chat');
  };

  const deleteSession = async (sessionId) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    
    try {
      await base44.entities.TherapySession.delete(sessionId);
      await loadSessions();
      if (activeSession?.id === sessionId) {
        startNewSession();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await base44.functions.invoke('therapyAI', {
        message: userMessage.content,
        sessionId: activeSession?.id
      });

      if (response.data) {
        const therapistMessage = {
          role: 'therapist',
          content: response.data.response,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, therapistMessage]);

        // If new session created, reload
        if (response.data.sessionId && !activeSession) {
          await loadSessions();
          const newSession = await base44.entities.TherapySession.filter({ id: response.data.sessionId });
          if (newSession.length > 0) {
            setActiveSession(newSession[0]);
          }
        }

        // Reload insights if new ones were added
        await loadInsights();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = {
        role: 'therapist',
        content: "I apologize, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionalColor = (state) => {
    const colors = {
      'anxious': 'text-yellow-400',
      'depressed': 'text-blue-400',
      'stressed': 'text-red-400',
      'calm': 'text-green-400',
      'hopeful': 'text-cyan-400',
      'neutral': 'text-gray-400'
    };
    return colors[state?.toLowerCase()] || 'text-purple-400';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 flex flex-col pt-32">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex-shrink-0"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Therapy Day</h1>
                <p className="text-white/50 text-xs">AI Therapist</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => setView('chat')}
                variant={view === 'chat' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 ${view === 'chat' ? 'bg-purple-500 hover:bg-purple-600' : 'text-white/60 hover:bg-white/10'}`}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                <span className="text-xs">Chat</span>
              </Button>
              <Button
                onClick={() => setView('sessions')}
                variant={view === 'sessions' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 ${view === 'sessions' ? 'bg-purple-500 hover:bg-purple-600' : 'text-white/60 hover:bg-white/10'}`}
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                <span className="text-xs">History</span>
              </Button>
            </div>
          </div>

          {activeSession && view === 'chat' && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-semibold truncate">{activeSession.session_title}</h3>
                  {activeSession.emotional_state && (
                    <p className={`text-xs mt-0.5 ${getEmotionalColor(activeSession.emotional_state)}`}>
                      {activeSession.emotional_state}
                    </p>
                  )}
                </div>
                {activeSession.progress_score && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-white text-sm font-bold">{activeSession.progress_score}/10</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Views */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid md:grid-cols-[220px_1fr] gap-3 h-full"
                >
                {/* Sidebar */}
                <div className="hidden md:block">
                  <Button
                    onClick={startNewSession}
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 mb-3 h-9 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    New Session
                  </Button>
                  <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className={`w-full text-left p-2 rounded-lg border transition-all ${
                        activeSession?.id === session.id
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-white text-xs font-semibold truncate">
                        {session.session_title}
                      </div>
                      <div className="text-white/40 text-[10px] mt-0.5">
                        {new Date(session.created_date).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="bg-black/40 border border-white/10 rounded-xl flex flex-col h-full overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                      <h3 className="text-white text-lg font-bold mb-2">Welcome</h3>
                      <p className="text-white/60 text-sm max-w-md mx-auto mb-4">
                        I'm here to listen and support you. Share what's on your mind.
                      </p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300 text-xs">
                          Anxiety
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-300 text-xs">
                          Depression
                        </Badge>
                        <Badge variant="outline" className="bg-pink-500/10 border-pink-500/30 text-pink-300 text-xs">
                          Relationships
                        </Badge>
                        <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-300 text-xs">
                          Stress
                        </Badge>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'therapist' && (
                        <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Heart className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-xl p-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}>
                        <p className="text-white text-xs leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <p className="text-white/60 text-xs">Thinking...</p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/10">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                      placeholder="Share what's on your mind..."
                      className="flex-1 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/40 min-h-[50px] max-h-[100px] resize-none"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-[50px] px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

            {view === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto"
              >
              {sessions.map((session) => (
                <div key={session.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-bold text-lg">{session.session_title}</h3>
                    <Button
                      onClick={() => deleteSession(session.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-auto p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    {new Date(session.created_date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                  {session.emotional_state && (
                    <Badge className={`mb-3 ${getEmotionalColor(session.emotional_state)} bg-white/5`}>
                      {session.emotional_state}
                    </Badge>
                  )}
                  {session.key_topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {session.key_topics.slice(0, 3).map((topic, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-white/5 border-white/20">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-white/40" />
                      <span className="text-white/60 text-sm">{session.messages?.length || 0} messages</span>
                    </div>
                    {session.progress_score && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-white font-bold text-sm">{session.progress_score}/10</span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => loadSession(session)}
                    className="w-full mt-4 bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
                  >
                    Continue Session
                  </Button>
                </div>
              ))}
            </motion.div>
          )}

            {view === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 h-full overflow-y-auto"
              >
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-white text-xl font-bold">Learned Insights</h2>
                </div>
                <p className="text-white/70 text-sm">
                  Our AI continuously learns from thousands of therapy sessions to provide better support. Here are patterns and approaches that have helped others.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <Badge className="mb-3 bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {insight.insight_category}
                    </Badge>
                    <h4 className="text-white font-semibold mb-2">{insight.pattern_detected}</h4>
                    <p className="text-white/60 text-sm mb-4">{insight.therapeutic_approach}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-white/40">Success Rate:</span>
                          <span className="text-green-400 font-bold ml-1">{insight.success_rate}%</span>
                        </div>
                        <div>
                          <span className="text-white/40">Applied:</span>
                          <span className="text-cyan-400 font-bold ml-1">{insight.times_applied}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}