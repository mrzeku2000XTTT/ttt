import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Music, Wand2, Play, Pause, Download, RefreshCw,
  Sparkles, Film, ChevronLeft, Loader2, Check, MessageSquare,
  Zap, Volume2, VolumeX, Edit3, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const STAGES = ["idea", "generating", "editing", "music", "done"];

const EDIT_SUGGESTIONS = [
  "Make it more cinematic with dramatic lighting",
  "Speed up the pacing and add energetic cuts",
  "Add a slow-motion dreamy effect",
  "Make it darker and more mysterious",
  "Brighten the mood, add vibrant colors",
  "Add a vintage film grain aesthetic",
];

const NARRATOR_VOICES = [
  { id: "river", label: "River", desc: "Calm & neutral", emoji: "🌊" },
  { id: "honey", label: "Honey", desc: "Warm & soft", emoji: "🍯" },
  { id: "sunny", label: "Sunny", desc: "Bright & upbeat", emoji: "☀️" },
  { id: "storm", label: "Storm", desc: "Formal & authoritative", emoji: "⛈️" },
  { id: "spark", label: "Spark", desc: "Energetic & quick", emoji: "⚡" },
];

const LS_KEY = "video_studio_project";

function loadProject() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; }
}
function saveProject(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}
function clearProject() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

export default function VideoStudio() {
  const saved = loadProject();
  const [stage, setStage] = useState(saved?.stage || "idea");
  const [idea, setIdea] = useState(saved?.idea || "");
  const [agentLog, setAgentLog] = useState(saved?.agentLog || []);
  const [videoUrl, setVideoUrl] = useState(saved?.videoUrl || null);
  const [videoPrompt, setVideoPrompt] = useState(saved?.videoPrompt || "");
  const [editInstruction, setEditInstruction] = useState("");
  const [editedPrompt, setEditedPrompt] = useState(saved?.editedPrompt || "");
  const [selectedVoice, setSelectedVoice] = useState(NARRATOR_VOICES.find(v => v.id === saved?.voiceId) || NARRATOR_VOICES[0]);
  const [narratorText, setNarratorText] = useState(saved?.narratorText || "");
  const [musicUrl, setMusicUrl] = useState(saved?.musicUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const logRef = useRef(null);

  // Persist project state to localStorage whenever key values change
  useEffect(() => {
    if (stage === "idea" && !videoUrl) return; // don't save blank state
    saveProject({ stage, idea, videoUrl, videoPrompt, editedPrompt, narratorText, musicUrl, voiceId: selectedVoice?.id, agentLog });
  }, [stage, idea, videoUrl, videoPrompt, editedPrompt, narratorText, musicUrl, selectedVoice]);

  const addLog = (msg, type = "info") => {
    setAgentLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 100);
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setStage("generating");
    setIsLoading(true);
    setAgentLog([]);

    try {
      addLog("🤖 Agent analyzing your idea...", "agent");
      
      // Step 1: Enhance the prompt with LLM
      const enhanced = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a cinematic video director AI. Take this user idea and craft a vivid, detailed video generation prompt optimized for AI video creation. Be specific about visuals, motion, lighting, camera angles, and mood. Keep it under 200 words.

User idea: "${idea}"

Return ONLY the enhanced video prompt, nothing else.`,
      });

      const prompt = typeof enhanced === "string" ? enhanced : enhanced.prompt || idea;
      setVideoPrompt(prompt);
      setEditedPrompt(prompt);
      addLog("✨ Video prompt crafted: " + prompt.substring(0, 80) + "...", "success");
      addLog("🎬 Generating video (this takes ~30-60 seconds)...", "agent");

      // Step 2: Generate video
      const result = await base44.integrations.Core.GenerateVideo({
        prompt: prompt,
        duration: 6,
        aspect_ratio: "16:9"
      });

      setVideoUrl(result.url);
      addLog("✅ Video generated successfully!", "success");
      setStage("editing");
    } catch (err) {
      addLog("❌ Error: " + err.message, "error");
      setStage("idea");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoEdit = async () => {
    if (!editInstruction.trim()) return;
    setIsEditLoading(true);
    addLog("🎨 Agent applying edit: " + editInstruction, "agent");

    try {
      const newPrompt = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a video editing AI. Take this existing video prompt and rewrite it incorporating this edit instruction. Keep the core subject but apply the style/mood change.

Original prompt: "${editedPrompt}"
Edit instruction: "${editInstruction}"

Return ONLY the new enhanced video prompt.`,
      });

      const refined = typeof newPrompt === "string" ? newPrompt : editedPrompt;
      setEditedPrompt(refined);
      addLog("🔄 Re-generating video with edits...", "agent");

      const result = await base44.integrations.Core.GenerateVideo({
        prompt: refined,
        duration: 6,
        aspect_ratio: "16:9"
      });

      setVideoUrl(result.url);
      addLog("✅ Edited video ready!", "success");
      setEditInstruction("");
    } catch (err) {
      addLog("❌ Edit failed: " + err.message, "error");
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleGenerateNarrator = async () => {
    if (!narratorText.trim()) return;
    setIsMusicLoading(true);
    addLog("🎙️ Generating narrator voiceover with " + selectedVoice.label + " voice...", "agent");

    try {
      const audio = await base44.integrations.Core.GenerateSpeech({
        text: narratorText.trim(),
        voice: selectedVoice.id,
      });

      setMusicUrl(audio.url);
      addLog("🎙️ Narrator voiceover ready!", "success");
      setStage("done");
    } catch (err) {
      addLog("❌ Narrator generation failed: " + err.message, "error");
    } finally {
      setIsMusicLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSkipToMusic = () => setStage("music");
  const handleReset = () => {
    clearProject();
    setStage("idea");
    setIdea("");
    setVideoUrl(null);
    setVideoPrompt("");
    setEditedPrompt("");
    setMusicUrl(null);
    setAgentLog([]);
    setSelectedVoice(NARRATOR_VOICES[0]);
    setNarratorText("");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/ORBT">
              <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
                <ChevronLeft className="w-4 h-4" />
                ORBT Hub
              </button>
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-sm">Video Studio</h1>
                <p className="text-xs text-white/40">AI-Powered Video Creation</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stage !== "idea" && (
              <Button onClick={handleReset} variant="ghost" size="sm" className="text-white/60 hover:text-white text-xs">
                <RefreshCw className="w-3 h-3 mr-1" />
                New Project
              </Button>
            )}
          </div>
        </div>

        {/* Stage Progress */}
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-2">
            {[
              { id: "idea", label: "Idea", icon: Sparkles },
              { id: "generating", label: "Generate", icon: Video },
              { id: "editing", label: "Edit", icon: Edit3 },
              { id: "music", label: "Voice", icon: Volume2 },
              { id: "done", label: "Done", icon: Check },
            ].map((s, i) => {
              const Icon = s.icon;
              const stageIndex = STAGES.indexOf(stage);
              const thisIndex = STAGES.indexOf(s.id);
              const isActive = s.id === stage;
              const isPast = thisIndex < stageIndex;
              return (
                <React.Fragment key={s.id}>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" :
                    isPast ? "bg-white/10 text-white/60" : "text-white/30"
                  }`}>
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < 4 && <div className={`flex-1 h-px max-w-8 ${isPast ? "bg-purple-500/40" : "bg-white/10"}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">

            {/* Idea Stage */}
            <AnimatePresence mode="wait">
              {stage === "idea" && (
                <motion.div
                  key="idea"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold">What's your video idea?</h2>
                  </div>
                  <Textarea
                    value={idea}
                    onChange={e => setIdea(e.target.value)}
                    placeholder="e.g. A lone astronaut drifting through a colorful nebula, discovering an ancient space station..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/30 min-h-[120px] text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-white/40">The AI agent will craft a cinematic prompt and generate your video</p>
                    <Button
                      onClick={handleGenerate}
                      disabled={!idea.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Video
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Generating Stage */}
              {stage === "generating" && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Film className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Agent is working...</h2>
                  <p className="text-white/50 text-sm">Generating your video (30-60 seconds)</p>
                  <div className="mt-4 flex justify-center">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                </motion.div>
              )}

              {/* Editing Stage */}
              {(stage === "editing" || stage === "music" || stage === "done") && videoUrl && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Video Player */}
                  <div className="bg-black rounded-2xl overflow-hidden border border-white/10 relative">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full aspect-video"
                      loop
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={togglePlay} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button onClick={toggleMute} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>
                      <a href={videoUrl} download="video-studio.mp4" target="_blank" rel="noreferrer">
                        <button className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors">
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </a>
                    </div>
                  </div>

                  {/* Narrator Audio Player (if generated) */}
                  {musicUrl && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Volume2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Narrator Voiceover</p>
                        <p className="text-xs text-white/50">{selectedVoice.label} · {selectedVoice.desc}</p>
                      </div>
                      <audio ref={audioRef} src={musicUrl} controls className="h-8 w-full max-w-[180px]" />
                    </div>
                  )}

                  {/* Edit Panel */}
                  {stage === "editing" && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Edit3 className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-semibold text-sm">Auto-Edit with Agent</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {EDIT_SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setEditInstruction(s)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                              editInstruction === s
                                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={editInstruction}
                          onChange={e => setEditInstruction(e.target.value)}
                          placeholder="Or type a custom edit instruction..."
                          className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/50"
                        />
                        <Button
                          onClick={handleAutoEdit}
                          disabled={!editInstruction.trim() || isEditLoading}
                          size="sm"
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                        >
                          {isEditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={handleSkipToMusic}
                          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                        >
                          Skip to Music
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Narrator Stage */}
                  {stage === "music" && !musicUrl && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Volume2 className="w-4 h-4 text-pink-400" />
                        <h3 className="font-semibold text-sm">Generate Narrator Voiceover</h3>
                      </div>
                      <p className="text-xs text-white/40 mb-4">Type the narration text and choose a voice. The AI will generate a real TTS audio track.</p>

                      {/* Voice picker */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                        {NARRATOR_VOICES.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVoice(v)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              selectedVoice?.id === v.id
                                ? "bg-pink-500/20 border-pink-500/50 text-pink-200"
                                : "bg-white/5 border-white/10 hover:border-white/30 text-white/70 hover:text-white"
                            }`}
                          >
                            <div className="text-lg mb-1">{v.emoji}</div>
                            <div className="text-xs font-semibold">{v.label}</div>
                            <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{v.desc}</div>
                          </button>
                        ))}
                      </div>

                      {/* Narrator text */}
                      <Textarea
                        value={narratorText}
                        onChange={e => setNarratorText(e.target.value)}
                        placeholder="Type your narrator script here... e.g. 'In a world where technology meets nature, one journey begins...'"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/30 min-h-[90px] text-sm resize-none mb-3"
                      />

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setStage("done")}
                          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                        >
                          Skip Narration
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <Button
                          onClick={handleGenerateNarrator}
                          disabled={!narratorText.trim() || isMusicLoading}
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white border-0"
                        >
                          {isMusicLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
                          Generate Voice
                        </Button>
                      </div>
                    </div>
                  )}

                  {stage === "done" && (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Project Complete!</p>
                          <p className="text-xs text-white/50">Video + voiceover ready to download</p>
                        </div>
                      </div>
                      <Button onClick={handleReset} size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0 text-xs">
                        New Video
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Agent Log Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sticky top-40">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold">Agent Activity</h3>
                {isLoading || isEditLoading || isMusicLoading ? (
                  <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                ) : null}
              </div>
              <div
                ref={logRef}
                className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide"
              >
                {agentLog.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-5 h-5 text-white/30" />
                    </div>
                    <p className="text-xs text-white/30">Agent activity will appear here</p>
                  </div>
                ) : (
                  agentLog.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-xs p-2.5 rounded-lg border ${
                        log.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-300" :
                        log.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-300" :
                        log.type === "agent" ? "bg-purple-500/10 border-purple-500/20 text-purple-200" :
                        "bg-white/5 border-white/10 text-white/60"
                      }`}
                    >
                      <p className="leading-relaxed">{log.msg}</p>
                      <p className="text-white/30 mt-1">{log.time}</p>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Quick Tips */}
              {stage === "idea" && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-2 font-medium">💡 Idea Starters</p>
                  {[
                    "A dragon flying over a futuristic city at night",
                    "Time-lapse of a flower blooming in slow motion",
                    "Neon-lit cyberpunk street scene with rain",
                  ].map((tip) => (
                    <button
                      key={tip}
                      onClick={() => setIdea(tip)}
                      className="w-full text-left text-xs text-white/40 hover:text-white/70 py-1.5 px-2 hover:bg-white/5 rounded transition-all"
                    >
                      → {tip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}