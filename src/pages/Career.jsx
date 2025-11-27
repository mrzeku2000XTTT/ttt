
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Loader2,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Code,
  Palette,
  Building,
  DollarSign,
  BookOpen,
  Zap,
  Target,
  Bot,
  CheckCircle2,
  ExternalLink,
  Crown,
  AlertCircle,
  Rocket,
  Award,
  BarChart3,
  Lightbulb,
  MessageSquare,
  FileText,
  Download,
  Plus,
  Trash2,
  Save // New icon added for 'Save Changes' button
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const PROFESSION_ICONS = {
  architecture: Building,
  software: Code,
  design: Palette,
  finance: DollarSign,
  marketing: TrendingUp,
  healthcare: Users,
  education: BookOpen,
  default: Briefcase
};

export default function CareerPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAgentZK, setHasAgentZK] = useState(false);

  // Career Profile State
  const [careerProfile, setCareerProfile] = useState({
    currentCareer: "",
    hobbies: "",
    experience: "",
    goals: ""
  });

  // AI Chat State
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // const [error, setError] = useState(null); // Removed this state variable

  // Dashboard State
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Interview Prep State
  const [interviewJobTitle, setInterviewJobTitle] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Resume Builder State
  const [resume, setResume] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    certifications: []
  });
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);

  // Resume View State
  const [resumeView, setResumeView] = useState('futuristic'); // futuristic, matrix, cyber

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (conversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
          setIsSending(false);
          setIsAnalyzing(false);

          // Extract dashboard data from latest AI response
          if (data.messages.length > 0) {
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.content) {
              extractDashboardData(lastMessage.content);
            }
          }
        } else if (data && data.messages === undefined) {
          setMessages([]);
          setIsSending(false);
          setIsAnalyzing(false);
        }
      });

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user has Agent ZK access
      if (currentUser.created_wallet_address) {
        const verifications = await base44.entities.WalletVerification.filter({
          user_email: currentUser.email
        });
        setHasAgentZK(verifications.length >= 2);
      }

      // Try to load existing conversation
      const savedConvId = localStorage.getItem('career_conversation_id');
      if (savedConvId) {
        try {
          const conv = await base44.agents.getConversation(savedConvId);
          if (conv && conv.id) {
            setConversation(conv);
            setMessages(Array.isArray(conv.messages) ? conv.messages : []);

            // Extract dashboard from existing conversation
            if (conv.messages && conv.messages.length > 0) {
              const lastAssistantMsg = [...conv.messages].reverse().find(m => m.role === 'assistant');
              if (lastAssistantMsg) {
                extractDashboardData(lastAssistantMsg.content);
              }
            }
          }
        } catch (err) {
          console.log('No existing conversation found');
          localStorage.removeItem('career_conversation_id');
        }
      }

      // Load saved resume
      const savedResume = localStorage.getItem('career_resume');
      if (savedResume) {
        setResume(JSON.parse(savedResume));
      } else {
        setResume({
          ...resume,
          fullName: currentUser.full_name || "",
          email: currentUser.email || ""
        });
      }

    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const extractDashboardData = (content) => {
    try {
      // Extract structured data from AI response
      const dashboardData = {
        summary: '',
        strengths: [],
        opportunities: [],
        skills: [],
        salary: null,
        nextSteps: []
      };

      // Simple parsing - look for key sections
      const lines = content.split('\n');
      let currentSection = '';

      lines.forEach(line => {
        const trimmed = line.trim();

        if (trimmed.includes('**Your Transferable Skills:**') || trimmed.includes('**Strengths Analysis:**') || trimmed.includes('**Career Strengths Analysis:**')) {
          currentSection = 'strengths';
        } else if (trimmed.includes('**Opportunities:**') || trimmed.includes('**Immediate Opportunities:**')) {
          currentSection = 'opportunities';
        } else if (trimmed.includes('**Next Steps:**') || trimmed.includes('**Action Plan:**') || trimmed.includes('**Action Today:**')) {
          currentSection = 'nextSteps';
        } else if (trimmed.includes('**Skill Development Path:**') || trimmed.includes('Skills to Learn') || trimmed.includes('Skills to Develop')) {
          currentSection = 'skills';
        }

        // Extract bullet points
        if (trimmed.match(/^[\d\-\*•]\.?\s/)) {
          const text = trimmed.replace(/^[\d\-\*•]\.?\s+/, '').trim();
          if (text && currentSection) {
            if (currentSection === 'opportunities' && text.includes('$')) {
              // Extract salary info
              const salaryMatch = text.match(/\$[\d,]+\s?-\s?[\d,]+k?/i); // More robust regex for salary
              dashboardData.opportunities.push({
                title: text.split('-')[0].trim(),
                salary: salaryMatch ? salaryMatch[0] : null,
                description: text
              });
            } else if (dashboardData[currentSection] && !dashboardData[currentSection].includes(text)) { // Avoid duplicates
              dashboardData[currentSection].push(text);
            }
          }
        }
      });

      if (dashboardData.opportunities.length > 0 || dashboardData.strengths.length > 0 || dashboardData.skills.length > 0 || dashboardData.nextSteps.length > 0) {
        setDashboard(dashboardData);
        if (activeTab === 'profile') { // Only switch if currently on profile tab
          setActiveTab('dashboard');
        }
      }
    } catch (err) {
      console.error('Failed to extract dashboard data:', err);
    }
  };

  const createConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "career_advisor",
        metadata: {
          name: "Career Consultation",
          user_id: user?.id || 'unknown',
          user_email: user?.email || 'unknown'
        }
      });

      if (!conv || !conv.id) {
        throw new Error('Failed to create conversation - invalid response');
      }

      setConversation(conv);
      localStorage.setItem('career_conversation_id', conv.id);
      return conv;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw new Error('Could not start conversation. Please try again.');
    }
  };

  const handleAnalyzeProfile = async () => {
    if (!careerProfile.currentCareer.trim()) {
      alert('Please enter your current career');
      return;
    }

    if (!user) {
      alert('Please log in to use the career advisor');
      return;
    }

    setIsAnalyzing(true);
    setActiveTab('chat');
    // setError(null); // Removed: Clear any previous errors

    try {
      let conv = conversation;
      if (!conv || !conv.id) {
        conv = await createConversation();
      }

      const profileMessage = `
🎯 **CAREER ANALYSIS REQUEST**

Please analyze my career profile and create a comprehensive personalized dashboard.

**Current Career/Profession:** ${careerProfile.currentCareer}
**Experience & Background:** ${careerProfile.experience || 'Not specified'}
**Hobbies & Interests:** ${careerProfile.hobbies || 'Not specified'}
**Career Goals:** ${careerProfile.goals || 'Not specified'}

**Please provide a structured analysis including:**

1. **Career Strengths Analysis**: What are my key transferable skills and strengths?

2. **Immediate Opportunities**: List 5-10 real job opportunities with:
   - Job title
   - Salary range (e.g., $80k-$120k)
   - Key requirements
   - Why I'm a good fit

3. **Skill Development Path**: What skills should I learn/improve?

4. **Web3/Crypto Opportunities**: Relevant blockchain/crypto career paths (if applicable)

5. **Salary Insights**: Current market rates for my experience level

6. **Action Plan**: Concrete next steps I can take TODAY

${hasAgentZK ? '\n7. **Agent ZK Automation**: How can I use Agent ZK to automate my job search and applications?\n' : ''}

Please use web search to find current, real job listings and provide actionable, specific advice.
      `.trim();

      await base44.agents.addMessage(conv, {
        role: "user",
        content: profileMessage
      });

    } catch (error) {
      console.error('Failed to analyze profile:', error);
      const errorMessage = error.message || 'Failed to analyze profile. Please try again.';
      alert(errorMessage);
      setIsAnalyzing(false);
      setActiveTab('profile');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    if (!user) {
      alert('Please log in to use the career advisor');
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsSending(true);
    // setError(null); // Removed: Clear any previous errors

    try {
      let conv = conversation;
      if (!conv || !conv.id) {
        conv = await createConversation();
      }

      await base44.agents.addMessage(conv, {
        role: "user",
        content: userMessage
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error.message || 'Failed to send message. Please try again.';
      alert(errorMessage);
      setIsSending(false);
      setInput(userMessage);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Interview Prep Functions
  const handleGenerateQuestions = async () => {
    if (!interviewJobTitle.trim()) {
      alert('Please enter a job title');
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 10 common interview questions for a ${interviewJobTitle} position.

For each question, provide:
1. The question
2. Why it's asked (interviewer's intent)
3. A strong example answer
4. Tips for answering effectively

Format as JSON array with: question, intent, example_answer, tips (array of strings)`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  intent: { type: "string" },
                  example_answer: { type: "string" },
                  tips: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            }
          },
          required: ["questions"]
        }
      });

      setInterviewQuestions(response.questions || []);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Resume Builder Functions
  const handleAddExperience = () => {
    setResume({
      ...resume,
      experience: [...resume.experience, {
        title: "",
        company: "",
        startDate: "",
        endDate: "",
        description: ""
      }]
    });
  };

  const handleRemoveExperience = (index) => {
    setResume({
      ...resume,
      experience: resume.experience.filter((_, i) => i !== index)
    });
  };

  const handleUpdateExperience = (index, field, value) => {
    const updated = [...resume.experience];
    updated[index] = { ...updated[index], [field]: value };
    setResume({ ...resume, experience: updated });
  };

  const handleAddEducation = () => {
    setResume({
      ...resume,
      education: [...resume.education, {
        degree: "",
        institution: "",
        year: "",
        description: ""
      }]
    });
  };

  const handleRemoveEducation = (index) => {
    setResume({
      ...resume,
      education: resume.education.filter((_, i) => i !== index)
    });
  };

  const handleUpdateEducation = (index, field, value) => {
    const updated = [...resume.education];
    updated[index] = { ...updated[index], [field]: value };
    setResume({ ...resume, education: updated });
  };

  const handleAddSkill = () => {
    const skill = prompt('Enter a skill:');
    if (skill && skill.trim()) {
      setResume({
        ...resume,
        skills: [...resume.skills, skill.trim()]
      });
    }
  };

  const handleRemoveSkill = (index) => {
    setResume({
      ...resume,
      skills: resume.skills.filter((_, i) => i !== index)
    });
  };

  const handleSaveResume = () => {
    localStorage.setItem('career_resume', JSON.stringify(resume));
    alert('Resume saved successfully!');
  };

  const handleEnhanceResume = async () => {
    if (!user) {
      alert('Please log in to use the resume enhancer');
      return;
    }

    setIsGeneratingResume(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Enhance this resume with professional descriptions and formatting suggestions. Focus on strong action verbs, quantifiable achievements, and industry best practices.

**Current Resume Data:**
Name: ${resume.fullName || 'Not provided'}
Email: ${resume.email || 'Not provided'}
Phone: ${resume.phone || 'Not provided'}
Location: ${resume.location || 'Not provided'}
Summary: ${resume.summary || 'No summary provided'}
Experience: ${JSON.stringify(resume.experience, null, 2)}
Education: ${JSON.stringify(resume.education, null, 2)}
Skills: ${resume.skills.length > 0 ? resume.skills.join(', ') : 'No skills provided'}
Certifications: ${resume.certifications.length > 0 ? resume.certifications.join(', ') : 'No certifications provided'}

**Please provide:**
1. An enhanced professional summary (key: enhanced_summary)
2. Improved job descriptions for existing experience entries, including action verbs and quantifiable achievements. Each item in the array should have 'index' (original index) and 'enhanced_description' (key: enhanced_experience)
3. Additional relevant skills to add, based on the provided profile (key: suggested_skills)
4. Overall formatting recommendations (key: formatting_tips)

Format your response strictly as a JSON object following the schema provided.`,
        response_json_schema: {
          type: "object",
          properties: {
            enhanced_summary: { type: "string" },
            enhanced_experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "number" },
                  enhanced_description: { type: "string" }
                },
                required: ["index", "enhanced_description"]
              }
            },
            suggested_skills: {
              type: "array",
              items: { type: "string" }
            },
            formatting_tips: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["enhanced_summary", "enhanced_experience", "suggested_skills", "formatting_tips"]
        }
      });

      // Apply enhancements
      const updatedExperience = resume.experience.map(exp => ({ ...exp })); // Create a deep copy
      response.enhanced_experience?.forEach(item => {
        if (updatedExperience[item.index]) {
          updatedExperience[item.index].description = item.enhanced_description;
        }
      });

      setResume(prevResume => ({
        ...prevResume,
        summary: response.enhanced_summary || prevResume.summary,
        experience: updatedExperience,
        skills: [...new Set([...prevResume.skills, ...(response.suggested_skills || [])])]
      }));

      if (response.formatting_tips?.length > 0) {
        alert('Resume Enhancements Applied!\n\nHere are some formatting and content tips:\n' + response.formatting_tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n'));
      } else {
        alert('Resume enhancements applied!');
      }

    } catch (error) {
      console.error('Failed to enhance resume:', error);
      alert('Failed to enhance resume. Please try again. Error: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const handleExportResume = () => {
    const resumeText = `
${resume.fullName}
${resume.email || ''}${resume.phone ? ` | ${resume.phone}` : ''}${resume.location ? ` | ${resume.location}` : ''}

${resume.summary ? `\nPROFESSIONAL SUMMARY\n${resume.summary}\n` : ''}

${resume.experience.length > 0 ? `\nEXPERIENCE\n` : ''}
${resume.experience.map(exp => `
${exp.title} at ${exp.company}
${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : ''}
${exp.description}
`).join('\n').trim()}

${resume.education.length > 0 ? `\nEDUCATION\n` : ''}
${resume.education.map(edu => `
${edu.degree} - ${edu.institution}${edu.year ? ` (${edu.year})` : ''}
${edu.description}
`).join('\n').trim()}

${resume.skills.length > 0 ? `\nSKILLS\n${resume.skills.join(' • ')}\n` : ''}

${resume.certifications.length > 0 ? `\nCERTIFICATIONS\n${resume.certifications.join('\n')}\n` : ''}
    `.trim();

    const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.fullName.replace(/\s+/g, '_') || 'Your_Resume'}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const profilePhoto = user?.profile_photo; // Assuming user.profile_photo is the source, as editData is not defined
  const agentZKPhoto = user?.agent_zk_photo;
  const agentZKId = user?.created_wallet_address
    ? `ZK-${user.created_wallet_address.slice(-10).toUpperCase()}`
    : null;

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                    TTT Career Hub
                  </h1>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>
                    AI-Powered Career Intelligence & Opportunities
                  </p>
                </div>
              </div>

              {hasAgentZK && (
                <Link to={createPageUrl("AgentZK")}>
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30 text-cyan-400 cursor-pointer hover:bg-cyan-500/30">
                    <Bot className="w-3 h-3 mr-1" />
                    Agent ZK Linked
                  </Badge>
                </Link>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 mb-8 overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <Target className="w-4 h-4 inline mr-2" />
                Profile Setup
              </button>
              {dashboard && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  style={{ fontFamily: 'monospace' }}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Dashboard
                </button>
              )}
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Career Advisor
              </button>
              <button
                onClick={() => setActiveTab('interview')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                  activeTab === 'interview'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Interview Prep
              </button>
              <button
                onClick={() => setActiveTab('resume')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                  activeTab === 'resume'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Resume Builder
              </button>
              <button
                onClick={() => setActiveTab('view-resume')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                  activeTab === 'view-resume'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-400 hover:text-white'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <Award className="w-4 h-4 inline mr-2" />
                My Resume
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader className="border-b border-zinc-800">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'monospace' }}>
                      <Target className="w-6 h-6 text-cyan-400" />
                      Build Your Career Profile
                    </h2>
                    <p className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>
                      Tell us about yourself and get personalized career intelligence
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Current Career */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block font-semibold" style={{ fontFamily: 'monospace' }}>
                        Current Career / Profession *
                      </label>
                      <Input
                        value={careerProfile.currentCareer}
                        onChange={(e) => setCareerProfile({ ...careerProfile, currentCareer: e.target.value })}
                        placeholder="e.g., Software Engineer, Architect, Trader, Designer..."
                        className="bg-black border-zinc-700 text-white"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>

                    {/* Experience */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block font-semibold" style={{ fontFamily: 'monospace' }}>
                        Experience Level & Background
                      </label>
                      <Textarea
                        value={careerProfile.experience}
                        onChange={(e) => setCareerProfile({ ...careerProfile, experience: e.target.value })}
                        placeholder="Years of experience, key skills, notable projects, education..."
                        className="bg-black border-zinc-700 text-white h-24"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>

                    {/* Hobbies */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block font-semibold" style={{ fontFamily: 'monospace' }}>
                        Hobbies & Interests
                      </label>
                      <Input
                        value={careerProfile.hobbies}
                        onChange={(e) => setCareerProfile({ ...careerProfile, hobbies: e.target.value })}
                        placeholder="e.g., 3D modeling, trading, gaming, writing..."
                        className="bg-black border-zinc-700 text-white"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>

                    {/* Goals */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block font-semibold" style={{ fontFamily: 'monospace' }}>
                        Career Goals
                      </label>
                      <Textarea
                        value={careerProfile.goals}
                        onChange={(e) => setCareerProfile({ ...careerProfile, goals: e.target.value })}
                        placeholder="What are you looking for? Transition to Web3? Salary increase? New skills? Remote work?"
                        className="bg-black border-zinc-700 text-white h-24"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>

                    {/* Agent ZK Integration Info */}
                    {hasAgentZK && (
                      <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Bot className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-white font-semibold mb-1 text-sm" style={{ fontFamily: 'monospace' }}>
                              Agent ZK Enhanced Analysis
                            </h3>
                            <p className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                              Your Agent ZK will provide advanced automation capabilities and personalized workflow recommendations
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!hasAgentZK && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-white font-semibold mb-1 text-sm" style={{ fontFamily: 'monospace' }}>
                              Unlock Agent ZK
                            </h3>
                            <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                              Complete DAGKnight verification to access Agent ZK career automation tools
                            </p>
                            <Link to={createPageUrl("DAGKnightWallet")}>
                              <Button size="sm" variant="outline" className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30">
                                <Crown className="w-3 h-3 mr-2" />
                                Get Agent ZK Access
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Analyze Button */}
                    <Button
                      onClick={handleAnalyzeProfile}
                      disabled={isAnalyzing || !careerProfile.currentCareer.trim()}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-6 text-lg shadow-lg shadow-cyan-500/50"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                          Analyzing Your Profile...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-3" />
                          Analyze My Career Profile
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'dashboard' && dashboard && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Career Strengths */}
                {dashboard.strengths.length > 0 && (
                  <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader className="border-b border-zinc-800">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Award className="w-6 h-6 text-yellow-400" />
                        Your Career Strengths
                      </h3>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        {dashboard.strengths.map((strength, idx) => (
                          <div key={idx} className="bg-black border border-zinc-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <p className="text-gray-300 text-sm" style={{ fontFamily: 'monospace' }}>{strength}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Career Opportunities */}
                {dashboard.opportunities.length > 0 && (
                  <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader className="border-b border-zinc-800">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Rocket className="w-6 h-6 text-cyan-400" />
                        Immediate Opportunities
                      </h3>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {dashboard.opportunities.map((opp, idx) => (
                          <div key={idx} className="bg-black border border-cyan-500/30 rounded-lg p-4 hover:bg-zinc-900 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-white font-semibold" style={{ fontFamily: 'monospace' }}>{opp.title || opp.description.split('-')[0]}</h4>
                              {opp.salary && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30" style={{ fontFamily: 'monospace' }}>
                                  {opp.salary}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>{opp.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Skills & Next Steps */}
                <div className="grid md:grid-cols-2 gap-6">
                  {dashboard.skills.length > 0 && (
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardHeader className="border-b border-zinc-800">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-purple-400" />
                          Skills to Develop
                        </h3>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ul className="space-y-2">
                          {dashboard.skills.map((skill, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm" style={{ fontFamily: 'monospace' }}>
                              <Zap className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {dashboard.nextSteps.length > 0 && (
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardHeader className="border-b border-zinc-800">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Target className="w-5 h-5 text-cyan-400" />
                          Next Steps
                        </h3>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ul className="space-y-2">
                          {dashboard.nextSteps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm" style={{ fontFamily: 'monospace' }}>
                              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* CTA */}
                <div className="text-center mt-6">
                  <Button
                    onClick={() => setActiveTab('chat')}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    style={{ fontFamily: 'monospace' }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ask Career Advisor More Questions
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Chat Area */}
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="p-0">
                    {/* Messages */}
                    <div className="h-[600px] overflow-y-auto p-6 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-20">
                          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-10 h-10 text-cyan-400" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
                            Your Career Advisor is Ready
                          </h3>
                          <p className="text-gray-400 text-sm mb-6" style={{ fontFamily: 'monospace' }}>
                            Fill out your profile and get personalized career intelligence
                          </p>
                          <Button
                            onClick={() => setActiveTab('profile')}
                            variant="outline"
                            className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                            style={{ fontFamily: 'monospace' }}
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Go to Profile Setup
                          </Button>
                        </div>
                      ) : (
                        messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                                msg.role === 'user'
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                  : 'bg-zinc-900 border border-zinc-800 text-gray-200'
                              }`}
                            >
                              {msg.role === 'assistant' ? (
                                <ReactMarkdown
                                  className="prose prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                  components={{
                                    p: ({ children }) => <p className="my-2 leading-relaxed" style={{ fontFamily: 'monospace' }}>{children}</p>,
                                    ul: ({ children }) => <ul className="my-2 ml-4 list-disc" style={{ fontFamily: 'monospace' }}>{children}</ul>,
                                    ol: ({ children }) => <ol className="my-2 ml-4 list-decimal" style={{ fontFamily: 'monospace' }}>{children}</ol>,
                                    li: ({ children }) => <li className="my-1" style={{ fontFamily: 'monospace' }}>{children}</li>,
                                    h1: ({ children }) => <h1 className="text-xl font-bold my-3" style={{ fontFamily: 'monospace' }}>{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-lg font-bold my-2" style={{ fontFamily: 'monospace' }}>{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-base font-semibold my-2" style={{ fontFamily: 'monospace' }}>{children}</h3>,
                                    code: ({ inline, children }) =>
                                      inline ? (
                                        <code className="px-1 py-0.5 rounded bg-white/10 text-cyan-400 text-xs font-mono">
                                          {children}
                                        </code>
                                      ) : (
                                        <code className="block p-3 rounded-lg bg-black/50 text-cyan-400 text-xs font-mono my-2 overflow-x-auto">
                                          {children}
                                        </code>
                                      ),
                                    a: ({ children, href }) => (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
                                      >
                                        {children}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ),
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              ) : (
                                <p className="leading-relaxed text-sm" style={{ fontFamily: 'monospace' }}>{msg.content}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}

                      {(isSending || isAnalyzing) && (
                        <div className="flex justify-start">
                          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4">
                            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-zinc-800 p-4">
                      <div className="flex gap-3">
                        <Input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask about opportunities, skills, salary ranges..."
                          className="flex-1 bg-black border-zinc-700 text-white"
                          style={{ fontFamily: 'monospace' }}
                          disabled={isSending || !conversation}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!input.trim() || isSending || !conversation}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-6"
                          style={{ fontFamily: 'monospace' }}
                        >
                          {isSending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'interview' && (
              <motion.div
                key="interview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader className="border-b border-zinc-800">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-6 h-6 text-cyan-400" />
                      Interview Preparation
                    </h2>
                    <p className="text-sm text-gray-400">
                      Get AI-powered interview questions and expert tips for your target role
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex gap-3">
                      <Input
                        value={interviewJobTitle}
                        onChange={(e) => setInterviewJobTitle(e.target.value)}
                        placeholder="Enter job title (e.g., Senior Software Engineer, Product Manager)"
                        className="flex-1 bg-black border-zinc-700 text-white"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleGenerateQuestions();
                        }}
                      />
                      <Button
                        onClick={handleGenerateQuestions}
                        disabled={isGeneratingQuestions || !interviewJobTitle.trim()}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        {isGeneratingQuestions ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Questions
                          </>
                        )}
                      </Button>
                    </div>

                    {interviewQuestions.length > 0 && (
                      <div className="space-y-4">
                        {interviewQuestions.map((q, idx) => (
                          <Card key={idx} className="bg-black border-zinc-800 hover:border-cyan-500/50 transition-colors cursor-pointer" onClick={() => setSelectedQuestion(selectedQuestion === idx ? null : idx)}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-2">
                                    Question {idx + 1}
                                  </Badge>
                                  <h3 className="text-white font-semibold text-lg">{q.question}</h3>
                                  <p className="text-gray-500 text-sm mt-2">
                                    <span className="text-purple-400 font-semibold">Why it's asked:</span> {q.intent}
                                  </p>
                                </div>
                                <motion.div
                                  animate={{ rotate: selectedQuestion === idx ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Lightbulb className={`w-5 h-5 ${selectedQuestion === idx ? 'text-yellow-400' : 'text-gray-600'}`} />
                                </motion.div>
                              </div>
                            </CardHeader>
                            <AnimatePresence>
                              {selectedQuestion === idx && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <CardContent className="border-t border-zinc-800 pt-4 space-y-4">
                                    <div>
                                      <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Example Answer
                                      </h4>
                                      <p className="text-gray-300 text-sm bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        {q.example_answer}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Pro Tips
                                      </h4>
                                      <ul className="space-y-2">
                                        {q.tips.map((tip, tipIdx) => (
                                          <li key={tipIdx} className="flex items-start gap-2 text-gray-400 text-sm">
                                            <span className="text-cyan-400 mt-1">•</span>
                                            <span>{tip}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </CardContent>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        ))}
                      </div>
                    )}

                    {interviewQuestions.length === 0 && !isGeneratingQuestions && (
                      <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-2">Ready to Ace Your Interview?</h3>
                        <p className="text-gray-500 text-sm">
                          Enter a job title above to get tailored interview questions and expert answers
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'resume' && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader className="border-b border-zinc-800">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <FileText className="w-6 h-6 text-cyan-400" />
                          Resume Builder
                        </h2>
                        <p className="text-sm text-gray-400">
                          Build a professional resume powered by AI
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Button
                          onClick={handleEnhanceResume}
                          disabled={isGeneratingResume}
                          variant="outline"
                          className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
                        >
                          {isGeneratingResume ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          AI Enhance
                        </Button>
                        <Button
                          onClick={handleSaveResume}
                          className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={handleExportResume}
                          className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Personal Info */}
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-lg border-b border-zinc-800 pb-2">Personal Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Full Name</label>
                          <Input
                            value={resume.fullName}
                            onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                            className="bg-black border-zinc-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Email</label>
                          <Input
                            value={resume.email}
                            onChange={(e) => setResume({ ...resume, email: e.target.value })}
                            className="bg-black border-zinc-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Phone</label>
                          <Input
                            value={resume.phone}
                            onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                            className="bg-black border-zinc-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Location</label>
                          <Input
                            value={resume.location}
                            onChange={(e) => setResume({ ...resume, location: e.target.value })}
                            className="bg-black border-zinc-700 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Professional Summary</label>
                        <Textarea
                          value={resume.summary}
                          onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                          placeholder="Write a brief summary of your professional background and goals..."
                          className="bg-black border-zinc-700 text-white h-24"
                        />
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h3 className="text-white font-semibold text-lg">Experience</h3>
                        <Button onClick={handleAddExperience} size="sm" className="bg-cyan-500/20 text-cyan-400">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      {resume.experience.map((exp, idx) => (
                        <Card key={idx} className="bg-black border-zinc-800 p-4">
                          <div className="flex justify-between mb-3">
                            <h4 className="text-white font-semibold">Position {idx + 1}</h4>
                            <Button
                              onClick={() => handleRemoveExperience(idx)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <Input
                              value={exp.title}
                              onChange={(e) => handleUpdateExperience(idx, 'title', e.target.value)}
                              placeholder="Job Title"
                              className="bg-zinc-900 border-zinc-700 text-white"
                            />
                            <Input
                              value={exp.company}
                              onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                              placeholder="Company"
                              className="bg-zinc-900 border-zinc-700 text-white"
                            />
                            <Input
                              value={exp.startDate}
                              onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                              placeholder="Start Date (e.g., Jan 2020)"
                              className="bg-zinc-900 border-zinc-700 text-white"
                            />
                            <Input
                              value={exp.endDate}
                              onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                              placeholder="End Date (or 'Present')"
                              className="bg-zinc-900 border-zinc-700 text-white"
                            />
                          </div>
                          <Textarea
                            value={exp.description}
                            onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                            placeholder="Describe your responsibilities and achievements..."
                            className="bg-zinc-900 border-zinc-700 text-white h-20 mt-3"
                          />
                        </Card>
                      ))}
                      {resume.experience.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No experience added yet. Click "Add" to get started.</p>
                        </div>
                      )}
                    </div>

                    {/* Education */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h3 className="text-white font-semibold text-lg">Education</h3>
                        <Button onClick={handleAddEducation} size="sm" className="bg-cyan-500/20 text-cyan-400">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      {resume.education.map((edu, idx) => (
                        <Card key={idx} className="bg-black border-zinc-800 p-4">
                          <div className="flex justify-between mb-3">
                            <h4 className="text-white font-semibold">Education {idx + 1}</h4>
                            <Button
                              onClick={() => handleRemoveEducation(idx)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <Input
                              value={edu.degree}
                              onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                              placeholder="Degree (e.g., BS Computer Science)"
                              className="bg-zinc-900 border-zinc-700 text-white"
                            />
                            <Input
                              value={edu.institution}
                              onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                              placeholder="Institution"
                              className="bg-zinc-900 border-zinc-700 text-white"
                            />
                            <Input
                              value={edu.year}
                              onChange={(e) => handleUpdateEducation(idx, 'year', e.target.value)}
                              placeholder="Year (e.g., 2020)"
                              className="bg-zinc-900 border-zinc-700 text-white"
                            />
                          </div>
                          <Textarea
                            value={edu.description}
                            onChange={(e) => handleUpdateEducation(idx, 'description', e.target.value)}
                            placeholder="Additional details (GPA, honors, relevant coursework)..."
                            className="bg-zinc-900 border-zinc-700 text-white h-16 mt-3"
                          />
                        </Card>
                      ))}
                    </div>

                    {/* Skills */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h3 className="text-white font-semibold text-lg">Skills</h3>
                        <Button onClick={handleAddSkill} size="sm" className="bg-cyan-500/20 text-cyan-400">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resume.skills.map((skill, idx) => (
                          <Badge key={idx} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 px-3 py-1">
                            {skill}
                            <button
                              onClick={() => handleRemoveSkill(idx)}
                              className="ml-2 text-cyan-400 hover:text-red-400"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      {resume.skills.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No skills added yet. Click "Add" to include your skills.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'view-resume' && (
              <motion.div
                key="view-resume"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Resume Style Selector */}
                <div className="flex items-center justify-between bg-black border border-cyan-500/30 rounded-xl p-4 backdrop-blur-xl shadow-lg shadow-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">Style:</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setResumeView('futuristic')}
                        variant={resumeView === 'futuristic' ? 'default' : 'outline'}
                        size="sm"
                        className={resumeView === 'futuristic' ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50' : 'border-zinc-700 text-gray-400 hover:text-white hover:border-cyan-500/50'}
                      >
                        Futuristic
                      </Button>
                      <Button
                        onClick={() => setResumeView('matrix')}
                        variant={resumeView === 'matrix' ? 'default' : 'outline'}
                        size="sm"
                        className={resumeView === 'matrix' ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50' : 'border-zinc-700 text-gray-400 hover:text-white hover:border-cyan-500/50'}
                      >
                        Matrix
                      </Button>
                      <Button
                        onClick={() => setResumeView('cyber')}
                        variant={resumeView === 'cyber' ? 'default' : 'outline'}
                        size="sm"
                        className={resumeView === 'cyber' ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50' : 'border-zinc-700 text-gray-400 hover:text-white hover:border-cyan-500/50'}
                      >
                        Cyber
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleExportResume}
                    className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 shadow-lg shadow-green-500/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                {/* Futuristic Resume Display */}
                <Card className="bg-black border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 relative overflow-hidden">
                  {/* Animated Grid Background */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)',
                      backgroundSize: '50px 50px'
                    }} />
                  </div>

                  {/* Glowing Orbs */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"
                  />

                  <CardContent className="p-0 relative z-10">
                    {resumeView === 'futuristic' && (
                      <div className="p-12 bg-gradient-to-br from-black via-zinc-950 to-black">
                        {/* Futuristic Header */}
                        <div className="mb-10 relative">
                          {/* Scan Line Effect */}
                          <motion.div
                            animate={{ y: [0, 200, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"
                          />

                          <div className="flex items-start justify-between relative">
                            <div className="flex-1">
                              {/* Agent ZK ID - Holographic Badge */}
                              {agentZKId && (
                                <motion.div
                                  initial={{ opacity: 0, y: -20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mb-6"
                                >
                                  <div className="inline-block relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg blur-lg opacity-75 animate-pulse" />
                                    <div className="relative bg-black border-2 border-cyan-500 px-6 py-3 rounded-lg font-mono">
                                      <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-500" />
                                        <span className="text-cyan-400 font-bold text-lg tracking-wider">{agentZKId}</span>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-500" />
                                      </div>
                                      <div className="text-xs text-cyan-400/60 mt-1 text-center tracking-widest">AGENT IDENTITY • VERIFIED • ENCRYPTED</div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {/* Name with Glitch Effect */}
                              <motion.h1
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-3 tracking-tight"
                                style={{ textShadow: '0 0 30px rgba(6, 182, 212, 0.5)' }}
                              >
                                {resume.fullName || 'YOUR NAME'}
                              </motion.h1>

                              <div className="h-px bg-gradient-to-r from-cyan-500/50 via-transparent to-transparent mb-4" />

                              <p className="text-2xl text-gray-300 mb-6 font-light tracking-wide">
                                {careerProfile.currentCareer || 'Professional Title'}
                              </p>

                              {/* Contact Info with Icons */}
                              <div className="flex flex-wrap gap-6 text-sm">
                                {resume.email && (
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg backdrop-blur-sm"
                                  >
                                    <span className="text-cyan-400">📧</span>
                                    <span className="text-gray-300">{resume.email}</span>
                                  </motion.div>
                                )}
                                {resume.phone && (
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg backdrop-blur-sm"
                                  >
                                    <span className="text-cyan-400">📱</span>
                                    <span className="text-gray-300">{resume.phone}</span>
                                  </motion.div>
                                )}
                                {resume.location && (
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg backdrop-blur-sm"
                                  >
                                    <span className="text-cyan-400">📍</span>
                                    <span className="text-gray-300">{resume.location}</span>
                                  </motion.div>
                                )}
                              </div>
                            </div>

                            {/* Profile Photo with Holographic Frame */}
                            {(profilePhoto || agentZKPhoto) && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur-xl opacity-75 animate-pulse" />
                                <div className="relative">
                                  <img
                                    src={agentZKPhoto || profilePhoto}
                                    alt="Profile"
                                    className="w-40 h-40 rounded-2xl object-cover border-4 border-cyan-500 shadow-2xl shadow-cyan-500/50"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-2xl" />
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>

                        {/* Professional Summary - Holographic Panel */}
                        {resume.summary && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-10 relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-xl blur-xl" />
                            <div className="relative bg-black/80 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full shadow-lg shadow-cyan-500/50" />
                                <h2 className="text-2xl font-bold text-cyan-400 tracking-wide">PROFILE ANALYSIS</h2>
                              </div>
                              <p className="text-gray-300 leading-relaxed text-lg">{resume.summary}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Experience - Cyber Cards */}
                        {resume.experience.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mb-10"
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50" />
                              <h2 className="text-2xl font-bold text-cyan-400 tracking-wide">EXPERIENCE MATRIX</h2>
                            </div>
                            <div className="space-y-4">
                              {resume.experience.map((exp, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  whileHover={{ scale: 1.02, translateX: 10 }}
                                  className="relative group"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                                  <div className="relative bg-black/50 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm group-hover:border-cyan-500/50 transition-all">
                                    <div className="flex items-start justify-between mb-2">
                                      <h3 className="text-xl font-bold text-white">{exp.title}</h3>
                                      <div className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-3 py-1 rounded border border-cyan-500/30">
                                        {exp.startDate} - {exp.endDate}
                                      </div>
                                    </div>
                                    <p className="text-cyan-400 font-semibold mb-3">{exp.company}</p>
                                    <div className="h-px bg-gradient-to-r from-cyan-500/50 via-transparent to-transparent mb-3" />
                                    <p className="text-gray-300 leading-relaxed">{exp.description}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Education - Neon Cards */}
                        {resume.education.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-10"
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full shadow-lg shadow-cyan-500/50" />
                              <h2 className="text-2xl font-bold text-cyan-400 tracking-wide">EDUCATION PROTOCOL</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              {resume.education.map((edu, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.1 }}
                                  whileHover={{ scale: 1.05 }}
                                  className="relative group"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className="relative bg-black/50 border border-cyan-500/30 rounded-lg p-5 backdrop-blur-sm group-hover:border-cyan-500/50 transition-all">
                                    <h3 className="text-lg font-bold text-white mb-2">{edu.degree}</h3>
                                    <p className="text-cyan-400 mb-2">{edu.institution}</p>
                                    <p className="text-sm text-gray-400 font-mono">{edu.year}</p>
                                    {edu.description && (
                                      <p className="text-gray-300 text-sm mt-3 pt-3 border-t border-cyan-500/20">{edu.description}</p>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Skills - Neon Tags */}
                        {resume.skills.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-10"
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50" />
                              <h2 className="text-2xl font-bold text-cyan-400 tracking-wide">SKILL ARRAY</h2>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {resume.skills.map((skill, idx) => (
                                <motion.span
                                  key={idx}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  className="relative group"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                                  <span className="relative px-5 py-2 bg-black border-2 border-cyan-500/50 text-cyan-400 rounded-lg font-semibold text-sm inline-block group-hover:border-cyan-400 transition-all shadow-lg">
                                    {skill}
                                  </span>
                                </motion.span>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Footer - Verification Stamp */}
                        {agentZKId && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-16 pt-8 border-t border-cyan-500/30"
                          >
                            <div className="flex items-center justify-center gap-4">
                              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent flex-1" />
                              <div className="text-center">
                                <div className="inline-flex items-center gap-3 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg backdrop-blur-sm">
                                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-500" />
                                  <span className="text-cyan-400 text-xs font-mono tracking-wider">
                                    🔐 VERIFIED BY TTT AGENT ZK • {agentZKId} • {new Date().toLocaleDateString()} • QUANTUM ENCRYPTED
                                  </span>
                                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-500" />
                                </div>
                              </div>
                              <div className="h-px bg-gradient-to-r from-cyan-500 via-transparent to-transparent flex-1" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {resumeView === 'matrix' && (
                      <div className="p-12 bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
                        {/* Matrix-Style Header */}
                        <div className="text-center mb-10 relative">
                          {/* Matrix Rain Effect Background */}
                          <div className="absolute inset-0 opacity-10 overflow-hidden">
                            <div className="text-xs text-green-500 font-mono">
                              {Array.from({ length: 20 }).map((_, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ y: [0, 400, 0] }}
                                  transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
                                  style={{ position: 'absolute', left: `${i * 5}%` }}
                                >
                                  01001010
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {agentZKId && (
                            <div className="mb-4 relative">
                              <Badge className="bg-black border-2 border-green-500 text-green-400 px-6 py-2 text-sm font-mono shadow-lg shadow-green-500/50">
                                {agentZKId} • MATRIX VERIFIED
                              </Badge>
                            </div>
                          )}

                          <h1 className="text-5xl font-black text-green-400 mb-3 tracking-wider font-mono" style={{ textShadow: '0 0 20px rgba(34, 197, 94, 0.8)' }}>
                            {resume.fullName || 'YOUR NAME'}
                          </h1>
                          <p className="text-xl text-green-400/70 mb-4 font-mono">{careerProfile.currentCareer || 'Professional Title'}</p>

                          <div className="flex justify-center gap-4 text-sm text-green-400/60 font-mono">
                            {resume.email && <span className="border border-green-500/30 px-3 py-1 rounded bg-green-500/5">{resume.email}</span>}
                            {resume.phone && <span className="border border-green-500/30 px-3 py-1 rounded bg-green-500/5">{resume.phone}</span>}
                            {resume.location && <span className="border border-green-500/30 px-3 py-1 rounded bg-green-500/5">{resume.location}</span>}
                          </div>
                        </div>

                        {/* Rest of Matrix theme content */}
                        {resume.summary && (
                          <div className="mb-8 bg-black/80 border-2 border-green-500/30 rounded p-4">
                            <h2 className="text-lg font-bold text-green-400 uppercase border-b-2 border-green-500/30 pb-2 mb-3 font-mono">
                              &gt;&gt; PROFESSIONAL_SUMMARY
                            </h2>
                            <p className="text-green-400/70 font-mono text-sm leading-relaxed">{resume.summary}</p>
                          </div>
                        )}

                        {resume.experience.length > 0 && (
                          <div className="mb-8">
                            <h2 className="text-lg font-bold text-green-400 uppercase border-b-2 border-green-500/30 pb-2 mb-4 font-mono">
                              &gt;&gt; EXPERIENCE_LOG
                            </h2>
                            <div className="space-y-4">
                              {resume.experience.map((exp, idx) => (
                                <div key={idx} className="bg-black/50 border border-green-500/30 rounded p-4 hover:border-green-500/50 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-green-400 font-mono">[{exp.title}] @ {exp.company}</h3>
                                    <span className="text-sm text-green-400/60 font-mono">{exp.startDate} - {exp.endDate}</span>
                                  </div>
                                  <p className="text-green-400/70 text-sm font-mono">{exp.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {resume.education.length > 0 && (
                          <div className="mb-8">
                            <h2 className="text-lg font-bold text-green-400 uppercase border-b-2 border-green-500/30 pb-2 mb-4 font-mono">
                              &gt;&gt; EDUCATION_DATA
                            </h2>
                            <div className="space-y-3">
                              {resume.education.map((edu, idx) => (
                                <div key={idx} className="bg-black/50 border border-green-500/30 rounded p-3">
                                  <h3 className="font-bold text-green-400 font-mono">[{edu.degree}]</h3>
                                  <p className="text-green-400/60 text-sm font-mono">{edu.institution} • {edu.year}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {resume.skills.length > 0 && (
                          <div className="mb-8">
                            <h2 className="text-lg font-bold text-green-400 uppercase border-b-2 border-green-500/30 pb-2 mb-4 font-mono">
                              &gt;&gt; SKILLS_ARRAY
                            </h2>
                            <p className="text-green-400/70 font-mono text-sm">[{resume.skills.join(', ')}]</p>
                          </div>
                        )}
                      </div>
                    )}

                    {resumeView === 'cyber' && (
                      <div className="p-12 bg-black relative overflow-hidden">
                        {/* Cyber Grid */}
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'linear-gradient(rgba(138, 43, 226, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(138, 43, 226, 0.5) 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                          }} />
                        </div>

                        {/* Cyber Minimal Layout */}
                        <div className="relative z-10">
                          <div className="mb-12">
                            <h1 className="text-7xl font-thin text-white mb-4 tracking-widest">
                              {resume.fullName || 'YOUR NAME'}
                            </h1>
                            {agentZKId && (
                              <div className="flex items-center gap-3 mb-4">
                                <div className="h-px bg-gradient-to-r from-purple-500 to-transparent flex-1" />
                                <p className="text-xs font-mono text-purple-400 tracking-widest">{agentZKId}</p>
                                <div className="h-px bg-gradient-to-l from-purple-500 to-transparent flex-1" />
                              </div>
                            )}
                            <p className="text-2xl text-gray-500 mb-6 font-light tracking-widest">
                              {careerProfile.currentCareer || 'Professional Title'}
                            </p>
                            <div className="text-sm text-gray-600 tracking-wide space-x-4">
                              {resume.email} {resume.phone && `• ${resume.phone}`} {resume.location && `• ${resume.location}`}
                            </div>
                          </div>

                          {resume.summary && (
                            <div className="mb-12">
                              <div className="h-px bg-gradient-to-r from-purple-500/50 via-transparent to-transparent mb-6" />
                              <p className="text-gray-400 text-lg leading-relaxed italic font-light tracking-wide">{resume.summary}</p>
                            </div>
                          )}

                          {resume.experience.length > 0 && (
                            <div className="mb-12">
                              <h2 className="text-xs font-bold text-purple-400 uppercase tracking-[0.3em] mb-8">Experience</h2>
                              <div className="space-y-8">
                                {resume.experience.map((exp, idx) => (
                                  <div key={idx} className="relative pl-6 border-l border-purple-500/30 hover:border-purple-500/50 transition-colors">
                                    <div className="absolute left-0 top-0 w-2 h-2 bg-purple-500 rounded-full -translate-x-[4.5px]" />
                                    <div className="flex justify-between mb-2">
                                      <h3 className="font-bold text-white tracking-wide">{exp.title}</h3>
                                      <span className="text-sm text-gray-600 font-mono">{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-3 tracking-wide">{exp.company}</p>
                                    <p className="text-gray-400 leading-relaxed">{exp.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {resume.education.length > 0 && (
                            <div className="mb-12">
                              <h2 className="text-xs font-bold text-purple-400 uppercase tracking-[0.3em] mb-8">Education</h2>
                              <div className="space-y-4">
                                {resume.education.map((edu, idx) => (
                                  <div key={idx}>
                                    <h3 className="font-bold text-white tracking-wide">{edu.degree}</h3>
                                    <p className="text-gray-500 tracking-wide">{edu.institution} • {edu.year}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {resume.skills.length > 0 && (
                            <div className="mb-12">
                              <h2 className="text-xs font-bold text-purple-400 uppercase tracking-[0.3em] mb-8">Skills</h2>
                              <p className="text-gray-400 tracking-wide">{resume.skills.join(' • ')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions - Futuristic Buttons */}
                <div className="flex gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} className="flex-1">
                    <Button
                      onClick={() => setActiveTab('resume')}
                      variant="outline"
                      className="w-full bg-black/80 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 backdrop-blur-sm shadow-lg shadow-cyan-500/20"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Edit Resume
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="flex-1">
                    <Button
                      onClick={handleSaveResume}
                      className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 hover:from-cyan-500/30 hover:to-purple-500/30 shadow-lg shadow-cyan-500/20"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
