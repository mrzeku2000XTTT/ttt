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
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchVoice, setSearchVoice] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = React.useRef(null);

  const voices = [
    { id: 1, name: "Kaspa - Genesis Voice", category: "Professional", description: "Deep, authoritative, commanding presence", icon: "👑", elevenLabsId: "EXAVITQu4vr4xnSDxMaL" },
    { id: 2, name: "Satoshi - Mysterious Oracle", category: "Professional", description: "Calm, wise, philosophical tone", icon: "🧙", elevenLabsId: "pNInz6obpgDQGcFmaJgB" },
    { id: 3, name: "Vitalik - Tech Visionary", category: "Professional", description: "Intellectual, analytical, forward-thinking", icon: "🤖", elevenLabsId: "TxGEqnHWrfWFTfGW9XjX" },
    { id: 4, name: "Nakamoto - Shadow Architect", category: "Professional", description: "Enigmatic, calculated, strategic", icon: "🕵️", elevenLabsId: "21m00Tcm4TlvDq8ikWAM" },
    { id: 5, name: "Luna - Crypto Queen", category: "Professional", description: "Confident, dynamic, charismatic", icon: "👸", elevenLabsId: "XB0fDUnXU5powFXDhCwa" },
    { id: 6, name: "Echo - Digital Spirit", category: "Creative", description: "Ethereal, haunting, mysterious", icon: "👻", elevenLabsId: "jBpfuIE2acCO8z3wKNLl" },
    { id: 7, name: "Cipher - Code Whisperer", category: "Creative", description: "Technical, precise, methodical", icon: "🔐", elevenLabsId: "Zlb1dXrM653N07WRdFW3" },
    { id: 8, name: "Nova - Star Trader", category: "Creative", description: "Energetic, optimistic, inspiring", icon: "⭐", elevenLabsId: "pqHfZKP75CvOlQylNhV4" },
  ];

  const filteredVoices = searchVoice
    ? voices.filter(v => v.name.toLowerCase().includes(searchVoice.toLowerCase()))
    : voices;

  const handleGenerate = async () => {
    if (!text || !selectedVoice) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data } = await base44.functions.invoke('generateVoice', {
        text: text,
        voice_id: selectedVoice.elevenLabsId
      });
      
      setAudioUrl(data.audio_url);
    } catch (err) {
      setError(err.message || 'Failed to generate speech');
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

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'vox_invicta_speech.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
              >
                <Card className="bg-red-500/10 border-red-500/30 mb-6">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <div className="text-red-400 text-sm">{error}</div>
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
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Right Sidebar - Voice Selection */}
      <div className="w-96 bg-zinc-950 border-l border-zinc-800 p-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select a voice</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={searchVoice}
              onChange={(e) => setSearchVoice(e.target.value)}
              placeholder="Search voices..."
              className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="mb-4">
          <button className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
            All saved voices
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-500 mb-2">Recently used</div>
          {filteredVoices.slice(0, 4).map((voice) => (
            <motion.button
              key={voice.id}
              onClick={() => setSelectedVoice(voice)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-3 rounded-lg border transition-all ${
                selectedVoice?.id === voice.id
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xl">
                  {voice.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">{voice.name}</div>
                  <div className="text-xs text-zinc-500">{voice.description.substring(0, 30)}...</div>
                </div>
                <Button size="icon" variant="ghost" className="w-8 h-8">
                  <Play className="w-4 h-4 text-zinc-400" />
                </Button>
              </div>
            </motion.button>
          ))}

          <div className="text-xs font-semibold text-zinc-500 mb-2 mt-6">Default</div>
          {filteredVoices.slice(4).map((voice) => (
            <motion.button
              key={voice.id}
              onClick={() => setSelectedVoice(voice)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-3 rounded-lg border transition-all ${
                selectedVoice?.id === voice.id
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl">
                  {voice.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">{voice.name}</div>
                  <div className="text-xs text-zinc-500">{voice.description.substring(0, 30)}...</div>
                </div>
                <Button size="icon" variant="ghost" className="w-8 h-8">
                  <Play className="w-4 h-4 text-zinc-400" />
                </Button>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-2">Voice Library - Top Picks for You</div>
          <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">
            View all →
          </button>
        </div>
      </div>
    </div>
  );
}