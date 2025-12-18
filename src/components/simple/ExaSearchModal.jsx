import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, ExternalLink, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function ExaSearchModal({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState("web_search");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('exaSearch', {
        query: query.trim(),
        type: searchType,
      });
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl mt-8 mb-8"
      >
        {/* Header */}
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">EXA Search</h2>
              <p className="text-white/60 text-sm">AI-powered web & code search</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Form */}
        <div className="p-6 border-b border-white/10">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the web or find code examples..."
                className="flex-1 bg-white/5 border-white/10 text-white h-12"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 h-12 px-6"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSearchType("web_search")}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  searchType === "web_search"
                    ? "bg-purple-500 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                Web Search
              </button>
              <button
                type="button"
                onClick={() => setSearchType("code")}
                className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  searchType === "code"
                    ? "bg-blue-500 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <Code className="w-4 h-4" />
                Code Search
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          )}

          {results && !loading && (
            <div className="space-y-4">
              {results.results?.length > 0 ? (
                results.results.map((result, i) => (
                  <motion.a
                    key={i}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-white font-semibold group-hover:text-purple-400 transition-colors flex-1">
                        {result.title}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-purple-400 flex-shrink-0" />
                    </div>
                    <p className="text-white/60 text-sm mb-2 line-clamp-2">
                      {result.text || result.highlights?.[0] || 'No description available'}
                    </p>
                    <p className="text-white/40 text-xs truncate">{result.url}</p>
                  </motion.a>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/60">No results found</p>
                </div>
              )}
            </div>
          )}

          {!results && !loading && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">Enter a query to search</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}