import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2, User as UserIcon, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

export default function KonektPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
      const msgs = await base44.entities.KasUnityMessage.list("-created_date", 50);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      await base44.entities.KasUnityMessage.create({
        message: newMessage.trim(),
        sender_username: user.username || user.email?.split('@')[0] || "Anonymous",
        sender_email: user.email,
        sender_wallet: user.created_wallet_address,
        message_type: "text"
      });
      setNewMessage("");
      loadMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center gap-4 z-10 fixed top-0 left-0 right-0">
        <Link to={createPageUrl("Gate")}>
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            KASUNITY
          </h1>
          <p className="text-xs text-white/60">Universal Chat</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 pt-20 pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-2">
            <Shield className="w-12 h-12 opacity-20" />
            <p>Welcome to KASUNITY. Be the first to speak.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((msg) => {
              const isMe = user && msg.sender_email === user.email;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? "bg-orange-500/20" : "bg-white/10"}`}>
                    <UserIcon className={`w-4 h-4 ${isMe ? "text-orange-400" : "text-white/60"}`} />
                  </div>
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-xs font-bold ${isMe ? "text-orange-400" : "text-white/80"}`}>
                        {msg.sender_username}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {moment(msg.created_date).fromNow()}
                      </span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl ${
                      isMe 
                        ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 text-white" 
                        : "bg-white/5 border border-white/10 text-white/90"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          {user ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50"
                disabled={sending}
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || sending}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-sm text-white/60">Sign in to join the conversation</span>
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                variant="outline"
                size="sm"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
              >
                Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}