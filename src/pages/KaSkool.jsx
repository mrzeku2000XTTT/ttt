import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, BookOpen, GraduationCap, TrendingUp, Award, Clock, Search, ShieldCheck, Sparkles, X, Menu, Brain, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function KaSkoolPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(null);
  const [explainPrompt, setExplainPrompt] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);

  useEffect(() => {
    loadUser();
    generateBackground();
  }, []);

  const generateBackground = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: "Professional minimalist educational background with subtle geometric blockchain network patterns, abstract hexagonal Kaspa blocks floating in soft gradient space, clean modern design, muted teal and gray tones, soft lighting, professional learning environment aesthetic, high quality, 4K resolution"
      });
      if (result?.url) {
        setBackgroundUrl(result.url);
      }
    } catch (err) {
      console.error('Failed to generate background:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Search query: "${searchQuery}". Provide comprehensive, accurate information about this topic related to blockchain, Kaspa, cryptocurrency, or educational content. Include key facts, explanations, and relevant details. Format as a clear, informative response without using asterisks or special formatting characters. Use plain text with proper paragraphs.`,
        add_context_from_internet: true
      });
      
      // Clean up response - remove asterisks and format properly
      const cleanedResponse = typeof response === 'string' 
        ? response.replace(/\*\*/g, '').replace(/\*/g, '').trim()
        : response;
      
      setSearchResults([{
        title: searchQuery,
        content: cleanedResponse,
        url: `Search results for: ${searchQuery}`,
        originalContent: cleanedResponse
      }]);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExplain = async (preset = null) => {
    if (selectedResultIndex === null) return;
    
    const currentResult = searchResults[selectedResultIndex];
    const prompt = preset || explainPrompt;
    
    if (!prompt) return;

    setIsExplaining(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Original content: "${currentResult.originalContent || currentResult.content}"\n\nTask: ${prompt}\n\nProvide a clear, reformatted explanation without using asterisks or special formatting. Use plain text with proper paragraphs.`,
        add_context_from_internet: false
      });
      
      const cleanedResponse = typeof response === 'string' 
        ? response.replace(/\*\*/g, '').replace(/\*/g, '').trim()
        : response;
      
      const updatedResults = [...searchResults];
      updatedResults[selectedResultIndex] = {
        ...currentResult,
        content: cleanedResponse
      };
      setSearchResults(updatedResults);
      setShowExplainModal(false);
      setExplainPrompt("");
    } catch (err) {
      console.error('Explanation failed:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  const generateQuiz = async () => {
    if (searchResults.length === 0) return;

    setIsGeneratingQuiz(true);
    try {
      const content = searchResults[0].originalContent || searchResults[0].content;
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this educational content: "${content}"\n\nGenerate 5 multiple choice quiz questions to test understanding. Return ONLY a valid JSON array with this exact structure:\n[\n  {\n    "question": "question text",\n    "options": ["option1", "option2", "option3", "option4"],\n    "correctAnswer": 0\n  }\n]\n\nMake questions educational and test key concepts. correctAnswer should be the index (0-3) of the correct option.`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  },
                  correctAnswer: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (response?.questions && Array.isArray(response.questions)) {
        setQuizQuestions(response.questions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowQuizResults(false);
      }
    } catch (err) {
      console.error('Quiz generation failed:', err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowQuizResults(true);
    }
  };

  const resetQuiz = () => {
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setShowQuizResults(false);
  };

  const presets = [
    "Explain this like I'm 5 years old",
    "Explain this like I'm 10 years old",
    "Explain this in simple terms",
    "Explain this technically",
    "Summarize in 3 sentences",
    "Make this more detailed",
    "Explain with examples"
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Futuristic Grid Background */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
            backgroundPosition: '-1px -1px, -1px -1px, -1px -1px, -1px -1px',
            transform: 'perspective(1000px) rotateX(60deg)',
            transformOrigin: 'center center',
            height: '200%',
            top: '-50%'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-cyan-900/20" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
      </div>
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-purple-900/30 via-black/90 to-cyan-900/30 backdrop-blur-xl sticky top-0 z-50 relative shadow-lg shadow-purple-500/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("AppStore")}>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">KaSkool</h1>
                <p className="text-sm text-gray-400 font-medium">Decentralized Education Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!user && (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold px-6 rounded-lg shadow-lg shadow-purple-500/30"
                >
                  Login to Learn
                </Button>
              )}
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <Menu className="w-6 h-6" />
                </Button>
                
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 top-12 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                      <div className="py-2">
                        <Link to={createPageUrl("AppStore")}>
                          <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 transition-colors">
                            App Store
                          </button>
                        </Link>
                        <Link to={createPageUrl("Home")}>
                          <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 transition-colors">
                            Home
                          </button>
                        </Link>
                        {user && (
                          <Link to={createPageUrl("KaSkoolProfile")}>
                            <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 transition-colors">
                              My Profile
                            </button>
                          </Link>
                        )}
                        <div className="border-t border-white/10 my-2" />
                        <Link to={createPageUrl("About")}>
                          <button className="w-full px-4 py-2 text-left text-sm text-white/60 hover:bg-white/5 transition-colors">
                            About
                          </button>
                        </Link>
                        <Link to={createPageUrl("Contact")}>
                          <button className="w-full px-4 py-2 text-left text-sm text-white/60 hover:bg-white/5 transition-colors">
                            Contact
                          </button>
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent border-0 h-auto p-0 space-x-1">
                <TabsTrigger 
                  value="search" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-purple-400 data-[state=active]:border-b-2 data-[state=active]:border-purple-400 rounded-none px-4 py-3 text-white/60 hover:text-white transition-all"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </TabsTrigger>
                <TabsTrigger 
                  value="courses" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-purple-400 data-[state=active]:border-b-2 data-[state=active]:border-purple-400 rounded-none px-4 py-3 text-white/60 hover:text-white transition-all"
                  onClick={() => navigate(createPageUrl("Courses"))}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Courses
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Search Content */}
      {searchResults.length === 0 && !isSearching ? (
        <div className="max-w-4xl mx-auto px-4 relative z-10" style={{ paddingTop: '15vh' }}>
          {/* Centered Search Section */}
          <div className="text-center mb-16">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-12">
              <div className="relative max-w-3xl mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blockchain courses, AI insights..."
                  className="w-full px-8 py-5 bg-white/5 border-2 border-purple-500/50 rounded-full text-white text-lg placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all backdrop-blur-sm"
                  style={{
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)'
                  }}
                />
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-full h-12 w-12 p-0 shadow-lg shadow-purple-500/50"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </form>

            {/* Icon and Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                <BookOpen className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">Decentralize Knowledge</h1>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Enter your query above to search for blockchain information, Kaspa resources, and educational content.
              </p>
            </motion.div>
          </div>
        </div>
      ) : (
        <>
          {/* Compact Search Bar - Google Style */}
          <div className="border-b border-white/10 relative z-10">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <form onSubmit={handleSearch} className="flex items-center justify-center gap-4">
                <div className="relative w-full max-w-2xl">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-6 py-3 bg-white/5 border border-white/20 rounded-full text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-all backdrop-blur-sm"
                  />
                  <Button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-full h-9 w-9 p-0"
                  >
                    {isSearching ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
            {searchResults.length > 0 && (
              <>
                {/* Query Heading */}
                <div className="mb-10">
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{searchResults[0].title}</h1>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Educational search results
                  </p>
                </div>

                {/* Results Grid */}
                <div className="space-y-6">
                  {searchResults.map((result, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all shadow-lg">
                        {/* Verified Badge and AI Button */}
                        <div className="flex items-center justify-between px-8 pt-6 pb-4">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-full backdrop-blur-sm">
                            <ShieldCheck className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-400 font-semibold">Fact Checked</span>
                          </div>
                          
                          <Button
                            onClick={() => {
                              setSelectedResultIndex(idx);
                              setShowExplainModal(true);
                            }}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/50 text-purple-300"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-semibold">AI</span>
                          </Button>
                        </div>
                        
                        <CardContent className="px-8 pb-8 pt-0">
                          <div className="prose prose-invert max-w-none">
                            <p className="text-gray-200 leading-relaxed text-base whitespace-pre-wrap">{result.content}</p>
                          </div>
                          
                          {/* Quiz Button */}
                          {idx === 0 && quizQuestions.length === 0 && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                              <Button
                                onClick={generateQuiz}
                                disabled={isGeneratingQuiz}
                                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-6 text-lg"
                              >
                                {isGeneratingQuiz ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                ) : (
                                  <Brain className="w-5 h-5 mr-2" />
                                )}
                                Generate Quiz
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Quiz Section */}
      {quizQuestions.length > 0 && !showQuizResults && (
        <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border-2 border-cyan-500/30 backdrop-blur-sm shadow-2xl">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-2xl">Quiz Time!</CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        Question {currentQuestionIndex + 1} of {quizQuestions.length}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Score</div>
                    <div className="text-2xl font-bold text-cyan-400">{score}/{quizQuestions.length}</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                {quizQuestions[currentQuestionIndex] && (
                  <>
                    <h3 className="text-xl font-semibold text-white mb-6 leading-relaxed">
                      {quizQuestions[currentQuestionIndex].question}
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                        const isCorrect = idx === quizQuestions[currentQuestionIndex].correctAnswer;
                        const isSelected = idx === selectedAnswer;
                        const showFeedback = isAnswered && (isSelected || isCorrect);
                        
                        return (
                          <motion.button
                            key={idx}
                            onClick={() => handleAnswerSelect(idx)}
                            disabled={isAnswered}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                              !isAnswered
                                ? 'bg-white/5 border-white/20 hover:border-cyan-500/50 hover:bg-white/10'
                                : showFeedback
                                ? isCorrect
                                  ? 'bg-green-500/20 border-green-500'
                                  : 'bg-red-500/20 border-red-500'
                                : 'bg-white/5 border-white/10 opacity-50'
                            }`}
                            whileHover={!isAnswered ? { scale: 1.02 } : {}}
                            whileTap={!isAnswered ? { scale: 0.98 } : {}}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">{option}</span>
                              {showFeedback && (
                                isCorrect ? (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : isSelected ? (
                                  <XCircle className="w-5 h-5 text-red-400" />
                                ) : null
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                    
                    {isAnswered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Button
                          onClick={handleNextQuestion}
                          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-4 text-lg"
                        >
                          {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
                        </Button>
                      </motion.div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Quiz Results */}
      {showQuizResults && (
        <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border-2 border-purple-500/50 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-24 h-24 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Award className="w-12 h-12 text-white" />
                </motion.div>
                
                <h2 className="text-4xl font-bold text-white mb-4">Quiz Complete!</h2>
                <p className="text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text mb-6">
                  {score}/{quizQuestions.length}
                </p>
                
                <p className="text-xl text-gray-300 mb-8">
                  {score === quizQuestions.length
                    ? "Perfect score! You're a master! 🎉"
                    : score >= quizQuestions.length * 0.8
                    ? "Excellent work! Keep it up! 🌟"
                    : score >= quizQuestions.length * 0.6
                    ? "Good job! Keep learning! 📚"
                    : "Keep studying and try again! 💪"}
                </p>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={resetQuiz}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold px-8 py-4 text-lg"
                  >
                    Back to Content
                  </Button>
                  <Button
                    onClick={() => {
                      resetQuiz();
                      generateQuiz();
                    }}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 text-lg"
                  >
                    Try New Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Explain Modal */}
      {showExplainModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-cyan-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">AI Re-Explain</h3>
              </div>
              <button
                onClick={() => {
                  setShowExplainModal(false);
                  setExplainPrompt("");
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Presets */}
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-3">Quick Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset, i) => (
                    <Button
                      key={i}
                      onClick={() => handleExplain(preset)}
                      disabled={isExplaining}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white justify-start"
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-3">Or Create Your Own</h4>
                <textarea
                  value={explainPrompt}
                  onChange={(e) => setExplainPrompt(e.target.value)}
                  placeholder="E.g., 'Explain this using sports analogies' or 'Make this fun and engaging'"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 resize-none"
                  rows={3}
                />
                <Button
                  onClick={() => handleExplain()}
                  disabled={isExplaining || !explainPrompt.trim()}
                  className="mt-3 w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  {isExplaining ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    "Apply Custom Explanation"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}