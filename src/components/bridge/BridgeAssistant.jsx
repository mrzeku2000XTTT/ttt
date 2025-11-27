import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { agentSDK as base44agentSDK } from "@/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot, Loader2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AISwitcher from "@/components/AISwitcher";

// Mock base44 object for agent SDK calls, assuming base44.agents is the new standard
// In a real application, this would likely be imported from a global context or specific SDK file.
// For this task, I'm assuming 'base44.agents' refers to agentSDK as defined originally.
const base44 = {
  agents: base44agentSDK
};

export default function BridgeAssistant({ onClose }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    if (conversation?.id) {
      try {
        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
          if (data && data.messages) {
            setMessages(data.messages || []);
            setIsLoading(false); // Agent has responded, so stop loading
          }
        });

        return () => {
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
          }
        };
      } catch (err) {
        console.error('Failed to subscribe:', err);
        setError('Connection error. Please try closing and reopening the assistant.');
      }
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initConversation = async () => {
    try {
      setError(null);
      console.log('🤖 Creating bridge assistant conversation...');
      
      const conv = await base44.agents.createConversation({
        agent_name: "bridge_assistant",
        metadata: {
          name: "Bridge Help",
          description: "Get help with TTT Bridge",
          created_at: new Date().toISOString()
        }
      });

      if (!conv || !conv.id) {
        throw new Error('Failed to create conversation - no ID returned');
      }

      console.log('✅ Bridge assistant conversation created:', conv.id);
      setConversation(conv);

      // Send welcome message
      setTimeout(async () => {
        try {
          await base44.agents.addMessage(conv, {
            role: "user",
            content: "Hello! I need help with the bridge."
          });
        } catch (err) {
          console.error('Failed to send welcome message:', err);
        }
      }, 500);

    } catch (error) {
      console.error('❌ Failed to create conversation:', error);
      setError('Failed to start conversation. Please try again or contact support.');
    }
  };

  const handleSend = async () => {
    if (!conversation || !conversation.id) {
      setError('No active conversation. Please close and reopen the assistant.');
      return;
    }

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null); // Clear any previous error before sending a new message

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessage
      });
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setError('Failed to send message. Please try again.');
      setIsLoading(false); // Stop loading if message sending fails
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 w-full md:w-[400px] z-50"
      style={{ 
        top: 'calc(env(safe-area-inset-top, 0px) + 7.5rem)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)',
        height: 'auto'
      }}
    >
      <div className="h-full backdrop-blur-2xl bg-black/90 border-l border-white/10 flex flex-col rounded-tl-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50 flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm">Bridge Assistant</h3>
              <p className="text-xs text-gray-400 truncate">Here to help you bridge</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <AISwitcher currentAI="bridge" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex-shrink-0 p-3 border-b border-red-500/30 bg-red-500/10">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300 flex-1">{error}</p>
              <Button
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-400"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'backdrop-blur-xl bg-white/5 border border-white/10 text-gray-200'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    className="text-sm prose prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    components={{
                      p: ({ children }) => <p className="my-1">{children}</p>,
                      ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 flex-shrink-0 bg-black/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about the bridge..."
              className="flex-1 backdrop-blur-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-10"
              disabled={isLoading || !!error}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !!error}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/50 h-10 w-10 p-0 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}