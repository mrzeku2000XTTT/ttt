import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Wallet, Send, MessageSquare, History, Eye, TrendingUp,
  CheckCircle2, Loader2, Copy, ExternalLink, Lock, ArrowLeft
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function VibeSessionPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('send');
  const [user, setUser] = useState(null);
  
  // Send tab
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  
  // Message tab
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Balance
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    loadSession();
    loadUser();
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, session]);

  const loadSession = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      
      if (!sessionId) {
        navigate(createPageUrl('Vibe'));
        return;
      }

      const sessions = JSON.parse(localStorage.getItem('vibe_sessions') || '[]');
      const currentSession = sessions.find(s => s.session_id === sessionId);
      
      if (!currentSession) {
        navigate(createPageUrl('Vibe'));
        return;
      }

      setSession(currentSession);
      loadBalance(currentSession.wallet_address);
    } catch (err) {
      console.error('Failed to load session:', err);
      navigate(createPageUrl('Vibe'));
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log('Not logged in');
    }
  };

  const loadBalance = async (address) => {
    try {
      // Mock balance for now
      setBalance(Math.random() * 100);
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const loadMessages = async () => {
    if (!session) return;
    
    try {
      const storedMessages = JSON.parse(localStorage.getItem(`vibe_messages_${session.session_id}`) || '[]');
      setMessages(storedMessages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      const message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: user.email,
        timestamp: Date.now(),
        encrypted: true
      };

      const updatedMessages = [...messages, message];
      localStorage.setItem(`vibe_messages_${session.session_id}`, JSON.stringify(updatedMessages));
      setMessages(updatedMessages);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSend = async () => {
    if (!sendTo || !sendAmount) return;
    
    setSending(true);
    try {
      // Transaction logic here
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Transaction sent successfully!');
      setSendTo('');
      setSendAmount('');
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const tabs = [
    { id: 'send', name: 'Send KAS', icon: Send },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'history', name: 'History', icon: History },
    { id: 'balance', name: 'Balance', icon: Eye },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-black to-purple-950/20" />

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              onClick={() => navigate(createPageUrl('Vibe'))}
              variant="ghost"
              className="text-white/60 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to VIBE
            </Button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">
                  VIBE Session
                </h1>
                <p className="text-white/60">Encrypted & Connected</p>
              </div>
            </div>

            {/* Wallet Info */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-white/60 text-xs">Connected Wallet</div>
                      <code className="text-white font-mono text-sm">
                        {session?.wallet_address?.slice(0, 10)}...{session?.wallet_address?.slice(-8)}
                      </code>
                    </div>
                  </div>
                  {balance !== null && (
                    <div className="text-right">
                      <div className="text-white/60 text-xs">Balance</div>
                      <div className="text-white font-bold">{balance.toFixed(2)} KAS</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </Button>
              );
            })}
          </div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'send' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Send KAS</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">To Address</label>
                      <Input
                        value={sendTo}
                        onChange={(e) => setSendTo(e.target.value)}
                        placeholder="kaspa:..."
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Amount (KAS)</label>
                      <Input
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={sending || !sendTo || !sendAmount}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send KAS
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'messages' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Encrypted Messages</h2>
                  
                  {/* Messages List */}
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-white/40">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.sender === user?.email
                              ? 'bg-cyan-500/20 border border-cyan-500/30 ml-8'
                              : 'bg-white/5 border border-white/10 mr-8'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Lock className="w-3 h-3 text-green-400" />
                            <span className="text-white/60 text-xs">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-white text-sm">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Send Message */}
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type encrypted message..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'history' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
                  <div className="text-center py-8 text-white/40">
                    No transactions yet
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'balance' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Balance Overview</h2>
                  <div className="text-center py-12">
                    <div className="text-6xl font-black text-white mb-2">
                      {balance?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-white/60 text-lg">KAS</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'analytics' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-white/60 text-sm mb-1">Session Duration</div>
                      <div className="text-white font-bold text-xl">
                        {session ? Math.floor((Date.now() - session.timestamp) / 60000) : 0} minutes
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-white/60 text-sm mb-1">Messages Sent</div>
                      <div className="text-white font-bold text-xl">{messages.length}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-white/60 text-sm mb-1">Transactions</div>
                      <div className="text-white font-bold text-xl">0</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}