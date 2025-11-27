import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Shield, DollarSign, GraduationCap, Brain, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(false);
  const [learningMode, setLearningMode] = useState(false);

  useEffect(() => {
    loadUser();
    
    if ('Notification' in window) {
      setNotifications(Notification.permission === 'granted');
    }

    const savedLearning = localStorage.getItem('learning_mode');
    if (savedLearning === 'true') {
      setLearningMode(true);
    }
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const toggleNotifications = async () => {
    if ('Notification' in window) {
      if (!notifications) {
        const permission = await Notification.requestPermission();
        setNotifications(permission === 'granted');
      } else {
        setNotifications(false);
      }
    }
  };

  const toggleLearningMode = () => {
    const newMode = !learningMode;
    setLearningMode(newMode);
    localStorage.setItem('learning_mode', newMode.toString());
    
    if (newMode) {
      alert('🎓 Learning Mode Activated!\n\nYou\'ll now see helpful tips, tutorials, and AI-powered guidance throughout the app.');
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 text-sm">Customize your TTT experience</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* ESC Portal */}
            <Card className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
              <CardHeader className="border-b border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white">Enhanced System Control</h2>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-4">
                    Access advanced system monitoring and control interface
                  </p>
                </div>
                <Link to={createPageUrl("ESC")}>
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12 text-lg font-semibold">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Enter ESC Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Learning Mode */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-white" />
                  <h2 className="text-xl font-bold text-white">Learning & Tutorials</h2>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-white font-semibold">Learning Mode</div>
                      <div className="text-gray-400 text-sm">Get AI-powered tips and tutorials</div>
                    </div>
                  </div>
                  <Switch
                    checked={learningMode}
                    onCheckedChange={toggleLearningMode}
                  />
                </div>
                
                {learningMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-purple-200">
                        <strong className="block mb-1">Learning Mode Active!</strong>
                        <p className="text-purple-300/80">
                          You'll see helpful tooltips, feature explanations, and AI-guided tutorials as you explore TTT.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-white" />
                  <h2 className="text-xl font-bold text-white">Notifications</h2>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-white" />
                    <div>
                      <div className="text-white font-semibold">Push Notifications</div>
                      <div className="text-gray-400 text-sm">Get notified about news and updates</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={toggleNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-white" />
                  <h2 className="text-xl font-bold text-white">Account</h2>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Email</div>
                  <div className="text-white">{user?.email}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Account Type</div>
                  <div className="text-white">{user?.role === 'admin' ? 'Admin' : 'User'}</div>
                </div>
                {user?.created_wallet_address && (
                  <div>
                    <div className="text-gray-400 text-sm mb-1">TTT Wallet</div>
                    <div className="text-white font-mono text-sm break-all">
                      {user.created_wallet_address}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}