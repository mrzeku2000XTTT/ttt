import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Languages, 
  BookOpen, 
  Brain, 
  Sparkles, 
  ChevronRight,
  Globe,
  MessageSquare,
  Zap,
  Target,
  Award,
  TrendingUp,
  Users
} from "lucide-react";

export default function LearningPage() {
  const [user, setUser] = useState(null);
  const [translateFrom, setTranslateFrom] = useState("");
  const [translateTo, setTranslateTo] = useState("");
  const [translating, setTranslating] = useState(false);
  const [fromLang, setFromLang] = useState("English");
  const [toLang, setToLang] = useState("Spanish");
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [learningPath, setLearningPath] = useState([]);

  useEffect(() => {
    loadUser();
    loadLearningPath();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log('User not logged in');
    }
  };

  const loadLearningPath = async () => {
    try {
      const modules = await base44.entities.LearningModule.list('-created_date', 10);
      setLearningPath(modules);
    } catch (err) {
      console.error('Failed to load learning path:', err);
    }
  };

  const handleTranslate = async () => {
    if (!translateFrom.trim()) return;
    
    setTranslating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following text from ${fromLang} to ${toLang}. Only provide the translation, nothing else:\n\n${translateFrom}`,
        add_context_from_internet: false
      });

      setTranslateTo(response);
    } catch (err) {
      console.error('Translation failed:', err);
      setTranslateTo('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const generateQuiz = async (topic) => {
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a fun, interactive multiple choice quiz question about ${topic}. Return ONLY a JSON object with this exact structure:
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correct": 0
}
Where correct is the index (0-3) of the correct answer.`,
        response_json_schema: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            correct: { type: "number" }
          }
        }
      });

      setCurrentQuestion({ ...response, topic });
      setQuizActive(true);
    } catch (err) {
      console.error('Quiz generation failed:', err);
    }
  };

  const checkAnswer = (index) => {
    if (index === currentQuestion.correct) {
      setScore(score + 1);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-[200] bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg shadow-lg';
      notification.textContent = '✓ Correct! +1 point';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } else {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-[200] bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg shadow-lg';
      notification.textContent = '✗ Not quite! Try again';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }
    
    setQuizActive(false);
    setCurrentQuestion(null);
  };

  const topics = [
    { 
      name: "Web3 & Blockchain", 
      icon: Globe, 
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-cyan-500/30",
      description: "Master decentralized technologies"
    },
    { 
      name: "AI & Machine Learning", 
      icon: Brain, 
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      description: "Understand artificial intelligence"
    },
    { 
      name: "Kaspa Ecosystem", 
      icon: Zap, 
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      description: "Deep dive into KAS"
    },
    { 
      name: "DeFi & Trading", 
      icon: TrendingUp, 
      color: "from-orange-500/20 to-red-500/20",
      borderColor: "border-orange-500/30",
      description: "Financial markets mastery"
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-black to-zinc-900/30 pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white">Learning Hub</h1>
                <p className="text-white/40 text-sm">Master Web3, AI, and more</p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-3">
                <div className="text-2xl font-bold text-white">{score}</div>
                <div className="text-xs text-white/40">Points</div>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-3">
                <div className="text-2xl font-bold text-cyan-400">{learningPath.length}</div>
                <div className="text-xs text-white/40">Modules</div>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-400">12</div>
                <div className="text-xs text-white/40">Completed</div>
              </div>
            </div>
          </motion.div>

          {/* Translator Widget - First Priority */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-zinc-900 border-white/5">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                    <Languages className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">AI Translator</h3>
                    <p className="text-xs text-white/40">Instant language translation</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        value={fromLang}
                        onChange={(e) => setFromLang(e.target.value)}
                        className="flex-1 bg-black border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
                      >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                        <option>Japanese</option>
                        <option>Chinese</option>
                        <option>Arabic</option>
                        <option>Russian</option>
                      </select>
                    </div>
                    <Textarea
                      value={translateFrom}
                      onChange={(e) => setTranslateFrom(e.target.value)}
                      placeholder="Enter text to translate..."
                      className="bg-black border-white/10 text-white placeholder-white/30 resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        value={toLang}
                        onChange={(e) => setToLang(e.target.value)}
                        className="flex-1 bg-black border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
                      >
                        <option>Spanish</option>
                        <option>English</option>
                        <option>French</option>
                        <option>German</option>
                        <option>Japanese</option>
                        <option>Chinese</option>
                        <option>Arabic</option>
                        <option>Russian</option>
                      </select>
                    </div>
                    <Textarea
                      value={translateTo}
                      readOnly
                      placeholder="Translation will appear here..."
                      className="bg-black border-white/10 text-white placeholder-white/30 resize-none"
                      rows={4}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleTranslate}
                  disabled={translating || !translateFrom.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {translating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4 mr-2" />
                      Translate
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Interactive Learning Topics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Learning Paths
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {topics.map((topic, index) => {
                const Icon = topic.icon;
                return (
                  <motion.div
                    key={topic.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className={`bg-gradient-to-br ${topic.color} border ${topic.borderColor} cursor-pointer group`}>
                      <div className="p-4" onClick={() => generateQuiz(topic.name)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 bg-black/40 border ${topic.borderColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{topic.name}</h3>
                              <p className="text-xs text-white/60">{topic.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Sparkles className="w-3 h-3" />
                          <span>Click to start interactive quiz</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Community Learning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-zinc-900 border-white/5">
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Community Learning</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-black/40 border border-white/5 rounded-lg p-4">
                    <MessageSquare className="w-8 h-8 text-cyan-400 mb-2" />
                    <div className="text-sm font-semibold text-white mb-1">Discussion Forums</div>
                    <div className="text-xs text-white/40">Ask questions, share knowledge</div>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-lg p-4">
                    <Award className="w-8 h-8 text-yellow-400 mb-2" />
                    <div className="text-sm font-semibold text-white mb-1">Achievements</div>
                    <div className="text-xs text-white/40">Earn badges as you learn</div>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-lg p-4">
                    <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                    <div className="text-sm font-semibold text-white mb-1">Progress Tracking</div>
                    <div className="text-xs text-white/40">See your learning journey</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {quizActive && currentQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setQuizActive(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">{currentQuestion.topic}</h3>
              </div>

              <p className="text-white text-lg mb-6">{currentQuestion.question}</p>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => checkAnswer(index)}
                    className="w-full bg-black border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-white justify-start text-left h-auto py-4 px-4"
                  >
                    <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </Button>
                ))}
              </div>

              <Button
                onClick={() => setQuizActive(false)}
                variant="ghost"
                className="w-full mt-4 text-white/60 hover:text-white"
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}