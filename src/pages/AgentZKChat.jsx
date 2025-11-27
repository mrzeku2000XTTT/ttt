import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Loader2, 
  Brain, 
  User, 
  Sparkles, 
  TrendingUp, 
  AlertCircle,
  Search,
  X,
  Upload,
  FileSearch,
  ShoppingCart,
  CheckCircle2,
  Diamond,
  Link as LinkIcon,
  ExternalLink,
  Shield,
  Plus,
  Briefcase
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";

const rarityColors = {
  common: { bg: 'from-gray-500/20 to-gray-600/20', border: 'border-gray-500/50' },
  uncommon: { bg: 'from-green-500/20 to-emerald-600/20', border: 'border-green-500/50' },
  rare: { bg: 'from-blue-500/20 to-cyan-600/20', border: 'border-blue-500/50' },
  epic: { bg: 'from-purple-500/20 to-pink-600/20', border: 'border-purple-500/50' },
  legendary: { bg: 'from-yellow-500/20 to-orange-600/20', border: 'border-yellow-500/50' }
};

export default function AgentZKChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetAddress = searchParams.get('targetAddress');
  const targetName = searchParams.get('targetName');
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [targetProfile, setTargetProfile] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shopItems, setShopItems] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeepSearch, setShowDeepSearch] = useState(false);
  const [deepSearchFile, setDeepSearchFile] = useState(null);
  const [isDeepSearching, setIsDeepSearching] = useState(false);
  const [showJobListModal, setShowJobListModal] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [isGeneratingJob, setIsGeneratingJob] = useState(false);
  const [jobListings, setJobListings] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const deepSearchInputRef = useRef(null);
  const searchRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    init();
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [targetAddress]);
  
  useEffect(() => {
    if (conversationId) {
      loadMessages();
      if (pollInterval.current) clearInterval(pollInterval.current);
      pollInterval.current = setInterval(loadMessages, 3000);
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [conversationId]);

  useEffect(() => {
    // Only auto-scroll if the last message is not a jobs message
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.isJobsMessage) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (searchQuery.trim()) {
      filterSearchResults();
    } else {
      setFilteredResults([]);
    }
  }, [searchQuery, shopItems]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const init = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const myProfiles = await base44.entities.AgentZKProfile.filter({ user_email: currentUser.email });
      if (myProfiles.length > 0) {
        setCurrentProfile(myProfiles[0]);
      }

      if (targetAddress || targetName) {
        const target = targetAddress || targetName;

        const profiles = await base44.entities.AgentZKProfile.filter({ wallet_address: target });
        if (profiles.length > 0) {
          setTargetProfile(profiles[0]);
          checkIfOnline(profiles[0]);
        } else {
          // Create a basic profile object for display
          setTargetProfile({
            username: targetName || target.substring(0, 20),
            wallet_address: target
          });
        }

        // Always create conversation ID
        const myId = myProfiles.length > 0 ? myProfiles[0].wallet_address : currentUser.email;
        const targetId = target;
        const ids = [myId, targetId].sort();
        const convId = `conv_${ids[0]}_${ids[1]}`;
        setConversationId(convId);
        console.log('✅ Created conversation:', convId);
      }

      await loadShopItems();
      await loadJobListings();
    } catch (err) {
      console.error("Init failed:", err);
    }
  };

  const checkIfOnline = (profile) => {
    if (!profile?.last_active) {
      setIsOnline(false);
      return;
    }
    const now = Date.now();
    const lastActive = new Date(profile.last_active).getTime();
    const onlineThreshold = 3 * 60 * 1000;
    setIsOnline((now - lastActive) < onlineThreshold);
  };

  const loadJobListings = async () => {
    try {
      const jobs = await base44.entities.HRJobListing.filter({ status: 'active' });
      setJobListings(jobs);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  };

  const loadShopItems = async () => {
    try {
      const items = await base44.entities.ShopItem.filter({
        status: "active",
        stock: { $gt: 0 }
      }, "-created_date", 100);
      setShopItems(items);
    } catch (err) {
      console.error("Failed to load shop items:", err);
    }
  };

  const loadMessages = async () => {
    if (!conversationId || !user) return;
    try {
      const msgs = await base44.entities.AgentMessage.filter({ conversation_id: conversationId });
      msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      
      setMessages(prev => {
        const dbMessages = msgs.map(m => ({
          role: m.sender_email === user?.email ? 'user' : 'agent',
          content: m.message,
          created_date: m.created_date,
          id: m.id
        }));
        
        // Keep local-only messages (like jobs messages) that aren't in the database
        const localOnlyMessages = prev.filter(m => 
          m.isJobsMessage && !dbMessages.find(dm => dm.id === m.id)
        );
        
        // Merge and sort by date
        const allMessages = [...dbMessages, ...localOnlyMessages].sort(
          (a, b) => new Date(a.created_date) - new Date(b.created_date)
        );
        
        return allMessages;
      });

      const unread = msgs.filter(m => !m.is_read && m.recipient_email === user?.email);
      for (const m of unread) {
        await base44.entities.AgentMessage.update(m.id, { is_read: true });
      }
    } catch (err) {
      console.error("Load messages failed:", err);
    }
  };

  const filterSearchResults = () => {
    const query = searchQuery.toLowerCase().trim();
    
    // Filter NFTs
    const nftResults = shopItems
      .filter(item => {
        const isNFT = item.tags?.includes('NFT') || item.tags?.includes('AI-Generated');
        if (!isNFT) return false;
        
        const titleMatch = item.title?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(query));
        
        return titleMatch || descMatch || tagMatch;
      })
      .slice(0, 6);

    // Create page results
    const pages = [];
    
    if (query.includes('nft')) {
      pages.push(
        { type: 'page', name: 'NFT Mint', path: 'NFTMint', description: 'Create and mint AI NFTs', icon: '🎨' },
        { type: 'page', name: 'NFT Shop', path: 'Shop', description: 'Browse and buy NFTs', icon: '🛍️' }
      );
    }

    setFilteredResults([...pages, ...nftResults.map(item => ({ type: 'nft', ...item }))]);
  };

  const getNFTRarity = (item) => {
    return item.tags?.find(tag => 
      ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(tag.toLowerCase())
    )?.toLowerCase() || 'common';
  };

  const handleSearchItemClick = (result) => {
    if (result.type === 'page') {
      navigate(createPageUrl(result.path));
    } else if (result.type === 'nft') {
      navigate(createPageUrl("ShopItemView") + "?id=" + result.id);
    }
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls = [];
      
      for (const file of files) {
        const response = await base44.integrations.Core.UploadFile({ file });
        if (response.file_url) {
          uploadedUrls.push({
            name: file.name,
            url: response.file_url,
            type: file.type
          });
        }
      }
      
      setUploadedFiles([...uploadedFiles, ...uploadedUrls]);
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeepSearch = async () => {
    if (!deepSearchFile) return;

    setIsDeepSearching(true);
    const userMessage = {
      role: "user",
      content: `🔍 Deep Search requested for: ${deepSearchFile.name}`,
      files: [deepSearchFile]
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced AI research assistant. A user has uploaded a file for deep analysis.

File: ${deepSearchFile.name}
Type: ${deepSearchFile.type}

Please perform a comprehensive deep search and analysis:
1. Extract all text, data, and metadata from the file
2. Identify key topics, themes, and entities
3. Research related information using web search
4. Provide detailed insights and findings
5. Include relevant external sources and links

Format your response with:
- **Summary**: Overview of the file contents
- **Key Findings**: Main discoveries and insights
- **Deep Analysis**: Detailed examination
- **Related Resources**: Links to relevant sources
- **Recommendations**: Suggested actions or further reading

Be thorough and provide actionable insights.`,
        add_context_from_internet: true,
        file_urls: [deepSearchFile.url]
      });

      const aiMessage = {
        role: "assistant",
        content: response,
        isDeepSearch: true
      };

      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
      
      setDeepSearchFile(null);
      setShowDeepSearch(false);
    } catch (err) {
      console.error("Deep search failed:", err);
      const errorMessage = {
        role: "assistant",
        content: "❌ Deep search failed. Please try again or upload a different file.",
        isError: true
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } finally {
      setIsDeepSearching(false);
    }
  };

  const handleGenerateJob = async () => {
    if (!jobDescription.trim()) {
      alert('Please describe the job');
      return;
    }

    if (!currentProfile) {
      alert('Please create your Agent ZK profile first');
      return;
    }

    setIsGeneratingJob(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract job details from this description and return as JSON:

"${jobDescription}"

Return JSON with:
{
  "title": "job title",
  "department": "category/department",
  "employment_type": "Full Time" or "Part Time" or "Contract",
  "location": "city or Remote",
  "is_remote": true/false,
  "salary_range_min": number (USD),
  "salary_range_max": number (USD),
  "description": "full description",
  "requirements": ["requirement1", "requirement2"],
  "responsibilities": ["resp1", "resp2"],
  "skills": ["skill1", "skill2"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            department: { type: "string" },
            employment_type: { type: "string" },
            location: { type: "string" },
            is_remote: { type: "boolean" },
            salary_range_min: { type: "number" },
            salary_range_max: { type: "number" },
            description: { type: "string" },
            requirements: { type: "array", items: { type: "string" } },
            responsibilities: { type: "array", items: { type: "string" } },
            skills: { type: "array", items: { type: "string" } }
          }
        }
      });

      await base44.entities.HRJobListing.create({
        ...response,
        posted_by_email: user.email,
        posted_by_username: currentProfile.username,
        posted_by_wallet: currentProfile.wallet_address,
        company_id: user.email,
        status: 'active',
        applications_count: 0
      });

      alert('✅ Job listed successfully!');
      setShowJobListModal(false);
      setJobDescription('');
      await loadJobListings();

      const jobsMsg = await generateJobsMessage();
      setMessages(prev => [...prev, jobsMsg]);
    } catch (err) {
      console.error('Job generation failed:', err);
      alert('❌ Failed to create job listing');
    } finally {
      setIsGeneratingJob(false);
    }
  };

  const generateJobsMessage = async () => {
    const allJobs = await base44.entities.HRJobListing.filter({ status: 'active' });
    
    let content = '## 💼 Job Listings\n\n';
    
    if (allJobs.length === 0) {
      content += '*No active job listings at the moment.*\n\n';
    } else {
      allJobs.forEach((job, idx) => {
        content += `**${idx + 1}. ${job.title}**\n`;
        content += `📍 ${job.location} ${job.is_remote ? '• Remote' : ''}\n`;
        content += `💰 $${job.salary_range_min?.toLocaleString()} - $${job.salary_range_max?.toLocaleString()}\n`;
        content += `👤 Posted by: ${job.posted_by_username}\n`;
        content += `---\n\n`;
      });
    }

    return {
      role: 'agent',
      content: content,
      created_date: new Date().toISOString(),
      id: `system-${Date.now()}`,
      isJobsMessage: true,
      jobsData: allJobs
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    const text = input.trim();

    // ✅ JOBS COMMAND - Works without conversation
    if (text.toLowerCase() === 'jobs' || text.toLowerCase() === '/jobs' || text.toLowerCase() === 'job') {
      setInput("");
      setIsSending(true);

      const userMsg = { 
        role: 'user', 
        content: 'JOBS', 
        created_date: new Date().toISOString(), 
        id: `user-${Date.now()}` 
      };

      setMessages(prev => [...prev, userMsg]);

      try {
        console.log('🔍 Calling getJobListings API...');
        const response = await base44.functions.invoke('getJobListings', {});
        console.log('📦 API Response:', response);

        const allJobs = response.data?.jobs || [];
        console.log('✅ Fetched', allJobs.length, 'jobs');

        const jobsMsg = {
          role: 'agent',
          content: `Found ${allJobs.length} active job listings`,
          created_date: new Date().toISOString(),
          id: `jobs-${Date.now()}`,
          isJobsMessage: true,
          jobsData: allJobs
        };

        setMessages(prev => [...prev, jobsMsg]);
      } catch (err) {
        console.error('❌ Jobs API failed:', err);
        setMessages(prev => [...prev, {
          role: 'agent',
          content: '❌ Failed to load jobs',
          created_date: new Date().toISOString(),
          id: `error-${Date.now()}`
        }]);
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Regular messages - just send them
    setInput("");
    setIsSending(true);

    const optimisticMsg = {
      role: 'user',
      content: text,
      created_date: new Date().toISOString(),
      id: `temp-${Date.now()}`
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await base44.entities.AgentMessage.create({
        conversation_id: conversationId,
        sender_email: user.email,
        sender_address: currentProfile?.wallet_address || user.email,
        sender_username: currentProfile?.username || user.username || user.email,
        sender_agent_id: currentProfile?.agent_zk_id || '',
        recipient_email: targetProfile?.user_email || '',
        recipient_address: targetAddress || targetName,
        recipient_username: targetProfile?.username || targetName || 'User',
        recipient_agent_id: targetProfile?.agent_zk_id || '',
        message: text,
        is_read: false
      });

      setTimeout(loadMessages, 500);
    } catch (err) {
      console.error("Send failed:", err);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setInput(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col relative">
      {targetProfile && (
        <div className="p-4 border-b border-white/10 bg-black/50 backdrop-blur-xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg border-2 border-cyan-500/50 overflow-hidden">
                  {targetProfile.agent_zk_photo ? (
                    <img src={targetProfile.agent_zk_photo} alt={targetProfile.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-cyan-400" />
                    </div>
                  )}
                </div>
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {targetProfile.username || targetName || 'Agent'}
                  {isOnline && <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Online</Badge>}
                </h2>
                <p className="text-xs text-gray-400">{targetProfile.agent_zk_id || targetAddress?.substring(0, 20)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {targetProfile ? `Chat with ${targetProfile.username || 'Agent'}` : 'Agent ZK Chat'}
              </h2>
              <p className="text-gray-400 text-sm max-w-md mb-4">
                {targetProfile ? 'Start your conversation' : 'Select an agent to chat with'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={async () => {
                    setIsSending(true);
                    const userMsg = { role: 'user', content: 'JOBS', created_date: new Date().toISOString(), id: `user-${Date.now()}` };
                    setMessages([userMsg]);
                    try {
                      const response = await base44.functions.invoke('getJobListings', {});
                      const allJobs = response.data?.jobs || [];
                      const jobsMsg = {
                        role: 'agent',
                        content: `Found ${allJobs.length} active job listings`,
                        created_date: new Date().toISOString(),
                        id: `jobs-${Date.now()}`,
                        isJobsMessage: true,
                        jobsData: allJobs
                      };
                      setMessages([userMsg, jobsMsg]);
                    } catch (err) {
                      console.error('Browse jobs failed:', err);
                      setMessages([userMsg, {
                        role: 'agent',
                        content: '❌ Failed to load jobs',
                        created_date: new Date().toISOString(),
                        id: `error-${Date.now()}`
                      }]);
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "agent" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${msg.role === "user" ? "order-1" : ""}`}>
                {msg.isJobsMessage && msg.jobsData ? (
                    <div className="space-y-3 w-full max-w-4xl">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-bold text-lg">💼 Job Listings</h3>
                        {currentProfile && (
                          <Button
                            onClick={() => setShowJobListModal(true)}
                            size="sm"
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            List New Job
                          </Button>
                        )}
                      </div>

                      {msg.jobsData.length === 0 ? (
                        <p className="text-gray-400 text-sm">No active job listings</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.jobsData.map((job) => {
                          const posterProfile = job.poster_profile;

                          return (
                            <Card key={job.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                              <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="text-white font-bold mb-1">{job.title}</h4>
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                                      {job.department}
                                    </Badge>
                                    <Badge className="bg-cyan-500/20 text-cyan-300 text-xs">
                                      {job.employment_type}
                                    </Badge>
                                    {job.is_remote && (
                                      <Badge className="bg-green-500/20 text-green-300 text-xs">Remote</Badge>
                                    )}
                                    <Badge className="bg-white/10 text-gray-300 text-xs">
                                      {job.applications_count || 0} applicants
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {posterProfile && (
                                <div className="mb-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg border border-cyan-500/50 overflow-hidden flex-shrink-0">
                                      {posterProfile.agent_zk_photo ? (
                                        <img src={posterProfile.agent_zk_photo} alt={posterProfile.username} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                          <Shield className="w-4 h-4 text-cyan-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs text-gray-400">Posted by</div>
                                      <div className="text-sm font-semibold text-cyan-400 truncate">
                                        {posterProfile.username || job.posted_by_username}
                                      </div>
                                      {posterProfile.agent_zk_id && (
                                        <code className="text-xs text-gray-500 font-mono">{posterProfile.agent_zk_id}</code>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="text-sm text-gray-300 mb-3 space-y-1">
                                <p>📍 {job.location}</p>
                                <p>💰 ${job.salary_range_min?.toLocaleString()} - ${job.salary_range_max?.toLocaleString()}</p>
                              </div>

                              {job.skills && job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {job.skills.slice(0, 5).map((skill, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-black/40 border border-white/10 rounded text-gray-400">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => setSelectedJob(job)}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                                >
                                  View Details
                                </Button>
                                {job.posted_by_wallet && (
                                  <Button
                                    onClick={() => {
                                      const name = posterProfile?.username || job.posted_by_username || 'Employer';
                                      navigate(createPageUrl('AgentZKChat') + `?targetAddress=${encodeURIComponent(job.posted_by_wallet)}&targetName=${encodeURIComponent(name)}`);
                                    }}
                                    size="sm"
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                                  >
                                    Connect
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                            </Card>
                            );
                            })}
                            </div>
                            )}
                            </div>
                ) : (
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'bg-white/10 border border-white/10 text-gray-200'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                )}
                {msg.created_date && !msg.isJobsMessage && (
                  <div className={`flex mt-1 px-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-gray-600">
                      {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </motion.div>
          ))
        )}
        
        {isSending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-end"
          >
            <div className="rounded-2xl px-4 py-3 bg-gradient-to-r from-cyan-500/50 to-blue-500/50">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Search Dropdown */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            ref={searchRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 left-4 right-4 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden z-[60] max-w-2xl mx-auto"
          >
            <div className="p-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search NFTs, items, pages..."
                  autoFocus
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-600 text-sm focus:outline-none"
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filteredResults.length > 0 && (
              <div className="max-h-[50vh] overflow-y-auto scrollbar-hide">
                <div className="p-2 space-y-1">
                  {filteredResults.map((result, index) => {
                    if (result.type === 'page') {
                      return (
                        <button
                          key={`page-${result.path}`}
                          onClick={() => handleSearchItemClick(result)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center text-xl">
                            {result.icon}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold text-sm">{result.name}</div>
                            <div className="text-gray-400 text-xs">{result.description}</div>
                          </div>
                        </button>
                      );
                    } else if (result.type === 'nft') {
                      const rarity = getNFTRarity(result);
                      const rarityStyle = rarityColors[rarity] || rarityColors.common;
                      
                      return (
                        <button
                          key={`nft-${result.id}`}
                          onClick={() => handleSearchItemClick(result)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg bg-gradient-to-br ${rarityStyle.bg} border ${rarityStyle.border} hover:border-white/50 transition-all`}
                        >
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={result.images?.[0]}
                              alt={result.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-bold text-white">
                              {rarity.toUpperCase()}
                            </div>
                            <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-green-400" />
                          </div>
                          
                          <div className="flex-1 text-left min-w-0">
                            <div className="text-white font-bold text-xs truncate">{result.title}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Diamond className="w-3 h-3 text-purple-400" />
                              <span className="text-purple-400 font-bold text-xs">{result.price_kas} ZEKU</span>
                            </div>
                            <div className="text-gray-400 text-[10px] truncate">{result.seller_username}</div>
                          </div>

                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0">
                            <ShoppingCart className="w-3 h-3 text-white" />
                            <span className="text-white text-[10px] font-bold">BUY</span>
                          </div>
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deep Search Modal */}
      <AnimatePresence>
        {showDeepSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => !isDeepSearching && setShowDeepSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <FileSearch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Deep Search</h3>
                  <p className="text-gray-400 text-xs">AI-powered file analysis</p>
                </div>
              </div>

              {!deepSearchFile ? (
                <div
                  onClick={() => deepSearchInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-white font-semibold mb-1">Drop file or click to upload</p>
                  <p className="text-gray-400 text-xs">PDF, images, documents, spreadsheets</p>
                  <input
                    ref={deepSearchInputRef}
                    type="file"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setIsUploading(true);
                        try {
                          const response = await base44.integrations.Core.UploadFile({ file });
                          setDeepSearchFile({
                            name: file.name,
                            url: response.file_url,
                            type: file.type
                          });
                        } catch (err) {
                          console.error("Upload failed:", err);
                        } finally {
                          setIsUploading(false);
                        }
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.csv,.xlsx"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FileSearch className="w-8 h-8 text-purple-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{deepSearchFile.name}</div>
                        <div className="text-gray-400 text-xs">Ready for analysis</div>
                      </div>
                      <button
                        onClick={() => setDeepSearchFile(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleDeepSearch}
                    disabled={isDeepSearching}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
                  >
                    {isDeepSearching ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Start Deep Search
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isUploading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/50 backdrop-blur-xl p-4 z-20">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type message..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[60px] max-h-[120px] resize-none"
            disabled={isSending}
            rows={2}
          />

          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isSending}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-[60px] px-6"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* List New Job Modal */}
      <AnimatePresence>
        {showJobListModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
            onClick={() => !isGeneratingJob && setShowJobListModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-purple-500/30 rounded-xl p-6 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-xl flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-purple-400" />
                  List New Job
                </h3>
                <Button
                  onClick={() => setShowJobListModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-gray-400 text-sm mb-4">Describe the job you want to post</p>

              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Example: Senior Blockchain Engineer for DeFi platform. Remote, $150k-200k, need Solidity experience..."
                className="bg-black border-white/10 text-white h-32 mb-4"
                disabled={isGeneratingJob}
                />

              <Button
                onClick={handleGenerateJob}
                disabled={isGeneratingJob || !jobDescription.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
              >
                {isGeneratingJob ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Job Listing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Job Listing with AI
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Details Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedJob.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-500/20 text-purple-300">{selectedJob.department}</Badge>
                    <Badge className="bg-cyan-500/20 text-cyan-300">{selectedJob.employment_type}</Badge>
                    {selectedJob.is_remote && <Badge className="bg-green-500/20 text-green-300">Remote</Badge>}
                  </div>
                </div>
                <Button onClick={() => setSelectedJob(null)} variant="ghost" size="sm">
                  <X className="w-5 h-5 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Location</div>
                    <div className="text-white font-semibold">📍 {selectedJob.location}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Salary Range</div>
                    <div className="text-white font-semibold">
                      💰 ${selectedJob.salary_range_min?.toLocaleString()} - ${selectedJob.salary_range_max?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Posted by</div>
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">👤 {selectedJob.posted_by_username}</div>
                    {selectedJob.posted_by_wallet && (
                      <Button
                        onClick={() => {
                          setSelectedJob(null);
                          navigate(createPageUrl('AgentZKChat') + `?targetAddress=${encodeURIComponent(selectedJob.posted_by_wallet)}&targetName=${encodeURIComponent(selectedJob.posted_by_username)}`);
                        }}
                        size="sm"
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        Message Employer
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Description</div>
                  <p className="text-white leading-relaxed">{selectedJob.description}</p>
                </div>

                {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Responsibilities</div>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedJob.responsibilities.map((resp, idx) => (
                        <li key={idx} className="text-white text-sm">{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Requirements</div>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedJob.requirements.map((req, idx) => (
                        <li key={idx} className="text-white text-sm">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Required Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map((skill, idx) => (
                        <Badge key={idx} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}