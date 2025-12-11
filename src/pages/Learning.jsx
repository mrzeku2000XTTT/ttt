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
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [questionBank, setQuestionBank] = useState({});
  const [userProgress, setUserProgress] = useState({});
  const [difficultyLevel, setDifficultyLevel] = useState("10+");
  const [showHint, setShowHint] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  useEffect(() => {
    loadUser();
    loadLearningPath();
    initializeQuestionBank();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user?.email) return;
    
    try {
      const progress = await base44.entities.UserProgress.filter({
        user_email: user.email
      });
      
      const progressMap = {};
      progress.forEach(p => {
        progressMap[p.topic] = p;
      });
      
      setUserProgress(progressMap);
      
      if (progress.length > 0 && progress[0].difficulty_level) {
        setDifficultyLevel(progress[0].difficulty_level);
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  };

  const initializeQuestionBank = () => {
    const questions = {
      "Web3 & Blockchain": [
        { id: "web3_1", q: "What is the primary purpose of a blockchain?", o: ["To store data in a decentralized manner", "To create video games", "To enhance social media connectivity", "To improve traditional banking methods"], c: 0, hint: "Think about data storage and control", difficulty: "5+" },
        { id: "web3_2", q: "What does 'decentralized' mean in blockchain?", o: ["No single authority controls the network", "Faster transaction speeds", "Lower costs", "Better graphics"], c: 0, hint: "Think about who has control", difficulty: "5+" },
        { id: "web3_3", q: "What is a smart contract?", o: ["Self-executing code on blockchain", "A legal document", "A wallet app", "A mining tool"], c: 0, hint: "It runs automatically", difficulty: "10+" },
        { id: "web3_4", q: "Who created Bitcoin?", type: "text", answer: "Satoshi Nakamoto", hint: "Japanese-sounding pseudonym", difficulty: "5+" },
        { id: "web3_5", q: "What is a hash in blockchain?", o: ["A cryptographic output of data", "A type of wallet", "A trading strategy", "A mining machine"], c: 0, hint: "It's a unique fingerprint", difficulty: "10+" },
        { id: "web3_6", q: "What consensus mechanism does Bitcoin use?", o: ["Proof of Work", "Proof of Stake", "Proof of Authority", "Delegated Proof of Stake"], c: 0, hint: "Miners solve puzzles", difficulty: "15+" },
        { id: "web3_7", q: "What is a blockchain node?", o: ["A computer maintaining a copy of the blockchain", "A type of cryptocurrency", "A wallet address", "A mining pool"], c: 0, hint: "Think about network participants", difficulty: "15+" },
        { id: "web3_8", q: "What is gas in Ethereum?", o: ["Fee for transactions", "A type of token", "Mining reward", "Wallet feature"], c: 0, hint: "You pay this to miners", difficulty: "10+" },
        { id: "web3_9", q: "What is Web3?", o: ["Decentralized internet", "Third version of website design", "Faster internet", "Mobile-first web"], c: 0, hint: "The future of internet ownership", difficulty: "5+" },
        { id: "web3_10", q: "What does DAO stand for?", type: "text", answer: "Decentralized Autonomous Organization", hint: "Three words: D___ A___ O___", difficulty: "10+" },
        { q: "What is immutability in blockchain?", o: ["Data cannot be changed once recorded", "Fast transactions", "Low fees", "High scalability"], c: 0 },
        { q: "What is a private key?", o: ["Secret code to access wallet", "Public wallet address", "Transaction ID", "Network password"], c: 0 },
        { q: "What is mining?", o: ["Validating transactions and securing network", "Trading cryptocurrencies", "Creating wallets", "Sending tokens"], c: 0 },
        { q: "What is a block?", o: ["Collection of transactions", "A single transaction", "A wallet type", "A mining tool"], c: 0 },
        { q: "What is a fork in blockchain?", o: ["Split in blockchain protocol", "Mining tool", "Wallet feature", "Trading strategy"], c: 0 },
        { q: "What is Layer 2?", o: ["Scaling solution built on Layer 1", "Second generation blockchain", "Type of wallet", "Mining layer"], c: 0 },
        { q: "What is DeFi?", o: ["Decentralized Finance", "Digital Finance", "Direct Finance", "Distributed Finance"], c: 0 },
        { q: "What is an NFT?", o: ["Non-Fungible Token", "New Finance Technology", "Network Function Token", "Next Future Token"], c: 0 },
        { q: "What is staking?", o: ["Locking tokens to support network", "Trading strategy", "Mining process", "Wallet creation"], c: 0 },
        { q: "What is a wallet address?", o: ["Public identifier for receiving crypto", "Private password", "Transaction ID", "Network name"], c: 0 }
      ],
      "AI & Machine Learning": [
        { q: "What is Machine Learning?", o: ["Computer learning from data", "Manual programming", "Internet browsing", "Video editing"], c: 0 },
        { q: "What is a neural network?", o: ["Computing system inspired by brain", "Internet network", "Blockchain network", "Social network"], c: 0 },
        { q: "What is supervised learning?", o: ["Learning from labeled data", "Learning without data", "Self-teaching AI", "Random learning"], c: 0 },
        { q: "What is deep learning?", o: ["Neural networks with many layers", "Surface level learning", "Quick learning", "Manual programming"], c: 0 },
        { q: "What is Natural Language Processing?", o: ["AI understanding human language", "Programming language", "Network protocol", "Data format"], c: 0 },
        { q: "What is overfitting?", o: ["Model too specific to training data", "Perfect model", "Fast training", "Large dataset"], c: 0 },
        { q: "What is reinforcement learning?", o: ["Learning through rewards/penalties", "Supervised learning", "Unsupervised learning", "Manual training"], c: 0 },
        { q: "What is a training dataset?", o: ["Data used to train model", "Testing data", "Production data", "Backup data"], c: 0 },
        { q: "What is computer vision?", o: ["AI understanding images/video", "Screen resolution", "Graphics card", "Display technology"], c: 0 },
        { q: "What is GPT?", o: ["Generative Pre-trained Transformer", "Graphics Processing Tool", "General Purpose Technology", "Global Processing Terminal"], c: 0 },
        { q: "What is an algorithm?", o: ["Set of instructions to solve problem", "Type of data", "Network protocol", "Hardware component"], c: 0 },
        { q: "What is feature engineering?", o: ["Creating relevant input variables", "Hardware design", "Network setup", "Database creation"], c: 0 },
        { q: "What is accuracy in ML?", o: ["Correct predictions ratio", "Speed of training", "Size of model", "Cost of computing"], c: 0 },
        { q: "What is bias in AI?", o: ["Systematic error in predictions", "Perfect accuracy", "Fast processing", "Large dataset"], c: 0 },
        { q: "What is a chatbot?", o: ["AI for conversation", "Chat application", "Social network", "Messaging protocol"], c: 0 },
        { q: "What is transfer learning?", o: ["Using pre-trained model knowledge", "Moving data", "Network transfer", "File sharing"], c: 0 },
        { q: "What is gradient descent?", o: ["Optimization algorithm", "Data structure", "Network protocol", "File format"], c: 0 },
        { q: "What is classification?", o: ["Categorizing data into classes", "Organizing files", "Network routing", "Data compression"], c: 0 },
        { q: "What is regression?", o: ["Predicting continuous values", "Going backwards", "Data deletion", "Network error"], c: 0 },
        { q: "What is clustering?", o: ["Grouping similar data", "Network topology", "File organization", "Database backup"], c: 0 }
      ],
      "Kaspa Ecosystem": [
        { id: "kas_1", q: "What is Kaspa?", o: ["BlockDAG cryptocurrency", "Bitcoin fork", "Ethereum clone", "Centralized coin"], c: 0, hint: "It uses a DAG structure", difficulty: "5+" },
        { id: "kas_2", q: "What makes Kaspa unique?", o: ["BlockDAG structure with parallel blocks", "Slow transactions", "High fees", "Centralized control"], c: 0, hint: "Multiple blocks at once", difficulty: "10+" },
        { id: "kas_3", q: "What is KAS?", o: ["Kaspa's native token", "Wallet application", "Mining pool", "Exchange platform"], c: 0, hint: "The coin of Kaspa", difficulty: "5+" },
        { id: "kas_4", q: "What is Kaspa's block time?", o: ["1 second", "10 minutes", "2.5 minutes", "15 seconds"], c: 0, hint: "Fastest in crypto", difficulty: "10+" },
        { id: "kas_5", q: "What consensus does Kaspa use?", o: ["Proof of Work", "Proof of Stake", "Proof of Authority", "Delegated PoS"], c: 0, hint: "Mining-based", difficulty: "10+" },
        { id: "kas_6", q: "What is GHOSTDAG?", type: "text", answer: "GHOSTDAG", hint: "Kaspa's DAG protocol name", difficulty: "15+" },
        { id: "kas_7", q: "What is Kaspa's max supply?", o: ["28.7 billion KAS", "21 million", "Unlimited", "100 billion"], c: 0, hint: "Much higher than Bitcoin", difficulty: "15+" },
        { id: "kas_8", q: "What is a BlockDAG?", o: ["Directed Acyclic Graph of blocks", "Linear blockchain", "Centralized database", "Cloud storage"], c: 0, hint: "Graph structure, not chain", difficulty: "15+" },
        { id: "kas_9", q: "Can Kaspa handle high TPS?", o: ["Yes, designed for scalability", "No, limited to 7 TPS", "Maybe with upgrades", "Only with Layer 2"], c: 0, hint: "Scalability is key feature", difficulty: "10+" },
        { id: "kas_10", q: "Is Kaspa ASIC-resistant?", o: ["No, optimized for ASICs", "Yes, GPU only", "Yes, CPU only", "Quantum resistant"], c: 0, hint: "Not resistant", difficulty: "15+" },
        { id: "kas_11", q: "What is Kaspa's hashing algorithm?", type: "text", answer: "kHeavyHash", hint: "Starts with 'k'", difficulty: "20+" },
        { id: "kas_12", q: "Does Kaspa have smart contracts?", o: ["Not yet, in development", "Yes, fully functional", "No, never planned", "Only basic contracts"], c: 0, hint: "Coming soon", difficulty: "10+" },
        { id: "kas_13", q: "What is Kasplex?", o: ["Layer 2 solution for Kaspa", "Mining pool", "Wallet app", "Exchange"], c: 0, hint: "Built on top of Kaspa", difficulty: "15+" },
        { id: "kas_14", q: "What is Kaspa's advantage?", o: ["Speed and scalability", "Privacy features", "Smart contracts", "Proof of Stake"], c: 0, hint: "Fast and can grow", difficulty: "5+" },
        { id: "kas_15", q: "Who founded Kaspa?", type: "text", answer: "Yonatan Sompolinsky", hint: "Israeli researcher", difficulty: "15+" },
        { id: "kas_16", q: "Is Kaspa mineable?", o: ["Yes, Proof of Work", "No, Proof of Stake", "Pre-mined only", "Not applicable"], c: 0, hint: "Uses miners", difficulty: "5+" },
        { id: "kas_17", q: "What wallet supports KAS?", o: ["Kaspium, OneKey, Tangem", "MetaMask only", "Hardware wallets only", "No wallets yet"], c: 0, hint: "Multiple options", difficulty: "10+" },
        { id: "kas_18", q: "What is Kaspa's vision?", o: ["Fast, scalable, decentralized payments", "Replace Bitcoin", "Smart contract platform", "Privacy coin"], c: 0, hint: "Speed + Scale", difficulty: "10+" },
        { id: "kas_19", q: "Is Kaspa open source?", o: ["Yes, fully open source", "No, proprietary", "Partially open", "Closed beta"], c: 0, hint: "Community-driven", difficulty: "5+" },
        { id: "kas_20", q: "What is Kaspa's block reward?", o: ["Decreasing with halvings", "Fixed forever", "No rewards", "Increasing over time"], c: 0, hint: "Like Bitcoin", difficulty: "15+" }
      ],
      "DeFi & Trading": [
        { q: "What is DeFi?", o: ["Decentralized Finance", "Digital Finance", "Direct Finance", "Distributed Finance"], c: 0 },
        { q: "What is a liquidity pool?", o: ["Pool of tokens for trading", "Water reservoir", "Mining pool", "Staking pool"], c: 0 },
        { q: "What is yield farming?", o: ["Earning rewards by providing liquidity", "Agricultural trading", "Mining crypto", "Buying NFTs"], c: 0 },
        { q: "What is a DEX?", o: ["Decentralized Exchange", "Digital Exchange", "Direct Exchange", "Distributed Exchange"], c: 0 },
        { q: "What is impermanent loss?", o: ["Loss from price changes in LP", "Permanent loss", "Mining loss", "Transaction fee"], c: 0 },
        { q: "What is a stablecoin?", o: ["Crypto pegged to stable asset", "Volatile cryptocurrency", "Mining token", "NFT type"], c: 0 },
        { q: "What is TVL?", o: ["Total Value Locked", "Token Value Limit", "Trading Volume Level", "Transaction Validation Layer"], c: 0 },
        { q: "What is an AMM?", o: ["Automated Market Maker", "Active Market Manager", "Asset Management Module", "Advanced Mining Method"], c: 0 },
        { q: "What is slippage?", o: ["Price difference during trade execution", "Mining difficulty", "Network delay", "Wallet error"], c: 0 },
        { q: "What is gas fee?", o: ["Transaction cost on blockchain", "Fuel price", "Mining reward", "Staking reward"], c: 0 },
        { q: "What is a limit order?", o: ["Order at specific price", "Unlimited trading", "Market order", "Stop loss"], c: 0 },
        { q: "What is arbitrage?", o: ["Profiting from price differences", "Random trading", "Long-term holding", "Mining strategy"], c: 0 },
        { q: "What is leverage?", o: ["Borrowing to increase position size", "Wallet feature", "Mining tool", "Staking method"], c: 0 },
        { q: "What is a market order?", o: ["Immediate trade at current price", "Future order", "Limit order", "Stop loss"], c: 0 },
        { q: "What is FOMO?", o: ["Fear Of Missing Out", "Financial Order Management", "Fast Online Market Order", "Fixed Output Mining Operation"], c: 0 },
        { q: "What is FUD?", o: ["Fear Uncertainty Doubt", "Fund Under Development", "Fast Universal Deploy", "Financial User Data"], c: 0 },
        { q: "What is HODLing?", o: ["Holding long-term", "Fast trading", "Day trading", "Mining process"], c: 0 },
        { q: "What is a bull market?", o: ["Rising prices", "Falling prices", "Stable prices", "No trading"], c: 0 },
        { q: "What is a bear market?", o: ["Falling prices", "Rising prices", "Stable prices", "High volatility"], c: 0 },
        { q: "What is technical analysis?", o: ["Using charts to predict prices", "Fundamental research", "Random guessing", "News analysis"], c: 0 }
      ]
    };
    setQuestionBank(questions);
  };

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
    const questions = questionBank[topic] || [];
    const progress = userProgress[topic];
    const answeredIds = progress?.answered_questions || [];
    
    // Filter out answered questions and match difficulty
    let availableQuestions = questions.filter(q => 
      !answeredIds.includes(q.id) && 
      (q.difficulty === difficultyLevel || difficultyLevel === "20+")
    );
    
    // If no questions left or running low, generate with AI
    if (availableQuestions.length < 5) {
      setIsGeneratingQuestion(true);
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate a unique, educational quiz question about ${topic} for difficulty level ${difficultyLevel}. Make it engaging and accurate. Return ONLY a JSON object:
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correct": 0,
  "hint": "helpful hint",
  "type": "multiple"
}`,
          response_json_schema: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              correct: { type: "number" },
              hint: { type: "string" },
              type: { type: "string" }
            }
          }
        });
        
        const newQuestion = {
          id: `ai_${Date.now()}_${Math.random()}`,
          q: response.question,
          o: response.options,
          c: response.correct,
          hint: response.hint,
          difficulty: difficultyLevel,
          topic
        };
        
        setCurrentQuestion({
          ...newQuestion,
          question: newQuestion.q,
          options: newQuestion.o,
          correct: newQuestion.c,
          topic
        });
        setQuizActive(true);
        setIsGeneratingQuestion(false);
        return;
      } catch (err) {
        console.error('AI generation failed:', err);
        setIsGeneratingQuestion(false);
      }
    }
    
    if (availableQuestions.length === 0) {
      // Reset progress if all questions answered
      availableQuestions = questions.filter(q => q.difficulty === difficultyLevel);
      if (progress) {
        await base44.entities.UserProgress.update(progress.id, {
          answered_questions: []
        });
      }
    }
    
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const q = availableQuestions[randomIndex];
    
    setCurrentQuestion({
      id: q.id,
      question: q.q,
      options: q.o,
      correct: q.c,
      hint: q.hint,
      type: q.type || "multiple",
      answer: q.answer,
      topic
    });
    setQuizActive(true);
    setShowHint(false);
    setTextAnswer("");
  };

  const checkAnswer = async (index) => {
    const isCorrect = currentQuestion.type === "text" 
      ? textAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()
      : index === currentQuestion.correct;
    
    setTotalAnswered(totalAnswered + 1);
    
    // Save progress
    if (user?.email && currentQuestion.id) {
      const progress = userProgress[currentQuestion.topic];
      const answeredIds = progress?.answered_questions || [];
      
      if (!answeredIds.includes(currentQuestion.id)) {
        answeredIds.push(currentQuestion.id);
      }
      
      const newScore = isCorrect ? (progress?.current_score || 0) + 1 : (progress?.current_score || 0);
      const newTotal = (progress?.total_answered || 0) + 1;
      const newStreak = isCorrect ? (progress?.current_streak || 0) + 1 : 0;
      const bestStreak = Math.max(newStreak, progress?.best_streak || 0);
      
      if (progress) {
        await base44.entities.UserProgress.update(progress.id, {
          answered_questions: answeredIds,
          current_score: newScore,
          total_answered: newTotal,
          current_streak: newStreak,
          best_streak: bestStreak
        });
      } else {
        await base44.entities.UserProgress.create({
          user_email: user.email,
          topic: currentQuestion.topic,
          answered_questions: answeredIds,
          current_score: newScore,
          total_answered: newTotal,
          current_streak: newStreak,
          best_streak: bestStreak,
          difficulty_level: difficultyLevel
        });
      }
      
      await loadUserProgress();
    }
    
    if (isCorrect) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      
      // Celebration effects
      const messages = [
        '🔥 On fire!',
        '⚡ Lightning fast!',
        '🎯 Bulls eye!',
        '💎 Diamond hands!',
        '🚀 To the moon!',
        '⭐ Superstar!'
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl text-2xl font-black';
      notification.innerHTML = `
        <div class="text-center">
          <div class="text-4xl mb-2">${randomMessage}</div>
          <div class="text-lg">+1 Point • ${newStreak} Streak 🔥</div>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Animate and remove
      setTimeout(() => {
        notification.style.transform = 'translate(-50%, -50%) scale(0.8)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease-out';
      }, 1500);
      setTimeout(() => notification.remove(), 1800);
      
      // Generate next question automatically
      setTimeout(() => {
        generateQuiz(currentQuestion.topic);
      }, 2000);
      
    } else {
      setStreak(0);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl text-xl font-bold';
      notification.innerHTML = `
        <div class="text-center">
          <div class="text-3xl mb-2">💪 Keep trying!</div>
          <div class="text-sm">Streak reset • You got this!</div>
        </div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.transform = 'translate(-50%, -50%) scale(0.8)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease-out';
      }, 1500);
      setTimeout(() => notification.remove(), 1800);
    }
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
                <h1 className="text-3xl md:text-4xl font-black text-white">K Learning Hub</h1>
                <p className="text-white/40 text-sm">Master Kaspa, Web3, AI, and more</p>
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-3 mt-4">
              <label className="text-xs text-white/60 mb-2 block">Difficulty Level</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full bg-black border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="5+">5+ Beginner</option>
                <option value="10+">10+ Intermediate</option>
                <option value="15+">15+ Advanced</option>
                <option value="20+">20+ Expert</option>
              </select>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-3 mt-6">
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-3">
                <div className="text-2xl font-bold text-white">{score}</div>
                <div className="text-xs text-white/40">Points</div>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-3">
                <div className="text-2xl font-bold text-orange-400">{streak} 🔥</div>
                <div className="text-xs text-white/40">Streak</div>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-3">
                <div className="text-2xl font-bold text-cyan-400">{totalAnswered}</div>
                <div className="text-xs text-white/40">Answered</div>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-400">{totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0}%</div>
                <div className="text-xs text-white/40">Accuracy</div>
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
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full relative"
            >
              <button
                onClick={() => {
                  setQuizActive(false);
                  setCurrentQuestion(null);
                }}
                className="absolute top-4 right-4 w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">{currentQuestion.topic}</h3>
              </div>
              
              {/* Progress indicator */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                  <span>Question {(userProgress[currentQuestion.topic]?.total_answered || 0) + 1}</span>
                  <div className="flex items-center gap-2">
                    {streak > 0 && <span className="text-orange-400">🔥 {streak} streak</span>}
                    <span className="text-cyan-400">{difficultyLevel}</span>
                  </div>
                </div>
              </div>

              <p className="text-white text-lg mb-4">{currentQuestion.question}</p>

              {/* Hint Button */}
              {currentQuestion.hint && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="mb-4 text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                >
                  💡 {showHint ? 'Hide' : 'Show'} Hint
                </button>
              )}
              
              {showHint && currentQuestion.hint && (
                <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-200">
                  {currentQuestion.hint}
                </div>
              )}

              {currentQuestion.type === "text" ? (
                <div className="space-y-3">
                  <Input
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="bg-black border-white/10 text-white placeholder-white/30"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && textAnswer.trim()) {
                        checkAnswer(0);
                      }
                    }}
                  />
                  <Button
                    onClick={() => checkAnswer(0)}
                    disabled={!textAnswer.trim()}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    Submit Answer
                  </Button>
                </div>
              ) : (
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
              )}

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-white/60">
                    Score: <span className="text-white font-bold">{score}</span>
                  </div>
                  <div className="text-white/60">
                    Accuracy: <span className="text-cyan-400 font-bold">{totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}