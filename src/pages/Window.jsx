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
  const [streamingMessage, setStreamingMessage] = useState("");
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

  const typewriterEffect = (text, callback) => {
    let index = 0;
    setStreamingMessage("");
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setStreamingMessage(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
        callback();
      }
    }, 20);
    
    return interval;
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
    const userInput = input;
    setInput("");
    setIsLoading(true);
    setStreamingMessage("");

    try {
      // Build context from conversation history
      const conversationContext = updatedMessages.slice(-6)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Window AI'}: ${msg.content}`)
        .join('\n\n');

      // Analyze user input to determine response length
      const inputLength = userInput.split(' ').length;
      const isQuestion = userInput.includes('?');
      const isGreeting = /^(hi|hey|hello|yo|sup)/i.test(userInput.trim());
      
      let lengthInstruction = "";
      if (isGreeting || inputLength <= 3) {
        lengthInstruction = "Keep response very brief (1-2 sentences max).";
      } else if (inputLength <= 10 && isQuestion) {
        lengthInstruction = "Provide a concise answer (2-3 sentences).";
      } else if (inputLength > 20 || userInput.includes('explain') || userInput.includes('tell me about')) {
        lengthInstruction = "Provide a detailed response with examples and explanations.";
      } else {
        lengthInstruction = "Keep response moderate length (3-5 sentences).";
      }

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

RESPONSE LENGTH GUIDANCE: ${lengthInstruction}

Current conversation:
${conversationContext}

User's message: ${userInput}

Provide helpful, accurate responses about TTTZ features and data. Format responses with proper spacing and line breaks for readability.`,
        add_context_from_internet: true
      });

      // Typewriter effect
      typewriterEffect(response, () => {
        const aiMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        setStreamingMessage("");
        saveConversation(finalMessages);
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Failed to get AI response:', err);
      const errorMessage = { 
        role: 'error', 
        content: 'Failed to get response. Please try again.', 
        timestamp: new Date().toISOString() 
      };
      setMessages([...updatedMessages, errorMessage]);
      setIsLoading(false);
      setStreamingMessage("");
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-red-50 to-red-100 flex flex-col overflow-hidden">
      {/* Red Edges */}
      <div className="absolute inset-0 pointer-events-none border-4 border-red-600 z-50" />
      
      {/* Eyes Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-0 right-0 z-40 flex items-center justify-center"
      >
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/c1bbdc871_image.png"
          alt="No Fear Eyes"
          className="h-20 md:h-24 w-auto object-contain drop-shadow-[0_0_30px_rgba(220,38,38,0.9)]"
        />
      </motion.div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ paddingBottom: '180px', paddingTop: '120px' }}>
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-5xl md:text-6xl font-black mb-2" style={{ 
                fontFamily: 'Impact, "Arial Black", sans-serif',
                fontStyle: 'italic',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#dc2626',
                WebkitTextStroke: '3px black',
                textStroke: '3px black',
                paintOrder: 'stroke fill',
                textShadow: '4px 4px 0px rgba(0,0,0,0.5), -2px -2px 0px rgba(0,0,0,0.3)',
                transform: 'skewX(-8deg)',
                textTransform: 'uppercase'
              }}>NO FEAR AI</h2>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg px-3 py-2 relative ${
                  msg.role === 'user'
                    ? 'bg-red-600 backdrop-blur-sm border-2 border-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                    : msg.role === 'error'
                    ? 'bg-red-500/20 backdrop-blur-sm border-2 border-red-500 text-red-800 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-white backdrop-blur-sm border-2 border-red-600 text-black shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ lineHeight: '1.6' }}>{msg.content}</p>
                </div>
              </motion.div>
            ))
          )}
          {streamingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%] rounded-lg px-3 py-2 bg-white backdrop-blur-sm border-2 border-red-600 text-black shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ lineHeight: '1.6' }}>
                  {streamingMessage}
                  <span className="inline-block w-1 h-4 bg-red-600 ml-0.5 animate-pulse" />
                </p>
              </div>
            </motion.div>
          )}
          {isLoading && !streamingMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/80 backdrop-blur-sm border border-red-500/40 rounded-xl px-4 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                  <span className="text-sm text-red-600">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-red-50/95 to-transparent pointer-events-none">
        <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-xl border border-red-600 rounded-xl p-3 pointer-events-auto">
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
            placeholder="Ask me anything... (type /clear to reset)"
            disabled={isLoading}
            className="flex-1 bg-transparent border-none text-black placeholder:text-black/40 resize-none min-h-[44px] max-h-[120px] text-sm focus:outline-none"
          />
          <Button
            onClick={handleClearChat}
            variant="outline"
            className="bg-red-500/10 border-red-600 text-red-600 hover:text-red-700 hover:bg-red-500/20 h-[44px] px-3"
            title="New Chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-[44px] px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-black/40 text-center mt-2">
          Shift + Enter for new line • Enter to send
        </p>
        </div>
      </div>
    </div>
  );
}