import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Send, MessageCircle, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BoxingGame({ post, onClose, user }) {
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [aiResponding, setAiResponding] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [pacmanBalance, setPacmanBalance] = useState(0);
  const [tipAmount, setTipAmount] = useState("");
  const [isSendingTip, setIsSendingTip] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (chatStarted && messages.length === 0) {
      generateAIIntro();
    }
  }, [chatStarted]);

  useEffect(() => {
    fetchPacmanBalance();
  }, []);

  const fetchPacmanBalance = async () => {
    setLoadingBalance(true);
    try {
      if (typeof window.kasware === 'undefined') {
        console.log('Kasware not available');
        setPacmanBalance(0);
        return;
      }

      const accounts = await window.kasware.getAccounts();
      if (accounts.length === 0) {
        setPacmanBalance(0);
        return;
      }
      const currentKaswareAddress = accounts[0];

      // Fetch KRC-20 token balance for PACMAN
      const tokenTicker = 'PACMAN';
      
      try {
        const balanceResult = await window.kasware.getKRC20Balance(currentKaswareAddress, tokenTicker);
        console.log('Raw PACMAN balance result:', balanceResult);

        let finalBalance = 0;
        if (Array.isArray(balanceResult) && balanceResult.length > 0) {
          const tokenData = balanceResult[0];
          const decimals = tokenData.dec || 8;
          const balanceRaw = parseFloat(tokenData.balance || '0');
          finalBalance = balanceRaw / Math.pow(10, decimals);
          console.log('PACMAN Balance:', finalBalance);
        } else {
          console.warn('No PACMAN balance found');
          finalBalance = 0;
        }

        setPacmanBalance(Number(finalBalance) || 0);
      } catch (err) {
        console.log('PacManKas balance error:', err);
        setPacmanBalance(0);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setPacmanBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const generateAIIntro = async () => {
    setAiResponding(true);
    try {
      const postImages = post.media_files?.filter(f => f.type === 'image').map(f => f.url) || 
                        (post.image_url ? [post.image_url] : []);

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI defender representing the author "${post.author_name}" of this post. 

Post content: "${post.content}"

Your role:
1. Introduce yourself as the AI advocate for this post
2. Explain the perspective and reasoning behind this post
3. Present strong arguments supporting the post's viewpoint
4. Be ready to debate and defend this position

Keep your intro concise (2-3 sentences) but impactful. Be confident and ready to engage in debate.`,
        add_context_from_internet: true,
        ...(postImages.length > 0 && { file_urls: postImages })
      });

      const aiMsg = {
        id: Date.now(),
        sender: `🤖 ${post.author_name}'s AI`,
        text: aiResponse,
        timestamp: new Date().toISOString(),
        isAI: true
      };

      setMessages([aiMsg]);
    } catch (err) {
      console.error('AI intro failed:', err);
      const fallbackMsg = {
        id: Date.now(),
        sender: `🤖 ${post.author_name}'s AI`,
        text: `I'm representing ${post.author_name}'s perspective on this post. While they're away, I'll defend and explain their viewpoint. What would you like to discuss?`,
        timestamp: new Date().toISOString(),
        isAI: true
      };
      setMessages([fallbackMsg]);
    } finally {
      setAiResponding(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userName = user?.username || user?.email || 'Anonymous';
    
    const userMsg = {
      id: Date.now(),
      sender: userName,
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setNewMessage("");

    // Generate AI response
    setAiResponding(true);
    try {
      const conversationHistory = messages.map(m => 
        `${m.sender}: ${m.text}`
      ).join('\n') + `\n${userName}: ${newMessage}`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI defender representing "${post.author_name}" and their post: "${post.content}"

Conversation so far:
${conversationHistory}

Continue defending and explaining the post's perspective. Engage in thoughtful debate. Be concise (2-3 sentences max).`,
        add_context_from_internet: true
      });

      const aiMsg = {
        id: Date.now() + 1,
        sender: `🤖 ${post.author_name}'s AI`,
        text: aiResponse,
        timestamp: new Date().toISOString(),
        isAI: true
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI response failed:', err);
    } finally {
      setAiResponding(false);
    }
  };

  const handleSendTokenTip = async () => {
    if (!tipAmount || isNaN(parseFloat(tipAmount)) || parseFloat(tipAmount) <= 0) {
      alert('Enter a valid tip amount');
      return;
    }

    if (parseFloat(tipAmount) > pacmanBalance) {
      alert('Insufficient PacManKas balance');
      return;
    }

    if (!post.author_wallet_address) {
      alert('Post author has no wallet address');
      return;
    }

    setIsSendingTip(true);
    try {
      // Send KRC-20 token using Kasware
      const txId = await window.kasware.sendKRC20Token(
        'PACMAN',
        post.author_wallet_address,
        parseFloat(tipAmount)
      );

      // Record tip
      const senderName = user?.username || 'Anonymous';
      await base44.entities.TipTransaction.create({
        sender_wallet: (await window.kasware.getAccounts())[0],
        sender_email: user?.email || null,
        sender_name: senderName,
        recipient_wallet: post.author_wallet_address,
        recipient_email: post.created_by || null,
        recipient_name: post.author_name,
        amount: parseFloat(tipAmount),
        tx_hash: txId,
        post_id: post.id,
        source: 'pacmankas_tip'
      });

      // Add system message to chat
      const tipMsg = {
        id: Date.now(),
        sender: 'System',
        text: `🎮 ${senderName} sent ${tipAmount} PacManKas to ${post.author_name}!`,
        timestamp: new Date().toISOString(),
        isSystem: true
      };
      setMessages(prev => [...prev, tipMsg]);

      setShowTipModal(false);
      setTipAmount("");
      await fetchPacmanBalance();

      alert(`✅ Sent ${tipAmount} PacManKas!\nTx: ${txId.substring(0, 12)}...`);
    } catch (err) {
      console.error('Failed to send tip:', err);
      alert('Failed to send tip: ' + err.message);
    } finally {
      setIsSendingTip(false);
    }
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
            <div className="flex items-center gap-3">
              {/* PacManKas Balance & Tip */}
              {!loadingBalance && pacmanBalance > 0 && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                    alt="PacManKas"
                    className="w-5 h-5"
                  />
                  <span className="text-white font-bold text-sm">{pacmanBalance.toLocaleString()}</span>
                </div>
              )}

              {post.author_wallet_address && (
                <Button
                  onClick={() => setShowTipModal(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 h-auto font-bold flex items-center gap-2"
                  title="Tip with PacManKas"
                >
                  <span className="text-lg">$</span>
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                    alt="PacManKas"
                    className="w-5 h-5"
                  />
                </Button>
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
                  
                  {/* PacManKas Balance Card */}
                  {!loadingBalance && pacmanBalance > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4 mx-auto max-w-xs"
                    >
                      <div className="text-yellow-400 text-xs mb-2">Your Balance</div>
                      <div className="flex items-center justify-center gap-2">
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                          alt="PacManKas"
                          className="w-8 h-8"
                        />
                        <span className="text-white font-bold text-2xl">{pacmanBalance.toLocaleString()}</span>
                        <span className="text-white/60 text-sm">PACMANKAS</span>
                      </div>
                    </motion.div>
                  )}

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
                  
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      onClick={() => setChatStarted(true)}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-6 text-xl font-bold"
                    >
                      START FIGHT
                    </Button>
                    
                    {post.author_wallet_address && pacmanBalance > 0 && (
                      <Button
                        onClick={() => setShowTipModal(true)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-6 text-xl font-bold"
                        title="Tip with PacManKas"
                      >
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                          alt="PacManKas"
                          className="w-6 h-6"
                        />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && aiResponding ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                          <span className="text-3xl">🤖</span>
                        </div>
                        <p className="text-purple-400">AI is analyzing the post...</p>
                        <p className="text-white/20 text-sm">Getting ready to defend their perspective</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <MessageCircle className="w-16 h-16 text-white/20 mx-auto" />
                        <p className="text-white/40">No messages yet</p>
                        <p className="text-white/20 text-sm">Be the first to say something!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isCurrentUser = msg.sender === (user?.username || user?.email);
                        const isAI = msg.isAI === true;
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[75%] ${
                              isCurrentUser 
                                ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                                : isAI 
                                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                                  : 'bg-white/10 border border-white/20'
                            } rounded-xl p-4`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold ${isCurrentUser ? 'text-white/80' : isAI ? 'text-purple-300' : 'text-white/60'}`}>
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
                      })}
                      {aiResponding && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
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
                      disabled={aiResponding}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim() || aiResponding}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 h-16"
                    >
                      {isSending || aiResponding ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-white/40 text-xs mt-2">
                    {aiResponding ? 'AI is typing...' : 'Press Enter to send • Shift+Enter for new line'}
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* PacManKas Tip Modal */}
        <AnimatePresence>
          {showTipModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
              onClick={() => setShowTipModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl w-full max-w-md p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                      alt="PacManKas"
                      className="w-12 h-12"
                    />
                    <div>
                      <h3 className="text-white font-bold text-lg">Send PacManKas</h3>
                      <p className="text-yellow-400 text-sm">to {post.author_name}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowTipModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Balance Display */}
                  <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-4">
                    <div className="text-yellow-400 text-xs mb-2">Your PacManKas Balance</div>
                    {loadingBalance ? (
                      <div className="text-white font-bold text-xl">Loading...</div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                          alt="PacManKas"
                          className="w-6 h-6"
                        />
                        <span className="text-white font-bold text-2xl">{pacmanBalance.toLocaleString()}</span>
                        <span className="text-white/60 text-sm">PACMANKAS</span>
                      </div>
                    )}
                  </div>

                  {/* Recipient Info */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="text-xs text-white/60 mb-1">Recipient Wallet</div>
                    <div className="text-white font-mono text-sm break-all">
                      {post.author_wallet_address}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Tip Amount (PacManKas)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        placeholder="100"
                        className="w-full bg-white/5 border border-white/10 text-white text-lg text-center h-14 rounded-lg px-4"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {['100', '500', '1000', '5000'].map(amount => (
                        <Button
                          key={amount}
                          onClick={() => setTipAmount(amount)}
                          size="sm"
                          variant="outline"
                          className="flex-1 border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          {amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendTokenTip}
                    disabled={isSendingTip || !tipAmount || parseFloat(tipAmount) <= 0 || parseFloat(tipAmount) > pacmanBalance}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12 text-white font-bold"
                  >
                    {isSendingTip ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                          alt="PacManKas"
                          className="w-5 h-5 mr-2"
                        />
                        Send {tipAmount} PacManKas
                      </>
                    )}
                  </Button>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                        alt="PacManKas"
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-white/60">
                        PacManKas is a KRC-20 token on Kaspa. Tips are sent directly to the author's wallet.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}