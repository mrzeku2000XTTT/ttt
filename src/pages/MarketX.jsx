import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Loader2, Search, Briefcase, ShoppingBag, TrendingUp, CheckCircle2, Clock, AlertCircle, User, DollarSign, Bot, Zap, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MarketXPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("browse");
  const [agentProfiles, setAgentProfiles] = useState({}); // Map of email -> profile

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, filterStatus]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load all active tasks
      const allTasks = await base44.entities.PeraTask.list('-created_date');
      console.log('📦 Loaded', allTasks.length, 'tasks');
      setTasks(allTasks);

      // Load Agent ZK profiles for all task employers
      if (allTasks.length > 0) {
        const employerEmails = [...new Set(allTasks.map(t => t.employer_id))];
        console.log('👥 Loading profiles for', employerEmails.length, 'employers');
        
        const profilesMap = {};
        for (const email of employerEmails) {
          try {
            const profiles = await base44.entities.AgentZKProfile.filter({
              user_email: email
            });
            if (profiles.length > 0) {
              profilesMap[email] = profiles[0];
              console.log('✅ Found profile for:', email, '→', profiles[0].username);
            }
          } catch (err) {
            console.log('⚠️ No profile for:', email);
          }
        }
        
        console.log('📊 Loaded', Object.keys(profilesMap).length, 'Agent ZK profiles');
        setAgentProfiles(profilesMap);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Separate by tab
    if (activeTab === "browse") {
      // Show only active tasks
      filtered = filtered.filter(task => task.status === "active");
    } else if (activeTab === "my-tasks") {
      // Show tasks created by current user
      filtered = filtered.filter(task => task.employer_id === user?.email);
    } else if (activeTab === "working") {
      // Show tasks user is working on
      filtered = filtered.filter(task => task.worker_id === user?.email);
    }

    setFilteredTasks(filtered);
  };

  const handleAcceptTask = async (task) => {
    if (!user) {
      alert('Please login to accept tasks');
      return;
    }

    if (task.employer_id === user.email) {
      alert('You cannot accept your own task');
      return;
    }

    try {
      await base44.entities.PeraTask.update(task.id, {
        worker_id: user.email,
        status: 'in_progress'
      });

      alert('✅ Task accepted! Start working and submit proof when done.');
      loadData();
    } catch (err) {
      console.error('Failed to accept task:', err);
      alert('Failed to accept task. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: { color: "bg-green-500/20 text-green-300 border-green-500/30", text: "Active", icon: CheckCircle2 },
      in_progress: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", text: "In Progress", icon: Clock },
      awaiting_approval: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", text: "Awaiting Approval", icon: Clock },
      completed: { color: "bg-purple-500/20 text-purple-300 border-purple-500/30", text: "Completed", icon: CheckCircle2 },
      voided: { color: "bg-red-500/20 text-red-300 border-red-500/30", text: "Voided", icon: AlertCircle }
    };

    const config = configs[status] || configs.active;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'monospace' }}>
                    Market X
                  </h1>
                  <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: 'monospace' }}>
                    Decentralized Task Marketplace with MZK Bot Security
                  </p>
                </div>
              </div>

              <Link to={createPageUrl("Pera")}>
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg shadow-cyan-500/50">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Create Task
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-white mb-1">{tasks.length}</div>
                  <div className="text-xs text-gray-400">Total Tasks</div>
                </CardContent>
              </Card>
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {tasks.filter(t => t.status === 'active').length}
                  </div>
                  <div className="text-xs text-gray-400">Active</div>
                </CardContent>
              </Card>
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </div>
                  <div className="text-xs text-gray-400">In Progress</div>
                </CardContent>
              </Card>
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {tasks.filter(t => t.status === 'completed').length}
                  </div>
                  <div className="text-xs text-gray-400">Completed</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                activeTab === 'browse'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Browse Tasks
            </button>
            {user && (
              <>
                <button
                  onClick={() => setActiveTab('my-tasks')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                    activeTab === 'my-tasks'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  My Tasks
                </button>
                <button
                  onClick={() => setActiveTab('working')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                    activeTab === 'working'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Working On
                </button>
              </>
            )}
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-black border-zinc-700 text-white"
                    />
                  </div>

                  {activeTab !== 'browse' && (
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[200px] bg-black border-zinc-700 text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="all" className="text-white">All Status</SelectItem>
                        <SelectItem value="active" className="text-white">Active</SelectItem>
                        <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                        <SelectItem value="awaiting_approval" className="text-white">Awaiting Approval</SelectItem>
                        <SelectItem value="completed" className="text-white">Completed</SelectItem>
                        <SelectItem value="voided" className="text-white">Voided</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tasks Grid */}
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <ShoppingBag className="w-20 h-20 text-gray-700 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">No Tasks Found</h2>
              <p className="text-gray-400 mb-8">
                {activeTab === 'browse' 
                  ? 'No active tasks available. Check back later!'
                  : activeTab === 'my-tasks'
                  ? 'You haven\'t created any tasks yet.'
                  : 'You\'re not working on any tasks yet.'}
              </p>
              {activeTab !== 'working' && (
                <Link to={createPageUrl("Pera")}>
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Create Task
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredTasks.map((task, index) => {
                const employerProfile = agentProfiles[task.employer_id];
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-black/80 backdrop-blur-xl border-zinc-800 hover:border-cyan-500/50 transition-all h-full group">
                      <CardHeader className="border-b border-zinc-800 pb-4">
                        {/* Agent ZK Profile Section */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-cyan-500/50">
                              {employerProfile?.agent_zk_photo ? (
                                <img 
                                  src={employerProfile.agent_zk_photo} 
                                  alt={employerProfile.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                  <Bot className="w-6 h-6 text-cyan-400" />
                                </div>
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                              <Star className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                              {employerProfile?.username || 'Agent'}
                            </div>
                            <div className="text-xs text-cyan-400 font-mono truncate">
                              {employerProfile?.agent_zk_id || task.employer_id.slice(0, 15) + '...'}
                            </div>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>

                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-bold text-white mb-2 flex-1">{task.task_name}</h3>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-cyan-400">{task.tip_amount}</div>
                            <div className="text-xs text-gray-500">KAS</div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6">
                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">{task.description}</p>

                        <div className="space-y-2 mb-4">
                          {task.worker_id && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <span className="text-gray-400">Worker:</span>
                              <span className="text-blue-400 font-mono text-xs truncate">
                                {task.worker_id.slice(0, 20)}...
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-gray-400">MZK Bot:</span>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              {task.balance_verified ? '✓ Secured' : 'Verifying...'}
                            </Badge>
                          </div>

                          {task.proof_score && (
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <span className="text-gray-400">Quality:</span>
                              <span className="text-purple-400 font-semibold">{task.proof_score}/100</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {task.status === 'active' && activeTab === 'browse' && (
                          <Button
                            onClick={() => handleAcceptTask(task)}
                            disabled={!user || task.employer_id === user?.email}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                          >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Accept Task
                          </Button>
                        )}

                        {task.status === 'in_progress' && task.worker_id === user?.email && (
                          <Link to={`${createPageUrl("WorkerTask")}?id=${task.id}`}>
                            <Button className="w-full bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30">
                              <Clock className="w-4 h-4 mr-2" />
                              Submit Proof
                            </Button>
                          </Link>
                        )}

                        {task.status === 'awaiting_approval' && task.employer_id === user?.email && (
                          <Link to={`${createPageUrl("EmployerTask")}?id=${task.id}`}>
                            <Button className="w-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Review & Approve
                            </Button>
                          </Link>
                        )}

                        {task.status === 'completed' && (
                          <Badge className="w-full bg-purple-500/20 text-purple-400 border-purple-500/30 justify-center py-2">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Completed
                          </Badge>
                        )}

                        {task.status === 'voided' && (
                          <Badge className="w-full bg-red-500/20 text-red-400 border-red-500/30 justify-center py-2">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Voided
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}