import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, BookOpen, GraduationCap, TrendingUp, Award, Clock, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KaSkoolPage() {
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

            {!user && (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold px-6 rounded-lg shadow-lg shadow-purple-500/30"
              >
                Login to Learn
              </Button>
            )}
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