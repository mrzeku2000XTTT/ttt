import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Pause, Download, Volume2, Search, Home, Mic, Wand2, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function VoxInvictaPage() {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState({ 
    id: 1, 
    name: "Default Voice", 
    elevenLabsId: "21m00Tcm4TlvDq8ikWAM" 
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchVoice, setSearchVoice] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = React.useRef(null);

  const voices = [];

  const filteredVoices = searchVoice
    ? voices.filter(v => v.name.toLowerCase().includes(searchVoice.toLowerCase()))
    : voices;

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text to convert to speech');
      return;
    }

    if (!selectedVoice) {
      setError('Please select a voice');
      return;
    }

    if (text.length > 5000) {
      setError('Text is too long. Maximum 5000 characters allowed.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    
    try {
      const { data } = await base44.functions.invoke('generateVoice', {
        text: text.trim(),
        voice_id: selectedVoice.elevenLabsId
      });
      
      if (data?.audio_url) {
        setAudioUrl(data.audio_url);
        setError(null);
      } else if (data?.error) {
        setError(data.error);
      } else {
        setError('Failed to generate speech. Please try again.');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to generate speech. Please check your connection and try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!audioUrl) return;
    
    try {
      // Convert data URL to blob
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `vox_invicta_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/42e7376e4_image.png"
            alt="Vox Invicta"
            className="w-10 h-10 rounded-full"
          />
          <h1 className="text-xl font-bold text-white">Vox Invicta</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800/50 transition-colors">
            <Volume2 className="w-5 h-5" />
            <span className="font-medium">Voices</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800/50 transition-colors">
            <Wand2 className="w-5 h-5" />
            <span className="font-medium">Voice Changer</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800/50 transition-colors">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Sound Effects</span>
          </button>
        </nav>

        <div className="pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-2">Credits Remaining</div>
          <div className="text-2xl font-bold text-white">5,471</div>
          <div className="text-xs text-zinc-500">characters</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Text to Speech</h2>
              <p className="text-zinc-400">Transform your text into lifelike voice with Kaspa-powered AI</p>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 mb-6">
              <CardContent className="p-6">
                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Enter your text</label>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Hi, welcome to Vox Invicta. The world is ending. What do we do to prepare?"
                    className="min-h-[200px] bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600 text-lg"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500">
                    {text.length} / 5,471 characters
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={!text || !selectedVoice || isGenerating}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-8"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Speech
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="bg-red-500/10 border-red-500/30 mb-6">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div className="flex-1 text-red-400 text-sm">{error}</div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Audio Player Preview */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-zinc-900 border-zinc-800 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <Volume2 className="w-6 h-6 text-cyan-400 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium mb-2">Generating audio...</div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '60%' }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Audio Player */}
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-zinc-900 border-zinc-800 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={handlePlayPause}
                        size="icon"
                        className="w-12 h-12 bg-cyan-500 hover:bg-cyan-600 rounded-full"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </Button>
                      <div className="flex-1">
                        <div className="text-white font-medium mb-2">{selectedVoice?.name}</div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: '100%' }} />
                        </div>
                      </div>
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        size="icon"
                        className="border-zinc-700 hover:bg-zinc-800"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                    </div>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      preload="auto"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Right Sidebar - Voice Settings */}
      <div className="w-96 bg-zinc-950 border-l border-zinc-800 p-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Voice Settings</h3>
          <p className="text-sm text-zinc-400">Using ElevenLabs Turbo v2.5 model</p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">{selectedVoice.name}</div>
                <div className="text-xs text-zinc-500">Professional Quality</div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <div className="text-sm text-zinc-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>Model:</span>
                <span className="text-cyan-400 font-mono text-xs">eleven_turbo_v2_5</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Voice ID:</span>
                <span className="text-white font-mono text-xs">{selectedVoice.elevenLabsId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}