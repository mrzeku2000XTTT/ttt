import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  MessageSquare,
  X,
  Send,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Minimize2,
  Maximize2,
  RefreshCw,
  Activity
} from "lucide-react";
import AISwitcher from "@/components/AISwitcher";

export default function AgentYingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [knowledge, setKnowledge] = useState(null);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadKnowledge = async () => {
    setIsLoadingKnowledge(true);
    try {
      const response = await base44.functions.invoke("getAgentYingKnowledge");
      if (response.data) {
        setKnowledge(response.data);
      }
    } catch (err) {
      console.error("Failed to load knowledge:", err);
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() && !selectedImage) return;

    const userMessage = selectedImage
      ? { role: 'user', content: chatInput || 'Analyze this image', image: selectedImage }
      : { role: 'user', content: chatInput };

    setChatMessages(prev => [...prev, userMessage]);
    const tempInput = chatInput;
    const tempImage = selectedImage;
    setChatInput('');
    setSelectedImage(null);
    setIsChatting(true);

    try {
      const response = await base44.functions.invoke("chatWithAgentYing", {
        question: tempInput || (tempImage ? 'Analyze this image' : ''),
        imageUrl: tempImage
      });

      if (response.data) {
        const aiMessage = {
          role: 'agent',
          content: response.data.response,
          savedToHiveMind: response.data.visionDataSaved
        };
        setChatMessages(prev => [...prev, aiMessage]);

        if (response.data.visionDataSaved) {
          console.log('🧠 New vision data added to hive mind');
          setTimeout(() => loadKnowledge(), 1000);
        }
      }
    } catch (err) {
      console.error("Chat failed:", err);
      const errorMessage = { role: 'agent', content: 'Sorry, I encountered an error. Please try again.' };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleImageUploadForChat = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setSelectedImage(response.file_url);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Failed to upload image");
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          if (!knowledge) loadKnowledge();
        }}
        className="fixed right-4 md:right-6 bottom-4 md:bottom-6 z-[60] w-10 h-10 md:w-12 md:h-12 bg-black/80 border border-white/20 hover:border-white/40 rounded-full flex items-center justify-center shadow-lg transition-all"
        title="Chat with Agent Ying AI"
      >
        <Brain className="w-4 h-4 md:w-5 md:h-5 text-white/80" strokeWidth={2} />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`fixed z-[60] bg-black/95 backdrop-blur-xl border-2 border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col
          ${isMinimized 
            ? 'right-4 md:right-6 bottom-4 md:bottom-6 w-[calc(100vw-2rem)] md:w-80 h-14' 
            : 'inset-4 md:inset-auto md:right-6 md:bottom-6 md:w-96 md:h-[600px]'
          }`}
        style={{ maxHeight: isMinimized ? '56px' : 'calc(100vh - 2rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500/20 border-2 border-cyan-500/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-xs md:text-sm truncate">Agent Ying AI</h3>
              <p className="text-cyan-400 text-[10px] md:text-xs">Vision • Memory</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isMinimized && <AISwitcher currentAI="ying" />}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-white p-1 h-8 w-8 flex items-center justify-center"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 h-8 w-8 flex items-center justify-center"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Stats - Hidden on mobile when chat is active */}
              <div className={`${chatMessages.length > 0 ? 'hidden md:flex' : 'flex'} w-24 md:w-28 border-r border-cyan-500/30 p-2 overflow-y-auto bg-black/30 flex-col`}>
                {isLoadingKnowledge ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin mx-auto" />
                  </div>
                ) : knowledge ? (
                  <div className="space-y-2">
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 text-center">
                      <div className="text-base md:text-lg font-bold text-cyan-400">{knowledge.stats.totalPatterns}</div>
                      <div className="text-[8px] md:text-[9px] text-gray-400">Patterns</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                      <div className="text-base md:text-lg font-bold text-green-400">{knowledge.stats.totalVerifications}</div>
                      <div className="text-[8px] md:text-[9px] text-gray-400">Verified</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 text-center">
                      <div className="text-base md:text-lg font-bold text-purple-400">{knowledge.stats.totalVisionAnalyses || 0}</div>
                      <div className="text-[8px] md:text-[9px] text-gray-400">Images</div>
                    </div>
                    
                    {knowledge.visionInsights && (
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2">
                        <div className="text-[8px] md:text-[9px] text-gray-300 space-y-1">
                          <div>👁️ Seen</div>
                          <div>📱 {knowledge.visionInsights.uniqueUsernames}</div>
                          <div>🔗 {knowledge.visionInsights.uniqueUrls}</div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={loadKnowledge}
                      size="sm"
                      className="w-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 h-7 text-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={loadKnowledge}
                    size="sm"
                    className="w-full bg-cyan-500/20 text-cyan-400 text-xs h-7"
                  >
                    <Brain className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* Right: Chat Interface */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-6 md:py-8">
                      <Brain className="w-10 h-10 md:w-12 md:h-12 text-cyan-400/50 mx-auto mb-2 md:mb-3" />
                      <p className="text-white font-semibold text-xs md:text-sm mb-2">Ask Agent Ying!</p>
                      <div className="space-y-1 text-[10px] md:text-xs text-gray-400">
                        <p>👁️ Upload images</p>
                        <p>💡 Ask questions</p>
                        <p>🔍 Search memory</p>
                      </div>
                    </div>
                  )}

                  {chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'agent' && (
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-cyan-500/20 border border-cyan-500/50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Brain className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" strokeWidth={2} />
                        </div>
                      )}
                      <div className={`max-w-[80%] md:max-w-[75%] ${msg.role === 'user' ? 'bg-white/10 border-white/20' : 'bg-cyan-500/10 border-cyan-500/30'} border rounded-xl p-2 md:p-3`}>
                        {msg.image && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                            <img
                              src={msg.image}
                              alt="Uploaded"
                              className="w-full max-h-24 md:max-h-32 object-contain bg-black/30"
                            />
                          </div>
                        )}
                        <p className="text-white text-[11px] md:text-xs leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        {msg.savedToHiveMind && (
                          <div className="mt-1.5 md:mt-2 flex items-center gap-1 text-[9px] md:text-[10px] text-green-400">
                            <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            <span>Saved</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isChatting && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-cyan-500/20 border border-cyan-500/50 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 text-cyan-400 animate-spin" strokeWidth={2} />
                      </div>
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-2 md:p-3">
                        <p className="text-cyan-400 text-[11px] md:text-xs">Analyzing...</p>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-cyan-500/30 p-2 md:p-3 bg-black/50" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
                  {selectedImage && (
                    <div className="mb-2 relative">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-cyan-500/30"
                      />
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-1.5 md:gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUploadForChat}
                      className="hidden"
                      id="ying-chat-image-upload"
                    />
                    <label htmlFor="ying-chat-image-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 h-9 md:h-10 w-9 md:w-10 p-0"
                        disabled={isChatting}
                        asChild
                      >
                        <div>
                          <ImageIcon className="w-4 h-4 md:w-4.5 md:h-4.5" strokeWidth={2} />
                        </div>
                      </Button>
                    </label>

                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                      placeholder="Ask..."
                      className="flex-1 bg-white/5 border-cyan-500/30 text-white placeholder:text-gray-600 h-9 md:h-10 text-xs md:text-sm"
                      disabled={isChatting}
                    />
                    <Button
                      onClick={handleChat}
                      disabled={isChatting || (!chatInput.trim() && !selectedImage)}
                      size="sm"
                      className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 h-9 md:h-10 w-9 md:w-10 p-0"
                    >
                      <Send className="w-4 h-4 md:w-4.5 md:h-4.5" strokeWidth={2} />
                    </Button>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 mt-1 md:mt-1.5">
                    👁️ Vision • 💬 Memory
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}