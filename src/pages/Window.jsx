import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, Brain, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WindowPage() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
    loadConversationHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const loadConversationHistory = async () => {
    try {
      const history = await base44.entities.AIConversation.filter({
        conversation_type: 'window_ai'
      }, '-created_date', 1);
      
      if (history.length > 0 && history[0].messages) {
        setMessages(history[0].messages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const saveConversation = async (msgs) => {
    try {
      const existing = await base44.entities.AIConversation.filter({
        conversation_type: 'window_ai'
      }, '-created_date', 1);
      
      if (existing.length > 0) {
        await base44.entities.AIConversation.update(existing[0].id, {
          messages: msgs,
          last_interaction: new Date().toISOString()
        });
      } else {
        await base44.entities.AIConversation.create({
          user_wallet_address: user?.created_wallet_address || 'anonymous',
          user_email: user?.email || 'anonymous',
          messages: msgs,
          conversation_type: 'window_ai',
          last_interaction: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  };

  const handleClearChat = async () => {
    setMessages([]);
    try {
      const existing = await base44.entities.AIConversation.filter({
        conversation_type: 'window_ai'
      }, '-created_date', 1);
      
      if (existing.length > 0) {
        await base44.entities.AIConversation.delete(existing[0].id);
      }
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check for /clear command
    if (input.trim() === '/clear') {
      handleClearChat();
      setInput("");
      return;
    }

    const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Build context from conversation history
      const conversationContext = updatedMessages.slice(-6)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Window AI'}: ${msg.content}`)
        .join('\n\n');

      // Call LLM with comprehensive context
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are TTTZ AI, the official AI assistant for TTTZ.xyz (TTT ecosystem). 

      ABOUT TTTZ.XYZ:
      TTTZ is a comprehensive Web3 platform built on Kaspa blockchain featuring:
      - TTT Feed: Social platform with encrypted posts and KAS tipping
      - Agent ZK: AI agent directory and profiles with ZK verification
      - Bridge: L1/L2 Kaspa transfers and crypto bridging
      - TTTV: Video streaming and content platform
      - DAGKnight: Multi-wallet verification system (Kasware, TTT Wallet, MetaMask)
      - Marketplace: P2P trading, services, and digital goods
      - Over 50+ integrated apps and tools in the ecosystem
      - Built-in AI features: Zeku AI, Window AI (you), and various AI agents

      You have access to all TTTZ platform data including user profiles, posts, transactions, wallet data, and app integrations.

      Current conversation:
      ${conversationContext}

      User's message: ${input}

      Provide helpful, accurate responses about TTTZ features and data. Be concise and format responses with proper spacing and line breaks for readability.`,
        add_context_from_internet: true
      });

      const aiMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (err) {
      console.error('Failed to get AI response:', err);
      const errorMessage = { 
        role: 'error', 
        content: 'Failed to get response. Please try again.', 
        timestamp: new Date().toISOString() 
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-black/90 backdrop-blur-xl border-b border-white/10 px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to={createPageUrl("Feed")}>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a8ee75db6_image.png"
                alt="TTTZ"
                className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full"
              />
              <h1 className="text-lg sm:text-xl font-bold text-white">TTTZ</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                onClick={handleClearChat}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white h-8 px-2 sm:px-3"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-300 font-medium">Smartest AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a8ee75db6_image.png"
                alt="TTTZ"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full mx-auto mb-3 sm:mb-4"
              />
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">TTTZ AI</h2>
              <p className="text-sm text-white/60">Ask me anything about TTTZ.xyz</p>
              <p className="text-xs text-white/40 mt-2">Type /clear to start a new chat</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 sm:px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 text-white'
                    : msg.role === 'error'
                    ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                    : 'bg-white/5 border border-white/10 text-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">{msg.content}</p>
                </div>
              </motion.div>
            ))
          )}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-purple-500/30 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-sm text-purple-300">Analyzing across TTT data...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything about TTTZ... (type /clear to reset)"
            disabled={isLoading}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none min-h-[50px] sm:min-h-[60px] max-h-[150px] sm:max-h-[200px] text-sm sm:text-base"
          />
          {messages.length > 0 && (
            <Button
              onClick={handleClearChat}
              variant="outline"
              className="bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 h-[50px] sm:h-[60px] px-3 sm:px-4"
              title="New Chat"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 h-[50px] sm:h-[60px] px-4 sm:px-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] sm:text-xs text-white/40 text-center mt-2">
          Shift + Enter for new line • Enter to send
        </p>
      </div>
    </div>
  );
}