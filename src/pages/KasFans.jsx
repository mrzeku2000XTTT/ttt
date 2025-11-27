import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Heart, TrendingUp, Star, Award, Shield, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KasFansPage() {
  const [user, setUser] = useState(null);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    checkVerification();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const checkVerification = () => {
    const isVerified = localStorage.getItem('civic_verified') === 'true';
    setVerified(isVerified);
    setChecking(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950/30 via-black to-orange-900/25 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-black/60 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Age Verification Required
            </h2>
            
            <p className="text-white/60 mb-6">
              This content is restricted to adults 18+. Please verify your age to continue.
            </p>

            <Button
              onClick={() => navigate(createPageUrl('CivicVerify'))}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold h-12 mb-3"
            >
              <Shield className="w-5 h-5 mr-2" />
              Verify Age
            </Button>

            <Button
              onClick={() => navigate(createPageUrl('Categories'))}
              variant="ghost"
              className="w-full text-white/60 hover:text-white"
            >
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950/30 via-black to-blue-900/25 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl mb-4">
            <Users className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 text-white">
            KAS Fans
          </h1>
          <p className="text-white/50 text-lg">Community of KAS enthusiasts</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Fan Rankings</h3>
              </div>
              <p className="text-white/60 text-sm">
                Top KAS supporters and community members
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-pink-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Achievements</h3>
              </div>
              <p className="text-white/60 text-sm">
                Earn badges for your contributions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Fan Activity</h3>
              </div>
              <p className="text-white/60 text-sm">
                Track your engagement and contributions
              </p>
            </CardContent>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-white/60">
              KAS Fans is launching soon with exclusive features for the community
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}