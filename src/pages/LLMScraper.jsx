import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Bot, Search, Database, ArrowLeft, Terminal, Copy, Upload, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";

export default function LLMScraperPage() {
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a file to analyze");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setStatus("Uploading file...");
    setUploadProgress(10);

    try {
      // 1. Upload the file
      setUploadProgress(30);
      
      // Pass the File object directly to the SDK
      const uploadRes = await base44.integrations.Core.UploadFile({
        file: selectedFile
      });
      
      const fileUrl = uploadRes.file_url;
      setUploadProgress(60);

      setStatus("Agent Ying is analyzing patterns...");
      setUploadProgress(80);

      // 2. Analyze the file
      const response = await base44.functions.invoke("analyzeUploadedFile", {
        file_url: fileUrl,
        file_type: selectedFile.type,
        instruction: instruction || "Analyze and extract key information",
      });

      setUploadProgress(100);
      setStatus("Complete!");

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setResult(response.data.result);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to analyze file.");
    } finally {
      setIsLoading(false);
      setStatus("");
      setUploadProgress(0);
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
              AI File Analyst
            </h1>
            <p className="text-white/60">Upload PDFs, images, or text files to extract insights and analyze data.</p>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardContent className="p-6 space-y-6">
            
            {/* File Upload Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Upload File</label>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors relative">
                <input 
                  type="file" 
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.csv"
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2 text-green-400">
                    <Database className="w-10 h-10" />
                    <span className="font-semibold text-lg">{selectedFile.name}</span>
                    <span className="text-xs text-white/40">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/40">
                    <Search className="w-10 h-10 mb-2" />
                    <span className="font-medium">Click or Drag file here</span>
                    <span className="text-xs">PDF, Images, Text, CSV</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Analysis Instructions (Optional)</label>
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g., Summarize the main points, Extract financial data, Describe the image..."
                className="bg-black/40 border-white/10 text-white placeholder:text-white/20 min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !selectedFile}
              className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Bot className="w-5 h-5 mr-2" />
                  Analyze File
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {/* Progress Status */}
            {isLoading && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                  <Bot className="w-5 h-5" />
                  <span className="text-sm font-medium">{status}</span>
                </div>
                <div className="w-full max-w-md h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-cyan-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.5 }}
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