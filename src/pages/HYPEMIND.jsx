import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Zap, TrendingUp, Send, Loader2, Sparkles, X } from "lucide-react";
import { createPageUrl } from "@/utils";

function GlitchWord({ word, isChinese, baseX, baseY, mousePos, delay }) {
  const [position, setPosition] = useState({ x: baseX, y: baseY });

  useEffect(() => {
    const distance = Math.sqrt(
      Math.pow(mousePos.x - position.x, 2) + Math.pow(mousePos.y - position.y, 2)
    );

    const avoidanceRadius = 150;

    if (distance < avoidanceRadius) {
      const angle = Math.atan2(position.y - mousePos.y, position.x - mousePos.x);
      const pushDistance = (avoidanceRadius - distance) * 0.5;

      setPosition({
        x: position.x + Math.cos(angle) * pushDistance,
        y: position.y + Math.sin(angle) * pushDistance
      });
    } else {
      const returnSpeed = 0.05;
      setPosition({
        x: position.x + (baseX - position.x) * returnSpeed,
        y: position.y + (baseY - position.y) * returnSpeed
      });
    }
  }, [mousePos, baseX, baseY, position.x, position.y]);

  return (
    <motion.div
      animate={{
        x: position.x,
        y: position.y,
        opacity: [0.2, 1, 0.5, 0.8, 0.3],
        scale: [0.8, 1.3, 0.9, 1.1, 0.85],
        rotate: [0, 15, -10, 5, 0],
      }}
      transition={{
        x: { type: "spring", stiffness: 50, damping: 15 },
        y: { type: "spring", stiffness: 50, damping: 15 },
        opacity: { duration: 2 + Math.random(), repeat: Infinity, delay },
        scale: { duration: 3 + Math.random() * 2, repeat: Infinity, delay },
        rotate: { duration: 4 + Math.random(), repeat: Infinity, delay },
      }}
      className={`absolute text-white font-black ${isChinese ? 'text-4xl' : 'text-2xl'} pointer-events-none select-none`}
      style={{
        textShadow: `0 0 30px rgba(168, 85, 247, 0.9), 0 0 60px rgba(236, 72, 153, 0.5)`,
        mixBlendMode: 'screen',
        filter: `blur(${Math.random() * 2}px)`,
      }}
    >
      {word}
    </motion.div>
  );
}

export default function HYPEMINDPage() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [showChatBox, setShowChatBox] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadUser();
    loadHistory();

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const loadHistory = () => {
    const saved = localStorage.getItem('hypemind_history');
    if (saved) {
      const parsedHistory = JSON.parse(saved);
      setHistory(parsedHistory);
    } else {
      // Day 1 intro log
      const day1Log = {
        id: 1,
        prompt: "Day 1 - Introduction",
        response: "Watch the origin story: https://youtube.com/shorts/icv13wKddBM?feature=share",
        timestamp: new Date('2025-11-27').toISOString(),
        isSystemLog: true
      };
      setHistory([day1Log]);
      localStorage.setItem('hypemind_history', JSON.stringify([day1Log]));
    }
  };

  const saveHistory = (newHistory) => {
    localStorage.setItem('hypemind_history', JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setResponse("");
    setShowChatBox(false);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are HYPEMIND, an advanced AI assistant specialized in creative thinking, problem solving, and generating innovative ideas. Respond to the following: ${prompt}`,
        add_context_from_internet: true
      });

      setResponse(result);

      const newEntry = {
        id: Date.now(),
        prompt,
        response: result,
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [newEntry, ...history].slice(0, 10);
      saveHistory(updatedHistory);
      setPrompt("");
    } catch (err) {
      console.error('Failed to generate:', err);
      setResponse("❌ Failed to generate response. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteHistoryItem = (id) => {
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Static Background Image (screenshot from video) */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80)',
            filter: 'brightness(0.4)'
          }}
        />
      </div>

      {/* YouTube Background (playing with audio behind static image) */}
      <div className="fixed inset-0 z-0 overflow-hidden opacity-30">
        <iframe
          className="absolute top-1/2 left-1/2 w-[300vw] h-[300vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          src="https://www.youtube.com/embed/6F156_hZz7I?autoplay=1&loop=1&playlist=6F156_hZz7I&mute=0&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1"
          frameBorder="0"
          allow="autoplay; encrypted-media"
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-pink-500/15 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {showChatBox && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center mb-8"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Brain className="w-12 h-12 text-purple-400" />
                  </motion.div>
                  <h1 className="text-5xl font-black text-white">HYPEMIND</h1>
                </div>
                <p className="text-white/60 text-lg">Advanced AI-Powered Creative Intelligence</p>
              </motion.div>

              <Card className="bg-black/60 border-purple-500/30 backdrop-blur-xl mb-6">
            <CardContent className="p-6">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="Ask HYPEMIND anything... (Press Enter to send)"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[120px] mb-4 text-base"
                disabled={isGenerating}
              />

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-12 text-lg font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Response
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
            </>
          )}

          {!showChatBox && response && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 flex items-center justify-center z-20 overflow-hidden"
            >
              {/* Glitching Visual Pattern with Mouse Avoidance */}
              <div className="absolute inset-0">
                {Array.from({ length: 80 }).map((_, i) => {
                  const kaspaSeedWords = [
                    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
                    'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
                    'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
                    'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
                    'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
                    'wallet', 'seed', 'phrase', 'private', 'public', 'key', 'blockchain', 'crypto', 'kaspa', 'transaction'
                  ];
                  const chineseChars = [
                    '加', '密', '货', '币', '区', '块', '链', '数', '字', '资',
                    '产', '交', '易', '钱', '包', '网', '络', '节', '点', '挖',
                    '矿', '算', '力', '安', '全', '私', '钥', '公', '钥', '地',
                    '址', '转', '账', '收', '益', '投', '资', '风', '险', '价',
                    '值', '市', '场', '波', '动', '涨', '跌', '持', '有', '卡',
                    '量', '子', '计', '算', '未', '来', '科', '技', '创', '新'
                  ];
                  
                  const isChinese = Math.random() > 0.5;
                  const randomWord = isChinese 
                    ? chineseChars[Math.floor(Math.random() * chineseChars.length)]
                    : kaspaSeedWords[Math.floor(Math.random() * kaspaSeedWords.length)];
                  
                  const baseX = (i % 10) * (window.innerWidth / 10) + Math.random() * 100;
                  const baseY = Math.floor(i / 10) * (window.innerHeight / 8) + Math.random() * 100;
                  
                  return (
                    <GlitchWord
                      key={i}
                      word={randomWord}
                      isChinese={isChinese}
                      baseX={baseX}
                      baseY={baseY}
                      mousePos={mousePos}
                      delay={Math.random() * 2}
                    />
                  );
                })}
              </div>

              {/* Glitch Lines */}
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={`line-${i}`}
                  className="absolute w-full h-1 bg-gradient-to-r from-purple-500/50 to-pink-500/50"
                  initial={{ y: Math.random() * window.innerHeight, opacity: 0 }}
                  animate={{
                    y: [
                      Math.random() * window.innerHeight,
                      Math.random() * window.innerHeight,
                      Math.random() * window.innerHeight,
                    ],
                    opacity: [0, 0.8, 0, 0.6, 0],
                    scaleX: [1, 0.5, 1, 0.3, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random(),
                  }}
                />
              ))}

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowChatBox(true);
                  setResponse("");
                }}
                className="fixed top-8 right-8 z-30 w-12 h-12 bg-black/50 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {showChatBox && response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/40 backdrop-blur-xl mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-bold text-lg">HYPEMIND Response</h3>
                  </div>
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                    {response}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {showChatBox && history.length > 0 && (
            <div className="mt-8">
              <h2 className="text-white font-bold text-2xl mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                Recent Sessions
              </h2>

              <div className="space-y-4">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className={`bg-black/40 border-white/10 backdrop-blur-xl hover:border-purple-500/30 transition-colors ${item.isSystemLog ? 'border-yellow-500/40 bg-yellow-500/5' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="text-white/50 text-xs mb-1">
                              {new Date(item.timestamp).toLocaleString()}
                            </div>
                            <div className={`font-semibold mb-2 ${item.isSystemLog ? 'text-yellow-400' : 'text-purple-300'}`}>
                              {item.prompt}
                            </div>
                          </div>
                          {!item.isSystemLog && (
                            <button
                              onClick={() => deleteHistoryItem(item.id)}
                              className="text-white/40 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="text-white/70 text-sm">
                          {item.response.includes('youtube.com/shorts/') || item.response.includes('youtu.be/') ? (
                            <Link
                              to={createPageUrl('OriginStory')}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors"
                            >
                              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                              <span>Watch Origin Story</span>
                            </Link>
                          ) : (
                            <div className="line-clamp-3">{item.response}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}