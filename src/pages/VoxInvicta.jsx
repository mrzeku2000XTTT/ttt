import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Download, Mic, Menu, ChevronRight, Info, Music, Plus, Key, SlidersHorizontal } from "lucide-react";
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
  const [freeCount, setFreeCount] = useState(() => {
    try { return parseInt(localStorage.getItem('voxinvicta_free_count') || '0', 10); } catch { return 0; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState("River");
  const FREE_LIMIT = 30;
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
      if (freeCount < FREE_LIMIT) {
        const result = await base44.integrations.Core.GenerateSpeech({
          text: text.trim(),
          voice: 'river',
        });
        if (result?.url) {
          setAudioUrl(result.url);
          const newCount = freeCount + 1;
          setFreeCount(newCount);
          localStorage.setItem('voxinvicta_free_count', String(newCount));
          setError(null);
        } else {
          setError('Failed to generate speech. Please try again.');
        }
      } else {
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

  const voiceAvatars = [
    { name: "River", color: "from-emerald-400 to-teal-500" },
    { name: "Honey", color: "from-amber-400 to-orange-500" },
    { name: "Sunny", color: "from-yellow-400 to-amber-500" },
    { name: "Storm", color: "from-slate-500 to-slate-700" },
    { name: "Spark", color: "from-fuchsia-400 to-pink-500" },
  ];

  const projectList = ["Untitled Project", "Narration Draft", "Podcast Intro"];

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center">
              <span className="text-white font-black text-sm">V</span>
            </div>
            <span className="font-bold text-[#111827]">Vox Invicta</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F0F2F5] text-[#6B7280] transition-colors lg:hidden"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text-to-Speech */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-[#111827]">Text-to-Speech</h2>
                <p className="text-sm text-[#6B7280]">General voice and big border radius</p>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Hi, welcome to Vox Invicta. The world is ending. What do we do to prepare?"
                className="min-h-[180px] bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF] text-base rounded-2xl focus-visible:ring-[#10B981] focus-visible:border-[#10B981] resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[#6B7280]">{text.length} / 5000 characters</span>
                <span className="text-xs text-[#6B7280]">Free: {Math.max(0, FREE_LIMIT - freeCount)}/{FREE_LIMIT}</span>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#111827] mb-4">Voice Selection</h3>
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {voiceAvatars.map((v) => {
                  const selected = v.name === activeVoiceName;
                  return (
                    <button
                      key={v.name}
                      onClick={() => setActiveVoiceName(v.name)}
                      className="flex flex-col items-center gap-2 flex-shrink-0"
                    >
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${v.color} flex items-center justify-center border-2 transition-all ${selected ? 'border-[#10B981] ring-2 ring-[#10B981]/30' : 'border-transparent opacity-80'}`}>
                        <Mic className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-xs font-medium ${selected ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>{v.name} Voice</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate */}
            <button
              onClick={handleGenerate}
              disabled={!text.trim() || isGenerating}
              className="w-full h-12 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate Audio
                </>
              )}
            </button>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3"
                >
                  <Info className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-600 flex-1">{error}</span>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Audio Player */}
            <AnimatePresence>
              {(audioUrl || isGenerating) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePlayPause}
                      disabled={isGenerating || !audioUrl}
                      className="w-12 h-12 rounded-full bg-[#111827] hover:bg-[#1F2937] disabled:opacity-40 flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#111827] mb-2">{activeVoiceName} Voice</div>
                      <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div className="h-full bg-[#10B981] rounded-full transition-all" style={{ width: isPlaying ? '100%' : '0%' }} />
                      </div>
                    </div>
                    <button
                      onClick={handleDownload}
                      disabled={!audioUrl}
                      className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] disabled:opacity-40 flex items-center justify-center text-[#6B7280] transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                  {audioUrl && (
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      preload="auto"
                      className="hidden"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Advanced Settings */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal className="w-4 h-4 text-[#6B7280]" />
                <h3 className="text-sm font-bold text-[#111827]">Advanced Settings</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#374151]">Stability</span>
                    <span className="text-sm font-medium text-[#111827]">50%</span>
                  </div>
                  <div className="relative h-1.5 bg-[#E5E7EB] rounded-full">
                    <div className="absolute left-0 top-0 h-full w-1/2 bg-[#10B981] rounded-full" />
                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-[#E5E7EB] rounded-full shadow-sm" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#374151]">Clarity</span>
                    <span className="text-sm font-medium text-[#111827]">75%</span>
                  </div>
                  <div className="relative h-1.5 bg-[#E5E7EB] rounded-full">
                    <div className="absolute left-0 top-0 h-full w-3/4 bg-[#10B981] rounded-full" />
                    <div className="absolute left-3/4 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-[#E5E7EB] rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-[#374151]">Enable Hava</span>
                  <div className="w-10 h-6 bg-[#10B981] rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#374151]">Enable Sixens</span>
                  <div className="w-10 h-6 bg-[#E5E7EB] rounded-full relative">
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Legal footer */}
            <button className="w-full bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center justify-between shadow-sm hover:bg-[#F9FAFB] transition-colors">
              <span className="text-sm text-[#6B7280]">Legal</span>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
            </button>
          </div>

          {/* Sidebar */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block space-y-6`}>
            {/* Projects */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#111827] mb-4">Projects</h3>
              <div className="space-y-1">
                {projectList.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-[#111827]">{p}</div>
                      <div className="text-xs text-[#9CA3AF]">50 maters - 11:00 pm</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-[#6B7280]" />
                <h3 className="text-sm font-bold text-[#111827]">Subscription Status</h3>
              </div>
              <div className="text-sm text-[#6B7280] mb-1">Free Plan</div>
              <div className="text-xs text-[#9CA3AF] mb-3">Unlimited free tier (no API key)</div>
              <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-xl">
                <span className="text-xs text-[#6B7280]">Free speech remaining</span>
                <span className="text-sm font-bold text-[#10B981]">{Math.max(0, FREE_LIMIT - freeCount)}/{FREE_LIMIT}</span>
              </div>
            </div>

            {/* API Keys */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#6B7280]" />
                  <h3 className="text-sm font-bold text-[#111827]">API Keys</h3>
                </div>
                <button className="text-xs font-medium text-[#10B981] hover:text-[#059669] flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Create
                </button>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-xl">
                  <span className="text-xs font-mono text-[#6B7280]">Model</span>
                  <span className="text-xs font-mono text-[#111827]">eleven_turbo_v2_5</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-xl">
                  <span className="text-xs font-mono text-[#6B7280]">Voice ID</span>
                  <span className="text-xs font-mono text-[#111827]">{selectedVoice.elevenLabsId}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-xl">
                  <span className="text-xs font-mono text-[#6B7280]">••••••••</span>
                  <span className="text-xs text-[#9CA3AF]">masked</span>
                </div>
              </div>
              <button className="w-full h-10 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold transition-colors">
                Create Now
              </button>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#111827] mb-4">History</h3>
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-[#F0F2F5] flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-[#6B7280]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#111827] truncate">Generated Audio {i}</div>
                      <div className="text-xs text-[#9CA3AF]">{i * 12} minutes ago</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 pb-4">
              {["Legal", "Privacy", "Links", "Contact", "Terms and Conditions"].map(l => (
                <span key={l} className="text-xs text-[#9CA3AF]">{l}</span>
              ))}
              <span className="text-xs text-[#9CA3AF] w-full text-center mt-2">© 2026 by - Vox Invicta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}