import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Bot, Search, Database, ArrowLeft, Terminal, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";

export default function LLMScraperPage() {
  const [url, setUrl] = useState("");
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchStatus, setSearchStatus] = useState("");

  const handleScrape = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSearchStatus("Initializing research agent...");

    // Simulate search steps for UX
    const statusInterval = setInterval(() => {
      setSearchStatus(prev => {
        if (prev === "Initializing research agent...") return "Browsing target website...";
        if (prev === "Browsing target website...") return "Searching external sources (News, Social, Docs)...";
        if (prev === "Searching external sources (News, Social, Docs)...") return "Cross-referencing data...";
        if (prev === "Cross-referencing data...") return "Synthesizing research report...";
        return prev;
      });
    }, 4000);

    try {
      const response = await base44.functions.invoke("scrapeAndMine", {
        url,
        instruction: instruction || "Conduct deep research and analysis",
      });

      clearInterval(statusInterval);
      setSearchStatus("");

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setResult(response.data.result);
    } catch (err) {
      clearInterval(statusInterval);
      setSearchStatus("");
      console.error("Research failed:", err);
      setError(err.message || "Failed to conduct research. The agent encountered an issue.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Categories")}>
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="w-8 h-8 text-cyan-400" />
              Deep Web Research
            </h1>
            <p className="text-white/60">Enter a URL to have an AI agent browse, investigate, and report on it (Perplexity-style).</p>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Target Website URL</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/products"
                  className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-white/20 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Mining Instructions (Optional)</label>
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g., Extract all product names and prices, or Summarize the article..."
                className="bg-black/40 border-white/10 text-white placeholder:text-white/20 min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleScrape}
              disabled={isLoading || !url}
              className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Mining Data...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Start Mining
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {/* Search Status Indicator */}
            {isLoading && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                  <Bot className="w-5 h-5" />
                  <span className="text-sm font-medium">{searchStatus}</span>
                </div>
                <div className="w-full max-w-md h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-cyan-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Bot className="w-5 h-5 text-green-400" />
                  Mined Data
                </CardTitle>
                <Button
                  onClick={copyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </CardHeader>
              <CardContent className="p-8 md:p-10 bg-black/40">
                <div className="prose prose-invert max-w-none prose-headings:text-white prose-h1:text-3xl prose-h1:font-bold prose-h2:text-2xl prose-h2:text-cyan-400 prose-h3:text-xl prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-ul:text-gray-300 prose-li:marker:text-cyan-500 prose-code:text-cyan-300 prose-code:bg-cyan-900/20 prose-code:px-1 prose-code:rounded prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-blockquote:border-l-cyan-500 prose-blockquote:text-gray-400 prose-blockquote:italic">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}