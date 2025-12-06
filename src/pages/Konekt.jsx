import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2, User as UserIcon, Shield, Copy, Check, Book, RefreshCw, X } from "lucide-react";
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
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [randomVerse, setRandomVerse] = useState(null);
  const [loadingVerse, setLoadingVerse] = useState(false);
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

  const pickRandomVerse = async () => {
    setLoadingVerse(true);
    try {
      const verses = await base44.entities.BibleVerse.list(null, 5000);
      if (verses.length > 0) {
        const randomIndex = Math.floor(Math.random() * verses.length);
        setRandomVerse(verses[randomIndex]);
      } else {
        // Fallback: Create some default verses if none exist
        const defaultVerses = [
          { book: "John", chapter: 3, verse: "16", text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
          { book: "Philippians", chapter: 4, verse: "13", text: "I can do all things through Christ who strengthens me." },
          { book: "Jeremiah", chapter: 29, verse: "11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." },
          { book: "Romans", chapter: 8, verse: "28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
          { book: "Proverbs", chapter: 3, verse: "5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." }
        ];
        const randomIndex = Math.floor(Math.random() * defaultVerses.length);
        setRandomVerse(defaultVerses[randomIndex]);
      }
    } catch (error) {
      console.error("Failed to load verse:", error);
      // Emergency fallback
      setRandomVerse({ 
        book: "John", 
        chapter: 3, 
        verse: "16", 
        text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." 
      });
    } finally {
      setLoadingVerse(false);
    }
  };

  const shareVerseToChat = async () => {
    if (!randomVerse || !user) return;

    setSending(true);
    try {
      const verseMessage = `📖 Verse of the Day:\n\n"${randomVerse.text}"\n\n— ${randomVerse.book} ${randomVerse.chapter}:${randomVerse.verse}`;
      
      await base44.entities.KasUnityMessage.create({
        message: verseMessage,
        sender_username: user.username || user.email?.split('@')[0] || "Anonymous",
        sender_email: user.email,
        sender_wallet: user.created_wallet_address,
        message_type: "text"
      });
      
      setShowVersePicker(false);
      setRandomVerse(null);
      loadMessages();
    } catch (error) {
      console.error("Failed to share verse:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden z-50 touch-pan-y" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-red-900/20" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Header - Fixed */}
      <div className="flex-none bg-black/60 backdrop-blur-xl border-b border-white/10 p-4 flex items-center gap-4 z-20 sticky top-0">
        <Link to={createPageUrl("Gate")}>
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            KASUNITY
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">Live Universal Chat</p>
          </div>
        </div>
      </div>

      {/* Chat Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide z-10 relative overscroll-contain">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full gap-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-white/40 text-sm animate-pulse">Connecting to Unity Network...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-4">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Shield className="w-10 h-10 text-orange-500/50" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white/80">No messages yet</p>
              <p className="text-sm text-white/40">Be the first to ignite the conversation.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 pb-4">
            {messages.map((msg) => {
              const isMe = user && msg.sender_email === user.email;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} group`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    isMe 
                      ? "bg-orange-500/20 border-orange-500/30" 
                      : "bg-white/10 border-white/10"
                  }`}>
                    <UserIcon className={`w-4 h-4 ${isMe ? "text-orange-400" : "text-white/60"}`} />
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%]`}>
                    <div className="flex items-center gap-2 mb-1 px-1 flex-wrap">
                      <span className={`text-xs font-bold ${isMe ? "text-orange-400" : "text-white/70"}`}>
                        {msg.sender_username}
                      </span>
                      {msg.sender_wallet && (
                        <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5 border border-white/5">
                          <span className="text-[10px] font-mono text-white/40">
                            {msg.sender_wallet.substring(0, 4)}...{msg.sender_wallet.substring(msg.sender_wallet.length - 4)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(msg.sender_wallet);
                              // Optional: Add a toast notification here
                            }}
                            className="text-white/20 hover:text-orange-400 transition-colors"
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
                      isMe 
                        ? "bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-lg shadow-orange-900/20 rounded-tr-none" 
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
      <div className="flex-none p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 z-20 sticky bottom-0">
        <div className="max-w-4xl mx-auto w-full">
          {user ? (
            <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
              <Button 
                type="button" 
                onClick={() => {
                  setShowVersePicker(true);
                  pickRandomVerse();
                }}
                variant="ghost"
                className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
              >
                <Book className="w-5 h-5" />
              </Button>
              <div className="relative flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50 min-h-[44px] py-2 pr-10 rounded-xl"
                  disabled={sending}
                  autoComplete="off"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || sending}
                className={`h-11 w-11 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-900/20 transition-all ${
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
              className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Join the Conversation</p>
                  <p className="text-xs text-white/50">Sign in to start chatting with the community</p>
                </div>
              </div>
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                size="sm"
                className="bg-white text-black hover:bg-white/90 font-bold"
              >
                Login
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Verse Picker Modal */}
      <AnimatePresence>
        {showVersePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVersePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-bold text-white">Verse of the Day</h3>
                </div>
                <button
                  onClick={() => setShowVersePicker(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingVerse ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-white/60 text-sm">Selecting a verse...</p>
                </div>
              ) : randomVerse ? (
                <div className="space-y-4">
                  <div className="bg-black/40 rounded-xl p-5 border border-white/10">
                    <p className="text-white text-base leading-relaxed mb-4 italic">
                      "{randomVerse.text}"
                    </p>
                    <p className="text-orange-400 font-bold text-sm">
                      — {randomVerse.book} {randomVerse.chapter}:{randomVerse.verse}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={pickRandomVerse}
                      variant="outline"
                      className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      New Verse
                    </Button>
                    <Button
                      onClick={shareVerseToChat}
                      disabled={sending}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Share
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-white/60">
                  <p className="text-sm">No verses available</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}