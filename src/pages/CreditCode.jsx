import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function CreditCodePage() {
  const [tttId, setTttId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPinStep, setShowPinStep] = useState(false);
  const [pin, setPin] = useState("");
  const [generatedPin, setGeneratedPin] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Verify TTT ID exists
      const tttRecords = await base44.entities.TTTID.filter({
        ttt_id: tttId
      });

      if (tttRecords.length === 0) {
        setError("Invalid TTT ID");
        setLoading(false);
        return;
      }

      if (!password) {
        setError("Password required");
        setLoading(false);
        return;
      }

      // Get user email from authenticated user
      const user = await base44.auth.me();
      if (!user?.email) {
        setError("Please log in to continue");
        setLoading(false);
        return;
      }

      setUserEmail(user.email);

      // Generate 6-digit PIN
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPin(newPin);

      // Send PIN via FluxKmail
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: "CreditCode Sign In - Verification PIN",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px;">
            <h1 style="color: #06b6d4;">CreditCode Verification</h1>
            <p>Your verification PIN is:</p>
            <h2 style="background: linear-gradient(to right, #06b6d4, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 36px; letter-spacing: 8px;">${newPin}</h2>
            <p style="color: #9ca3af;">This PIN will expire in 10 minutes.</p>
            <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      });

      // Show PIN verification step
      setShowPinStep(true);
      setLoading(false);
      
    } catch (err) {
      setError(err.message || "Sign in failed");
      setLoading(false);
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    setError("");

    if (pin !== generatedPin) {
      setError("Invalid PIN. Please check your email.");
      return;
    }

    // Success - store session
    localStorage.setItem('creditcode_session', JSON.stringify({
      ttt_id: tttId,
      email: userEmail,
      timestamp: Date.now()
    }));

    alert("Sign in successful!");
    setShowPinStep(false);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className="text-white/60 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-md mx-auto mt-20">
          {/* Logo - Black Box with Diamond */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-8"
          >
            <div className="w-32 h-32 mx-auto relative group">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              
              {/* Black glass box */}
              <div className="relative w-full h-full bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                
                {/* Static Diamond inside */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-cyan-400" />
                </div>

                {/* Shine effect */}
                <motion.div
                  animate={{
                    x: [-200, 200],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
              </div>
            </div>

            {/* App name */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-center mt-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              CreditCode
            </motion.h1>
            <p className="text-center text-white/40 text-sm mt-2">Premium Diamond Access</p>
          </motion.div>

          {/* Sign in form */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-cyan-400" />
              Sign In
            </h2>

            {!showPinStep ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              {/* TTT ID */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  TTT ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    type="text"
                    placeholder="Enter your TTT ID"
                    value={tttId}
                    onChange={(e) => setTttId(e.target.value)}
                    className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                    required
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Sign in button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            ) : (
            <form onSubmit={handleVerifyPin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Verification PIN
                </label>
                <p className="text-white/50 text-xs mb-3">
                  Check your email ({userEmail}) for the 6-digit PIN
                </p>
                <Input
                  type="text"
                  placeholder="Enter 6-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50"
              >
                Verify PIN
              </Button>

              <Button
                type="button"
                onClick={() => setShowPinStep(false)}
                variant="ghost"
                className="w-full text-white/60 hover:text-white"
              >
                Back to Sign In
              </Button>
            </form>
            )}

            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="text-white/40 text-sm">
                Don't have a TTT ID?{" "}
                <Link to={createPageUrl("RegisterTTTID")} className="text-cyan-400 hover:text-cyan-300 font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}