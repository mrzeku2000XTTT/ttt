
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileSearch,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Wrench,
  RefreshCw,
  X as XIcon,
  ArrowLeft,
  Eye,
  Target,
  Activity,
  MessageSquare,
  Send,
  Image as ImageIcon
} from "lucide-react";

export default function XPage() {
  const [user, setUser] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [userExplanation, setUserExplanation] = useState("");
  const [enhancedExplanation, setEnhancedExplanation] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [bgPrompt, setBgPrompt] = useState("");
  const [showBgGenerator, setShowBgGenerator] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState("upload");
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [knowledge, setKnowledge] = useState(null);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false); // This state might not be needed anymore or could be integrated
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadUser();
    loadBackground();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const loadBackground = () => {
    const savedBg = localStorage.getItem("x_page_background");
    if (savedBg) {
      setBackgroundImage(savedBg);
    }
  };

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
          savedToHiveMind: response.data.visionDataSaved // 🔥 Show user data was saved
        };
        setChatMessages(prev => [...prev, aiMessage]);

        // Auto-refresh knowledge if vision data was saved
        if (response.data.visionDataSaved) {
          console.log('🧠 New vision data added to hive mind, refreshing...');
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

  // handleImageAnalysis is removed as its functionality is now integrated into handleChat
  // The 'onclick' on image in chat messages is also removed because of this

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile({
        name: file.name,
        url: response.file_url,
        type: file.type,
        size: file.size
      });
      setCurrentStep("explain");
    } catch (err) {
      console.error("File upload failed:", err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEnhanceExplanation = async () => {
    if (!userExplanation.trim()) {
      alert("Please explain what this proof shows");
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Agent Yang, the frontend verification assistant working with Agent Ying (backend ML system).

User uploaded file: ${uploadedFile.name}
User explanation: ${userExplanation}

Your task:
1. Clarify and expand the explanation
2. Extract key verification points
3. Identify what task was completed
4. Make it structured and clear for Agent Ying's verification

Return a clear, detailed explanation that helps Agent Ying understand:
- What task was this?
- What proof does this file show?
- What are the key indicators of completion?

Keep it concise but comprehensive.`,
        add_context_from_internet: false
      });

      setEnhancedExplanation(response);
      setCurrentStep("verify");
    } catch (err) {
      console.error("Enhancement failed:", err);
      alert("AI enhancement failed");
    } finally {
      setIsEnhancing(false);
    }
  };

  const startVerification = async () => {
    if (!uploadedFile || !enhancedExplanation) return;

    setIsScanning(true);
    setScanProgress(0);
    setVerificationResult(null);

    try {
      setScanStatus("📤 Sending to Agent Ying...");
      setScanProgress(10);
      await new Promise(resolve => setTimeout(resolve, 800));

      setScanStatus("🔍 Agent Ying analyzing proof...");
      setScanProgress(30);
      await new Promise(resolve => setTimeout(resolve, 800));

      setScanStatus("📋 Extracting verification patterns...");
      setScanProgress(50);
      await new Promise(resolve => setTimeout(resolve, 800));

      setScanStatus("🧠 Matching against learned patterns...");
      setScanProgress(70);

      const verifyResponse = await base44.functions.invoke("verifyProofOfWork", {
        fileUrl: uploadedFile.url,
        fileName: uploadedFile.name,
        fileType: uploadedFile.type,
        userEmail: user?.email,
        userExplanation: userExplanation,
        enhancedExplanation: enhancedExplanation
      });

      setScanProgress(90);
      setScanStatus("🎓 Agent Ying learning...");
      await new Promise(resolve => setTimeout(resolve, 800));

      setScanProgress(100);
      setScanStatus("✅ Verification complete!");

      if (verifyResponse.data) {
        setVerificationResult(verifyResponse.data);
      }

    } catch (err) {
      console.error("Verification failed:", err);
      setScanStatus("❌ Verification failed");
      alert("Verification failed: " + err.message);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 1000);
    }
  };

  const generateBackground = async () => {
    if (!bgPrompt.trim()) {
      alert("Enter a background prompt");
      return;
    }

    setIsGeneratingBg(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `Ultra high quality 8K professional background: ${bgPrompt}. Cinematic, sharp, crystal clear, photorealistic, no blur, highly detailed, masterpiece quality, stunning visual clarity`
      });

      if (response.url) {
        setBackgroundImage(response.url);
        localStorage.setItem("x_page_background", response.url);
        setShowBgGenerator(false);
        setBgPrompt("");
      }
    } catch (err) {
      console.error("Background generation failed:", err);
      alert("Failed to generate background");
    } finally {
      setIsGeneratingBg(false);
    }
  };

  const resetScan = () => {
    setUploadedFile(null);
    setUserExplanation("");
    setEnhancedExplanation("");
    setVerificationResult(null);
    setScanProgress(0);
    setScanStatus("");
    setCurrentStep("upload");
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        {backgroundImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              imageRendering: 'crisp-edges',
              filter: 'contrast(1.1) saturate(1.1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black" />
          </div>
        ) : (
          <>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"
            />
          </>
        )}
      </div>

      {/* Controls */}
      <div className="fixed top-24 right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => {
            setShowKnowledge(!showKnowledge);
            if (!showKnowledge && !knowledge) loadKnowledge();
          }}
          className="w-10 h-10 bg-black border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg flex items-center justify-center transition-all backdrop-blur-xl"
          title="Chat with Agent Ying"
        >
          <MessageSquare className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => setShowBgGenerator(!showBgGenerator)}
          className="w-10 h-10 bg-black border border-white/20 hover:border-white/40 rounded-lg flex items-center justify-center transition-all backdrop-blur-xl"
          title="Change Background"
        >
          <Wrench className="w-5 h-5 text-white" strokeWidth={1.5} />
        </button>
      </div>

      {/* Background Generator Modal */}
      <AnimatePresence>
        {showBgGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBgGenerator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/20 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-xl">AI Background Generator</h3>
                <button
                  onClick={() => setShowBgGenerator(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <Textarea
                  value={bgPrompt}
                  onChange={(e) => setBgPrompt(e.target.value)}
                  placeholder="Ultra HD futuristic cityscape at night, neon lights, cyberpunk style..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-gray-600 min-h-[100px] resize-none focus:outline-none focus:border-purple-500/50"
                />

                <Button
                  onClick={generateBackground}
                  disabled={isGeneratingBg || !bgPrompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
                >
                  {isGeneratingBg ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating HD Background...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate HD Background
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setBackgroundImage(null);
                    localStorage.removeItem("x_page_background");
                    setShowBgGenerator(false);
                  }}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Ying Chat Modal */}
      <AnimatePresence>
        {showKnowledge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowKnowledge(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-cyan-500/30 rounded-xl w-full max-w-5xl h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-500/20 border-2 border-cyan-500/50 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Agent Ying AI</h3>
                    <p className="text-cyan-400 text-sm">Google Lens Vision • Machine Learning</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKnowledge(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left: Knowledge Stats */}
                <div className="w-80 border-r border-cyan-500/30 p-4 overflow-y-auto">
                  {isLoadingKnowledge ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Loading knowledge...</p>
                    </div>
                  ) : knowledge ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                          <div className="text-2xl font-bold text-cyan-400 mb-1">
                            {knowledge.stats.totalPatterns}
                          </div>
                          <div className="text-xs text-gray-400">Learned Patterns</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            {knowledge.stats.totalVerifications}
                          </div>
                          <div className="text-xs text-gray-400">Verifications</div>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                          <div className="text-2xl font-bold text-purple-400 mb-1">
                            {knowledge.stats.totalVisionAnalyses || 0}
                          </div>
                          <div className="text-xs text-gray-400">Images Analyzed</div>
                        </div>
                      </div>

                      {/* Vision Insights */}
                      {knowledge.visionInsights && (
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                          <h4 className="text-white font-semibold mb-2 text-sm">👁️ What I've Seen</h4>
                          <div className="space-y-2 text-xs text-gray-300">
                            <div>📱 Usernames: {knowledge.visionInsights.uniqueUsernames}</div>
                            <div>🔗 URLs: {knowledge.visionInsights.uniqueUrls}</div>
                            {knowledge.visionInsights.topUsernames?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {knowledge.visionInsights.topUsernames.slice(0, 5).map((username, i) => (
                                  <span key={i} className="bg-cyan-500/20 px-2 py-0.5 rounded text-[10px]">
                                    {username}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          Recent Activity
                        </h4>
                        <div className="space-y-2">
                          {knowledge.recentVerifications.slice(0, 5).map((v, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px] capitalize">
                                  {v.taskType}
                                </Badge>
                                <span className="text-xs text-white font-bold">{v.score}%</span>
                              </div>
                              {v.learnedNew && (
                                <Badge className="bg-purple-500/20 text-purple-300 text-[10px]">
                                  🧠 New Pattern
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={loadKnowledge}
                        size="sm"
                        className="w-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 h-9"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={loadKnowledge}
                      className="w-full bg-cyan-500/20 text-cyan-400"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Load Knowledge
                    </Button>
                  )}
                </div>

                {/* Right: Chat Interface */}
                <div className="flex-1 flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-12">
                        <Brain className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
                        <p className="text-white font-semibold mb-3">Ask Agent Ying Anything!</p>
                        <div className="space-y-2 text-sm text-gray-400">
                          <p>💡 "What have you learned from verifications?"</p>
                          <p>👁️ Upload an image to analyze it like Google Lens</p>
                          <p>📊 "Show me patterns for social media tasks"</p>
                          <p>🔍 "What usernames have you seen in proofs?"</p>
                        </div>
                      </div>
                    )}

                    {chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'agent' && (
                          <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                          </div>
                        )}
                        <div className={`max-w-[70%] ${msg.role === 'user' ? 'bg-white/10 border-white/20' : 'bg-cyan-500/10 border-cyan-500/30'} border rounded-xl p-4`}>
                          {msg.image && (
                            <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                              <img
                                src={msg.image}
                                alt="Uploaded"
                                className="w-full max-h-64 object-contain bg-black/30"
                              />
                            </div>
                          )}
                          <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          {msg.savedToHiveMind && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Saved to hive mind</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {isChatting && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/50 rounded-lg flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" strokeWidth={1.5} />
                        </div>
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                          <p className="text-cyan-400 text-sm">Agent Ying analyzing...</p>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-cyan-500/30 p-4 bg-black/50">
                    {selectedImage && (
                      <div className="mb-3 relative">
                        <img
                          src={selectedImage}
                          alt="Selected"
                          className="w-32 h-32 object-cover rounded-lg border border-cyan-500/30"
                        />
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <XIcon className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUploadForChat}
                        className="hidden"
                        id="chat-image-upload"
                      />
                      <label htmlFor="chat-image-upload">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                          disabled={isChatting}
                          asChild
                        >
                          <div>
                            <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
                          </div>
                        </Button>
                      </label>

                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                        placeholder={selectedImage ? "Ask about this image..." : "Ask Agent Ying anything..."}
                        className="flex-1 bg-white/5 border-cyan-500/30 text-white placeholder:text-gray-600"
                        disabled={isChatting}
                      />
                      <Button
                        onClick={handleChat}
                        disabled={isChatting || (!chatInput.trim() && !selectedImage)}
                        className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                      >
                        <Send className="w-5 h-5" strokeWidth={1.5} />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      👁️ Upload images for Google Lens-style analysis • 💬 Ask about learned patterns
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {currentStep !== "upload" && (
              <Button
                onClick={resetScan}
                variant="ghost"
                className="mb-6 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            <div className="w-20 h-20 mx-auto mb-6 bg-black border-2 border-cyan-500/30 rounded-2xl flex items-center justify-center shadow-2xl">
              <Brain className="w-10 h-10 text-cyan-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Agent Yang • Verification
            </h1>
            <p className="text-gray-400 text-lg mb-2">
              Proof of Work • Machine Learning • Pattern Recognition
            </p>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              Powered by Agent Ying Backend
            </Badge>
          </motion.div>

          {/* Step 1: Upload */}
          {currentStep === "upload" && !uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-black/50 border-white/20 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-white/40 rounded-2xl p-12 text-center cursor-pointer transition-all hover:bg-white/5"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-black border-2 border-white/20 rounded-xl flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Upload Proof of Work</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Screenshots, documents, photos, PDFs, code files
                    </p>
                    <Badge className="bg-white/10 text-white border-white/20">
                      Click to Upload
                    </Badge>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.csv,.xlsx"
                  />

                  {isUploading && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                      <span className="text-gray-400">Uploading...</span>
                    </div>
                  )}

                  {/* Example Use Cases */}
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <h4 className="text-white font-semibold mb-4 text-center">Example Proofs</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-white font-semibold mb-1">Social Media Task</div>
                        <div className="text-gray-400 text-xs">Screenshot showing you followed an account on X</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-white font-semibold mb-1">Content Creation</div>
                        <div className="text-gray-400 text-xs">Photo or document of completed work</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-white font-semibold mb-1">Code Development</div>
                        <div className="text-gray-400 text-xs">Code files or screenshots showing implementation</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-white font-semibold mb-1">Research Task</div>
                        <div className="text-gray-400 text-xs">Research document or analysis report</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Explain */}
          {currentStep === "explain" && uploadedFile && !enhancedExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              {/* File Preview */}
              <Card className="bg-black/50 border-white/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black border-2 border-white/20 rounded-lg flex items-center justify-center">
                        <FileSearch className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-white font-bold">{uploadedFile.name}</div>
                        <div className="text-gray-400 text-sm">
                          {(uploadedFile.size / 1024).toFixed(2)} KB • {uploadedFile.type}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={resetScan}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <XIcon className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>

                  {uploadedFile.type.includes('image') && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={uploadedFile.url}
                        alt="Proof preview"
                        className="w-full max-h-64 object-contain bg-black/30"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Explanation Form */}
              <Card className="bg-black/50 border-white/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-white font-bold text-lg mb-2">Explain Your Proof</h3>
                    <p className="text-gray-400 text-sm">
                      Help Agent ZK understand what task you completed and what this proof shows.
                    </p>
                  </div>

                  <Textarea
                    value={userExplanation}
                    onChange={(e) => setUserExplanation(e.target.value)}
                    placeholder="Example: This is a screenshot showing I followed @username on X/Twitter. The task was to follow their account and provide proof. You can see my profile following them in the screenshot."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder:text-gray-600 min-h-[150px] resize-none focus:outline-none focus:border-white/30 mb-4"
                  />

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div>
                        <div className="text-white font-semibold text-sm mb-1">What happens when you click Enhance?</div>
                        <div className="text-gray-400 text-xs">
                          AI will analyze your explanation and create a structured summary that helps the verification system understand exactly what to look for in your proof.
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleEnhanceExplanation}
                    disabled={isEnhancing || !userExplanation.trim()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12 text-lg font-semibold"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        AI Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" strokeWidth={1.5} />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Verify */}
          {currentStep === "verify" && uploadedFile && enhancedExplanation && !verificationResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-black/50 border-white/20 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-8">
                  {/* File Info */}
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black border-2 border-white/20 rounded-lg flex items-center justify-center">
                        <FileSearch className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-white font-bold">{uploadedFile.name}</div>
                        <div className="text-gray-400 text-sm">Ready for verification</div>
                      </div>
                    </div>
                    <Button
                      onClick={resetScan}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      disabled={isScanning}
                    >
                      <XIcon className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>

                  {/* Enhanced Explanation Display */}
                  <div className="mb-6 bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
                      <div className="text-white font-semibold text-sm">AI-Enhanced Explanation</div>
                    </div>
                    <div className="text-gray-300 text-sm leading-relaxed">
                      {enhancedExplanation}
                    </div>
                  </div>

                  {/* Scanner Animation */}
                  <div
                    ref={scannerRef}
                    className="relative h-64 bg-black border-2 border-white/20 rounded-xl overflow-hidden mb-6"
                  >
                    {isScanning && (
                      <motion.div
                        initial={{ top: "0%" }}
                        animate={{ top: "100%" }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                        style={{ top: "0%" }}
                      />
                    )}

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        {isScanning ? (
                          <>
                            <div className="w-16 h-16 mx-auto mb-4 bg-black border-2 border-cyan-400/50 rounded-xl flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" strokeWidth={1.5} />
                            </div>
                            <div className="text-white font-semibold text-lg">
                              {scanStatus}
                            </div>
                            <div className="text-cyan-400 text-sm mt-2">
                              {scanProgress}%
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 mx-auto mb-4 bg-black border-2 border-white/20 rounded-xl flex items-center justify-center">
                              <FileSearch className="w-8 h-8 text-white" strokeWidth={1.5} />
                            </div>
                            <div className="text-white font-semibold text-lg">
                              Ready to Verify
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white/5 rounded-full h-3 overflow-hidden mb-6 border border-white/10">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-black border border-white/10 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-xs mb-1">Confidence</div>
                      <div className="text-white font-bold text-2xl">
                        {isScanning ? `${Math.min(scanProgress, 100)}%` : "--"}
                      </div>
                    </div>
                    <div className="bg-black border border-white/10 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-xs mb-1">Pattern Match</div>
                      <div className="text-white font-bold text-2xl">
                        {isScanning ? `${Math.floor(scanProgress * 0.8)}%` : "--"}
                      </div>
                    </div>
                    <div className="bg-black border border-white/10 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-xs mb-1">Learning</div>
                      <div className="text-white font-bold text-2xl">
                        {isScanning ? (scanProgress > 70 ? "✓" : "...") : "--"}
                      </div>
                    </div>
                  </div>

                  {/* Start Button */}
                  {!isScanning && (
                    <Button
                      onClick={startVerification}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-14 text-lg font-bold"
                    >
                      <Sparkles className="w-5 h-5 mr-2" strokeWidth={1.5} />
                      Start Verification
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Results */}
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* Overall Score */}
              <Card className="bg-black/50 border-cyan-500/30 backdrop-blur-xl">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-black border-2 border-green-500/50 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-400" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Verification Complete!</h2>
                  </div>
                  <div className="text-6xl font-bold text-cyan-400 mb-2">
                    {verificationResult.verificationScore}%
                  </div>
                  <div className="text-gray-400 font-semibold">Agent Ying Confidence Score</div>
                </CardContent>
              </Card>

              {/* Detailed Scores */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-black/50 border-white/20 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-black border-2 border-white/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {Math.round((verificationResult.qualityScore || 0) * 100)}%
                    </div>
                    <div className="text-gray-400 text-sm">Quality Score</div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 border-white/20 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-black border-2 border-white/20 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {Math.round((verificationResult.complexityScore || 0) * 100)}%
                    </div>
                    <div className="text-gray-400 text-sm">Complexity</div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 border-white/20 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-black border-2 border-white/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {Math.round((verificationResult.patternMatch?.confidence || 0) * 100)}%
                    </div>
                    <div className="text-gray-400 text-sm">Pattern Match</div>
                  </CardContent>
                </Card>
              </div>

              {/* Contribution Score (NOT PAYMENT) */}
              <Card className="bg-black/50 border-purple-500/30 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-black border-2 border-purple-500/50 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-white font-bold text-xl">Contribution Points</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Trust Score</div>
                      <div className="text-green-400 font-bold text-xl">
                        +{Math.round((verificationResult.rewards?.trustScore || 0) * 100)}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Hive Contribution</div>
                      <div className="text-purple-400 font-bold text-xl">
                        +{verificationResult.rewards?.hiveContribution || 0}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    * These are contribution points, not actual token payments
                  </p>
                </CardContent>
              </Card>

              {/* Learning Notice */}
              {verificationResult.learnedNewPattern && (
                <Card className="bg-black/50 border-cyan-500/30 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-black border-2 border-cyan-500/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Brain className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg mb-2">
                          🧠 Agent Ying Learned New Pattern!
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Your verification contributed to Agent Ying's knowledge base. The system has learned new patterns and will use this knowledge to verify future tasks more accurately.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={resetScan}
                  className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 h-12"
                >
                  <Upload className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Verify Another Proof
                </Button>
                <Button
                  onClick={() => {
                    setShowKnowledge(true);
                    loadKnowledge();
                  }}
                  className="w-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 h-12"
                >
                  <Eye className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  View Agent Ying Knowledge
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
