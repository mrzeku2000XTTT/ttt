import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2, User as UserIcon, AlertTriangle, Copy, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import moment from "moment";

export default function Area51Page() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log("Guest user");
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.Area51Message.list("-created_date", 50);
      setMessages(msgs.reverse());
      setLoading(false);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const triggerAI = async (userMessage) => {
    setAiThinking(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AGENT X - a conspiracy theory expert at AREA51. Someone just said: "${userMessage}". 
        
Respond with a conspiracy theory perspective (serious or humorous). Keep it under 150 words. 
Topics can include: aliens, government secrets, shadow organizations, hidden technology, etc.`,
        add_context_from_internet: false
      });

      await base44.entities.Area51Message.create({
        message: response,
        sender_username: "AGENT X",
        sender_email: "ai@area51.gov",
        message_type: "ai",
        is_ai: true
      });

      loadMessages();
    } catch (error) {
      console.error("AI failed:", error);
    } finally {
      setAiThinking(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setSending(true);
    try {
      await base44.entities.Area51Message.create({
        message: messageContent,
        sender_username: user.username || user.email?.split('@')[0] || "Anonymous",
        sender_email: user.email,
        sender_wallet: user.created_wallet_address,
        message_type: "text",
        is_ai: false
      });
      setNewMessage("");
      loadMessages();

      // Trigger AI 30% of the time or if message contains keywords
      const keywords = ['alien', 'ufo', 'government', 'conspiracy', 'area51', 'secret', 'truth', 'cover'];
      const hasKeyword = keywords.some(kw => messageContent.toLowerCase().includes(kw));
      if (hasKeyword || Math.random() < 0.3) {
        setTimeout(() => triggerAI(messageContent), 2000);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden z-50">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black to-cyan-900/20" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)`
          }}
        />
        {/* Animated Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 3 }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[150px]"
        />
      </div>

      {/* Header - Fixed */}
      <div className="flex-none bg-black/60 backdrop-blur-xl border-b border-green-500/20 p-4 flex items-center gap-4 z-20">
        <Link to={createPageUrl("Gate")}>
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-green-400 hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
            AREA 51
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">Classified Chat Network</p>
          </div>
        </div>
        {aiThinking && (
          <div className="ml-auto flex items-center gap-2 text-green-400 text-xs animate-pulse">
            <Sparkles className="w-3 h-3" />
            <span>AGENT X typing...</span>
          </div>
        )}
      </div>

      {/* Chat Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide z-10 relative">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full gap-4">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            <p className="text-white/40 text-sm animate-pulse">Decrypting classified channel...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <AlertTriangle className="w-10 h-10 text-green-500/50" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white/80">No transmissions yet</p>
              <p className="text-sm text-white/40">Share your theories. The truth is out there.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 pb-4">
            {messages.map((msg) => {
              const isMe = user && msg.sender_email === user.email;
              const isAI = msg.is_ai === true;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} group`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    isAI
                      ? "bg-green-500/30 border-green-400/50 shadow-lg shadow-green-500/20"
                      : isMe 
                      ? "bg-cyan-500/20 border-cyan-500/30" 
                      : "bg-white/10 border-white/10"
                  }`}>
                    {isAI ? (
                      <Sparkles className="w-4 h-4 text-green-400" />
                    ) : (
                      <UserIcon className={`w-4 h-4 ${isMe ? "text-cyan-400" : "text-white/60"}`} />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%]`}>
                    <div className="flex items-center gap-2 mb-1 px-1 flex-wrap">
                      <span className={`text-xs font-bold ${
                        isAI ? "text-green-400" : isMe ? "text-cyan-400" : "text-white/70"
                      }`}>
                        {msg.sender_username}
                      </span>
                      {isAI && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                          AI AGENT
                        </span>
                      )}
                      {msg.sender_wallet && !isAI && (
                        <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5 border border-white/5">
                          <span className="text-[10px] font-mono text-white/40">
                            {msg.sender_wallet.substring(0, 4)}...{msg.sender_wallet.substring(msg.sender_wallet.length - 4)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(msg.sender_wallet);
                            }}
                            className="text-white/20 hover:text-green-400 transition-colors"
                            title="Copy Address"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                      <span className="text-[10px] text-white/30">
                        {moment(msg.created_date).utc().format('HH:mm')} UTC
                      </span>
                    </div>
                    
                    <div className={`px-4 py-2.5 rounded-2xl backdrop-blur-sm ${
                      isAI
                        ? "bg-gradient-to-br from-green-600/30 to-cyan-600/30 border border-green-500/30 text-white shadow-lg shadow-green-900/20 rounded-tl-none"
                        : isMe 
                        ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20 rounded-tr-none" 
                        : "bg-white/10 border border-white/10 text-white/90 rounded-tl-none hover:bg-white/15 transition-colors"
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed */}
      <div className="flex-none p-4 bg-black/80 backdrop-blur-xl border-t border-green-500/20 z-20">
        <div className="max-w-4xl mx-auto w-full">
          {user ? (
            <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
              <div className="relative flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share your conspiracy theories..."
                  className="bg-white/5 border-green-500/20 text-white placeholder:text-white/30 focus:border-green-500/50 min-h-[44px] py-2 pr-10 rounded-xl"
                  disabled={sending || aiThinking}
                  autoComplete="off"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || sending || aiThinking}
                className={`h-11 w-11 rounded-xl bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-black shadow-lg shadow-green-900/20 transition-all ${
                  sending ? 'opacity-80' : 'hover:scale-105'
                }`}
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-green-500/20 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Clearance Required</p>
                  <p className="text-xs text-white/50">Sign in to access classified chat</p>
                </div>
              </div>
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                size="sm"
                className="bg-green-500 text-black hover:bg-green-400 font-bold"
              >
                Login
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}