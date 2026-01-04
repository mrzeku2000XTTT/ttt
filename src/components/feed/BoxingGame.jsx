import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, MessageCircle, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BoxingGame({ post, onClose, user }) {
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userName = user?.username || user?.email || 'Anonymous';
    
    const newMsg = {
      id: Date.now(),
      sender: userName,
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage("");
    setIsSending(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border border-red-500/30 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-red-500/20 bg-black/40">
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                alt="Banter"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h3 className="text-white font-black text-2xl">LIVE BANTER</h3>
                <p className="text-red-400 text-sm">Connect & Debate!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {chatStarted && (
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                  <div className="text-white/60 text-xs mb-1">Post Author</div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3 h-3 text-cyan-400" />
                    <div className="text-white font-mono text-xs">
                      {post.author_wallet_address ? 
                        `${post.author_wallet_address.slice(0, 8)}...${post.author_wallet_address.slice(-6)}` : 
                        'No wallet'}
                    </div>
                  </div>
                </div>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 relative flex flex-col overflow-hidden">
            {!chatStarted ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-6 px-6">
                  <h2 className="text-4xl font-black text-white mb-4">
                    Ready to Connect?
                  </h2>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <div className="text-white/60 text-sm mb-3">You're connecting with:</div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-lg font-bold text-white">
                        {post.author_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-bold text-xl">{post.author_name}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 bg-black/40 rounded-lg px-3 py-2">
                      <Wallet className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400 font-mono text-sm">
                        {post.author_wallet_address ? 
                          `${post.author_wallet_address.slice(0, 10)}...${post.author_wallet_address.slice(-8)}` : 
                          'No wallet'}
                      </span>
                    </div>
                  </div>
                  <p className="text-red-400 mb-6">
                    Start a live conversation and debate!
                  </p>
                  <Button
                    onClick={() => setChatStarted(true)}
                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-6 text-xl font-bold"
                  >
                    START FIGHT
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <MessageCircle className="w-16 h-16 text-white/20 mx-auto" />
                        <p className="text-white/40">No messages yet</p>
                        <p className="text-white/20 text-sm">Be the first to say something!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isCurrentUser = msg.sender === (user?.username || user?.email);
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] ${isCurrentUser ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-white/10 border border-white/20'} rounded-xl p-4`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-semibold ${isCurrentUser ? 'text-white/80' : 'text-white/60'}`}>
                                {msg.sender}
                              </span>
                              <span className={`text-[10px] ${isCurrentUser ? 'text-white/60' : 'text-white/40'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className={`text-sm ${isCurrentUser ? 'text-white' : 'text-white/90'} leading-relaxed whitespace-pre-wrap break-words`}>
                              {msg.text}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-red-500/20 bg-black/40">
                  <div className="flex gap-3">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none h-16"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim()}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 h-16"
                    >
                      {isSending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-white/40 text-xs mt-2">
                    Press Enter to send • Shift+Enter for new line
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}