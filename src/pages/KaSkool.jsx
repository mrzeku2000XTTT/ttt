import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, BookOpen } from "lucide-react";
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
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Image */}
      {backgroundUrl && (
        <div 
          className="fixed inset-0 opacity-10 z-0"
          style={{
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
      
      {/* Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/90 via-zinc-900/80 to-black/90 z-0" />
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
      <div className="max-w-4xl mx-auto px-4 py-16 relative z-10">
        {/* Search Bar */}
        <div className="mb-12">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for blockchain knowledge, Kaspa info, and more..."
              className="w-full px-6 py-4 bg-white/5 border-2 border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
            />
            <Button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 rounded-full h-10 px-6"
            >
              {isSearching ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                </>
              ) : (
                "Search"
              )}
            </Button>
          </form>
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

        {/* Empty State */}
        {searchResults.length === 0 && !isSearching && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Search for Knowledge</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Enter your query above to search for blockchain information, Kaspa resources, and educational content.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}