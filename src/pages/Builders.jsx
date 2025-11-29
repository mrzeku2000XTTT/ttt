import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Rocket, CheckCircle2, Circle, Loader2, Trash2, Plus, Target, Code2, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BuildersPage() {
  const [user, setUser] = useState(null);
  const [appIdea, setAppIdea] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadRoadmaps();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log('User not logged in');
      setIsLoading(false);
    }
  };

  const loadRoadmaps = async () => {
    try {
      const maps = await base44.entities.AppRoadmap.filter({
        user_email: user.email
      }, '-created_date', 10);
      setRoadmaps(maps);
      if (maps.length > 0 && !activeRoadmap) {
        setActiveRoadmap(maps[0]);
      }
    } catch (err) {
      console.error('Failed to load roadmaps:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhanceIdea = async () => {
    if (!appIdea.trim() || !user) return;

    setIsEnhancing(true);
    try {
      const prompt = `Create a realistic, step-by-step development roadmap for this Kaspa blockchain app idea: "${appIdea}"

Generate a comprehensive roadmap with 5-7 phases. Each phase should include:
- Phase name (e.g., "Planning & Research", "Core Development", "Testing", etc.)
- Phase title (brief description)
- Detailed description of what happens in this phase
- 3-5 specific tasks to complete

Focus on practical steps like:
- Market research and user needs analysis
- Technical architecture and design
- Smart contract development (if applicable)
- Frontend/backend development
- Kaspa blockchain integration
- Testing and security audits
- Deployment and launch preparation
- Community building and marketing

Return ONLY valid JSON in this exact format:
{
  "enhanced_idea": "A compelling 2-3 sentence summary of the app potential",
  "roadmap_steps": [
    {
      "phase": "Phase 1",
      "title": "Planning & Research",
      "description": "Detailed phase description",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "completed": false
    }
  ]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            enhanced_idea: { type: "string" },
            roadmap_steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  tasks: { type: "array", items: { type: "string" } },
                  completed: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      const newRoadmap = await base44.entities.AppRoadmap.create({
        user_email: user.email,
        app_idea: appIdea,
        enhanced_idea: response.enhanced_idea,
        roadmap_steps: response.roadmap_steps,
        completed_tasks: [],
        progress_percentage: 0
      });

      setRoadmaps([newRoadmap, ...roadmaps]);
      setActiveRoadmap(newRoadmap);
      setAppIdea("");
    } catch (err) {
      alert('Failed to generate roadmap: ' + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const toggleTaskCompletion = async (stepIndex) => {
    if (!activeRoadmap) return;

    const updatedSteps = [...activeRoadmap.roadmap_steps];
    updatedSteps[stepIndex].completed = !updatedSteps[stepIndex].completed;

    const completedCount = updatedSteps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / updatedSteps.length) * 100);

    const updated = await base44.entities.AppRoadmap.update(activeRoadmap.id, {
      roadmap_steps: updatedSteps,
      progress_percentage: progress
    });

    setActiveRoadmap(updated);
    setRoadmaps(roadmaps.map(r => r.id === updated.id ? updated : r));
  };

  const deleteRoadmap = async (id) => {
    if (!confirm('Delete this roadmap?')) return;
    
    await base44.entities.AppRoadmap.delete(id);
    const filtered = roadmaps.filter(r => r.id !== id);
    setRoadmaps(filtered);
    if (activeRoadmap?.id === id) {
      setActiveRoadmap(filtered[0] || null);
    }
  };

  const openPhaseChat = async (phase) => {
    setSelectedPhase(phase);
    setChatMessages([]);
    setIsChatting(true);

    try {
      const prompt = `The user is working on this development phase for their app:

Phase: ${phase.phase}
Title: ${phase.title}
Description: ${phase.description}
Tasks: ${phase.tasks.join(', ')}

Provide detailed, practical guidance on how to complete this phase. Be conversational, helpful, and specific. Break down the steps, recommend tools, and give actionable advice.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setChatMessages([
        {
          role: "assistant",
          content: response
        }
      ]);
    } catch (err) {
      setChatMessages([
        {
          role: "assistant",
          content: "Sorry, I couldn't load guidance for this phase. Please try again."
        }
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const sendChatMessage = async () => {
    if (!userMessage.trim() || isChatting || !selectedPhase) return;

    const newUserMessage = {
      role: "user",
      content: userMessage
    };

    setChatMessages([...chatMessages, newUserMessage]);
    setUserMessage("");
    setIsChatting(true);

    try {
      const conversationContext = chatMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n\n');

      const prompt = `You're helping a developer build their Kaspa app. They're working on this phase:

Phase: ${selectedPhase.phase} - ${selectedPhase.title}
Description: ${selectedPhase.description}

Previous conversation:
${conversationContext}

User's question: ${newUserMessage.content}

Provide a helpful, detailed response.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setChatMessages([...chatMessages, newUserMessage, {
        role: "assistant",
        content: response
      }]);
    } catch (err) {
      setChatMessages([...chatMessages, newUserMessage, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl max-w-md">
          <CardContent className="p-8 text-center">
            <Code2 className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <p className="text-gray-400 mb-6">Sign in to create your app roadmap</p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-cyan-500 to-purple-500"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-20 h-20 mx-auto mb-6 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Rocket className="w-10 h-10 text-cyan-400" strokeWidth={1.5} />
              </div>
            </motion.div>
            <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                Builders Roadmap
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Transform your Kaspa app idea into a step-by-step development plan
            </p>
          </motion.div>

          {/* Idea Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">What's Your App Idea?</h3>
                    <p className="text-gray-400 text-sm">Describe your Kaspa blockchain app concept</p>
                  </div>
                </div>
                
                <Textarea
                  value={appIdea}
                  onChange={(e) => setAppIdea(e.target.value)}
                  placeholder="Example: A decentralized marketplace for NFT trading with instant transactions on Kaspa..."
                  className="bg-black/30 border-white/10 text-white placeholder:text-gray-500 min-h-[100px] mb-4"
                  disabled={isEnhancing}
                />
                
                <Button
                  onClick={handleEnhanceIdea}
                  disabled={!appIdea.trim() || isEnhancing}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 h-12 font-semibold"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Your Roadmap...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" strokeWidth={1.5} />
                      Enhance Idea & Build Roadmap
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Roadmap Display */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : roadmaps.length > 0 ? (
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Sidebar - Roadmap List */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-white font-bold text-sm mb-3 px-2">Your Roadmaps</h3>
                <AnimatePresence>
                  {roadmaps.map((roadmap, i) => (
                    <motion.div
                      key={roadmap.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all ${
                          activeRoadmap?.id === roadmap.id
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                        onClick={() => setActiveRoadmap(roadmap)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-semibold text-sm truncate mb-1">
                                {roadmap.app_idea}
                              </div>
                              <div className="text-xs text-gray-500">
                                {roadmap.progress_percentage}% Complete
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRoadmap(roadmap.id);
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${roadmap.progress_percentage}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Main - Active Roadmap */}
              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                  {activeRoadmap && (
                    <motion.div
                      key={activeRoadmap.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {/* Enhanced Idea Card */}
                      <Card className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border-cyan-500/20 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3 mb-3">
                            <Target className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" strokeWidth={1.5} />
                            <div>
                              <h3 className="text-white font-bold text-lg mb-2">Your Enhanced Vision</h3>
                              <p className="text-gray-300 leading-relaxed">{activeRoadmap.enhanced_idea}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Roadmap Steps */}
                      <div className="space-y-4">
                        {activeRoadmap.roadmap_steps.map((step, stepIndex) => (
                          <motion.div
                            key={stepIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: stepIndex * 0.1 }}
                          >
                            <Card 
                              className={`transition-all cursor-pointer ${
                                step.completed
                                  ? 'bg-green-500/5 border-green-500/30'
                                  : 'bg-white/5 border-white/10 hover:border-cyan-500/30'
                              }`}
                              onClick={() => openPhaseChat(step)}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  <button
                                    onClick={() => toggleTaskCompletion(stepIndex)}
                                    className="flex-shrink-0 mt-1"
                                  >
                                    {step.completed ? (
                                      <CheckCircle2 className="w-6 h-6 text-green-400" strokeWidth={2} />
                                    ) : (
                                      <Circle className="w-6 h-6 text-gray-500 hover:text-gray-400 transition-colors" strokeWidth={2} />
                                    )}
                                  </button>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                                        {step.phase}
                                      </span>
                                      <h4 className={`text-lg font-bold ${step.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                                        {step.title}
                                      </h4>
                                    </div>
                                    
                                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                      {step.description}
                                    </p>
                                    
                                    <div className="space-y-2">
                                      {step.tasks.map((task, taskIndex) => (
                                        <div key={taskIndex} className="flex items-start gap-2 text-sm">
                                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
                                          <span className={step.completed ? 'text-gray-500 line-through' : 'text-gray-300'}>
                                            {task}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                <Rocket className="w-10 h-10 text-gray-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">No Roadmaps Yet</h3>
              <p className="text-gray-400">Enter your app idea above to get started</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Phase Chat Modal */}
      <AnimatePresence>
        {selectedPhase && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhase(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-8 lg:inset-16 z-[101] flex items-center justify-center"
            >
              <Card className="bg-gradient-to-br from-zinc-900/95 to-black/95 border-cyan-500/30 backdrop-blur-xl shadow-2xl w-full max-w-4xl h-full max-h-[85vh]">
                <CardContent className="p-0 flex flex-col h-full max-h-[85vh]">
                  {/* Header */}
                  <div className="p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded inline-block mb-2">
                          {selectedPhase.phase}
                        </div>
                        <h3 className="text-lg font-bold text-white truncate">{selectedPhase.title}</h3>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{selectedPhase.description}</p>
                      </div>
                      <Button
                        onClick={() => setSelectedPhase(null)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white flex-shrink-0"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {chatMessages.length === 0 && isChatting ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">Loading guidance...</p>
                        </div>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm">No messages yet</p>
                      </div>
                    ) : (
                      <>
                        {chatMessages.map((msg, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] rounded-xl p-3 ${
                              msg.role === 'user'
                                ? 'bg-cyan-500/20 border border-cyan-500/30 text-white'
                                : 'bg-white/5 border border-white/10 text-gray-300'
                            }`}>
                              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                            </div>
                          </motion.div>
                        ))}
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-white/10 flex-shrink-0">
                    <div className="flex gap-2">
                      <Input
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                        placeholder="Ask for more details..."
                        className="flex-1 bg-black/30 border-white/10 text-white placeholder:text-gray-500 h-10"
                        disabled={isChatting}
                      />
                      <Button
                        onClick={sendChatMessage}
                        disabled={!userMessage.trim() || isChatting}
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 h-10 px-6"
                      >
                        {isChatting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Send'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}