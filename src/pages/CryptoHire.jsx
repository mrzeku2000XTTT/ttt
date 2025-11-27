import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, Plus, Send, CheckCircle2, Clock, 
  DollarSign, TrendingUp, Award, Loader2,
  Mail, User, Briefcase, ExternalLink, Copy,
  Zap, ArrowRight, Star, Target
} from "lucide-react";

export default function CryptoHirePage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [newReferral, setNewReferral] = useState({
    candidate_name: "",
    candidate_email: "",
    position: "",
    company: "",
    referral_bonus_kas: "",
    notes: ""
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Referral.filter({ referrer_email: user.email }, '-created_date');
    },
    enabled: !!user,
    initialData: []
  });

  const createReferralMutation = useMutation({
    mutationFn: (data) => base44.entities.Referral.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['referrals']);
      setShowAddReferral(false);
      setNewReferral({
        candidate_name: "",
        candidate_email: "",
        position: "",
        company: "",
        referral_bonus_kas: "",
        notes: ""
      });
    }
  });

  const updateReferralMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['referrals'])
  });

  const handleAddReferral = () => {
    if (!newReferral.candidate_name || !newReferral.candidate_email || !newReferral.position) {
      alert("Please fill in required fields: name, email, and position");
      return;
    }

    createReferralMutation.mutate({
      ...newReferral,
      referrer_email: user.email,
      referrer_name: user.username || user.full_name,
      status: "pending",
      referral_bonus_kas: parseFloat(newReferral.referral_bonus_kas) || 0
    });
  };

  const handleStatusChange = (referral, newStatus) => {
    updateReferralMutation.mutate({
      id: referral.id,
      data: { status: newStatus }
    });
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === "pending").length,
    hired: referrals.filter(r => r.status === "hired").length,
    totalEarned: referrals
      .filter(r => r.status === "hired")
      .reduce((sum, r) => sum + (r.referral_bonus_kas || 0), 0)
  };

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    screening: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    interviewing: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    hired: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30"
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">CryptoHire Referrals</h1>
                  <p className="text-gray-400">Track referrals and earn instant KAS bonuses</p>
                </div>
              </div>
              <Button
                onClick={() => setShowAddReferral(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 h-12 px-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Referral
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Total Referrals</p>
                      <p className="text-3xl font-bold text-white">{stats.total}</p>
                    </div>
                    <Target className="w-10 h-10 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Pending</p>
                      <p className="text-3xl font-bold text-white">{stats.pending}</p>
                    </div>
                    <Clock className="w-10 h-10 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Hired</p>
                      <p className="text-3xl font-bold text-white">{stats.hired}</p>
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/30 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-300 text-sm mb-1">Total Earned</p>
                      <p className="text-3xl font-bold text-white">{stats.totalEarned.toFixed(2)} KAS</p>
                    </div>
                    <Zap className="w-10 h-10 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <AnimatePresence>
            {showAddReferral && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardHeader className="border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">Add New Referral</h3>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Candidate Name *</label>
                        <Input
                          placeholder="John Doe"
                          value={newReferral.candidate_name}
                          onChange={(e) => setNewReferral({...newReferral, candidate_name: e.target.value})}
                          className="bg-black border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Email *</label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={newReferral.candidate_email}
                          onChange={(e) => setNewReferral({...newReferral, candidate_email: e.target.value})}
                          className="bg-black border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Position *</label>
                        <Input
                          placeholder="Senior Blockchain Developer"
                          value={newReferral.position}
                          onChange={(e) => setNewReferral({...newReferral, position: e.target.value})}
                          className="bg-black border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Company</label>
                        <Input
                          placeholder="Acme Corp"
                          value={newReferral.company}
                          onChange={(e) => setNewReferral({...newReferral, company: e.target.value})}
                          className="bg-black border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Bonus (KAS)</label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={newReferral.referral_bonus_kas}
                          onChange={(e) => setNewReferral({...newReferral, referral_bonus_kas: e.target.value})}
                          className="bg-black border-white/20 text-white"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-sm text-gray-400 mb-2 block">Notes</label>
                      <Textarea
                        placeholder="Additional details about the referral..."
                        value={newReferral.notes}
                        onChange={(e) => setNewReferral({...newReferral, notes: e.target.value})}
                        className="bg-black border-white/20 text-white h-24"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleAddReferral}
                        disabled={createReferralMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                      >
                        {createReferralMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Referral
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowAddReferral(false)}
                        variant="outline"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
              </div>
            ) : referrals.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Referrals Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Start tracking your employee referrals and earn KAS bonuses
                  </p>
                  <Button
                    onClick={() => setShowAddReferral(true)}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Referral
                  </Button>
                </CardContent>
              </Card>
            ) : (
              referrals.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-1">{referral.candidate_name}</h3>
                              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                <Mail className="w-4 h-4" />
                                {referral.candidate_email}
                                <button onClick={() => handleCopy(referral.candidate_email)}>
                                  <Copy className="w-3 h-3 hover:text-white" />
                                </button>
                              </div>
                            </div>
                            <Badge className={statusColors[referral.status]}>
                              {referral.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Briefcase className="w-4 h-4" />
                              {referral.position}
                            </div>
                            {referral.company && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Award className="w-4 h-4" />
                                {referral.company}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
                              <DollarSign className="w-4 h-4" />
                              {referral.referral_bonus_kas} KAS Bonus
                            </div>
                          </div>

                          {referral.notes && (
                            <p className="text-gray-400 text-sm mb-3">{referral.notes}</p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {referral.status === "pending" && (
                              <Button
                                onClick={() => handleStatusChange(referral, "screening")}
                                size="sm"
                                className="bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
                              >
                                Move to Screening
                              </Button>
                            )}
                            {referral.status === "screening" && (
                              <Button
                                onClick={() => handleStatusChange(referral, "interviewing")}
                                size="sm"
                                className="bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                              >
                                Move to Interview
                              </Button>
                            )}
                            {referral.status === "interviewing" && (
                              <Button
                                onClick={() => handleStatusChange(referral, "hired")}
                                size="sm"
                                className="bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Mark as Hired
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}