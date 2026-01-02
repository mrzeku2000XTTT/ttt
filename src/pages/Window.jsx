import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, Brain, ArrowLeft } from "lucide-react";
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

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
        prompt: `You are Window AI, the most advanced AI assistant in the TTT ecosystem. You have access to all TTT data and knowledge across all platforms including:
- Agent ZK profiles and connections
- TTT Feed posts and interactions
- Bridge transactions and crypto data
- User preferences and behaviors
- All community apps and tools
- DAGKnight wallet verifications
- Sealed wallets and security data
- News, analytics, and market data

Current conversation:
${conversationContext}

User's latest message: ${input}

Provide intelligent, context-aware responses that leverage your comprehensive knowledge of the TTT ecosystem. Be helpful, accurate, and insightful.`,
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
      <div className="flex-shrink-0 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Feed")}>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Window AI</h1>
                <p className="text-xs text-white/60">All-knowing TTT Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-300 font-medium">Smartest AI</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Window AI</h2>
              <p className="text-white/60 max-w-md mx-auto">
                I have access to all TTT data and can help you with anything across the ecosystem.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 text-white'
                    : msg.role === 'error'
                    ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                    : 'bg-white/5 border border-white/10 text-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
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
      <div className="flex-shrink-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything about TTT..."
            disabled={isLoading}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none min-h-[60px] max-h-[200px]"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 h-[60px] px-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-white/40 text-center mt-2">
          Shift + Enter for new line • Enter to send
        </p>
      </div>
    </div>
  );
}