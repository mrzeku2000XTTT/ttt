import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Briefcase, Loader2, Sparkles, CheckCircle2, 
  Wallet, Award, Target, TrendingUp
} from "lucide-react";
import AgentYingFloatingChat from "@/components/iwork/AgentYingFloatingChat";
import KNSCardScanner from "@/components/iwork/KNSCardScanner";
import JobMatchCard from "@/components/iwork/JobMatchCard";

export default function IWorkPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [kasPrice, setKasPrice] = useState(0.08);
  const [agentProfile, setAgentProfile] = useState(null);
  const [step, setStep] = useState(1); // 1: Input, 2: KNS Scan, 3: Ying Verification, 4: Matches
  const [skillsInput, setSkillsInput] = useState("");
  const [knsData, setKnsData] = useState(null);
  const [yingVerification, setYingVerification] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);

  useEffect(() => {
    loadUser();
    loadKasPrice();
  }, []);

  useEffect(() => {
    if (user) {
      loadAgentProfile();
      loadWorkerProfile();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("Not logged in");
    }
  };

  const loadKasPrice = async () => {
    try {
      const response = await base44.functions.invoke('getKaspaPrice');
      if (response.data?.price) {
        setKasPrice(response.data.price);
      }
    } catch (err) {
      console.error("Failed to load KAS price:", err);
    }
  };

  const loadAgentProfile = async () => {
    try {
      const profiles = await base44.entities.AgentZKProfile.filter({ 
        user_email: user.email 
      });
      if (profiles.length > 0) {
        setAgentProfile(profiles[0]);
      }
    } catch (err) {
      console.error("Failed to load agent profile:", err);
    }
  };

  const loadWorkerProfile = async () => {
    try {
      const profiles = await base44.entities.IWorkProfile.filter({ 
        user_email: user.email 
      });
      if (profiles.length > 0) {
        setWorkerProfile(profiles[0]);
        setStep(4); // Go straight to matches if already registered
      }
    } catch (err) {
      console.error("Failed to load worker profile:", err);
    }
  };

  const { data: jobListings = [] } = useQuery({
    queryKey: ['all-job-listings'],
    queryFn: async () => {
      return await base44.entities.HRJobListing.filter({ status: 'active' }, '-created_date');
    },
    enabled: !!user && step === 4
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.IWorkProfile.create(data);
    },
    onSuccess: (data) => {
      setWorkerProfile(data);
      queryClient.invalidateQueries({ queryKey: ['all-job-listings'] });
      setStep(4);
      alert('Profile created! Finding matches... 🎉');
    }
  });

  const handleYingVerification = (verification) => {
    setYingVerification(verification);
    
    // Create profile
    createProfileMutation.mutate({
      user_email: user.email,
      wallet_address: agentProfile?.wallet_address || user.created_wallet_address || '',
      agentzk_username: agentProfile?.username || user.username || '',
      full_name: knsData?.full_name || user.full_name || '',
      kns_card_data: JSON.stringify(knsData),
      skills_description: skillsInput,
      skills: verification.skills || [],
      hourly_rate_usd: verification.suggested_rate || 50,
      verified_by_ying: true
    });
  };

  const calculateMatchScore = (job) => {
    if (!workerProfile?.skills) return 0;
    
    const workerSkills = workerProfile.skills.map(s => s.toLowerCase());
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());
    
    const matchCount = workerSkills.filter(skill => 
      jobSkills.some(jSkill => jSkill.includes(skill) || skill.includes(jSkill))
    ).length;
    
    return Math.round((matchCount / Math.max(workerSkills.length, jobSkills.length)) * 100);
  };

  const matchedJobs = jobListings
    .map(job => ({ ...job, matchScore: calculateMatchScore(job) }))
    .filter(job => job.matchScore > 30)
    .sort((a, b) => b.matchScore - a.matchScore);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 p-8">
          <p className="text-white">Please log in to access iWork</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">iWork</h1>
            <p className="text-gray-300">Find work that matches your skills • Get verified by Agent Ying</p>
          </motion.div>

          {/* Step 1: Skills Input */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl mb-6">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-4">What can you do?</h2>
                  <p className="text-gray-300 mb-6">Describe your skills, experience, and what kind of work you're looking for.</p>
                  
                  <Textarea
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="I'm a full-stack developer with 5 years of experience in React, Node.js, and blockchain development. I'm looking for remote contract work..."
                    className="bg-black border-white/20 text-white min-h-32 mb-6"
                    rows={6}
                  />

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!skillsInput.trim()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 h-12"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Continue to KNS Verification
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: KNS Card Scanner */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <KNSCardScanner
                onScanComplete={(data) => {
                  setKnsData(data);
                  setStep(3);
                }}
              />
            </motion.div>
          )}

          {/* Step 3: Agent Ying Verification (floating chat appears) */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-8 text-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">Agent Ying is verifying...</h2>
                  <p className="text-gray-300 mb-6">
                    Chat with Agent Ying (bottom right) to complete your verification
                  </p>
                  <div className="p-4 bg-black/40 rounded-lg border border-white/10 text-left">
                    <div className="text-sm text-gray-300 space-y-2">
                      <div><span className="text-gray-400">Skills:</span> <span className="text-white">{skillsInput.substring(0, 100)}...</span></div>
                      <div><span className="text-gray-400">KNS Verified:</span> <span className="text-green-400">✓ {knsData?.full_name}</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Job Matches */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {workerProfile && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Your Profile</h2>
                        <p className="text-gray-300">@{workerProfile.agentzk_username}</p>
                      </div>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified by Ying
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {workerProfile.skills?.map((skill, idx) => (
                        <Badge key={idx} className="bg-purple-500/20 text-purple-300">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-black/40 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Hourly Rate</div>
                        <div className="text-lg font-bold text-cyan-400">${workerProfile.hourly_rate_usd}/h</div>
                      </div>
                      <div className="text-center p-3 bg-black/40 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Matches</div>
                        <div className="text-lg font-bold text-purple-400">{matchedJobs.length}</div>
                      </div>
                      <div className="text-center p-3 bg-black/40 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Status</div>
                        <div className="text-lg font-bold text-green-400">Active</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <h2 className="text-2xl font-bold text-white mb-6">
                <Target className="w-6 h-6 inline mr-2" />
                Matched Jobs ({matchedJobs.length})
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {matchedJobs.length === 0 ? (
                  <Card className="bg-white/5 border-white/10 col-span-2">
                    <CardContent className="p-12 text-center">
                      <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-30" />
                      <p className="text-gray-400">No job matches found yet. Check back soon!</p>
                    </CardContent>
                  </Card>
                ) : (
                  matchedJobs.map((job) => (
                    <JobMatchCard
                      key={job.id}
                      job={job}
                      matchScore={job.matchScore}
                      kasPrice={kasPrice}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Agent Ying Floating Chat */}
      {step === 3 && (
        <AgentYingFloatingChat onVerificationComplete={handleYingVerification} />
      )}
    </div>
  );
}