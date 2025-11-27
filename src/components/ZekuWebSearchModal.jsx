
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Globe, ExternalLink, Sparkles, TrendingUp, Monitor, Search, RefreshCw, Home } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from 'react-markdown';

export default function ZekuWebSearchModal({ initialQuery, results, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseMode, setResponseMode] = useState('concise');
  const [backgroundImage] = useState("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80");
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [browserInput, setBrowserInput] = useState('');
  const [isBrowserLoading, setIsBrowserLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    if (results?.query) {
      handleSearch(results.query);
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    const userMessage = {
      role: 'user',
      content: query.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('🔍 Calling perplexitySearch with:', query.trim());
      
      const response = await base44.functions.invoke('perplexitySearch', {
        query: query.trim(),
        mode: responseMode
      });

      console.log('✅ Got response:', response);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        citations: response.data.citations || [],
        model: 'Zeku AI'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('❌ Search failed:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: `❌ Search failed: ${error.message}\n\nPossible reasons:\n- The Perplexity API key may not be configured\n- Network connection issue\n- API rate limit reached\n\nPlease try again in a moment or contact support.`,
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    handleSearch(input);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBrowserNavigate = async () => {
    let inputValue = browserInput.trim();
    if (!inputValue) return;

    setIsBrowserLoading(true);

    try {
      // Determine if it's a URL or search query
      let targetUrl;
      
      if (inputValue.includes('.') || inputValue.startsWith('http://') || inputValue.startsWith('https://')) {
        // It's a URL
        targetUrl = inputValue.startsWith('http://') || inputValue.startsWith('https://') 
          ? inputValue 
          : 'https://' + inputValue;
      } else {
        // It's a search query - use DuckDuckGo (iframe-friendly)
        targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(inputValue)}`;
      }

      // Use our proxy function to fetch the page
      const response = await base44.functions.invoke('webProxy', {
        url: targetUrl
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Create a blob URL from the response
      const blob = new Blob([response.data], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      setBrowserUrl(blobUrl);
      setBrowserInput(targetUrl);
    } catch (error) {
      console.error('Browser navigation failed:', error);
      alert(`Failed to load page: ${error.message}`);
    } finally {
      setIsBrowserLoading(false);
    }
  };

  const handleBrowserKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBrowserNavigate();
    }
  };

  const openWhaleWatch = () => {
    setBrowserInput('kas.fyi/addresses/top');
    handleBrowserNavigate();
    setShowBrowser(true);
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-[999999] flex flex-col"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
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
          background: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
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
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-black/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-purple-400 font-mono text-sm tracking-wider font-bold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              ZEKU AI
              <span className="text-[8px] text-purple-600">WEB SEARCH</span>
            </div>
            <div className="text-[10px] text-gray-600 tracking-widest">Powered by TTT • Real-Time Internet</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Browser Toggle */}
          <button
            onClick={() => setShowBrowser(!showBrowser)}
            className={`px-3 py-1.5 border rounded-lg hover:bg-purple-500/10 transition-all font-mono text-xs backdrop-blur-xl flex items-center gap-2 ${
              showBrowser 
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' 
                : 'bg-black/50 border-purple-500/20 text-purple-400'
            }`}
          >
            <Monitor className="w-3 h-3" />
            {showBrowser ? 'CHAT' : 'BROWSER'}
          </button>

          {/* Whale Watch Button */}
          <button
            onClick={openWhaleWatch}
            className="px-3 py-1.5 bg-black/50 border border-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/10 transition-all font-mono text-xs backdrop-blur-xl flex items-center gap-2"
          >
            <TrendingUp className="w-3 h-3" />
            WHALE WATCH
          </button>

          {/* Mode Toggle - Only show in chat mode */}
          {!showBrowser && (
            <div className="flex bg-black/50 border border-purple-500/20 rounded-lg p-0.5 backdrop-blur-xl">
              <button
                onClick={() => setResponseMode('concise')}
                className={`px-2 py-1 text-[9px] font-mono tracking-wider rounded transition-all ${
                  responseMode === 'concise'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-600 hover:text-purple-400'
                }`}
              >
                CONCISE
              </button>
              <button
                onClick={() => setResponseMode('detailed')}
                className={`px-2 py-1 text-[9px] font-mono tracking-wider rounded transition-all ${
                  responseMode === 'detailed'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-600 hover:text-purple-400'
                }`}
              >
                DETAILED
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden pb-24">
        {showBrowser ? (
          /* Browser Mode */
          <div className="flex-1 flex flex-col">
            {/* Browser Controls */}
            <div className="bg-black/90 border-b border-purple-500/20 px-6 py-3 flex items-center gap-3">
              <button
                onClick={() => {
                  setBrowserUrl('');
                  setBrowserInput('');
                }}
                className="p-2 bg-black/50 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-all"
                title="Home"
              >
                <Home className="w-4 h-4 text-purple-400" />
              </button>
              
              <button
                onClick={handleBrowserNavigate}
                disabled={isBrowserLoading}
                className="p-2 bg-black/50 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-all disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-purple-400 ${isBrowserLoading ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex-1 flex items-center gap-2 bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <Input
                  value={browserInput}
                  onChange={(e) => setBrowserInput(e.target.value)}
                  onKeyPress={handleBrowserKeyPress}
                  placeholder="Enter URL or search query..."
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-600 h-7 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                />
              </div>

              <button
                onClick={handleBrowserNavigate}
                disabled={!browserInput.trim() || isBrowserLoading}
                className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50 font-mono text-xs"
              >
                {isBrowserLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'GO'}
              </button>
            </div>

            {/* Browser Content */}
            <div className="flex-1 bg-black relative">
              {isBrowserLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-purple-400 font-mono text-sm">Loading page...</p>
                  </div>
                </div>
              )}
              
              {browserUrl ? (
                <iframe
                  ref={iframeRef}
                  src={browserUrl}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={() => setIsBrowserLoading(false)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <Globe className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">TTT Browser</h3>
                    <p className="text-gray-400 text-sm">
                      Enter a URL or search query above to browse the web
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Chat Mode */
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.length === 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-purple-500/20">
                      <Globe className="w-10 h-10 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Zeku AI Web Search</h2>
                    <p className="text-gray-400 mb-2">
                      Real-time internet-connected intelligence
                    </p>
                    <p className="text-sm text-gray-600">
                      Powered by TTT • Search the web, track crypto markets, analyze trends
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
                          ? 'bg-purple-500/20 border border-purple-500/40 text-white'
                          : msg.isError
                            ? 'bg-red-500/20 border border-red-500/40 text-red-200'
                            : 'bg-black/60 border border-purple-500/20 text-gray-200'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <>
                          <ReactMarkdown
                            className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            components={{
                              p: ({ children }) => <p className="my-2 leading-relaxed text-sm">{children}</p>,
                              ul: ({ children }) => <ul className="my-2 ml-4 list-disc text-sm">{children}</ul>,
                              ol: ({ children }) => <ol className="my-2 ml-4 list-decimal text-sm">{children}</ol>,
                              li: ({ children }) => <li className="my-1">{children}</li>,
                              h1: ({ children }) => <h1 className="text-base font-bold my-3 text-purple-400">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-bold my-2 text-purple-400">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold my-2 text-purple-400">{children}</h3>,
                              code: ({ inline, children }) => 
                                inline ? (
                                  <code className="px-1.5 py-0.5 rounded bg-black/50 text-purple-400 text-xs font-mono">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block p-3 rounded-lg bg-black/50 text-purple-400 text-xs font-mono my-2 overflow-x-auto">
                                    {children}
                                  </code>
                                ),
                              strong: ({ children }) => <strong className="text-purple-400 font-bold">{children}</strong>,
                              a: ({ href, children }) => (
                                <a 
                                  href={href} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 underline"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>

                          {/* Citations */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-purple-500/20">
                              <div className="text-xs text-purple-400 font-semibold mb-2 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                Sources
                              </div>
                              <div className="space-y-2">
                                {msg.citations.map((citation, i) => (
                                  <a
                                    key={i}
                                    href={citation}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-300 transition-colors group"
                                  >
                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate group-hover:underline">{citation}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-black/60 border border-purple-500/20 rounded-2xl px-6 py-4 backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        <span className="text-sm text-purple-400 font-mono">Searching the web...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Input Area - Fixed at bottom with proper spacing */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-purple-500/20 bg-black/95 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex gap-3 items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search the web with Zeku AI..."
              disabled={isLoading}
              rows={1}
              className="flex-1 min-h-[52px] max-h-[120px] bg-black/50 border border-purple-500/30 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 font-mono text-sm px-4 py-3 rounded-xl outline-none backdrop-blur-xl disabled:opacity-50 resize-none"
              style={{ lineHeight: '1.5' }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3.5 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs tracking-wider font-bold backdrop-blur-xl flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SEARCHING
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  SEARCH
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t border-purple-500/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <p className="text-center text-[10px] text-gray-700 tracking-wider">
              ZEKU AI WEB SEARCH • POWERED BY TTT • REAL-TIME INTERNET CONNECTION
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
