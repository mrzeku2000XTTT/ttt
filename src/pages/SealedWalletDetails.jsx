import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Copy, ExternalLink, Loader2, CheckCircle2, Wallet, RefreshCw, Bot, Send, X, Stamp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function SealedWalletDetailsPage() {
  const navigate = useNavigate();
  const [sealedWallet, setSealedWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [kasPrice, setKasPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [isStamping, setIsStamping] = useState(false);
  const [stampSuccess, setStampSuccess] = useState(null);
  
  // AI Agent states
  const [showAI, setShowAI] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null);
  
  // Ref for auto-scroll
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    loadSealedWallet();
    
    // Cleanup: clear conversation when leaving page (zero-knowledge)
    return () => {
      setConversation(null);
      setMessages([]);
    };
  }, []);

  useEffect(() => {
    if (conversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        if (data && data.messages) {
          setMessages(data.messages || []);
          setIsSending(false);
        }
      });

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [conversation?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  const loadSealedWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const params = new URLSearchParams(window.location.search);
      const walletId = params.get('id');
      
      if (!walletId) {
        setError('No wallet ID provided');
        setIsLoading(false);
        return;
      }

      const wallets = await base44.entities.SealedWallet.filter({ id: walletId });
      
      if (wallets.length === 0) {
        setError('Sealed wallet not found');
        setIsLoading(false);
        return;
      }

      const wallet = wallets[0];
      setSealedWallet(wallet);
      
      await fetchBalance(wallet.wallet_address);
      
      const priceRes = await base44.functions.invoke('getKaspaPrice');
      setKasPrice(priceRes.data?.price || 0.05);
      
    } catch (err) {
      console.error('Failed to load sealed wallet:', err);
      setError('Failed to load wallet details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalance = async (address) => {
    try {
      const res = await base44.functions.invoke('getKaspaBalance', { address });
      setBalance(res.data?.balanceKAS || 0);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setBalance(0);
    }
  };

  const handleRefreshBalance = async () => {
    if (!sealedWallet) return;
    setIsRefreshing(true);
    await fetchBalance(sealedWallet.wallet_address);
    setIsRefreshing(false);
  };

  const handleCopy = async () => {
    if (!sealedWallet) return;
    try {
      await navigator.clipboard.writeText(sealedWallet.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleImport = () => {
    navigate(createPageUrl("Wallet"));
  };

  const handleStampWallet = async () => {
    if (!sealedWallet) return;
    
    if (!window.kasware) {
      setError('Please install Kasware wallet extension');
      return;
    }

    setIsStamping(true);
    setError(null);
    setStampSuccess(null);

    try {
      const accounts = await window.kasware.getAccounts();
      if (accounts.length === 0) {
        throw new Error('Please connect Kasware wallet');
      }

      const parentAddress = accounts[0];
      
      const stampMessage = `🔐 KASWARE L1 PARENT STAMP

I am stamping this TTT wallet with my Kasware L1 address.

Parent Address (Kasware L1): ${parentAddress}
Child Wallet (TTT): ${sealedWallet.wallet_address}

This creates a 2FA verification proving:
- I own the Kasware L1 address (parent)
- I control the sealed TTT wallet (child)

Timestamp: ${Date.now()}

This is my Kasware Parent Stamp.`;
      
      const signature = await window.kasware.signMessage(stampMessage);

      await base44.entities.SealedWallet.update(sealedWallet.id, {
        parent_kasware_address: parentAddress,
        parent_stamp_signature: signature,
        parent_stamp_message: stampMessage,
        stamped_date: new Date().toISOString(),
        is_stamped: true
      });

      setStampSuccess(`✅ Wallet stamped successfully with parent address: ${parentAddress.substring(0, 15)}...`);
      await loadSealedWallet();

    } catch (err) {
      console.error('Stamp error:', err);
      setError(err.message || 'Failed to stamp wallet');
    } finally {
      setIsStamping(false);
    }
  };

  const startAIAnalysis = async () => {
    if (!sealedWallet) return;
    
    setShowAI(true);
    
    // Always create a NEW conversation (zero-knowledge protocol)
    // Previous context exists in backend but UI starts fresh
    setMessages([]);
    setConversation(null);
    
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "sealed_wallet_analyzer",
        metadata: {
          name: `Analysis: ${sealedWallet.wallet_address.substring(0, 20)}...`,
          wallet_address: sealedWallet.wallet_address,
          user_email: user?.email
        }
      });
      
      setConversation(conv);
      
      setTimeout(async () => {
        const message = `Analyze this sealed wallet:

Address: ${sealedWallet.wallet_address}
Sealed Date: ${new Date(sealedWallet.sealed_date).toLocaleDateString()}
Balance at Seal: ${sealedWallet.balance_at_seal} KAS
Mnemonic Word Count: ${sealedWallet.mnemonic_word_count} words
Status: ${sealedWallet.is_active ? 'Active' : 'Inactive'}

Please fetch the current balance and give me a detailed analysis comparing current vs sealed balance.`;

        await base44.agents.addMessage(conv, {
          role: "user",
          content: message
        });
      }, 500);
    } catch (err) {
      console.error('Failed to start AI analysis:', err);
      setError('Failed to start AI analysis');
    }
  };

  const handleSendMessage = async () => {
    if (!conversation || !input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput("");
    setIsSending(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessage
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !sealedWallet) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => navigate(createPageUrl("RegisterTTTID"))}
            variant="outline"
            className="mb-6 bg-zinc-900 border-zinc-800 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to TTT ID
          </Button>
          
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Wallet Not Found</h2>
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={() => navigate(createPageUrl("RegisterTTTID"))}
          variant="outline"
          className="mb-6 bg-zinc-900 border-zinc-800 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to TTT ID
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-zinc-950 border-zinc-800 mb-6">
            <CardHeader className="border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Sealed Wallet</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active Seal
                      </Badge>
                      {sealedWallet.is_stamped && (
                        <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          <Stamp className="w-3 h-3 mr-1" />
                          2FA Stamped
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Success/Error Messages */}
              {stampSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-green-300">{stampSuccess}</p>
                  </div>
                </motion.div>
              )}

              {/* Current Balance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Current Balance</label>
                  <Button
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-white mb-1">
                    {balance !== null ? balance.toFixed(8) : '...'} KAS
                  </div>
                  {kasPrice && balance !== null && (
                    <div className="text-lg text-gray-500">
                      ≈ ${(balance * kasPrice).toFixed(2)} USD
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Kaspa Address (Child Wallet)</label>
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <code className="text-cyan-400 text-sm break-all font-mono block mb-3">
                    {sealedWallet.wallet_address}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopy}
                      className="flex-1 bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </>
                      )}
                    </Button>
                    <a
                      href={`https://kas.fyi/address/${sealedWallet.wallet_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-white">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Explorer
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Parent Stamp Info */}
              {sealedWallet.is_stamped && sealedWallet.parent_kasware_address && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Kasware L1 Parent (2FA Verification)</label>
                  <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      <span className="text-sm font-semibold text-cyan-300">2FA Verified with Kasware L1</span>
                    </div>
                    <code className="text-cyan-400 text-xs break-all font-mono block mb-2">
                      {sealedWallet.parent_kasware_address}
                    </code>
                    <div className="text-xs text-gray-400">
                      Stamped: {new Date(sealedWallet.stamped_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Seal Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Sealed Date</div>
                  <div className="text-white font-semibold">
                    {new Date(sealedWallet.sealed_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Balance at Seal</div>
                  <div className="text-white font-semibold">
                    {sealedWallet.balance_at_seal.toFixed(4)} KAS
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Mnemonic Words</div>
                  <div className="text-white font-semibold">
                    {sealedWallet.mnemonic_word_count} words
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="text-green-400 font-semibold">
                    {sealedWallet.is_active ? '✓ Active' : '✗ Inactive'}
                  </div>
                </div>
              </div>

              {/* Stamp Button */}
              {!sealedWallet.is_stamped && (
                <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                          <Stamp className="w-4 h-4 text-cyan-400" />
                          Stamp with Kasware (2FA)
                        </h3>
                        <p className="text-xs text-gray-400">Verify ownership with your Kasware L1 address</p>
                      </div>
                      <Button
                        onClick={handleStampWallet}
                        disabled={isStamping}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm"
                      >
                        {isStamping ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Stamping...
                          </>
                        ) : (
                          <>
                            <Stamp className="w-4 h-4 mr-2" />
                            Stamp Now
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seal Signature */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Seal Signature</label>
                <div className="bg-black border border-zinc-800 rounded-lg p-3">
                  <code className="text-purple-400 text-xs break-all font-mono">
                    {sealedWallet.seal_signature}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Button */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    AI Wallet Analyzer
                  </h3>
                  <p className="text-sm text-gray-400">Get AI insights about this specific wallet</p>
                </div>
                <Button
                  onClick={startAIAnalysis}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Analyze
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Instructions */}
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-blue-300 mb-3">💡 Want to Use This Wallet?</h3>
              <p className="text-sm text-blue-200 mb-4">
                To send KAS or manage this wallet, you'll need to import it using your seed phrase.
              </p>
              <Button
                onClick={handleImport}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Import Wallet (Requires Seed Phrase)
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Chat Interface - FIXED POSITION, INDEPENDENT SCROLL */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed top-0 right-0 h-full w-full md:w-[500px] z-50 bg-zinc-950 border-l border-zinc-800 shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">AI Assistant</h3>
                </div>
                <Button
                  onClick={() => setShowAI(false)}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-zinc-800 h-8 w-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages Container */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-black"
              >
                {messages.length === 0 && !isSending && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Bot className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                      <p className="text-sm">Starting analysis...</p>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-zinc-900 text-gray-200'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2">
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-zinc-800 p-4 bg-zinc-900">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about this wallet..."
                    className="flex-1 bg-black border-zinc-700 text-white placeholder:text-gray-600"
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isSending}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}