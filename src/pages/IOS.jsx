import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Trophy, Zap, BookOpen, Brain, Target, Star, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function IOSPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zekuBalance, setZekuBalance] = useState(0);
  const [showLesson, setShowLesson] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load Zeku balance
      const zekuData = await base44.entities.ZekuToken.filter({
        user_email: currentUser.email
      });
      
      if (zekuData.length > 0) {
        setZekuBalance(zekuData[0].balance || 0);
      }

      // Load learning modules
      const allModules = await base44.entities.LearningModule.list('order', 100);
      setModules(allModules);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startModule = (module) => {
    setSelectedModule(module);
    setShowLesson(true);
    setCurrentQuestion(0);
    setScore(0);
    setQuizComplete(false);
  };

  const startQuiz = () => {
    setShowLesson(false);
    setCurrentQuestion(0);
  };

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === selectedModule.quiz_questions[currentQuestion].correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer(null);

    if (currentQuestion + 1 < selectedModule.quiz_questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    setQuizComplete(true);
    
    // Calculate tokens earned
    const percentage = (score / selectedModule.quiz_questions.length) * 100;
    let tokensEarned = 0;
    
    if (percentage >= 80) {
      tokensEarned = selectedModule.reward_tokens;
    } else if (percentage >= 60) {
      tokensEarned = Math.floor(selectedModule.reward_tokens * 0.5);
    }

    if (tokensEarned > 0) {
      try {
        // Update or create Zeku token record
        const existing = await base44.entities.ZekuToken.filter({
          user_email: user.email
        });

        if (existing.length > 0) {
          await base44.entities.ZekuToken.update(existing[0].id, {
            balance: (existing[0].balance || 0) + tokensEarned,
            total_earned: (existing[0].total_earned || 0) + tokensEarned,
            last_updated: new Date().toISOString()
          });
        } else {
          await base44.entities.ZekuToken.create({
            user_email: user.email,
            balance: tokensEarned,
            total_earned: tokensEarned,
            last_updated: new Date().toISOString()
          });
        }

        setZekuBalance(zekuBalance + tokensEarned);

        // Save progress
        await base44.entities.UserProgress.create({
          user_email: user.email,
          module_id: selectedModule.id,
          completed: percentage >= 80,
          score: percentage,
          attempts: 1
        });
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
    }
  };

  const closeModule = () => {
    setSelectedModule(null);
    setShowLesson(false);
    setCurrentQuestion(0);
    setScore(0);
    setQuizComplete(false);
    setShowResult(false);
    setSelectedAnswer(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (selectedModule) {
    if (showLesson) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white p-6">
          <div className="max-w-3xl mx-auto">
            <Button
              onClick={closeModule}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10 mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">{selectedModule.icon}</div>
                <div>
                  <h2 className="text-3xl font-black">{selectedModule.title}</h2>
                  <p className="text-purple-300 text-sm">{selectedModule.category}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                  {selectedModule.lesson_content}
                </p>
              </div>

              <Button
                onClick={startQuiz}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-14 text-lg font-bold"
              >
                <Target className="w-5 h-5 mr-2" />
                Start Quiz
              </Button>
            </motion.div>
          </div>
        </div>
      );
    }

    if (quizComplete) {
      const percentage = (score / selectedModule.quiz_questions.length) * 100;
      const passed = percentage >= 80;
      const tokensEarned = passed ? selectedModule.reward_tokens : percentage >= 60 ? Math.floor(selectedModule.reward_tokens * 0.5) : 0;

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white p-6 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full"
          >
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                {passed ? (
                  <Trophy className="w-12 h-12 text-white" />
                ) : (
                  <Star className="w-12 h-12 text-white" />
                )}
              </div>

              <h2 className="text-3xl font-black mb-2">
                {passed ? 'Congratulations!' : 'Good Try!'}
              </h2>
              
              <p className="text-white/60 mb-6">
                You scored {score} out of {selectedModule.quiz_questions.length}
              </p>

              <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  {percentage.toFixed(0)}%
                </div>
                {tokensEarned > 0 && (
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-400">
                    <Zap className="w-6 h-6" />
                    +{tokensEarned} Tokens
                  </div>
                )}
              </div>

              <Button
                onClick={closeModule}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 font-bold"
              >
                Continue Learning
              </Button>
            </div>
          </motion.div>
        </div>
      );
    }

    const question = selectedModule.quiz_questions[currentQuestion];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={closeModule}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-white/60 text-sm">
              Question {currentQuestion + 1} / {selectedModule.quiz_questions.length}
            </div>
          </div>

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
          >
            <h3 className="text-2xl font-bold mb-8">{question.question}</h3>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => !showResult && handleAnswer(index)}
                  disabled={showResult}
                  whileHover={{ scale: showResult ? 1 : 1.02 }}
                  whileTap={{ scale: showResult ? 1 : 0.98 }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    showResult
                      ? index === question.correct_answer
                        ? 'bg-green-500/20 border-green-500 text-white'
                        : selectedAnswer === index
                        ? 'bg-red-500/20 border-red-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/40'
                      : selectedAnswer === index
                      ? 'bg-purple-500/20 border-purple-500 text-white'
                      : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {showResult && index === question.correct_answer && (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                    {showResult && selectedAnswer === index && index !== question.correct_answer && (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <span className="font-medium">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Button
                  onClick={nextQuestion}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 font-bold"
                >
                  {currentQuestion + 1 < selectedModule.quiz_questions.length ? 'Next Question' : 'See Results'}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate(createPageUrl('Categories'))}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-full px-4 py-2 border border-purple-500/30">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-white">{zekuBalance}</span>
            <span className="text-purple-300 text-sm">Tokens</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            Learning Games
          </h1>
          <p className="text-purple-300 text-lg">Master crypto knowledge, earn Zeku tokens</p>
        </motion.div>

        {modules.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg mb-2">No learning modules yet</p>
            <p className="text-white/20 text-sm">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden cursor-pointer"
                onClick={() => startModule(module)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl">{module.icon}</div>
                    <div className="flex items-center gap-1 bg-yellow-500/20 rounded-full px-3 py-1 border border-yellow-500/30">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-bold text-yellow-300">{module.reward_tokens}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{module.title}</h3>
                  <p className="text-purple-300 text-sm mb-3">{module.category}</p>
                  <p className="text-white/60 text-sm line-clamp-2 mb-4">{module.description}</p>

                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Brain className="w-4 h-4" />
                    <span>{module.quiz_questions?.length || 0} Questions</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}