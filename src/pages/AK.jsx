import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Bot, Sparkles, Share2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarGateProvider, useStarGate } from "@/components/stargate/StarGateContext";
import DataShareModal from "@/components/stargate/DataShareModal";

function AKContent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [shareModal, setShareModal] = useState({ open: false, data: "" });
  const { getSharedData, getAllSharedData } = useStarGate();

  useEffect(() => {
    loadUser();
    loadSharedData();
  }, []);

  const loadSharedData = () => {
    const allData = getAllSharedData();
    if (Object.keys(allData).length > 0) {
      const latestData = Object.values(allData).sort((a, b) => b.timestamp - a.timestamp)[0];
      if (latestData && latestData.data.content) {
        setInput(latestData.data.content);
      }
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: input,
        add_context_from_internet: false,
      });

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
      console.error("AI error:", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      bottom: 'calc(var(--sab, 0px) + 4rem)',
      left: 0,
      right: 0,
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(to bottom right, rgb(59, 7, 100), rgb(0, 0, 0), rgb(59, 7, 100))',
      overflow: 'hidden'
    }}>
      <div style={{ 
        maxWidth: '64rem', 
        margin: '0 auto', 
        width: '100%',
        padding: '0 1rem',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            marginBottom: '1rem', 
            textAlign: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Bot className="w-8 h-8 text-purple-400" />
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white' }}>AK</h1>
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Your AI Assistant</p>
        </motion.div>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          minHeight: 0
        }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex items-start gap-2 group">
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white backdrop-blur-xl border border-white/10"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => setShareModal({ open: true, data: msg.content })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg"
                      title="Share response"
                    >
                      <Share2 className="w-4 h-4 text-white/60 hover:text-purple-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            </motion.div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AK anything..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
            rows={2}
            style={{ fontSize: '16px' }}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        <DataShareModal
          isOpen={shareModal.open}
          onClose={() => setShareModal({ open: false, data: "" })}
          sourceApp="AK"
          dataToShare={shareModal.data}
          dataType="text"
        />
      </div>
    </div>
  );
}

export default function AKPage() {
  return (
    <StarGateProvider>
      <AKContent />
    </StarGateProvider>
  );
}