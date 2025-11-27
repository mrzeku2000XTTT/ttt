import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, Upload, Loader2, Image as ImageIcon, 
  Briefcase, CheckCircle2, Sparkles, X, Bot
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import JobMatchCard from "@/components/iwork/JobMatchCard";

export default function IWorkChatInterface({ kasPrice, onConnectToJob }) {
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "👋 Hi! I'm your iWork assistant. Tell me about your skills and experience, or upload your resume/portfolio images for analysis!" 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [jobListings, setJobListings] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadJobListings();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadJobListings = async () => {
    try {
      const jobs = await base44.entities.HRJobListing.filter({ status: 'active' }, '-created_date');
      setJobListings(jobs);
      console.log('📋 Loaded', jobs.length, 'active job listings');
    } catch (err) {
      console.error('Failed to load job listings:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // Upload file
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;
      
      setUploadedFile({ name: file.name, url: fileUrl });
      setMessages(prev => [...prev, { 
        role: "user", 
        content: `📎 Uploaded: ${file.name}`,
        fileUrl 
      }]);

      // Intelligent resume analysis
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert HR recruiter analyzing a resume, portfolio, or career document.

Carefully examine this image and extract comprehensive information:

1. **Technical Skills**: ALL programming languages, frameworks, tools, software
2. **Professional Skills**: Design, management, communication, etc.
3. **Experience Level**: Junior, Mid, Senior, or Expert (based on years/projects)
4. **Job Titles**: Current or target positions
5. **Education & Certifications**: Degrees, courses, certifications
6. **Hourly Rate**: Fair USD rate based on skills and experience ($20-$200+/hr)

Analyze deeply - look for:
- Job titles and company names
- Project descriptions and achievements
- Years of experience indicators
- Education background
- Portfolio work samples
- Specific technologies mentioned

Return a warm, encouraging analysis that highlights their strengths.`,
        file_urls: [fileUrl],
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            analysis: { 
              type: "string",
              description: "Friendly, detailed summary of qualifications"
            },
            skills: { 
              type: "array", 
              items: { type: "string" },
              description: "Comprehensive list of all detected skills"
            },
            experience_level: { 
              type: "string",
              enum: ["Junior", "Mid-Level", "Senior", "Expert"]
            },
            suggested_hourly_rate: { 
              type: "number",
              description: "Fair market rate in USD"
            },
            job_roles: {
              type: "array",
              items: { type: "string" },
              description: "Suitable job positions"
            }
          }
        }
      });

      setUserSkills(analysis.skills || []);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: analysis.analysis,
        skills: analysis.skills,
        rate: analysis.suggested_hourly_rate
      }]);

      // Auto-match jobs
      if (analysis.skills && analysis.skills.length > 0) {
        matchJobsWithSkills(analysis.skills);
      }
    } catch (err) {
      console.error("Failed to analyze file:", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I couldn't analyze that file. Please try again or tell me about your skills instead." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const userMessageLower = userMessage.toLowerCase();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    setLoading(true);

    try {
      // Intelligent skill extraction with context understanding
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an intelligent HR assistant analyzing a job seeker's message.

Message: "${userMessage}"

Your task:
1. Extract ALL skills, technologies, and qualifications mentioned
2. Infer additional relevant skills from context
3. Identify job role intent if mentioned

Examples:
- "I build websites" → ["Web Development", "HTML", "CSS", "JavaScript", "Frontend"]
- "React developer with 5 years" → ["React", "JavaScript", "Frontend Development", "Senior Developer"]
- "graphic designer" → ["Graphic Design", "Adobe Photoshop", "Illustrator", "Creative Design"]
- "I code in Python" → ["Python", "Programming", "Backend Development"]

Be smart and generous in skill detection. Return all relevant skills and technologies.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            skills: { 
              type: "array", 
              items: { type: "string" },
              description: "All extracted and inferred skills"
            },
            intent: {
              type: "string",
              description: "What the user is looking for"
            },
            confidence: {
              type: "string",
              enum: ["high", "medium", "low"]
            }
          }
        }
      });

      const extractedSkills = response.skills || [];
      const intent = response.intent || '';
      const confidence = response.confidence || 'medium';
      
      console.log('🔍 Extracted skills:', extractedSkills, '| Intent:', intent, '| Confidence:', confidence);

      // Add to user skills
      if (extractedSkills.length > 0) {
        const combinedSkills = [...new Set([...userSkills, ...extractedSkills])];
        setUserSkills(combinedSkills);

        // Intelligent response based on confidence
        let responseMessage = '';
        if (confidence === 'high') {
          responseMessage = `✅ Perfect! I found: ${extractedSkills.slice(0, 5).join(', ')}${extractedSkills.length > 5 ? ` +${extractedSkills.length - 5} more` : ''}`;
        } else if (confidence === 'medium') {
          responseMessage = `👍 Got it! Skills detected: ${extractedSkills.join(', ')}`;
        } else {
          responseMessage = `🤔 I think you mentioned: ${extractedSkills.join(', ')}. Is that correct?`;
        }
        
        if (intent) {
          responseMessage += `\n\n🎯 Looking for: ${intent}`;
        }
        
        responseMessage += '\n\n🔍 Searching for matching jobs...';

        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: responseMessage,
          skills: extractedSkills
        }]);

        // Reload and match jobs
        await loadJobListings();
        setTimeout(() => {
          matchJobsWithSkills(combinedSkills);
        }, 800);
      } else {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "🤔 I'm not sure what skills you're referring to. Could you be more specific?\n\nTry mentioning:\n• Technologies (React, Python, etc.)\n• Job roles (Designer, Developer, etc.)\n• Industries (Marketing, Engineering, etc.)" 
        }]);
      }
    } catch (err) {
      console.error("Failed to process:", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Error processing your message. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const matchJobsWithSkills = (skills) => {
    console.log('🔍 Matching skills:', skills, 'against', jobListings.length, 'jobs');
    
    if (!jobListings || jobListings.length === 0) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "⚠️ No active job listings available. Please check back later!" 
      }]);
      return;
    }

    const normalizedSkills = skills.map(s => s.toLowerCase());
    
    const scored = jobListings.map(job => {
      const jobSkills = (job.skills || []).map(s => s.toLowerCase());
      const jobDesc = (job.description || '').toLowerCase();
      const jobTitle = (job.title || '').toLowerCase();
      const jobReqs = (job.requirements || []).join(' ').toLowerCase();
      const jobDept = (job.department || '').toLowerCase();
      
      let score = 0;
      let matchDetails = [];
      
      normalizedSkills.forEach(skill => {
        let matched = false;
        
        // Title exact match (high priority)
        if (jobTitle.includes(skill)) {
          score += 35;
          matched = true;
        }
        
        // Skills array match (high priority)
        if (jobSkills.some(js => js.includes(skill) || skill.includes(js))) {
          score += 30;
          matched = true;
        }
        
        // Description match
        if (jobDesc.includes(skill)) {
          score += 15;
          matched = true;
        }
        
        // Requirements match
        if (jobReqs.includes(skill)) {
          score += 12;
          matched = true;
        }
        
        // Department match
        if (jobDept.includes(skill)) {
          score += 10;
          matched = true;
        }
        
        if (matched) {
          matchDetails.push(skill);
        }
      });
      
      return { ...job, matchScore: Math.min(score, 100), matchedSkills: matchDetails };
    });

    const matches = scored
      .filter(job => job.matchScore > 10)
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log('✅ Found', matches.length, 'matches:', matches.map(m => `${m.title} (${m.matchScore}%)`));
    setMatchedJobs(matches);
    
    if (matches.length > 0) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `✨ Found ${matches.length} matching job${matches.length > 1 ? 's' : ''}!`,
        showMatches: true
      }]);
    } else {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `No matches for "${skills.join(', ')}". Showing all ${jobListings.length} jobs below.` 
      }]);
      // Show all jobs if no matches
      setMatchedJobs(jobListings.map(job => ({ ...job, matchScore: 0 })));
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="h-[500px] md:h-[calc(100vh-300px)] flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' 
                  : 'bg-white/10 text-white border border-white/20'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                
                {msg.skills && msg.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.skills.map((skill, i) => (
                      <Badge key={i} className="bg-purple-500/30 text-purple-200 text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {msg.rate && (
                  <div className="mt-2 text-xs opacity-80">
                    💰 Suggested rate: ${msg.rate}/hour
                  </div>
                )}
                
                {msg.fileUrl && (
                  <div className="mt-2">
                    <img src={msg.fileUrl} alt="Uploaded" className="max-w-xs rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 p-4 rounded-2xl border border-cyan-500/30">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <span className="text-sm text-white">Searching jobs...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Matched Jobs */}
      <AnimatePresence>
        {matchedJobs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-gradient-to-b from-black/60 to-black/40 p-4 max-h-[500px] overflow-y-auto"
          >
            <motion.h3 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-lg font-bold text-white mb-4 flex items-center gap-2"
            >
              <Briefcase className="w-5 h-5 text-cyan-400" />
              Matched Jobs ({matchedJobs.length})
            </motion.h3>
            <div className="grid md:grid-cols-2 gap-4">
              {matchedJobs.map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <JobMatchCard
                    job={job}
                    matchScore={job.matchScore}
                    kasPrice={kasPrice}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Skills */}
      {userSkills.length > 0 && (
        <div className="px-4 py-2 bg-black/40 border-t border-white/10">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400">Your Skills:</span>
            {userSkills.map((skill, i) => (
              <Badge key={i} className="bg-cyan-500/20 text-cyan-300 text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-black/60 border-t border-white/10">
        {uploadedFile && (
          <div className="mb-2 p-2 bg-white/5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-300">{uploadedFile.name}</span>
            </div>
            <button onClick={clearUploadedFile} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Upload className="w-4 h-4" />
          </Button>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Tell me about your skills..."
            className="flex-1 bg-white/10 border-white/20 text-white"
            disabled={loading}
          />
          
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          💡 Upload your resume or describe your experience to find matching jobs
        </p>
      </div>
    </div>
  );
}