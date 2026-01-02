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
    <div className="fixed inset-0 bg-black flex items-end justify-center p-4 sm:p-6">
      {/* Loading Indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-1/2 -translate-x-1/2"
        >
          <div className="bg-white/5 border border-purple-500/30 rounded-2xl px-5 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-sm text-purple-300">Analyzing across TTT data...</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Input */}
      <div className="w-full max-w-4xl bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
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
            className="flex-1 bg-transparent border-none text-white placeholder:text-white/40 resize-none min-h-[50px] sm:min-h-[60px] max-h-[150px] sm:max-h-[200px] text-sm sm:text-base focus:outline-none"
          />
          <Button
            onClick={handleClearChat}
            variant="outline"
            className="bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 h-[50px] sm:h-[60px] px-3 sm:px-4"
            title="New Chat"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
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