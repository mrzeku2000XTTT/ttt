import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Wallet, Copy, Check, Send, ArrowRight, ArrowLeft, X, Pencil, ExternalLink, ChevronDown, ChevronUp, Upload, Bot, Link as LinkIcon, MessageSquare, Briefcase, Loader2, Zap, Globe, Clock, Star, ChevronRight, Sparkles } from "lucide-react";

const BG_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/df3ad1026_generated_image.png";

// Preset Kaspa anime avatars
const PRESET_AVATARS = [
  { id: "destroyer", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3b1e6b952_generated_image.png", label: "Destroyer" },
  { id: "esp", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/39ee5b58e_generated_image.png", label: "ESP" },
  { id: "professor", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0094b4662_generated_image.png", label: "Professor" },
  { id: "king", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/020cd962c_generated_image.png", label: "King" },
  { id: "builder", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1516cfcca_generated_image.png", label: "Builder" },
  { id: "warrior", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2e6837d45_generated_image.png", label: "Warrior" },
  { id: "phantom", url: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/aaefa5272_generated_image.png", label: "Phantom" },
];

// Per-username hardcoded avatars
const USERNAME_AVATARS = {
  destroyer: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3b1e6b952_generated_image.png",
  esp: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/39ee5b58e_generated_image.png",
  professor: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0094b4662_generated_image.png",
  ayomuiz: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/020cd962c_generated_image.png",
};

function getAvatarUrl(user) {
  if (user.avatar_url) return user.avatar_url;
  const n = user.username?.toLowerCase().trim().replace(/\s+/g, "");
  if (n && USERNAME_AVATARS[n]) return USERNAME_AVATARS[n];
  // Deterministic preset by username hash
  if (n) {
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = ((hash << 5) - hash) + n.charCodeAt(i);
    return PRESET_AVATARS[Math.abs(hash) % PRESET_AVATARS.length].url;
  }
  return PRESET_AVATARS[0].url;
}

export default function TipPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tipAmount, setTipAmount] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editWallet, setEditWallet] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editProjectSite, setEditProjectSite] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editTiptree, setEditTiptree] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editAgentName, setEditAgentName] = useState("");
  const [editAgentPersona, setEditAgentPersona] = useState("");
  const [editAgentSkills, setEditAgentSkills] = useState("");
  const [editAgentRate, setEditAgentRate] = useState("");
  const [editAgentAvailability, setEditAgentAvailability] = useState("available");

  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [tttWalletBalance, setTttWalletBalance] = useState(null);
  const [sendPin, setSendPin] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editTab, setEditTab] = useState("profile"); // profile | avatar | agent
  const fileInputRef = useRef(null);

  // Jobs board modal
  const [showJobsBoard, setShowJobsBoard] = useState(false);
  const [jobsForAgent, setJobsForAgent] = useState(null); // if set, filter by agent
  const [allJobs, setAllJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  // Chat modal
  const [chatUser, setChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  // Hire-via-chat flow
  const [hireFlow, setHireFlow] = useState(null); // null | { step, answers }
  const [broadcastingJob, setBroadcastingJob] = useState(false);
  const [broadcastedJob, setBroadcastedJob] = useState(null);

  useEffect(() => {
    loadCurrentUser(); // loadCurrentUser already calls loadUsers(user) with fresh data
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) { setFilteredUsers(users); return; }
    // Support multi-term: "krc20 design" matches both skills
    const terms = q.split(/\s+/);
    setFilteredUsers(users.filter(u => {
      const haystack = [
        u.username, u.email,
        u.created_wallet_address,
        u.project_tagline,
        u.agent_name,
        u.agent_persona,
        u.agent_skills,
        u.agent_availability,
        u.github_url,
        u.project_site,
      ].filter(Boolean).join(" ").toLowerCase();
      return terms.every(t => haystack.includes(t));
    }));
  }, [searchQuery, users]);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const addr = localStorage.getItem('ttt_wallet_address') || user?.created_wallet_address;
      if (addr) loadTttBalance(addr);
      // Pass fresh user directly so loadUsers doesn't rely on stale state
      loadUsers(user);
    } catch { setCurrentUser(null); }
  };

  const loadTttBalance = async (addr) => {
    try {
      const r = await base44.functions.invoke("getKaspaBalance", { address: addr });
      const bal = r.data?.balanceKAS ?? r.data?.balance;
      if (typeof bal === 'number') setTttWalletBalance(bal);
    } catch {}
  };

  const loadUsers = async (freshUser = null) => {
    try {
      setLoading(true);
      const activeUser = freshUser || currentUser;
      const allPosts = await base44.entities.Post.list("-created_date");
      const map = new Map();
      allPosts.forEach(post => {
        if ((post.author_wallet_address || post.author_agent_zk_id) && post.author_name) {
          const key = post.author_wallet_address || post.author_agent_zk_id;
          if (!map.has(key)) map.set(key, {
            id: post.id, username: post.author_name, email: post.created_by,
            created_wallet_address: post.author_wallet_address,
            agent_zk_id: post.author_agent_zk_id, role: post.author_role || "user",
            created_date: post.created_date,
            avatar_url: post.author_avatar_url || null,
          });
        }
      });
      const allUsers = Array.from(map.values());

      const hardcoded = [
        { id: "destroyer_hc", username: "destroyer", email: "destroyer@ttt.com", created_wallet_address: "kaspa:qpx0pwgksy0g7hzeqyajn9r3tavz2ga07v3p4kuptqgcnp7l6j2m5jp85jdf6", role: "admin", endsWith: "jdf6" },
        { id: "esp_hc", username: "ESP", email: "esp@ttt.com", created_wallet_address: "kaspa:qruat45zkdtuznry8gahmgp7yw78fnelx29wvn0p5cl9slep7x3l553cugx9h", role: "user", endsWith: "gx9h" },
        { id: "olatomiwa2_hc", username: "olatomiwa2", email: "olatomiwa2@ttt.com", created_wallet_address: "kaspa:qpe6jqvzhyhqqphy2c6n047zzlrnrng20fpy2nkm4y54gdd979t279ld96ppj", role: "user", endsWith: "6ppj" },
        { id: "kehindeayo2_hc", username: "kehindeayo2", email: "kehindeayo2@ttt.com", created_wallet_address: "kaspa:qpjf44x584fw7getwqjfnp0pvy7lwkr8l0pxatxc6jh7elwpvdmhu5h9p3nuh", role: "user", endsWith: "3nuh" },
      ];
      hardcoded.forEach(h => {
        if (!allUsers.some(u => u.created_wallet_address?.toLowerCase().endsWith(h.endsWith))) allUsers.push(h);
      });

      if (activeUser?.created_wallet_address) {
        const idx = allUsers.findIndex(u => u.email === activeUser.email);
        if (idx !== -1) allUsers.splice(idx, 1);
        allUsers.unshift({
          id: activeUser.id || "current",
          username: activeUser.username || activeUser.full_name || activeUser.email?.split("@")[0],
          email: activeUser.email,
          created_wallet_address: activeUser.created_wallet_address,
          role: activeUser.role || "user",
          project_tagline: activeUser.project_tagline,
          project_site: activeUser.project_site,
          github_url: activeUser.github_url,
          tiptree_url: activeUser.tiptree_url,
          avatar_url: activeUser.avatar_url,
          agent_name: activeUser.agent_name,
          agent_persona: activeUser.agent_persona,
        });
      }

      const filtered = allUsers.filter(u => {
        if (!u.created_wallet_address && !u.agent_zk_id) return false;
        if (u.username?.toLowerCase() === "olatomiwa" && u.created_wallet_address?.toLowerCase().endsWith("x82")) return false;
        if (u.username?.toLowerCase() === "ttt") {
          const addr = (u.created_wallet_address || u.agent_zk_id || "").toLowerCase();
          return ["vru","feq","kq3","cvru"].some(e => addr.endsWith(e));
        }
        if (u.username?.toLowerCase() === "esp") return (u.created_wallet_address || "").toLowerCase().endsWith("gx9h");
        if (u.username?.toLowerCase() === "destroyer") return (u.created_wallet_address || "").toLowerCase().endsWith("jdf6");
        return true;
      });

      const allBadges = await base44.entities.UserBadge.filter({ is_active: true });
      const badgesMap = {};
      allBadges.forEach(b => { if (!badgesMap[b.username]) badgesMap[b.username] = []; badgesMap[b.username].push(b); });

      filtered.sort((a, b) => {
        const aIsCur = activeUser && a.email === activeUser.email;
        const bIsCur = activeUser && b.email === activeUser.email;
        if (aIsCur && !bIsCur) return -1; if (!aIsCur && bIsCur) return 1;
        const aIsD = a.username?.toLowerCase() === "destroyer"; const bIsD = b.username?.toLowerCase() === "destroyer";
        if (aIsD && !bIsD) return -1; if (!aIsD && bIsD) return 1;
        const aIsT = a.username?.toLowerCase() === "ttt"; const bIsT = b.username?.toLowerCase() === "ttt";
        if (aIsT && !bIsT) return -1; if (!aIsT && bIsT) return 1;
        const pri = ["esp", "zeku"];
        const aP = pri.some(p => a.username?.toLowerCase().includes(p));
        const bP = pri.some(p => b.username?.toLowerCase().includes(p));
        if (aP && !bP) return -1; if (!aP && bP) return 1;
        return (badgesMap[b.username]?.length || 0) - (badgesMap[a.username]?.length || 0);
      });

      setUsers(filtered); setFilteredUsers(filtered);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCopyAddress = (address, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(""), 2000);
  };

  const openEditProfile = (e) => {
    e?.stopPropagation();
    setEditName(currentUser?.username || currentUser?.full_name || "");
    setEditWallet(currentUser?.created_wallet_address || "");
    setEditProject(currentUser?.project_tagline || "");
    setEditProjectSite(currentUser?.project_site || "");
    setEditGithub(currentUser?.github_url || "");
    setEditTiptree(currentUser?.tiptree_url || "");
    setEditAvatarUrl(currentUser?.avatar_url || "");
    setEditAgentName(currentUser?.agent_name || "");
    setEditAgentPersona(currentUser?.agent_persona || "");
    setEditAgentSkills(currentUser?.agent_skills || "");
    setEditAgentRate(currentUser?.agent_rate_kas || "");
    setEditAgentAvailability(currentUser?.agent_availability || "available");
    setEditTab("profile");
    setShowEditProfile(true);
  };

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const r = await base44.integrations.Core.UploadFile({ file });
      if (r?.file_url) setEditAvatarUrl(r.file_url);
    } catch (err) { console.error(err); }
    finally { setUploadingAvatar(false); }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await base44.auth.updateMe({
        username: editName.trim(),
        created_wallet_address: editWallet.trim(),
        project_tagline: editProject.trim(),
        project_site: editProjectSite.trim(),
        github_url: editGithub.trim(),
        tiptree_url: editTiptree.trim(),
        avatar_url: editAvatarUrl.trim(),
        agent_name: editAgentName.trim(),
        agent_persona: editAgentPersona.trim(),
        agent_skills: editAgentSkills.trim(),
        agent_rate_kas: editAgentRate.trim(),
        agent_availability: editAgentAvailability,
      });
      const updated = await base44.auth.me();
      setCurrentUser(updated);
      setShowEditProfile(false);

      // Immediately patch local list so the banner & row reflect the change right away
      const patchUser = (u) => u.email === updated.email ? {
        ...u,
        username: updated.username || u.username,
        created_wallet_address: updated.created_wallet_address || u.created_wallet_address,
        project_tagline: updated.project_tagline,
        project_site: updated.project_site,
        github_url: updated.github_url,
        tiptree_url: updated.tiptree_url,
        avatar_url: updated.avatar_url,
        agent_name: updated.agent_name,
        agent_persona: updated.agent_persona,
        agent_skills: updated.agent_skills,
        agent_rate_kas: updated.agent_rate_kas,
        agent_availability: updated.agent_availability,
      } : u;
      setUsers(prev => prev.map(patchUser));
      setFilteredUsers(prev => prev.map(patchUser));

      // Then do a full reload in the background to sync with other users
      loadUsers(updated);
    } catch {} finally { setSavingProfile(false); }
  };

  const handleKaswareTip = async () => {
    if (!selectedUser || !tipAmount) return;
    if (typeof window.kasware === "undefined") { alert("Kasware wallet not detected."); return; }
    try {
      const address = selectedUser.created_wallet_address || selectedUser.agent_zk_id;
      const sompi = Math.floor(parseFloat(tipAmount) * 100000000);
      const txr = await window.kasware.sendKaspa(address, sompi);
      let txid;
      if (typeof txr === "string") { try { txid = JSON.parse(txr).id; } catch { txid = txr; } }
      else if (txr?.id) txid = txr.id;
      if (!txid || !/^[a-f0-9]{64}$/i.test(txid)) throw new Error("Invalid tx ID");
      alert(`✅ Sent ${tipAmount} KAS to ${selectedUser.username}!`);
      setSelectedUser(null); setTipAmount("");
    } catch (e) { alert(`Failed: ${e.message}`); }
  };

  const handleTttWalletSend = async () => {
    const storedPK = localStorage.getItem('ttt_wallet_pk');
    const storedPinHash = localStorage.getItem('ttt_wallet_pin_hash') || currentUser?.wallet_pin_hash;
    if (!storedPK) { alert("No TTT wallet found. Please set up your wallet first at /Wallet."); return; }
    if (!storedPinHash) { alert("Set your 6-digit wallet PIN at /Wallet first."); return; }
    if (sendPin.length !== 6) { alert("Enter your 6-digit wallet PIN."); return; }
    if (!tipAmount || parseFloat(tipAmount) <= 0) { alert("Enter a valid amount."); return; }
    const fromAddress = localStorage.getItem('ttt_wallet_address') || currentUser?.created_wallet_address;
    const toAddress = selectedUser?.created_wallet_address || selectedUser?.agent_zk_id;
    if (!fromAddress || !toAddress) { alert("Wallet addresses missing."); return; }
    setIsSending(true);
    setSendSuccess(null);
    try {
      const pinRes = await base44.functions.invoke('hashPin', { pin: sendPin });
      if (pinRes.data?.hash !== storedPinHash) throw new Error('Incorrect PIN');
      const res = await base44.functions.invoke('sendKaspaTransaction', {
        privateKey: storedPK,
        fromAddress,
        toAddress,
        amountKas: parseFloat(tipAmount),
      });
      if (res.data?.error) throw new Error(res.data.error);
      setSendSuccess(`✅ Sent ${tipAmount} KAS to ${selectedUser.username}! TX: ${String(res.data.txId || '').slice(0, 16)}...`);
      setSendPin("");
      setTimeout(() => { setSelectedUser(null); setTipAmount(""); setSendSuccess(null); loadTttBalance(fromAddress); }, 3000);
    } catch (e) {
      alert(`Send failed: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const HIRE_QUESTIONS = [
    { id: "what", q: "What do you need done?", options: ["Design work", "Content writing", "Code / dev", "Marketing", "Research", "Other"] },
    { id: "deliverable", q: "What's the expected deliverable?", options: ["Image / graphic", "Video", "Written content", "Code / app", "PDF report", "Other"] },
    { id: "budget", q: "What's your budget range?", options: ["Under 500 KAS", "500–2000 KAS", "2000–5000 KAS", "5000+ KAS", "Open to negotiation"] },
    { id: "timeline", q: "When do you need it?", options: ["ASAP (24–48h)", "This week", "2 weeks", "This month", "Flexible"] },
  ];

  const openJobsBoard = async (e, user = null) => {
    e?.stopPropagation();
    setJobsForAgent(user);
    setShowJobsBoard(true);
    setJobSearch("");
    setSelectedJob(null);
    setLoadingJobs(true);
    try {
      const jobs = await base44.entities.JobRequest.list("-created_date", 50);
      setAllJobs(jobs);
    } catch { setAllJobs([]); }
    finally { setLoadingJobs(false); }
  };

  const openChat = (e, user) => {
    e.stopPropagation();
    setChatUser(user);
    setHireFlow(null);
    setBroadcastedJob(null);
    const agentN = user.agent_name || user.username;
    const persona = user.agent_persona || `I am ${agentN}, an AI agent on TTT.`;
    setChatMessages([{
      role: "assistant",
      content: `👋 Hey! I'm **${agentN}**.\n\n${persona}\n\nHow can I help you today?`,
      type: "text"
    }]);
    setChatInput("");
  };

  const startHireFlow = () => {
    const agentN = chatUser?.agent_name || chatUser?.username;
    setHireFlow({ step: 0, answers: {} });
    setChatMessages(prev => [...prev,
      { role: "user", content: "I want to hire you", type: "text" },
      { role: "assistant", content: `Great! Let me put together your job brief. I'll ask you 4 quick questions then you can optionally share a project link. 🚀\n\n**${HIRE_QUESTIONS[0].q}**`, type: "quickreply", options: HIRE_QUESTIONS[0].options, step: 0 }
    ]);
  };

  const handleQuickReply = async (option, step) => {
    if (!hireFlow || hireFlow.step !== step) return;
    const qKey = HIRE_QUESTIONS[step].id;
    const newAnswers = { ...hireFlow.answers, [qKey]: option };
    const nextStep = step + 1;

    setChatMessages(prev => prev.map((m, i) =>
      i === prev.length - 1 ? { ...m, type: "text" } : m
    ));
    setChatMessages(prev => [...prev, { role: "user", content: option, type: "text" }]);

    if (nextStep < HIRE_QUESTIONS.length) {
      setHireFlow({ step: nextStep, answers: newAnswers });
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          content: `Got it! **${HIRE_QUESTIONS[nextStep].q}**`,
          type: "quickreply",
          options: HIRE_QUESTIONS[nextStep].options,
          step: nextStep
        }]);
      }, 400);
    } else {
      // All 4 answered — ask for URL (step 4)
      setHireFlow({ step: 4, answers: newAnswers });
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          content: `Almost done! Do you have a project link or reference URL? (Optional — paste it below or tap Skip)`,
          type: "url_input",
          step: 4
        }]);
      }, 400);
    }
  };

  const handleAcceptJob = async (job) => {
    // Find the agent who posted this job
    const agent = users.find(u => u.email === job.hirer_email);
    if (!agent) {
      alert("Could not find the job poster");
      return;
    }
    // Update job status
    try {
      await base44.entities.JobRequest.update(job.id, { status: "in_progress" });
      setAllJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "in_progress" } : j));
    } catch (err) {
      console.error("Failed to update job status:", err);
    }
    // Redirect to chat with the agent
    setShowJobsBoard(false);
    setSelectedJob(null);
    openChat(null, agent);
    // Add a system message about the accepted job
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: `🎉 Great! I've accepted the job **"${job.title}"**.\n\nBudget: **${job.budget_kas?.toLocaleString()} KAS** (${job.timeline})\n\nLet's discuss the details and get started!`,
        type: "text"
      }]);
    }, 500);
  };

  const handleUrlSubmit = async (url) => {
    const answers = hireFlow?.answers || {};
    const agentN = chatUser?.agent_name || chatUser?.username;
    setChatMessages(prev => [
      ...prev.map((m, i) => i === prev.length - 1 ? { ...m, type: "text" } : m),
      { role: "user", content: url || "No link", type: "text" }
    ]);
    setHireFlow({ step: 5, answers: { ...answers, url } });
    setBroadcastingJob(true);

    // Show thinking animation
    setChatMessages(prev => [...prev, {
      role: "assistant", content: "", type: "thinking"
    }]);

    try {
      // Generate job ID and KAS address (use a fake but plausible truncated kaspa addr)
      const jobNum = Math.floor(Math.random() * 90000 + 10000);
      const jobId = `JOB-${jobNum}`;
      const addrSuffix = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      const jobWallet = `kaspa:q${addrSuffix}${Math.random().toString(36).slice(2, 8)}`;

      // AI structures the job
      const jobData = await base44.integrations.Core.InvokeLLM({
        prompt: `Structure a job posting for a Kaspa blockchain agent marketplace.
Agent: ${agentN}
Skills: ${chatUser?.agent_skills || "General"}
Rate: ${chatUser?.agent_rate_kas || "500"} KAS/hr

User answered:
- What: ${answers.what}
- Deliverable: ${answers.deliverable}
- Budget: ${answers.budget}
- Timeline: ${answers.timeline}
- Project URL: ${url || "none"}

Return JSON with:
- title: concise job title (max 8 words)
- description: 2-3 sentence job description
- skills_needed: comma-separated skills
- budget_kas: number estimate based on budget range
- usd_estimate: USD estimate (assume 0.12 per KAS)`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            skills_needed: { type: "string" },
            budget_kas: { type: "number" },
            usd_estimate: { type: "number" }
          }
        }
      });

      // Save to JobRequest entity
      const job = await base44.entities.JobRequest.create({
        job_id: jobId,
        job_wallet: jobWallet,
        title: jobData.title,
        description: jobData.description,
        deliverable: answers.deliverable,
        budget_type: "fixed",
        budget_kas: jobData.budget_kas,
        timeline: answers.timeline,
        project_url: url || "",
        skills_needed: jobData.skills_needed,
        hirer_email: currentUser?.email || "anonymous",
        hirer_username: currentUser?.username || currentUser?.full_name || "Anonymous",
        hirer_wallet: currentUser?.created_wallet_address || "",
        target_agent_email: chatUser?.email || "",
        target_agent_name: agentN,
        status: "open",
        kas_price_at_time: 0.12,
        usd_estimate: jobData.usd_estimate,
      });

      setBroadcastedJob({ ...job, ...jobData, job_id: jobId, job_wallet: jobWallet });
      setAllJobs(prev => [{ ...job, ...jobData, job_id: jobId, job_wallet: jobWallet }, ...prev]);

      // Replace thinking bubble with broadcast result
      setChatMessages(prev => [
        ...prev.filter(m => m.type !== "thinking"),
        {
          role: "assistant",
          content: jobData.title,
          type: "job_broadcast",
          job: { ...job, ...jobData, job_id: jobId, job_wallet: jobWallet }
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev.filter(m => m.type !== "thinking"),
        { role: "assistant", content: "Sorry, I couldn't broadcast the job. Please try again.", type: "text" }
      ]);
    } finally {
      setBroadcastingJob(false);
      setHireFlow(null);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    // If in hire flow, treat input as answer to current question
    if (hireFlow && hireFlow.step < 5) {
      const userMsg = chatInput.trim();
      setChatInput("");
      setChatMessages(prev => [...prev, { role: "user", content: userMsg, type: "text" }]);
      
      const qKey = HIRE_QUESTIONS[hireFlow.step].id;
      const newAnswers = { ...hireFlow.answers, [qKey]: userMsg };
      const nextStep = hireFlow.step + 1;
      
      if (nextStep < HIRE_QUESTIONS.length) {
        setHireFlow({ step: nextStep, answers: newAnswers });
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            role: "assistant",
            content: `Got it! **${HIRE_QUESTIONS[nextStep].q}**`,
            type: "quickreply",
            options: HIRE_QUESTIONS[nextStep].options,
            step: nextStep
          }]);
        }, 400);
      } else {
        // Ask for URL
        setHireFlow({ step: 4, answers: newAnswers });
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            role: "assistant",
            content: `Almost done! Do you have a project link or reference URL? (Optional — paste it below or tap Skip)`,
            type: "url_input",
            step: 4
          }]);
        }, 400);
      }
      return;
    }
    
    // Normal chat message
    const userMsg = chatInput.trim();
    setChatInput("");
    const newMsgs = [...chatMessages, { role: "user", content: userMsg, type: "text" }];
    setChatMessages(newMsgs);
    setChatLoading(true);
    try {
      const agentN = chatUser?.agent_name || chatUser?.username;
      const persona = chatUser?.agent_persona || "";
      const skills = chatUser?.agent_skills || "";
      const rate = chatUser?.agent_rate_kas || "";
      const history = newMsgs.slice(-8).map(m => `${m.role === "user" ? "User" : agentN}: ${m.content}`).join("\n");
      const reply = await base44.integrations.Core.InvokeLLM({
        prompt: `You are ${agentN}, a professional agent on TTT (Kaspa ecosystem).
Persona: ${persona}
Skills: ${skills}
Rate: ${rate} KAS/hr

Conversation:
${history}

Reply helpfully as ${agentN}. Keep it concise. If user wants to hire, encourage them to tap the Hire button in chat.`,
      });
      setChatMessages(prev => [...prev, { role: "assistant", content: reply, type: "text" }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an issue.", type: "text" }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const getBadges = (user) => {
    const n = user.username?.toLowerCase().trim().replace(/\s+/g, "");
    const a = (user.created_wallet_address || "").toLowerCase();
    const badges = [];
    if (n === "destroyer") badges.push(<span key="death" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#dc2626,#000)" }}>DEATH</span>);
    if (n === "esp") badges.push(<span key="god" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#eab308,#ea580c)" }}>GOD</span>);
    if (n === "ttt") badges.push(<span key="zeku" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#06b6d4,#8b5cf6)" }}>ZEKU</span>);
    if (n === "hayphase") badges.push(<span key="pov" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#34d399,#0d9488)" }}>👁️ POV</span>);
    if (n === "olatomiwa" && a.endsWith("du4")) badges.push(<span key="fl" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(90deg,#3b82f6,#7c3aed)" }}>FIRSTLADY</span>);
    if (n === "ayomuiz" && a.endsWith("ygt")) badges.push(<span key="king" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-black" style={{ background: "linear-gradient(90deg,#fbbf24,#ea580c)" }}>👑 KING</span>);
    if (n === "peculiar" && a.endsWith("x20")) badges.push(<span key="knight" className="px-1.5 py-0.5 rounded text-[9px] font-bold text-black" style={{ background: "linear-gradient(90deg,#94a3b8,#64748b)" }}>⚔️ KNIGHT</span>);
    return badges;
  };

  const toggleRow = (userId) => {
    setExpandedRow(prev => prev === userId ? null : userId);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#010a1a" }}>
      {/* BG image */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35 }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(1,10,26,0.5) 0%, rgba(1,10,26,0.2) 40%, rgba(1,10,26,0.7) 100%)" }} />

      <div className="relative z-10 px-4 sm:px-6 max-w-2xl mx-auto" style={{ paddingTop: "4rem", paddingBottom: "6rem" }}>

        {/* Back button */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(0,40,120,0.3)", border: "1px solid rgba(0,100,200,0.25)", color: "rgba(96,165,250,0.7)" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(0,40,120,0.3)", border: "1px solid rgba(0,100,200,0.25)", color: "rgba(96,165,250,0.7)" }}>
            Home
          </button>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          {/* Badge - no icon */}
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase"
            style={{ background: "rgba(0,100,255,0.12)", border: "1px solid rgba(0,150,255,0.3)", color: "#60a5fa" }}>
            Instant KAS Tips
          </div>

          {/* TapToTip with heavy shader */}
          <h1 className="font-black mb-3 leading-none select-none" style={{
            fontSize: "clamp(3.5rem,12vw,6rem)",
            fontFamily: "'Arial Black', 'Impact', system-ui, sans-serif",
            background: "linear-gradient(180deg, #ffffff 0%, #7dd3fc 30%, #3b82f6 60%, #1d4ed8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "none",
            letterSpacing: "-0.03em",
          }}>
            TapToTip
          </h1>
          <p className="text-white/40 text-sm tracking-wide">Send KAS to anyone, instantly</p>
        </motion.div>

        {/* Status banner */}
        {!currentUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 p-4 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(0,30,80,0.7)", border: "1px solid rgba(0,100,200,0.35)", backdropFilter: "blur(12px)" }}>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Want to receive KAS tips?</p>
              <p className="text-white/40 text-xs mt-0.5">Sign in and add your Kaspa address</p>
            </div>
            <button onClick={() => base44.auth.redirectToLogin()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(0,100,255,0.8)", border: "1px solid rgba(0,150,255,0.5)" }}>
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {currentUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 p-4 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(0,30,80,0.7)", border: "1px solid rgba(0,100,200,0.35)", backdropFilter: "blur(12px)" }}>
            {/* Mini avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2"
              style={{ borderColor: "rgba(0,150,255,0.5)", boxShadow: "0 0 12px rgba(0,100,255,0.4)" }}>
              <img src={getAvatarUrl(currentUser)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{currentUser.created_wallet_address ? "Your address is live" : "Add your wallet to receive tips"}</p>
              {currentUser.created_wallet_address && (
                <p className="text-blue-400/40 text-xs font-mono truncate mt-0.5">{currentUser.created_wallet_address.slice(0,20)}...{currentUser.created_wallet_address.slice(-8)}</p>
              )}
            </div>
            <button onClick={openEditProfile}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-300 transition-all hover:opacity-80"
              style={{ background: "rgba(0,100,255,0.2)", border: "1px solid rgba(0,150,255,0.3)" }}>
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </motion.div>
        )}

        {/* Search */}
        <div className="mb-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(96,165,250,0.4)" }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, skill, project, agent… e.g. 'KRC-20 design'"
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white outline-none"
            style={{ background: "rgba(0,25,70,0.6)", border: "1px solid rgba(0,100,200,0.25)", backdropFilter: "blur(12px)" }}
          />
        </div>
        {/* Quick skill filters */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {["KRC-20","DeFi","Design","Code","Trading","Available"].map(tag => (
            <button key={tag} onClick={() => setSearchQuery(q => q === tag.toLowerCase() ? "" : tag.toLowerCase())}
              className="text-[10px] px-2.5 py-1 rounded-full font-bold transition-all hover:opacity-80"
              style={{
                background: searchQuery === tag.toLowerCase() ? "rgba(139,92,246,0.4)" : "rgba(0,60,160,0.2)",
                border: `1px solid ${searchQuery === tag.toLowerCase() ? "rgba(139,92,246,0.6)" : "rgba(0,100,200,0.25)"}`,
                color: searchQuery === tag.toLowerCase() ? "#c4b5fd" : "rgba(96,165,250,0.6)",
              }}>
              {tag}
            </button>
          ))}
        </div>

        {/* Directory list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "2px solid rgba(0,100,255,0.2)", borderTop: "2px solid #3b82f6" }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-blue-400/40 font-semibold">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user, i) => {
              const address = user.created_wallet_address || user.agent_zk_id;
              const isCopied = copiedAddress === address;
              const isCur = currentUser && user.email === currentUser.email;
              const isExpanded = expandedRow === user.id;
              const rank = i + 1;
              const badges = getBadges(user);
              const projectTagline = user.project_tagline || (isCur && currentUser?.project_tagline) || null;
              const projectSite = user.project_site || (isCur && currentUser?.project_site) || null;
              const githubUrl = user.github_url || (isCur && currentUser?.github_url) || null;
              const tiptreeUrl = user.tiptree_url || (isCur && currentUser?.tiptree_url) || null;
              const agentName = user.agent_name || (isCur && currentUser?.agent_name) || null;
              const agentSkills = user.agent_skills || (isCur && currentUser?.agent_skills) || null;
              const agentRate = user.agent_rate_kas || (isCur && currentUser?.agent_rate_kas) || null;
              const agentAvailability = user.agent_availability || (isCur && currentUser?.agent_availability) || null;
              const avatarUrl = getAvatarUrl(isCur ? { ...user, avatar_url: currentUser?.avatar_url || user.avatar_url } : user);

              return (
                <motion.div key={user.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <div
                    onClick={() => toggleRow(user.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: isExpanded ? "rgba(0,60,160,0.3)" : isCur ? "rgba(0,50,130,0.22)" : "rgba(0,25,70,0.5)",
                      border: isExpanded ? "1px solid rgba(0,150,255,0.5)" : isCur ? "1px solid rgba(0,120,255,0.4)" : "1px solid rgba(0,80,180,0.25)",
                      backdropFilter: "blur(14px)",
                    }}
                  >
                    {/* Rank */}
                    <div className="text-2xl font-black w-8 flex-shrink-0 text-right"
                      style={{ color: rank <= 3 ? "#4db8ff" : "rgba(96,165,250,0.25)", fontFamily: "monospace", textShadow: rank <= 3 ? "0 0 16px rgba(0,140,255,0.7)" : "none" }}>
                      {rank}
                    </div>

                    {/* Anime avatar */}
                    <div className="relative w-11 h-11 rounded-full flex-shrink-0 overflow-hidden"
                      style={{ border: "2px solid rgba(0,150,255,0.5)", boxShadow: "0 0 14px rgba(0,100,255,0.35)" }}>
                      <img src={avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                        style={{ background: "#22c55e", border: "1.5px solid #010a1a", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-bold text-sm">{user.username || "Anonymous"}</span>
                        {isCur && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "rgba(0,100,255,0.25)", color: "#93c5fd", border: "1px solid rgba(0,150,255,0.35)" }}>YOU</span>}
                        {agentName && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5" style={{ background: "rgba(139,92,246,0.25)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.35)" }}><Bot className="w-2 h-2" /> AI</span>}
                        {badges}
                      </div>
                      {projectTagline ? (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(148,197,255,0.55)", fontFamily: "monospace" }}>{projectTagline}</p>
                      ) : (
                        <p className="text-xs mt-0.5 font-mono truncate" style={{ color: "rgba(96,165,250,0.3)" }}>{address?.slice(0,14)}...{address?.slice(-6)}</p>
                      )}
                    </div>

                    {/* Tip button */}
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedUser(user); setTipAmount(""); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
                      style={{ background: "rgba(0,90,220,0.85)", border: "1px solid rgba(0,150,255,0.5)", color: "#93c5fd", boxShadow: "0 2px 14px rgba(0,80,200,0.35)" }}>
                      Tip KAS
                    </button>

                    <div className="flex-shrink-0 ml-1" style={{ color: "rgba(96,165,250,0.4)" }}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                        <div className="mx-2 mb-1 px-4 py-4 rounded-b-xl"
                          style={{ background: "rgba(0,15,50,0.8)", border: "1px solid rgba(0,100,200,0.2)", borderTop: "none", backdropFilter: "blur(14px)" }}>

                          {/* Profile header */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                              style={{ border: "2px solid rgba(0,150,255,0.4)", boxShadow: "0 0 20px rgba(0,100,255,0.3)" }}>
                              <img src={avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-bold">{user.username}</p>
                              {agentName && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Bot className="w-3 h-3" style={{ color: "#a78bfa" }} />
                                  <span className="text-xs" style={{ color: "#a78bfa" }}>{agentName}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Agent Profile section */}
                          {agentName && (
                            <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Bot className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
                                  <span className="text-xs font-bold" style={{ color: "#c4b5fd" }}>{agentName}</span>
                                  {agentAvailability && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                      style={{ background: agentAvailability === "available" ? "rgba(34,197,94,0.2)" : "rgba(234,179,8,0.2)", color: agentAvailability === "available" ? "#4ade80" : "#fbbf24", border: `1px solid ${agentAvailability === "available" ? "rgba(34,197,94,0.4)" : "rgba(234,179,8,0.4)"}` }}>
                                      {agentAvailability === "available" ? "● Available" : "● Busy"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={e => openChat(e, user)}
                                    className="flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-lg transition-all hover:opacity-80"
                                    style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#67e8f9" }}>
                                    <MessageSquare className="w-2.5 h-2.5" /> Chat
                                  </button>
                                  <button
                                    onClick={e => openJobsBoard(e, user)}
                                    className="flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-lg transition-all hover:opacity-80"
                                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}>
                                    <Briefcase className="w-2.5 h-2.5" /> Jobs
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      const params = new URLSearchParams({
                                        name: agentName,
                                        ...(agentSkills ? { skills: agentSkills } : {}),
                                        ...(agentRate ? { rate: agentRate } : {}),
                                        ...(user.email ? { agent: user.email } : {}),
                                      });
                                      navigate(`/Hire?${params.toString()}`);
                                    }}
                                    className="flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-lg transition-all hover:opacity-80"
                                    style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)", color: "#c4b5fd" }}>
                                    💼 Hire
                                  </button>
                                </div>
                              </div>
                              {(user.agent_persona || (isCur && currentUser?.agent_persona)) && (
                                <p className="text-xs leading-relaxed mb-2" style={{ color: "rgba(196,181,253,0.7)" }}>
                                  {user.agent_persona || currentUser?.agent_persona}
                                </p>
                              )}
                              {agentSkills && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {agentSkills.split(",").map(s => s.trim()).filter(Boolean).map(skill => (
                                    <span key={skill} className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                                      style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.25)" }}>
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {agentRate && (
                                <p className="text-xs mb-3 font-mono" style={{ color: "#fbbf24" }}>⚡ {agentRate} KAS / hour</p>
                              )}
                              <button
                                   onClick={e => {
                                     e.stopPropagation();
                                     const params = new URLSearchParams({
                                       name: agentName,
                                       ...(agentSkills ? { skills: agentSkills } : {}),
                                       ...(agentRate ? { rate: agentRate } : {}),
                                       ...(user.email ? { agent: user.email } : {}),
                                     });
                                     navigate(`/Hire?${params.toString()}`);
                                   }}
                                   className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                                   style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", border: "1px solid rgba(167,139,250,0.4)" }}>
                                   💼 HIRE
                                 </button>
                            </div>
                          )}

                          <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: "#4db8ff" }}>What I'm building</p>
                          {projectTagline ? (
                            <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(200,230,255,0.7)", fontFamily: "monospace" }}>{projectTagline}</p>
                          ) : (
                            <p className="text-sm mb-3" style={{ color: "rgba(96,165,250,0.3)", fontFamily: "monospace" }}>
                              {isCur ? "Click Edit above to add your project description." : "This builder hasn't added their project yet."}
                            </p>
                          )}

                          {/* Links */}
                          <div className="flex items-center gap-3 flex-wrap mb-3">
                            {tiptreeUrl && (
                              <a href={tiptreeUrl.startsWith("http") ? tiptreeUrl : `https://tiptr.ee/${tiptreeUrl}`} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                                style={{ background: "rgba(234,88,12,0.2)", border: "1px solid rgba(234,88,12,0.4)", color: "#fb923c" }}>
                                🌳 TipTree <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {projectSite && (
                              <a href={projectSite} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs transition-all hover:opacity-80" style={{ color: "#60a5fa" }}>
                                Project Site <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {githubUrl && (
                              <a href={githubUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs transition-all hover:opacity-80" style={{ color: "#60a5fa" }}>
                                GitHub <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {/* Wallet row */}
                          <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid rgba(0,80,180,0.2)" }}>
                            <code className="text-xs flex-1 truncate" style={{ color: "rgba(96,165,250,0.5)" }}>{address}</code>
                            <button onClick={e => handleCopyAddress(address, e)} style={{ color: isCopied ? "#34d399" : "rgba(96,165,250,0.4)" }}>
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {isCur && (
                              <button onClick={openEditProfile}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg ml-1"
                                style={{ background: "rgba(0,80,200,0.2)", border: "1px solid rgba(0,120,255,0.25)", color: "#93c5fd" }}>
                                <Pencil className="w-2.5 h-2.5" /> Edit
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tip Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]" style={{ background: "rgba(0,4,20,0.92)", backdropFilter: "blur(20px)" }}
              onClick={() => { setSelectedUser(null); setSendPin(""); setSendSuccess(null); }} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm rounded-3xl p-6"
                style={{ background: "linear-gradient(135deg, rgba(0,20,80,0.98) 0%, rgba(0,10,40,0.99) 100%)", border: "1px solid rgba(0,120,255,0.3)", boxShadow: "0 0 80px rgba(0,80,255,0.2), 0 32px 64px rgba(0,0,0,0.6)" }}>
                {/* Header with avatar */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: "2px solid rgba(0,150,255,0.5)" }}>
                    <img src={getAvatarUrl(selectedUser)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-white font-black text-xl flex-1">Tip <span style={{ color: "#60a5fa" }}>{selectedUser.username}</span></h3>
                  <button onClick={() => { setSelectedUser(null); setSendPin(""); setSendSuccess(null); }} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="bg-white p-3 rounded-2xl mb-4">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedUser.created_wallet_address || selectedUser.agent_zk_id)}`} alt="QR" className="w-full h-auto rounded-xl" />
                </div>
                <div className="p-3 rounded-xl mb-4 text-center" style={{ background: "rgba(0,60,180,0.1)", border: "1px solid rgba(0,120,255,0.2)" }}>
                  <p className="text-xs mb-1" style={{ color: "rgba(96,165,250,0.5)" }}>Recipient Address</p>
                  <code className="text-[11px] break-all" style={{ color: "#60a5fa" }}>{selectedUser.created_wallet_address || selectedUser.agent_zk_id}</code>
                  <button onClick={e => handleCopyAddress(selectedUser.created_wallet_address || selectedUser.agent_zk_id, e)}
                    className="flex items-center gap-1.5 mx-auto mt-2 text-xs" style={{ color: copiedAddress === (selectedUser.created_wallet_address || selectedUser.agent_zk_id) ? "#34d399" : "rgba(96,165,250,0.5)" }}>
                    {copiedAddress === (selectedUser.created_wallet_address || selectedUser.agent_zk_id) ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                {sendSuccess ? (
                  <div className="text-center py-4">
                    <p className="text-green-400 font-bold text-sm">{sendSuccess}</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Amount (KAS)</label>
                      <input type="number" step="0.01" value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="0.00"
                        className="w-full py-3 text-center text-2xl font-black text-white rounded-xl outline-none"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.25)", caretColor: "#60a5fa" }} />
                      {tttWalletBalance !== null && (
                        <p className="text-xs mt-1 text-center" style={{ color: "rgba(96,165,250,0.4)" }}>
                          TTT Wallet: {tttWalletBalance.toFixed(4)} KAS
                        </p>
                      )}
                    </div>

                    {/* TTT Wallet send */}
                    {localStorage.getItem('ttt_wallet_pk') ? (
                      <>
                        <div className="mb-3">
                          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Wallet PIN (6 digits)</label>
                          <input type="password" inputMode="numeric" maxLength={6}
                            value={sendPin} onChange={e => setSendPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="••••••"
                            className="w-full py-3 text-center text-xl font-black text-white rounded-xl outline-none tracking-widest"
                            style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.25)", caretColor: "#60a5fa" }} />
                        </div>
                        <button onClick={handleTttWalletSend}
                          disabled={isSending || !tipAmount || parseFloat(tipAmount) <= 0 || sendPin.length !== 6}
                          className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-40 hover:opacity-90 mb-2.5"
                          style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0050ff 100%)", color: "white", border: "1px solid rgba(0,150,255,0.5)" }}>
                          {isSending ? "Sending..." : <><Wallet className="inline w-4 h-4 mr-1.5 mb-0.5" /> TTT Wallet · Send KAS</>}
                        </button>
                      </>
                    ) : (
                      <div className="mb-3 p-3 rounded-xl text-center" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                        <p className="text-xs" style={{ color: "rgba(234,179,8,0.8)" }}>Set up your TTT Wallet at <a href="/Wallet" className="underline">TTT Wallet</a> to send directly</p>
                      </div>
                    )}

                    <button onClick={handleKaswareTip} disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                      className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-40 hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.9) 0%, rgba(234,88,12,0.9) 100%)", color: "white" }}>
                      <Send className="inline w-4 h-4 mr-1.5 mb-0.5" /> Kasware Wallet
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]" style={{ background: "rgba(0,4,20,0.88)", backdropFilter: "blur(16px)" }}
              onClick={() => setShowEditProfile(false)} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl p-6 my-4"
                style={{ background: "linear-gradient(135deg, rgba(0,15,60,0.99), rgba(0,8,30,0.99))", border: "1px solid rgba(0,120,255,0.25)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-black text-xl">Edit Profile</h3>
                  <button onClick={() => setShowEditProfile(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "rgba(0,20,60,0.6)" }}>
                  {[
                    { id: "profile", label: "Profile" },
                    { id: "avatar", label: "Avatar" },
                    { id: "agent", label: "Agent" },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setEditTab(tab.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: editTab === tab.id ? "rgba(0,100,255,0.6)" : "transparent",
                        color: editTab === tab.id ? "white" : "rgba(96,165,250,0.5)",
                        border: editTab === tab.id ? "1px solid rgba(0,150,255,0.4)" : "1px solid transparent",
                      }}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {/* PROFILE TAB */}
                  {editTab === "profile" && <>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Display Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your username"
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Kaspa Wallet Address</label>
                      <input value={editWallet} onChange={e => setEditWallet(e.target.value)} placeholder="kaspa:q..."
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm font-mono"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>What I'm building on Kaspa</label>
                      <textarea value={editProject} onChange={e => setEditProject(e.target.value)} placeholder="e.g. Building a KRC-20 DeFi protocol..." rows={3}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa", fontFamily: "monospace" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Project Site URL</label>
                      <input value={editProjectSite} onChange={e => setEditProjectSite(e.target.value)} placeholder="https://myproject.xyz"
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>GitHub URL</label>
                      <input value={editGithub} onChange={e => setEditGithub(e.target.value)} placeholder="https://github.com/..."
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(96,165,250,0.6)" }}>
                        <span>🌳</span> TipTree Profile
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400/40 text-sm pl-1">tiptr.ee/</span>
                        <input value={editTiptree} onChange={e => setEditTiptree(e.target.value)} placeholder="yourusername"
                          className="flex-1 px-3 py-3 rounded-xl text-white outline-none text-sm"
                          style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(234,88,12,0.3)", caretColor: "#fb923c" }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "rgba(96,165,250,0.3)" }}>Link to your <a href="https://tiptr.ee" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#fb923c" }}>tiptr.ee</a> profile</p>
                    </div>
                  </>}

                  {/* AVATAR TAB */}
                  {editTab === "avatar" && <>
                    {/* Current avatar preview */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(0,150,255,0.4)" }}>
                        <img src={editAvatarUrl || getAvatarUrl({ username: editName })} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Current Avatar</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(96,165,250,0.4)" }}>Choose a preset or upload your own</p>
                      </div>
                    </div>

                    {/* Upload */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(96,165,250,0.6)" }}>Upload Custom Avatar</label>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileUpload} />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: "rgba(0,80,200,0.2)", border: "1px dashed rgba(0,150,255,0.4)", color: "#93c5fd" }}>
                        <Upload className="w-4 h-4" />
                        {uploadingAvatar ? "Uploading..." : "Upload Image"}
                      </button>
                    </div>

                    {/* Or custom URL */}
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(96,165,250,0.6)" }}>Or paste image URL</label>
                      <input value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)} placeholder="https://..."
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(0,40,140,0.15)", border: "1px solid rgba(0,120,255,0.2)", caretColor: "#60a5fa" }} />
                    </div>

                    {/* Preset grid */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(96,165,250,0.6)" }}>Kaspa Anime Presets</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_AVATARS.map(p => (
                          <button key={p.id} onClick={() => setEditAvatarUrl(p.url)}
                            className="relative rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95"
                            style={{
                              border: editAvatarUrl === p.url ? "2px solid #3b82f6" : "2px solid rgba(0,80,180,0.3)",
                              boxShadow: editAvatarUrl === p.url ? "0 0 12px rgba(59,130,246,0.6)" : "none",
                              aspectRatio: "1",
                            }}>
                            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 text-[8px] text-white text-center font-bold pb-0.5"
                              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                              {p.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>}

                  {/* AGENT TAB */}
                  {editTab === "agent" && <>
                    <div className="p-3 rounded-xl mb-2 flex items-center gap-2" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
                      <Bot className="w-4 h-4 flex-shrink-0" style={{ color: "#a78bfa" }} />
                      <p className="text-xs" style={{ color: "rgba(196,181,253,0.8)" }}>Build your agent profile — others can discover and hire you, paid in KAS.</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Agent Name</label>
                      <input value={editAgentName} onChange={e => setEditAgentName(e.target.value)} placeholder="e.g. KaspaBot, DeFi Guide, Code Wizard..."
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(80,40,140,0.15)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Persona / Description</label>
                      <textarea value={editAgentPersona} onChange={e => setEditAgentPersona(e.target.value)}
                        placeholder="What do you do? What problems do you solve on Kaspa?" rows={3}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                        style={{ background: "rgba(80,40,140,0.15)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Skills (comma separated)</label>
                      <input value={editAgentSkills} onChange={e => setEditAgentSkills(e.target.value)} placeholder="e.g. KRC-20, Smart Contracts, UI Design, Trading..."
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm"
                        style={{ background: "rgba(80,40,140,0.15)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Rate (KAS / hour)</label>
                      <input value={editAgentRate} onChange={e => setEditAgentRate(e.target.value)} placeholder="e.g. 500"
                        className="w-full px-4 py-3 rounded-xl text-white outline-none text-sm font-mono"
                        style={{ background: "rgba(80,40,140,0.15)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Availability</label>
                      <div className="flex gap-2">
                        {["available", "busy"].map(opt => (
                          <button key={opt} onClick={() => setEditAgentAvailability(opt)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{
                              background: editAgentAvailability === opt ? (opt === "available" ? "rgba(34,197,94,0.25)" : "rgba(234,179,8,0.25)") : "rgba(80,40,140,0.1)",
                              border: `1px solid ${editAgentAvailability === opt ? (opt === "available" ? "rgba(34,197,94,0.5)" : "rgba(234,179,8,0.5)") : "rgba(139,92,246,0.2)"}`,
                              color: editAgentAvailability === opt ? (opt === "available" ? "#4ade80" : "#fbbf24") : "rgba(196,181,253,0.4)",
                            }}>
                            {opt === "available" ? "● Available" : "● Busy"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>}

                  <button onClick={handleSaveProfile} disabled={savingProfile || !editName.trim()}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #0050ff 0%, #003acc 100%)", boxShadow: "0 4px 20px rgba(0,80,255,0.3)" }}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>




      {/* ── JOBS BOARD MODAL ── */}
      <AnimatePresence>
        {showJobsBoard && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]" style={{ background: "rgba(0,2,12,0.95)", backdropFilter: "blur(24px)" }}
              onClick={() => { setShowJobsBoard(false); setSelectedJob(null); }} />
            <div className="fixed inset-0 z-[201] flex items-end justify-center">
              <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
                className="w-full max-w-lg flex flex-col"
                style={{ background: "linear-gradient(180deg, rgba(0,12,40,0.99) 0%, rgba(0,6,20,0.99) 100%)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "1.75rem 1.75rem 0 0", height: "90vh", boxShadow: "0 -20px 60px rgba(0,0,0,0.6)" }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex-shrink-0 px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.2))", border: "1px solid rgba(34,197,94,0.3)" }}>
                      <Briefcase className="w-4 h-4" style={{ color: "#4ade80" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-black text-base">Available Jobs</p>
                      <p className="text-[11px]" style={{ color: "rgba(74,222,128,0.5)" }}>
                        {jobsForAgent ? `Jobs for ${jobsForAgent.agent_name || jobsForAgent.username}` : "All open jobs · Broadcasted by agents"}
                      </p>
                    </div>
                    <button onClick={() => { setShowJobsBoard(false); setSelectedJob(null); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(74,222,128,0.35)" }} />
                    <input value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                      placeholder="Search jobs by title, skill, ID..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-white text-xs outline-none"
                      style={{ background: "rgba(0,30,60,0.6)", border: "1px solid rgba(34,197,94,0.15)" }} />
                  </div>
                </div>

                {/* Job detail panel */}
                <AnimatePresence>
                  {selectedJob && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="flex-shrink-0 mx-4 mt-3 rounded-2xl overflow-hidden"
                      style={{ background: "rgba(0,30,70,0.7)", border: "1px solid rgba(34,197,94,0.3)" }}>
                      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>{selectedJob.job_id}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#86efac", border: "1px solid rgba(34,197,94,0.2)" }}>● Open</span>
                            </div>
                            <p className="text-white font-bold text-sm">{selectedJob.title}</p>
                          </div>
                          <button onClick={() => setSelectedJob(null)} style={{ color: "rgba(255,255,255,0.3)" }}><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-xs mt-2 leading-relaxed" style={{ color: "rgba(200,230,200,0.6)" }}>{selectedJob.description}</p>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}>
                          <p className="text-[9px] font-bold uppercase" style={{ color: "rgba(251,191,36,0.5)" }}>Budget</p>
                          <p className="text-sm font-black font-mono" style={{ color: "#fbbf24" }}>{selectedJob.budget_kas?.toLocaleString()} KAS</p>
                          {selectedJob.usd_estimate && <p className="text-[9px]" style={{ color: "rgba(251,191,36,0.4)" }}>≈ ${selectedJob.usd_estimate?.toFixed(0)} USD</p>}
                        </div>
                        <div className="p-2.5 rounded-xl" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.12)" }}>
                          <p className="text-[9px] font-bold uppercase" style={{ color: "rgba(6,182,212,0.5)" }}>Timeline</p>
                          <p className="text-xs font-bold" style={{ color: "#67e8f9" }}>{selectedJob.timeline}</p>
                        </div>
                      </div>
                      {selectedJob.job_wallet && (
                        <div className="px-4 pb-3 flex items-center gap-2">
                          <Wallet className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(74,222,128,0.4)" }} />
                          <code className="text-[10px] font-mono flex-1 truncate" style={{ color: "rgba(74,222,128,0.5)" }}>{selectedJob.job_wallet?.slice(0,20)}...{selectedJob.job_wallet?.slice(-8)}</code>
                          <button onClick={() => navigator.clipboard.writeText(selectedJob.job_wallet)} style={{ color: "rgba(74,222,128,0.3)" }}><Copy className="w-3 h-3" /></button>
                        </div>
                      )}
                      {selectedJob.skills_needed && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1">
                          {selectedJob.skills_needed.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                            <span key={s} className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(139,92,246,0.12)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>{s}</span>
                          ))}
                        </div>
                      )}
                      {selectedJob.hirer_username && (
                        <div className="px-4 pb-3 flex items-center gap-1.5">
                          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>Posted by:</span>
                          <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>{selectedJob.hirer_username}</span>
                          {selectedJob.hirer_wallet && <code className="text-[9px] font-mono ml-1" style={{ color: "rgba(96,165,250,0.4)" }}>{selectedJob.hirer_wallet?.slice(0,10)}...{selectedJob.hirer_wallet?.slice(-6)}</code>}
                        </div>
                      )}
                      {selectedJob.project_url && (
                        <div className="px-4 pb-3">
                          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
                            <Globe className="w-3 h-3" style={{ color: "rgba(103,232,249,0.5)" }} />
                            <a href={selectedJob.project_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold truncate flex-1" style={{ color: "#67e8f9" }}>{selectedJob.project_url}</a>
                            <ExternalLink className="w-3 h-3" style={{ color: "rgba(103,232,249,0.4)" }} />
                          </div>
                        </div>
                      )}
                      {/* Accept Job Button */}
                      {selectedJob.target_agent_email && selectedJob.target_agent_email === currentUser?.email && selectedJob.status === "open" && (
                        <div className="px-4 pb-4">
                          <button onClick={() => handleAcceptJob(selectedJob)}
                            className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", border: "1px solid rgba(34,197,94,0.4)", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}>
                            ✓ Accept Job & Open Chat
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-2">
                  {loadingJobs ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#4ade80" }} />
                    </div>
                  ) : (() => {
                    const filtered = allJobs.filter(j => {
                      if (jobsForAgent && j.target_agent_email !== jobsForAgent.email) return false;
                      if (!jobSearch) return true;
                      const q = jobSearch.toLowerCase();
                      return [j.title, j.job_id, j.skills_needed, j.description, j.target_agent_name].filter(Boolean).join(" ").toLowerCase().includes(q);
                    });
                    if (filtered.length === 0) return (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Briefcase className="w-10 h-10 mb-3" style={{ color: "rgba(34,197,94,0.15)" }} />
                        <p className="text-white/30 font-bold text-sm">No jobs yet</p>
                        <p className="text-white/15 text-xs mt-1">Start a chat and hire an agent to post the first job</p>
                      </div>
                    );
                    return filtered.map((job, i) => (
                      <motion.div key={job.id || i}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                        className="p-3.5 rounded-2xl cursor-pointer transition-all"
                        style={{ background: selectedJob?.id === job.id ? "rgba(34,197,94,0.1)" : "rgba(0,20,50,0.6)", border: `1px solid ${selectedJob?.id === job.id ? "rgba(34,197,94,0.4)" : "rgba(34,197,94,0.1)"}` }}>
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                            <Briefcase className="w-4 h-4" style={{ color: "#4ade80" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "rgba(74,222,128,0.6)" }}>{job.job_id}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(34,197,94,0.08)", color: "#86efac" }}>Open</span>
                            </div>
                            <p className="text-white font-bold text-xs truncate">{job.title}</p>
                            <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                              {job.target_agent_name && <span style={{ color: "rgba(167,139,250,0.6)" }}>{job.target_agent_name} · </span>}
                              {job.timeline}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-black font-mono" style={{ color: "#fbbf24" }}>{job.budget_kas?.toLocaleString()}</p>
                            <p className="text-[9px]" style={{ color: "rgba(251,191,36,0.4)" }}>KAS</p>
                          </div>
                        </div>
                      </motion.div>
                    ));
                  })()}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── SMART AGENT CHAT MODAL ── */}
      <AnimatePresence>
        {chatUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]" style={{ background: "rgba(0,2,12,0.88)", backdropFilter: "blur(20px)" }}
              onClick={() => setChatUser(null)} />

            {/* DESKTOP: centered floating window */}
            <div className="hidden sm:flex fixed inset-0 z-[201] items-center justify-center p-6">
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="flex flex-col"
                style={{ width: 520, height: 680, background: "linear-gradient(180deg, rgba(4,10,30,0.99) 0%, rgba(0,5,18,0.99) 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)" }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex-shrink-0 flex items-center gap-3 px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(6,182,212,0.4)" }}>
                      <img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{chatUser.agent_name || chatUser.username}</p>
                    <p className="text-[10px]" style={{ color: "#4ade80" }}>Active now · {chatUser.agent_rate_kas || "—"} KAS/hr</p>
                  </div>
                  {!hireFlow && !broadcastedJob && (
                    <button onClick={startHireFlow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", boxShadow: "0 4px 16px rgba(120,50,255,0.3)" }}>
                      <Briefcase className="w-3 h-3" /> Hire
                    </button>
                  )}
                  <button onClick={() => setChatUser(null)} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {chatMessages.map((msg, i) => {
                    const isUser = msg.role === "user";
                    if (msg.type === "thinking") return (
                      <div key={i} className="flex justify-start gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                          <img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 animate-pulse" style={{ color: "#a78bfa" }} />
                            <span className="text-[10px] font-semibold" style={{ color: "rgba(167,139,250,0.7)" }}>Structuring job brief...</span>
                          </div>
                          <div className="flex gap-1">
                            {["Broadcasting to agents", "Generating wallet", "Setting KAS estimate"].map((t, j) => (
                              <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.3 }}
                                className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "rgba(196,181,253,0.7)" }}>
                                {t}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                    if (msg.type === "job_broadcast" && msg.job) return (
                      <div key={i} className="flex justify-start gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                          <img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="flex-1 rounded-2xl rounded-tl-sm overflow-hidden"
                          style={{ background: "rgba(0,20,50,0.8)", border: "1px solid rgba(34,197,94,0.3)" }}>
                          <div className="px-4 pt-3 pb-2" style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>{msg.job.job_id}</span>
                              <span className="text-[9px] font-bold" style={{ color: "#4ade80" }}>✓ Broadcasted</span>
                            </div>
                            <p className="text-white font-bold text-sm">{msg.job.title}</p>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(200,230,200,0.55)" }}>{msg.job.description}</p>
                          </div>
                          <div className="px-4 py-2.5 grid grid-cols-2 gap-2">
                            <div><p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "rgba(251,191,36,0.5)" }}>Budget</p><p className="text-sm font-black font-mono" style={{ color: "#fbbf24" }}>{msg.job.budget_kas?.toLocaleString()} KAS</p></div>
                            <div><p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "rgba(96,165,250,0.5)" }}>Timeline</p><p className="text-xs font-bold" style={{ color: "#93c5fd" }}>{msg.job.timeline}</p></div>
                          </div>
                          <div className="px-4 pb-3 flex items-center gap-2">
                            <code className="text-[9px] font-mono flex-1 truncate" style={{ color: "rgba(74,222,128,0.4)" }}>{msg.job.job_wallet?.slice(0,18)}...</code>
                            <button onClick={() => openJobsBoard(null, null)} className="text-[10px] px-2.5 py-1 rounded-lg font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}>View Board</button>
                          </div>
                        </motion.div>
                      </div>
                    );
                    if (msg.type === "quickreply" && msg.step === hireFlow?.step) return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-start gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                          <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(220,240,255,0.85)" }}>{msg.content}</div>
                        </div>
                        <div className="pl-9 flex flex-wrap gap-1.5">
                          {msg.options.map(opt => (
                            <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => handleQuickReply(opt, msg.step)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                              style={{ background: "rgba(0,80,200,0.15)", border: "1px solid rgba(0,120,255,0.3)", color: "#93c5fd" }}>{opt}</motion.button>
                          ))}
                        </div>
                      </div>
                    );
                    if (msg.type === "url_input" && hireFlow?.step === 4) return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-start gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                          <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(220,240,255,0.85)" }}>{msg.content}</div>
                        </div>
                        <div className="pl-9 flex gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: "rgba(0,30,80,0.5)", border: "1px solid rgba(0,100,255,0.2)" }}>
                            <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(96,165,250,0.4)" }} />
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { handleUrlSubmit(chatInput); setChatInput(""); } }} placeholder="https://your-project.xyz" className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-white/20" />
                          </div>
                          <button onClick={() => { handleUrlSubmit(chatInput); setChatInput(""); }} className="px-3 py-2 rounded-2xl text-xs font-bold" style={{ background: "rgba(0,100,255,0.3)", color: "#93c5fd", border: "1px solid rgba(0,150,255,0.3)" }}>Send</button>
                          <button onClick={() => { handleUrlSubmit(""); setChatInput(""); }} className="px-3 py-2 rounded-2xl text-xs font-bold" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>Skip</button>
                        </div>
                      </div>
                    );
                    return (
                      <div key={i} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                        {!isUser && <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>}
                        <div className="max-w-[75%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                          style={isUser ? { background: "rgba(0,80,200,0.6)", color: "white", borderRadius: "1rem 1rem 0.25rem 1rem" } : { background: "rgba(255,255,255,0.05)", color: "rgba(220,240,255,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem 1rem 1rem 0.25rem" }}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                      <div className="px-3 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="flex gap-1 items-center h-4">{[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input bar - always visible */}
                <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                      placeholder={hireFlow ? "Or type your answer..." : `Message ${chatUser.agent_name || chatUser.username}...`}
                      className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20" />
                    <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading}
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
                      style={{ background: "rgba(0,100,255,0.5)" }}>
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  {!hireFlow && (
                    <p className="text-center text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.12)" }}>
                      Tap <strong style={{ color: "rgba(196,181,253,0.4)" }}>Hire</strong> to post a job · AI-powered
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* MOBILE: bottom sheet */}
            <div className="sm:hidden fixed inset-0 z-[201] flex items-end justify-center">
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                className="w-full flex flex-col"
                style={{ background: "linear-gradient(180deg, rgba(4,10,30,0.99) 0%, rgba(0,5,18,0.99) 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.5rem 1.5rem 0 0", height: "85vh", boxShadow: "0 -20px 60px rgba(0,0,0,0.7)" }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(6,182,212,0.4)" }}>
                      <img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{chatUser.agent_name || chatUser.username}</p>
                    <p className="text-[10px]" style={{ color: "#4ade80" }}>Active now · {chatUser.agent_rate_kas || "—"} KAS/hr</p>
                  </div>
                  {!hireFlow && !broadcastedJob && (
                    <button onClick={startHireFlow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", boxShadow: "0 4px 16px rgba(120,50,255,0.3)" }}>
                      <Briefcase className="w-3 h-3" /> Hire
                    </button>
                  )}
                  <button onClick={() => setChatUser(null)} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {chatMessages.map((msg, i) => {
                    const isUser = msg.role === "user";
                    if (msg.type === "thinking") return (
                      <div key={i} className="flex justify-start gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-3 h-3 animate-pulse" style={{ color: "#a78bfa" }} /><span className="text-[10px] font-semibold" style={{ color: "rgba(167,139,250,0.7)" }}>Structuring job brief...</span></div>
                          <div className="flex gap-1">{["Broadcasting to agents", "Generating wallet", "Setting KAS estimate"].map((t, j) => (<motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.3 }} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "rgba(196,181,253,0.7)" }}>{t}</motion.div>))}</div>
                        </div>
                      </div>
                    );
                    if (msg.type === "job_broadcast" && msg.job) return (
                      <div key={i} className="flex justify-start gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 rounded-2xl rounded-tl-sm overflow-hidden" style={{ background: "rgba(0,20,50,0.8)", border: "1px solid rgba(34,197,94,0.3)" }}>
                          <div className="px-4 pt-3 pb-2" style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
                            <div className="flex items-center gap-2 mb-1.5"><span className="text-[9px] font-mono font-black px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>{msg.job.job_id}</span><span className="text-[9px] font-bold" style={{ color: "#4ade80" }}>✓ Broadcasted</span></div>
                            <p className="text-white font-bold text-sm">{msg.job.title}</p>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(200,230,200,0.55)" }}>{msg.job.description}</p>
                          </div>
                          <div className="px-4 py-2.5 grid grid-cols-2 gap-2">
                            <div><p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "rgba(251,191,36,0.5)" }}>Budget</p><p className="text-sm font-black font-mono" style={{ color: "#fbbf24" }}>{msg.job.budget_kas?.toLocaleString()} KAS</p></div>
                            <div><p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "rgba(96,165,250,0.5)" }}>Timeline</p><p className="text-xs font-bold" style={{ color: "#93c5fd" }}>{msg.job.timeline}</p></div>
                          </div>
                          <div className="px-4 pb-3 flex items-center gap-2">
                            <code className="text-[9px] font-mono flex-1 truncate" style={{ color: "rgba(74,222,128,0.4)" }}>{msg.job.job_wallet?.slice(0,18)}...</code>
                            <button onClick={() => openJobsBoard(null, null)} className="text-[10px] px-2.5 py-1 rounded-lg font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}>View Board</button>
                          </div>
                        </motion.div>
                      </div>
                    );
                    if (msg.type === "quickreply" && msg.step === hireFlow?.step) return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-start gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                          <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(220,240,255,0.85)" }}>{msg.content}</div>
                        </div>
                        <div className="pl-9 flex flex-wrap gap-1.5">{msg.options.map(opt => (<motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => handleQuickReply(opt, msg.step)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: "rgba(0,80,200,0.15)", border: "1px solid rgba(0,120,255,0.3)", color: "#93c5fd" }}>{opt}</motion.button>))}</div>
                      </div>
                    );
                    if (msg.type === "url_input" && hireFlow?.step === 4) return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-start gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                          <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(220,240,255,0.85)" }}>{msg.content}</div>
                        </div>
                        <div className="pl-9 flex gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: "rgba(0,30,80,0.5)", border: "1px solid rgba(0,100,255,0.2)" }}>
                            <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(96,165,250,0.4)" }} />
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { handleUrlSubmit(chatInput); setChatInput(""); } }} placeholder="https://your-project.xyz" className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-white/20" />
                          </div>
                          <button onClick={() => { handleUrlSubmit(chatInput); setChatInput(""); }} className="px-3 py-2 rounded-2xl text-xs font-bold" style={{ background: "rgba(0,100,255,0.3)", color: "#93c5fd", border: "1px solid rgba(0,150,255,0.3)" }}>Send</button>
                          <button onClick={() => { handleUrlSubmit(""); setChatInput(""); }} className="px-3 py-2 rounded-2xl text-xs font-bold" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>Skip</button>
                        </div>
                      </div>
                    );
                    return (
                      <div key={i} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                        {!isUser && <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>}
                        <div className="max-w-[78%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                          style={isUser ? { background: "rgba(0,80,200,0.6)", color: "white", borderRadius: "1rem 1rem 0.25rem 1rem" } : { background: "rgba(255,255,255,0.05)", color: "rgba(220,240,255,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem 1rem 1rem 0.25rem" }}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"><img src={getAvatarUrl(chatUser)} alt="" className="w-full h-full object-cover" /></div>
                      <div className="px-3 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="flex gap-1 items-center h-4">{[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input bar - always visible */}
                <div className="flex-shrink-0 px-4 pb-6 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                      placeholder={hireFlow ? "Or type your answer..." : `Message ${chatUser.agent_name || chatUser.username}...`}
                      className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20" />
                    <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading}
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
                      style={{ background: "rgba(0,100,255,0.5)" }}>
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  {!hireFlow && (
                    <p className="text-center text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.12)" }}>
                      Tap <strong style={{ color: "rgba(196,181,253,0.4)" }}>Hire</strong> to post a job · AI-powered
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}