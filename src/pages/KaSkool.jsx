import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, BookOpen, GraduationCap, TrendingUp, Award, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KaSkoolPage() {
  const [user, setUser] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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
        prompt: `Search query: "${searchQuery}". Provide comprehensive information about this topic. Include key facts, explanations, and relevant details. Format as a clear, informative response.`,
        add_context_from_internet: true
      });
      
      setSearchResults([{
        title: searchQuery,
        content: response,
        url: `Search results for: ${searchQuery}`
      }]);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

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
      <div className="border-b border-white/10 bg-black/90 backdrop-blur-xl sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("AppStore")}>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/82eb2ecee_image.png"
                    alt="KaSkool Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">KaSkool</h1>
                  <p className="text-sm text-gray-400">Innovate. Educate. Monetize.</p>
                </div>
              </div>
            </div>

            {!user && (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Login to Learn
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {user && (
        <div className="bg-white/5 border-b border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-xs text-gray-400">Courses Enrolled</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">62%</p>
                <p className="text-xs text-gray-400">Avg Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">2</p>
                <p className="text-xs text-gray-400">Achievements</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">24h</p>
                <p className="text-xs text-gray-400">Learning Time</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Content */}
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
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Search className="w-5 h-5" />
                )}
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

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-6">
            {searchResults.map((result, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-xl mb-2">{result.title}</CardTitle>
                    <p className="text-xs text-cyan-400">{result.url}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{result.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}