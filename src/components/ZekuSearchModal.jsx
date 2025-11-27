
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Loader2, Zap, Brain, CheckCircle, X, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from 'react-markdown';

export default function ZekuSearchModal({ initialQuery, results, onClose }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [responseMode, setResponseMode] = useState('concise');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [backgroundImage] = useState("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [hasInitialQuerySent, setHasInitialQuerySent] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    initConversation();
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  useEffect(() => {
    if (conversation?.id) {
      try {
        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
          if (data && data.messages && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
          setIsLoading(false);
          setLoadingPhase('');
        });
        return () => {
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
          }
        };
      } catch (error) {
        console.error('Failed to subscribe to conversation:', error);
        setIsLoading(false);
        setLoadingPhase('');
      }
    }
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      console.log('🔄 Creating new conversation...');
      
      const conv = await base44.agents.createConversation({
        agent_name: "zeku_ai",
        metadata: {
          name: "Zeku AI Search",
          mode: responseMode
        }
      });

      console.log('✅ Conversation created:', conv?.id);
      setConversation(conv);

      // Send the initial query if provided
      if (results?.query && !hasInitialQuerySent) {
        setHasInitialQuerySent(true);
        await sendMessage(results.query);
      }
    } catch (error) {
      console.error('Failed to init conversation:', error);
      setMessages([{
        role: 'assistant',
        content: '❌ Failed to initialize conversation. Please try again or refresh the page.',
        isError: true
      }]);
    }
  };

  const sendMessage = async (messageText) => {
    if (!conversation) {
      console.error('No conversation available');
      return;
    }

    setIsLoading(true);
    
    setLoadingPhase('analyzing');
    await new Promise(r => setTimeout(r, 400));
    
    setLoadingPhase('thinking');
    await new Promise(r => setTimeout(r, 400));
    
    setLoadingPhase('confirming');
    await new Promise(r => setTimeout(r, 400));

    try {
      const messageData = {
        role: "user",
        content: messageText
      };

      if (uploadedFiles.length > 0) {
        messageData.file_urls = uploadedFiles.map(f => f.url);
      }

      console.log('📤 Sending message to agent...');
      await base44.agents.addMessage(conversation, messageData);
      console.log('✅ Message sent successfully');
      
      setUploadedFiles([]);
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Failed to send message: ${error.message}`,
        isError: true
      }]);
      setIsLoading(false);
      setLoadingPhase('');
    }
  };

  const handleSend = () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    sendMessage(input.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { name: file.name, url: file_url, type: file.type };
      });
      const uploaded = await Promise.all(uploadPromises);
      setUploadedFiles([...uploadedFiles, ...uploaded]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleNewChat = async () => {
    setMessages([]);
    setConversation(null);
    setInput('');
    setUploadedFiles([]);
    setHasInitialQuerySent(false);
    await initConversation();
  };

  const LoadingAnimation = () => {
    const phases = {
      analyzing: { icon: Brain, text: '◆ ANALYZING', color: 'text-cyan-400' },
      thinking: { icon: Zap, text: '◆ THINKING', color: 'text-cyan-500' },
      confirming: { icon: CheckCircle, text: '◆ CONFIRMING', color: 'text-cyan-600' }
    };

    const current = phases[loadingPhase];
    if (!current) return null;

    const Icon = current.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg backdrop-blur-xl"
      >
        <Icon className={`w-4 h-4 ${current.color} animate-pulse`} />
        <span className={`text-xs font-mono ${current.color} tracking-wider`}>
          {current.text}
        </span>
      </motion.div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-[9999]"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999
      }}
    >
      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>

      {/* TTT Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <div 
          className="text-[600px] font-black tracking-tighter"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          TTT
        </div>
      </div>

      {/* Gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-black/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-cyan-400 font-mono text-sm tracking-wider font-bold">ZEKU_AI</div>
            <div className="text-[10px] text-gray-600 tracking-widest">Elite Crypto Intelligence</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://kas.fyi/addresses/top"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-black/50 border border-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-all font-mono text-xs backdrop-blur-xl flex items-center gap-2"
          >
            <TrendingUp className="w-3 h-3" />
            WHALE WATCH
          </a>

          <Button
            onClick={handleNewChat}
            variant="outline"
            size="sm"
            className="bg-black/50 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 text-xs"
          >
            NEW CHAT
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden pb-24">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-cyan-500/20">
                  <Brain className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Welcome to Zeku AI</h2>
                <p className="text-gray-400 mb-4">
                  Your premium AI assistant is ready.
                </p>
              </motion.div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-6 py-4 backdrop-blur-xl ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-white'
                      : msg.isError
                        ? 'bg-red-500/20 border border-red-500/40 text-red-200'
                        : 'bg-black/60 border border-cyan-500/20 text-gray-200'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      components={{
                        p: ({ children }) => <p className="my-2 leading-relaxed text-sm">{children}</p>,
                        ul: ({ children }) => <ul className="my-2 ml-4 list-disc text-sm">{children}</ul>,
                        ol: ({ children }) => <ol className="my-2 ml-4 list-decimal text-sm">{children}</ol>,
                        li: ({ children }) => <li className="my-1">{children}</li>,
                        h1: ({ children }) => <h1 className="text-base font-bold my-3 text-cyan-400">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-bold my-2 text-cyan-400">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold my-2 text-cyan-400">{children}</h3>,
                        code: ({ inline, children }) => 
                          inline ? (
                            <code className="px-1.5 py-0.5 rounded bg-black/50 text-cyan-400 text-xs font-mono">
                              {children}
                            </code>
                          ) : (
                            <code className="block p-3 rounded-lg bg-black/50 text-cyan-400 text-xs font-mono my-2 overflow-x-auto">
                              {children}
                            </code>
                          ),
                        strong: ({ children }) => <strong className="text-cyan-400 font-bold">{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && <LoadingAnimation />}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area - Fixed at bottom with highest z-index */}
      <div className="fixed bottom-0 left-0 right-0 z-[10000] border-t border-cyan-500/20 bg-black/95 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {uploadedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-black/50 border border-cyan-500/20 rounded-lg px-3 py-1.5 backdrop-blur-xl">
                  <span className="text-xs text-cyan-400 font-mono truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-3 bg-black/50 border border-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-all font-mono text-xs backdrop-blur-xl disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Zeku AI anything..."
              disabled={isLoading}
              rows={1}
              className="flex-1 min-h-[52px] max-h-[120px] bg-black/50 border border-cyan-500/30 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 font-mono text-sm px-4 py-3 rounded-xl outline-none backdrop-blur-xl disabled:opacity-50 resize-none"
              style={{ lineHeight: '1.5' }}
            />

            <button
              onClick={handleSend}
              disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
              className="px-6 py-3.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs tracking-wider font-bold backdrop-blur-xl"
            >
              {isLoading ? 'SENDING...' : 'SEND'}
            </button>
          </div>
        </div>

        <div className="border-t border-cyan-500/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <p className="text-center text-[10px] text-gray-700 tracking-wider">
              ZEKU AI • POWERED BY TTT • ELITE CRYPTO INTELLIGENCE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
