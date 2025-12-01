import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Users } from "lucide-react";
import { format } from "date-fns";

export default function LiveChat({ partyId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [viewMode, setViewMode] = useState("chat"); // "chat" or "feed"
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    loadActiveUsers();
    
    const interval = setInterval(() => {
      loadMessages();
      loadActiveUsers();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [partyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      // Load recent posts from Feed as chat messages
      const posts = await base44.entities.Post.filter({}, '-created_date', 50);
      setMessages(posts.slice(0, 30));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const loadActiveUsers = async () => {
    try {
      const users = await base44.entities.User.list('-created_date', 20);
      setActiveUsers(users.filter(u => u.username).slice(0, 10));
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      let authorName = currentUser.username;
      
      if (!authorName && currentUser.created_wallet_address) {
        try {
          const profiles = await base44.entities.AgentZKProfile.filter({
            wallet_address: currentUser.created_wallet_address
          });
          if (profiles.length > 0 && profiles[0].username) {
            authorName = profiles[0].username;
          }
        } catch (err) {
          console.log('No AgentZK profile found');
        }
      }

      if (!authorName) {
        authorName = currentUser.created_wallet_address 
          ? `${currentUser.created_wallet_address.slice(0, 6)}...${currentUser.created_wallet_address.slice(-4)}`
          : currentUser.email.split('@')[0];
      }

      await base44.entities.Post.create({
        content: newMessage.trim(),
        author_name: authorName,
        author_wallet_address: currentUser.created_wallet_address || '',
        author_role: currentUser.role || 'user'
      });

      setNewMessage("");
      await loadMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const getBadges = (msg) => {
    const badges = [];
    
    if (msg.author_name?.toLowerCase() === 'ttt') {
      badges.push({ name: 'ZEKU', color: 'from-cyan-500 to-purple-500' });
    }
    if (msg.author_name?.toLowerCase() === 'destroyer') {
      badges.push({ name: 'DEATH', color: 'from-red-600 to-black' });
    }
    if (msg.author_name?.toLowerCase() === 'esp') {
      badges.push({ name: 'GOD', color: 'from-yellow-500 to-orange-500' });
    }
    if (msg.author_name?.toLowerCase() === 'hayphase') {
      badges.push({ name: '👁️ POV', color: 'from-emerald-400 via-green-500 to-teal-600' });
    }
    if (msg.author_name?.toLowerCase().trim().replace(/\s+/g, '') === 'olatomiwa' && 
        msg.author_wallet_address?.toLowerCase().endsWith('du4')) {
      badges.push({ name: 'TTT', color: 'cyan-500/20', border: true });
      badges.push({ name: 'FIRSTLADY', color: 'from-blue-500 via-indigo-500 to-purple-600' });
    }
    if (msg.author_name?.toLowerCase().trim().replace(/\s+/g, '') === 'ayomuiz' && 
        msg.author_wallet_address?.toLowerCase().endsWith('ygt')) {
      badges.push({ name: '👑 KING', color: 'from-amber-400 via-yellow-500 to-orange-600', textColor: 'text-black', border2: true });
      badges.push({ name: 'EL', color: 'from-red-500 to-orange-500' });
    }
    
    return badges;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header with Toggle */}
      <div className="bg-zinc-800 border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            {viewMode === "chat" ? "Live Chat" : "Live Feed"}
          </h3>
          <div className="flex gap-1 bg-zinc-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("chat")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                viewMode === "chat" 
                  ? "bg-cyan-600 text-white" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setViewMode("feed")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                viewMode === "feed" 
                  ? "bg-cyan-600 text-white" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Feed
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-xs">{activeUsers.length} active users</p>
      </div>

      {/* Active Users Scroll */}
      <div className="bg-zinc-800/50 border-b border-white/10 p-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {activeUsers.map((user, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div className="w-8 h-8 bg-black rounded-full border border-white/20 flex items-center justify-center" style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px),
                  repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)
                `,
                backgroundSize: '2px 2px'
              }}>
                <span className="text-cyan-400 text-lg font-bold" style={{ textShadow: '0 0 4px rgba(6,182,212,0.5)' }}>✕</span>
              </div>
              <span className="text-[9px] text-white/70 truncate max-w-[40px]">
                {user.username || 'User'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages/Feed Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {viewMode === "chat" ? (
          <AnimatePresence>
            {messages.map((msg, i) => {
              const badges = getBadges(msg);
              
              return (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-2"
                >
                  <div className="w-7 h-7 bg-black rounded-full flex-shrink-0 border border-white/20 flex items-center justify-center" style={{
                    backgroundImage: `
                      repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px),
                      repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)
                    `,
                    backgroundSize: '2px 2px'
                  }}>
                    <span className="text-cyan-400 text-sm font-bold" style={{ textShadow: '0 0 4px rgba(6,182,212,0.5)' }}>✕</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-white font-semibold text-xs">
                        {msg.author_name || 'Anonymous'}
                      </span>
                      {badges.map((badge, idx) => (
                        <span 
                          key={idx}
                          className={`px-1 py-0.5 ${
                            badge.border2 
                              ? 'border-2 border-yellow-400/80' 
                              : badge.border 
                                ? 'border border-cyan-500/30' 
                                : ''
                          } bg-gradient-to-r ${badge.color} rounded text-[8px] font-bold ${
                            badge.textColor || 'text-white'
                          }`}
                        >
                          {badge.name}
                        </span>
                      ))}
                      <span className="text-gray-500 text-[9px]">
                        {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs break-words">{msg.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => {
              const badges = getBadges(msg);
              
              return (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-zinc-800/50 rounded-lg p-2 border border-white/5"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-8 h-8 bg-black rounded-full flex-shrink-0 border border-white/20 flex items-center justify-center" style={{
                      backgroundImage: `
                        repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px),
                        repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)
                      `,
                      backgroundSize: '2px 2px'
                    }}>
                      <span className="text-cyan-400 text-sm font-bold" style={{ textShadow: '0 0 4px rgba(6,182,212,0.5)' }}>✕</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-bold text-xs">
                          {msg.author_name || 'Anonymous'}
                        </span>
                        {badges.map((badge, idx) => (
                          <span 
                            key={idx}
                            className={`px-1 py-0.5 ${
                              badge.border2 
                                ? 'border-2 border-yellow-400/80' 
                                : badge.border 
                                  ? 'border border-cyan-500/30' 
                                  : ''
                            } bg-gradient-to-r ${badge.color} rounded text-[8px] font-bold ${
                              badge.textColor || 'text-white'
                            }`}
                          >
                            {badge.name}
                          </span>
                        ))}
                        <span className="text-gray-500 text-[9px] ml-auto">
                          {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-xs break-words pl-10">{msg.content}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-zinc-800 border-t border-white/10 p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Send a message..."
            className="flex-1 bg-zinc-700 border-white/10 text-white placeholder:text-white/30 text-sm"
            disabled={!currentUser}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !currentUser}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {!currentUser && (
          <p className="text-gray-500 text-xs mt-2">Login to chat</p>
        )}
      </div>
    </div>
  );
}