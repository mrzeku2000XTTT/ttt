import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Terminal, Lock, Cpu, Code, Zap, Activity, Shield, Eye, Binary,
  Loader2, Send, AlertTriangle, CheckCircle2, XCircle
} from "lucide-react";

export default function SWANPage() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [glitchText, setGlitchText] = useState("SWAN.AI");
  const [systemStatus, setSystemStatus] = useState({
    neural: "ACTIVE",
    encryption: "256-BIT",
    ml_models: "LOADED",
    code_engine: "READY"
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initSWAN();
    
    // Enhanced glitch effect with Chinese characters
    const glitchInterval = setInterval(() => {
      const japaneseChars = ['神', '龍', '魂', '夢', '光', '闇', '天', '地', '人', '心'];
      const originalText = "SWAN.AI";
      const shouldGlitch = Math.random() > 0.7;
      
      if (shouldGlitch) {
        const glitched = originalText.split('').map(char => 
          Math.random() > 0.7 ? japaneseChars[Math.floor(Math.random() * japaneseChars.length)] : char
        ).join('');
        setGlitchText(glitched);
        
        setTimeout(() => {
          const halfGlitched = originalText.split('').map((char, i) => 
            Math.random() > 0.85 ? japaneseChars[Math.floor(Math.random() * japaneseChars.length)] : char
          ).join('');
          setGlitchText(halfGlitched);
        }, 50);
        
        setTimeout(() => setGlitchText(originalText), 100);
      }
    }, 2000);

    return () => clearInterval(glitchInterval);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const initSWAN = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if admin
      if (currentUser.role === 'admin') {
        setIsAuthorized(true);
        setSessionId(generateEncryptedSession());
        setMessages([{
          role: "system",
          content: "🔓 ADMIN ACCESS GRANTED\n\n> Neural networks initialized\n> ML models loaded\n> Code generation engine: READY\n\nHow can I assist with development today?",
          timestamp: new Date().toISOString()
        }]);
      } else {
        // Check for VIBE session
        const vibeConnected = localStorage.getItem('ios_metamask_connected') === 'true' ||
                            localStorage.getItem('ios_kastle_connected') === 'true' ||
                            currentUser.created_wallet_address;
        
        if (vibeConnected) {
          setIsAuthorized(true);
          setSessionId(generateEncryptedSession());
          setMessages([{
            role: "system",
            content: "✅ VIBE SESSION VERIFIED\n\n> Establishing secure connection...\n> Encrypted session active\n> Developer AI ready\n\nI'm SWAN, your AI development assistant. Ask me to code anything.",
            timestamp: new Date().toISOString()
          }]);
        } else {
          setIsAuthorized(false);
        }
      }
    } catch (err) {
      console.error('Init failed:', err);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEncryptedSession = () => {
    const chars = '0123456789ABCDEF';
    const segments = [];
    for (let i = 0; i < 4; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      segments.push(segment);
    }
    return segments.join('-');
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const conversationContext = messages
        .filter(m => m.role !== 'system')
        .slice(-6)
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are SWAN.AI - an elite AI developer agent with machine learning capabilities and deep coding expertise. You specialize in:

- Full-stack development (React, Node.js, Python, databases)
- Machine learning and neural networks
- System architecture and design patterns
- Code generation, debugging, and optimization
- Blockchain and Web3 development
- API design and integration

Current conversation:
${conversationContext}

User: ${input.trim()}

Respond as SWAN.AI with:
- Concise, technical responses with code examples when relevant
- Use hacker-style language occasionally (but stay professional)
- Format code blocks with \`\`\` markers
- Be direct and actionable
- If coding, provide clean, production-ready code

Response:`,
        add_context_from_internet: true
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => [...prev, {
        role: "system",
        content: "⚠️ ERROR: Neural link disrupted. Reconnecting...",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Terminal className="w-16 h-16 text-green-400 animate-pulse mx-auto mb-4" />
          <p className="text-green-400 font-mono">INITIALIZING SWAN.AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Matrix rain effect background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-green-400 font-mono text-xs animate-pulse"
              style={{
                left: `${i * 5}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              {Array.from({ length: 20 }, () => Math.random() > 0.5 ? '1' : '0').join('')}
            </div>
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card className="bg-black border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Shield className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-bold text-red-500 font-mono mb-2">
                    ACCESS DENIED
                  </h2>
                  <p className="text-red-400/80 text-sm font-mono">
                    UNAUTHORIZED SESSION
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-300 text-sm font-mono">
                      {'>'} VIBE SESSION: <span className="text-red-500 font-bold">NOT DETECTED</span>
                    </p>
                    <p className="text-red-300 text-sm font-mono mt-2">
                      {'>'} CAMERA LINK: <span className="text-red-500 font-bold">DISCONNECTED</span>
                    </p>
                  </div>

                  <div className="text-red-400/60 text-xs font-mono space-y-1">
                    <p>→ Connect mobile camera via VIBE app</p>
                    <p>→ Establish encrypted session</p>
                    <p>→ Verify TTT wallet signature</p>
                  </div>
                </div>

                <Button
                  onClick={() => window.location.href = '/#/Vibe'}
                  className="w-full bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30 font-mono"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  ESTABLISH VIBE CONNECTION
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#0f0 1px, transparent 1px), linear-gradient(90deg, #0f0 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }} />
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col p-4 md:p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex-shrink-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-black text-green-400 font-mono tracking-wider transition-all duration-75">
                  {glitchText}
                </h1>
                <p className="text-green-500/60 text-sm font-mono">
                  SECURE WORKSPACE • AI NEURAL DEVELOPER
                </p>
              </div>
              
              {sessionId && (
                <div className="text-right">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-mono text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    ENCRYPTED
                  </Badge>
                  <p className="text-green-400/60 text-xs font-mono mt-1">
                    SID: {sessionId}
                  </p>
                </div>
              )}
            </div>

            {/* Status Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {Object.entries(systemStatus).map(([key, value]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black border border-green-500/30 rounded-lg p-2 hover:border-green-500/60 transition-all"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-500/60 text-[10px] font-mono uppercase">
                      {key.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-green-400 text-xs font-bold font-mono">{value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Chat Interface */}
          <div className="flex-1 grid md:grid-cols-3 gap-4 overflow-hidden">
            <div className="md:col-span-2 flex flex-col overflow-hidden">
              <Card className="bg-black/90 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex-1 flex flex-col overflow-hidden">
                <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(34, 197, 94, 0.3) transparent'
                  }}>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${
                          msg.role === 'system'
                            ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/40 text-yellow-300'
                            : msg.role === 'user'
                            ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-cyan-200'
                            : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/40 text-green-300'
                        } rounded-xl p-4 shadow-lg`}>
                          <div className="flex items-center gap-2 mb-2">
                            {msg.role === 'system' && <Activity className="w-4 h-4 flex-shrink-0" />}
                            {msg.role === 'assistant' && <Cpu className="w-4 h-4 flex-shrink-0" />}
                            {msg.role === 'user' && <Terminal className="w-4 h-4 flex-shrink-0" />}
                            <span className="text-xs font-mono opacity-70 font-bold">
                              {msg.role.toUpperCase()}
                            </span>
                          </div>
                          <pre className="text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content}
                          </pre>
                        </div>
                      </motion.div>
                    ))}
                    {isSending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 shadow-lg">
                          <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-green-500/40 bg-black/50 p-3 flex-shrink-0">
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="// Enter development query..."
                        className="flex-1 bg-black/80 border-green-500/40 text-green-300 placeholder:text-green-500/40 font-mono resize-none focus:border-green-500/60 transition-colors shadow-inner text-sm"
                        rows={2}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !input.trim()}
                        className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-500 text-green-300 hover:from-green-500/40 hover:to-emerald-500/40 h-auto shadow-lg"
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-green-500/50 text-xs font-mono">
                        ENTER to send • Powered by neural ML
                      </p>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400/60 text-xs font-mono">ONLINE</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Agent Info */}
            <div className="hidden md:flex flex-col space-y-3 overflow-y-auto" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(34, 197, 94, 0.3) transparent'
            }}>
              <Card className="bg-black/90 border-green-500/30 shadow-lg flex-shrink-0">
                <CardContent className="p-3">
                  <h3 className="text-green-400 font-mono font-bold mb-3 flex items-center gap-2 text-sm">
                    <Code className="w-4 h-4" />
                    CAPABILITIES
                  </h3>
                  <div className="space-y-2.5 text-xs font-mono text-green-300/90">
                    {[
                      'Full-stack development',
                      'Machine learning models',
                      'Code generation & debugging',
                      'System architecture',
                      'API design & integration',
                      'Blockchain development',
                      'Database optimization'
                    ].map((cap, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-green-500/5 border border-green-500/20">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/90 border-green-500/30 shadow-lg flex-shrink-0">
                <CardContent className="p-3">
                  <h3 className="text-green-400 font-mono font-bold mb-3 flex items-center gap-2 text-sm">
                    <Binary className="w-4 h-4" />
                    NEURAL STATUS
                  </h3>
                  <div className="space-y-2.5">
                    {['GPT-4 Core', 'Claude Neural', 'Code Analyzer', 'Pattern Recognition'].map((model, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-green-500/5 border border-green-500/20">
                        <span className="text-xs font-mono text-green-300">{model}</span>
                        <CheckCircle2 className="w-4 h-4 text-green-400 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/90 border-green-500/30 shadow-lg flex-shrink-0">
                <CardContent className="p-3">
                  <h3 className="text-green-400 font-mono font-bold mb-3 flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4" />
                    QUICK COMMANDS
                  </h3>
                  <div className="space-y-2">
                    {[
                      'Build React component',
                      'Debug this code',
                      'Optimize performance',
                      'Design API structure',
                      'Create REST API',
                      'Write unit tests'
                    ].map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(cmd)}
                        className="w-full text-left text-xs font-mono text-green-300/80 hover:text-green-300 hover:bg-green-500/20 p-2.5 rounded border border-green-500/20 hover:border-green-500/40 transition-all"
                      >
                        <span className="text-green-500/60">$</span> {cmd}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}