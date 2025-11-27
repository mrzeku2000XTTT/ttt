import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Heart, Brain, Moon, Sun, Wind, Waves, Zap, Sparkles, 
  Volume2, VolumeX, Play, Pause, Send, Loader2, X,
  Activity, Coffee, Leaf, Music, Save, Smile, Frown, Meh,
  BookOpen, Star, Plus, Clock, List, PhoneCall
} from "lucide-react";

const FREQUENCIES = [
  { name: "Delta", hz: 2, color: "#8B5CF6", desc: "Deep sleep, healing" },
  { name: "Theta", hz: 6, color: "#A855F7", desc: "Meditation, creativity" },
  { name: "Alpha", hz: 10, color: "#C084FC", desc: "Relaxation, calm" },
  { name: "Beta", hz: 20, color: "#E9D5FF", desc: "Focus, alertness" },
  { name: "Gamma", hz: 40, color: "#F3E8FF", desc: "Peak awareness" },
  { name: "528Hz", hz: 528, color: "#10B981", desc: "Love frequency, DNA repair" },
  { name: "432Hz", hz: 432, color: "#14B8A6", desc: "Natural harmony" },
  { name: "396Hz", hz: 396, color: "#06B6D4", desc: "Liberation from fear" },
  { name: "639Hz", hz: 639, color: "#F59E0B", desc: "Connection, relationships" },
  { name: "741Hz", hz: 741, color: "#F97316", desc: "Awakening intuition" }
];

const THERAPY_FEATURES = [
  { icon: Brain, name: "Mental Clarity", active: true },
  { icon: Heart, name: "Emotional Balance", active: true },
  { icon: Moon, name: "Sleep Quality", active: true },
  { icon: Sun, name: "Energy Boost", active: false },
  { icon: Wind, name: "Stress Relief", active: true },
  { icon: Waves, name: "Flow State", active: false },
  { icon: Zap, name: "Chakra Alignment", active: true },
  { icon: Sparkles, name: "Aura Cleansing", active: false },
  { icon: Coffee, name: "Morning Ritual", active: false },
  { icon: Leaf, name: "Nature Connection", active: true }
];

const MOODS = [
  { name: "joyful", icon: Smile, color: "#F59E0B" },
  { name: "peaceful", icon: Moon, color: "#8B5CF6" },
  { name: "energized", icon: Zap, color: "#10B981" },
  { name: "anxious", icon: Wind, color: "#EF4444" },
  { name: "sad", icon: Frown, color: "#6B7280" },
  { name: "stressed", icon: Activity, color: "#DC2626" },
  { name: "neutral", icon: Meh, color: "#9CA3AF" }
];

export default function LifePage() {
  const [user, setUser] = useState(null);
  const [selectedFreq, setSelectedFreq] = useState(FREQUENCIES[5]);
  const [customFrequency, setCustomFrequency] = useState(528);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jazzPlaying, setJazzPlaying] = useState(true);
  const [messages, setMessages] = useState([]);
  
  // Meditation state
  const [showMeditation, setShowMeditation] = useState(false);
  const [meditationScript, setMeditationScript] = useState("");
  const [isGeneratingMeditation, setIsGeneratingMeditation] = useState(false);
  
  // Mood tracking state
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [moodNotes, setMoodNotes] = useState("");
  const [recentMoods, setRecentMoods] = useState([]);
  const [isSavingMood, setIsSavingMood] = useState(false);
  
  // Mood swing analyzer
  const [moodInput, setMoodInput] = useState("");
  const [isAnalyzingMood, setIsAnalyzingMood] = useState(false);
  const [moodAnalysis, setMoodAnalysis] = useState(null);
  

  
  // Presets state
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [activeTab, setActiveTab] = useState("frequency"); // frequency, meditation, mood, presets
  const [showVoiceWidget, setShowVoiceWidget] = useState(false);
  
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const jazzAudioRef = useRef(null);

  useEffect(() => {
    loadUser();
    initAudio();
    
    // Load ElevenLabs ConvAI script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    
    const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
    if (!existingScript) {
      document.head.appendChild(script);
    }
    
    return () => {
      stopTone();
      if (jazzAudioRef.current) {
        jazzAudioRef.current.pause();
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadPresets();
      loadRecentMoods();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const initAudio = () => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);
    gainNodeRef.current.gain.value = volume;

    // Piano Rain Ambience background
    jazzAudioRef.current = new Audio('https://www.soundjay.com/nature/sounds/rain-01.mp3');
    jazzAudioRef.current.loop = true;
    jazzAudioRef.current.volume = 0.15;
    if (jazzPlaying) {
      jazzAudioRef.current.play().catch(() => {});
    }
  };

  const playTone = (frequency = null) => {
    if (!audioContextRef.current) return;

    stopTone();

    oscillatorRef.current = audioContextRef.current.createOscillator();
    oscillatorRef.current.type = 'sine';
    oscillatorRef.current.frequency.value = frequency || customFrequency;
    oscillatorRef.current.connect(gainNodeRef.current);
    oscillatorRef.current.start();
    
    setIsPlaying(true);
  };

  const updateFrequency = (newFreq) => {
    setCustomFrequency(newFreq);
    if (isPlaying && oscillatorRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(newFreq, audioContextRef.current.currentTime);
    }
  };

  const stopTone = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopTone();
    } else {
      playTone();
    }
  };

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const toggleJazz = () => {
    if (!jazzAudioRef.current) return;
    
    if (jazzPlaying) {
      jazzAudioRef.current.pause();
    } else {
      jazzAudioRef.current.play().catch(() => {});
    }
    setJazzPlaying(!jazzPlaying);
  };

  const loadPresets = async () => {
    try {
      const userPresets = await base44.entities.FrequencyPreset.filter({
        user_email: user.email
      });
      setPresets(userPresets);
    } catch (err) {
      console.error("Failed to load presets:", err);
    }
  };

  const loadRecentMoods = async () => {
    try {
      const moods = await base44.entities.MoodEntry.filter({
        user_email: user.email
      }, '-created_date', 7);
      setRecentMoods(moods);
    } catch (err) {
      console.error("Failed to load moods:", err);
    }
  };

  const handleGenerateMeditation = async () => {
    setIsGeneratingMeditation(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a 5-minute guided meditation script for ${selectedFreq.name} (${selectedFreq.hz}Hz) frequency healing.

Purpose: ${selectedFreq.desc}

Write a calming, spoken meditation with:
- Opening breath work (30 seconds)
- Body scan with frequency visualization (2 minutes)
- Affirmations aligned with the frequency (1 minute)
- Integration and grounding (1.5 minutes)

Use mystical, healing language. Include pauses marked as [pause]. Keep it flowing and poetic.`,
        add_context_from_internet: false
      });

      setMeditationScript(response);
      setShowMeditation(true);
    } catch (err) {
      console.error("Failed to generate meditation:", err);
      alert("Failed to generate meditation. Please try again.");
    } finally {
      setIsGeneratingMeditation(false);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood || !user) return;

    setIsSavingMood(true);
    try {
      await base44.entities.MoodEntry.create({
        user_email: user.email,
        mood: selectedMood,
        energy_level: energyLevel,
        notes: moodNotes,
        frequency_used: `${selectedFreq.name} (${selectedFreq.hz}Hz)`,
        date: new Date().toISOString().split('T')[0]
      });

      setSelectedMood(null);
      setMoodNotes("");
      setEnergyLevel(5);
      setShowMoodTracker(false);
      loadRecentMoods();
    } catch (err) {
      console.error("Failed to save mood:", err);
      alert("Failed to save mood entry.");
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim() || !user) return;

    setIsSavingPreset(true);
    try {
      await base44.entities.FrequencyPreset.create({
        user_email: user.email,
        name: newPresetName,
        frequencies: [{
          name: selectedFreq.name,
          hz: selectedFreq.hz,
          duration: 10
        }],
        duration_minutes: 10,
        description: `${selectedFreq.desc}`,
        is_favorite: false
      });

      setNewPresetName("");
      loadPresets();
      alert("✨ Preset saved successfully!");
    } catch (err) {
      console.error("Failed to save preset:", err);
      alert("Failed to save preset.");
    } finally {
      setIsSavingPreset(false);
    }
  };



  const analyzeMoodAndPlay = async () => {
    if (!moodInput.trim()) return;

    setIsAnalyzingMood(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this person's day/mood and recommend the BEST healing frequency:

"${moodInput}"

Available frequencies:
- 396Hz: Liberation from fear, guilt
- 432Hz: Natural harmony, calming
- 528Hz: Love, DNA repair, transformation
- 639Hz: Connection, relationships, harmony
- 741Hz: Awakening intuition, expression
- Delta (2Hz): Deep healing, sleep
- Theta (6Hz): Meditation, creativity
- Alpha (10Hz): Relaxation, calm
- Beta (20Hz): Focus, alertness
- Gamma (40Hz): Peak awareness

Return JSON with:
{
  "frequency": number (the Hz value),
  "reason": "brief why this frequency helps",
  "stress_level": "low/medium/high/critical",
  "recommendation": "short guidance"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            frequency: { type: "number" },
            reason: { type: "string" },
            stress_level: { type: "string" },
            recommendation: { type: "string" }
          }
        }
      });

      setMoodAnalysis(response);

      // Find and set the frequency
      const matchedFreq = FREQUENCIES.find(f => f.hz === response.frequency);
      if (matchedFreq) {
        setSelectedFreq(matchedFreq);
        setCustomFrequency(response.frequency);
        
        // Auto-play the frequency
        if (!isPlaying) {
          setTimeout(() => {
            updateFrequency(response.frequency);
            playTone(response.frequency);
          }, 500);
        } else {
          updateFrequency(response.frequency);
        }
      }
    } catch (err) {
      console.error("Mood analysis failed:", err);
      alert("Failed to analyze mood. Please try again.");
    } finally {
      setIsAnalyzingMood(false);
    }
  };

  const handleAnalyze = async () => {
    if (!userInput.trim()) return;

    setIsAnalyzing(true);

    const newMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a soul frequency and wellness AI assistant. The user shared: "${userInput}". 

Provide gentle, healing insights on:
1. Their emotional state and soul frequency
2. Recommended healing frequencies (from: 396Hz, 432Hz, 528Hz, 639Hz, 741Hz)
3. A specific song recommendation (include artist and song name) that matches their current energy
4. Daily balance suggestions
5. Affirmations or mindful practices

Format your response clearly with the song recommendation highlighted. Keep it mystical, nurturing, and spiritually grounding.`,
        add_context_from_internet: false
      });

      const aiMsg = { role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMsg]);
      setAiResponse(response);
      setUserInput("");
    } catch (err) {
      console.error("AI analysis failed:", err);
      const errorMsg = { role: 'assistant', content: "✨ Connection disrupted. Please center yourself and try again." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Voice Widget Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowVoiceWidget(!showVoiceWidget)}
        className="fixed left-4 md:left-6 z-[100] w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 border border-purple-500/30 hover:border-purple-500/60 rounded-full flex items-center justify-center shadow-lg transition-all"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
        title={showVoiceWidget ? "Close Voice Agent" : "Talk to Frequency Assistant"}
      >
        <PhoneCall className="w-5 h-5 text-white" strokeWidth={2} />
      </motion.button>

      {/* Voice Agent Active Status */}
      <AnimatePresence>
        {showVoiceWidget && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-full px-4 py-2 flex items-center gap-3 text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              <span className="text-white/80">Frequency Voice Assistant Active</span>
              <button onClick={() => setShowVoiceWidget(false)} className="text-white/50 hover:text-white/90 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ElevenLabs Voice Widget */}
      <AnimatePresence>
        {showVoiceWidget && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-20 left-4 z-[9999]"
            style={{ 
              position: 'fixed !important',
              top: '80px !important',
              left: '16px !important',
              zIndex: 9999,
              transform: 'none !important'
            }}
          >
            <div style={{
              position: 'relative',
              width: '300px',
              height: '400px'
            }}>
              <elevenlabs-convai 
                agent-id="agent_1201k357903jfq5smv3sgnw0n62g"
                style={{
                  '--primary-color': '#8B5CF6',
                  position: 'absolute !important',
                  top: '0 !important',
                  left: '0 !important',
                  width: '100% !important',
                  height: '100% !important',
                  transform: 'none !important'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-4 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            LIFE
          </h1>
          <p className="text-white/40 text-xs">Soul Frequency Therapy</p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-1 bg-black border border-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("frequency")}
              className={`flex-1 px-2 py-2 rounded-md transition-all ${
                activeTab === "frequency"
                  ? "bg-purple-500/10 text-white border border-purple-500/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Activity className="w-3 h-3 mx-auto mb-0.5" />
              <span className="text-[10px]">Frequency</span>
            </button>
            <button
              onClick={() => setActiveTab("meditation")}
              className={`flex-1 px-2 py-2 rounded-md transition-all ${
                activeTab === "meditation"
                  ? "bg-purple-500/10 text-white border border-purple-500/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <BookOpen className="w-3 h-3 mx-auto mb-0.5" />
              <span className="text-[10px]">Meditation</span>
            </button>
            <button
              onClick={() => setActiveTab("mood")}
              className={`flex-1 px-2 py-2 rounded-md transition-all ${
                activeTab === "mood"
                  ? "bg-purple-500/10 text-white border border-purple-500/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Heart className="w-3 h-3 mx-auto mb-0.5" />
              <span className="text-[10px]">Mood</span>
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 px-2 py-2 rounded-md transition-all ${
                activeTab === "presets"
                  ? "bg-purple-500/10 text-white border border-purple-500/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Star className="w-3 h-3 mx-auto mb-0.5" />
              <span className="text-[10px]">Presets</span>
            </button>
          </div>
        </motion.div>

        {/* Frequency Tab */}
        {activeTab === "frequency" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Mood Swing Analyzer */}
          <Card className="bg-gradient-to-br from-pink-500/10 via-black to-orange-500/10 border border-pink-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white">How's Your Day?</h3>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={moodInput}
                onChange={(e) => setMoodInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeMoodAndPlay()}
                placeholder="Describe your day... (e.g., stressful meeting, tired, anxious)"
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-pink-500/30"
                disabled={isAnalyzingMood}
              />
              <Button
                onClick={analyzeMoodAndPlay}
                disabled={!moodInput.trim() || isAnalyzingMood}
                className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 px-4"
              >
                {isAnalyzingMood ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
              </Button>
            </div>

            {moodAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Recommended Frequency</span>
                  <span className="text-sm font-bold text-pink-400">{moodAnalysis.frequency}Hz</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    moodAnalysis.stress_level === 'critical' ? 'bg-red-400' :
                    moodAnalysis.stress_level === 'high' ? 'bg-orange-400' :
                    moodAnalysis.stress_level === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  } animate-pulse`} />
                  <span className="text-xs text-white/60 capitalize">Stress: {moodAnalysis.stress_level}</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">{moodAnalysis.reason}</p>
                <p className="text-xs text-cyan-400/80 italic">{moodAnalysis.recommendation}</p>
              </motion.div>
            )}
          </Card>

          {/* Frequency Player Card */}
          <Card className="bg-gradient-to-br from-purple-500/10 via-black to-cyan-500/10 border border-purple-500/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Frequency Player</h2>
                  <p className="text-[10px] text-white/40">{selectedFreq.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleJazz}
                  className={`p-2 rounded-lg transition-all ${jazzPlaying ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white/40'}`}
                >
                  <Music className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Frequency Display */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-sm text-white/60">Current Frequency</span>
                </div>
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  {customFrequency} Hz
                </div>
              </div>

              {/* Frequency Slider */}
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="1000"
                  step="1"
                  value={customFrequency}
                  onChange={(e) => updateFrequency(parseInt(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50"
                  style={{
                    background: `linear-gradient(to right, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0.3) ${(customFrequency/1000)*100}%, rgba(255, 255, 255, 0.05) ${(customFrequency/1000)*100}%, rgba(255, 255, 255, 0.05) 100%)`
                  }}
                />
              </div>

              {/* Frequency Presets */}
              <div className="grid grid-cols-5 gap-2 mt-4">
                {FREQUENCIES.map((freq) => (
                  <button
                    key={freq.hz}
                    onClick={() => {
                      setSelectedFreq(freq);
                      setCustomFrequency(freq.hz);
                      if (isPlaying) {
                        updateFrequency(freq.hz);
                      }
                    }}
                    className={`px-2 py-2 rounded-lg border transition-all text-center ${
                      Math.abs(customFrequency - freq.hz) < 5
                        ? 'border-purple-500/50 bg-purple-500/20 scale-105'
                        : 'border-white/5 bg-black/50 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5" style={{ color: freq.color }}>
                      {freq.name}
                    </div>
                    <div className="text-[8px] text-white/40">{freq.hz}Hz</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                onClick={togglePlay}
                className={`flex-1 h-12 text-sm font-bold transition-all ${
                  isPlaying
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 shadow-lg shadow-purple-500/30'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Frequency
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play {customFrequency}Hz
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="text-xs text-white/60 w-8">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          </Card>

          {/* Therapy Features */}
          <Card className="bg-black border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Therapy</h2>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {THERAPY_FEATURES.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border ${
                      feature.active
                        ? 'border-purple-500/20 bg-purple-500/5'
                        : 'border-white/5 bg-black opacity-30'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto text-purple-400" />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* AI Insights */}
          <Card className="bg-black border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-pink-400" />
              <h2 className="text-sm font-bold text-white">AI Insights + Song Suggestions</h2>
            </div>

            {/* Chat Messages */}
            {messages.length > 0 && (
              <div className="mb-3 max-h-64 overflow-y-auto space-y-3 pr-2">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl ${
                        msg.role === 'user'
                          ? 'bg-purple-500/20 border border-purple-500/30 text-white'
                          : 'bg-white/10 border border-white/20 text-white'
                      }`}
                    >
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Share your day... AI will suggest a healing song for you ✨"
              className="bg-black border border-white/5 text-white placeholder-white/30 min-h-[80px] mb-3 resize-none text-sm"
            />

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !userInput.trim()}
              className="w-full bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-600 hover:to-purple-600 h-10 text-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-2" />
                  Get Guidance + Song
                </>
              )}
            </Button>
          </Card>
        </motion.div>
        )}

        {/* Meditation Tab */}
        {activeTab === "meditation" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-black/40 border border-white/10 backdrop-blur-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold">Guided Meditation</h2>
              </div>
              <Button
                onClick={handleGenerateMeditation}
                disabled={isGeneratingMeditation}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isGeneratingMeditation ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Generate for {selectedFreq.name}</>
                )}
              </Button>
            </div>

            {meditationScript && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="mb-4 flex items-center gap-2 text-sm text-purple-400">
                  <Activity className="w-4 h-4" />
                  <span>{selectedFreq.name} - {selectedFreq.hz}Hz</span>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{meditationScript}</p>
                </div>
              </div>
            )}

            {!meditationScript && (
              <div className="text-center py-12 text-white/40">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Select a frequency and generate a personalized meditation</p>
              </div>
            )}
          </Card>
        </motion.div>
        )}

        {/* Mood Tracking Tab */}
        {activeTab === "mood" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-black/40 border border-white/10 backdrop-blur-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-5 h-5 text-pink-400" />
              <h2 className="text-lg font-bold">Mood Journal</h2>
            </div>

            {/* Mood Selector */}
            <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-6">
              {MOODS.map((mood) => {
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.name}
                    onClick={() => setSelectedMood(mood.name)}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedMood === mood.name
                        ? 'border-white/40 bg-white/10 scale-105'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: mood.color }} />
                    <div className="text-xs text-white/80 capitalize">{mood.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Energy Level */}
            <div className="mb-6">
              <label className="text-sm text-white/60 mb-2 block">Energy Level: {energyLevel}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Notes */}
            <Textarea
              value={moodNotes}
              onChange={(e) => setMoodNotes(e.target.value)}
              placeholder="How are you feeling today? Any thoughts to capture..."
              className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[100px] mb-4 resize-none"
            />

            <div className="flex items-center justify-between mb-6">
              <span className="text-xs text-white/40">Currently playing: {selectedFreq.name}</span>
              <Button
                onClick={handleSaveMood}
                disabled={!selectedMood || isSavingMood}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                {isSavingMood ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />Save Entry</>
                )}
              </Button>
            </div>

            {/* Recent Moods */}
            {recentMoods.length > 0 && (
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-semibold mb-4 text-white/80">Recent Entries</h3>
                <div className="space-y-3">
                  {recentMoods.map((mood) => (
                    <div key={mood.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{mood.mood}</span>
                        <span className="text-xs text-white/40">{new Date(mood.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-white/60">Energy: {mood.energy_level}/10</div>
                      {mood.notes && <p className="text-xs text-white/50 mt-2">{mood.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
        )}

        {/* Presets Tab */}
        {activeTab === "presets" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-black/40 border border-white/10 backdrop-blur-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-bold">Frequency Presets</h2>
            </div>

            {/* Save Current as Preset */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/80">Save Current: {selectedFreq.name} ({selectedFreq.hz}Hz)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30"
                />
                <Button
                  onClick={handleSavePreset}
                  disabled={!newPresetName.trim() || isSavingPreset}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {isSavingPreset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Saved Presets */}
            {presets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => {
                      const freq = FREQUENCIES.find(f => f.hz === preset.frequencies[0].hz);
                      if (freq) {
                        setSelectedFreq(freq);
                        setActiveTab("frequency");
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{preset.name}</h3>
                      <Clock className="w-4 h-4 text-white/40" />
                    </div>
                    <p className="text-xs text-white/60 mb-2">{preset.description}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Activity className="w-3 h-3" />
                      {preset.frequencies.map(f => `${f.name} (${f.hz}Hz)`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/40">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No saved presets yet. Create your first routine!</p>
              </div>
            )}
          </Card>
        </motion.div>
        )}
      </div>
    </div>
  );
}