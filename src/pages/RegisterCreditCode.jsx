import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, User } from "lucide-react";
import { motion } from "framer-motion";

export default function RegisterCreditCodePage() {
  const [step, setStep] = useState("register"); // register, verify-pin
  const [kaspaAddress, setKaspaAddress] = useState("");
  const [tttId, setTttId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [generatedPin, setGeneratedPin] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!kaspaAddress || !tttId || !password || !confirmPassword) {
        setError("All fields are required");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      // Generate PIN
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPin(newPin);

      setStep("verify-pin");
      setLoading(false);
    } catch (err) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    setError("");

    if (pin !== generatedPin) {
      setError("Invalid PIN.");
      return;
    }

    // Store registration data
    localStorage.setItem('creditcode_user', JSON.stringify({
      kaspa_address: kaspaAddress,
      ttt_id: tttId,
      password: btoa(password),
      registered_at: new Date().toISOString()
    }));

    alert("Registration successful! Please log in.");
    window.location.href = createPageUrl("CreditCode");
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
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <Link to={createPageUrl("CreditCode")}>
          <Button variant="ghost" className="text-white/60 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
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
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              
              {/* Black glass box */}
              <div className="relative w-full h-full bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                
                {/* Diamond inside */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/5cb60841a_image.png" alt="Diamond" className="w-16 h-16" />
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
              className="text-4xl font-black text-center mt-6 text-cyan-400"
            >
              CreditCode
            </motion.h1>
            <p className="text-center text-white/40 text-sm mt-2">Create Your Diamond Account</p>
          </motion.div>

          {/* Registration form */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-cyan-400" />
              {step === "register" ? "Register" : "Verify PIN"}
            </h2>

            {step === "register" ? (
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Kaspa Address */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Kaspa Address
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      type="text"
                      placeholder="kaspa1... or zkaspa1..."
                      value={kaspaAddress}
                      onChange={(e) => setKaspaAddress(e.target.value)}
                      className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                      required
                    />
                  </div>
                </div>

                {/* TTT ID */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    TTT ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      type="text"
                      placeholder="Your TTT ID"
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
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

                {/* Register button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Enter Your PIN
                  </label>
                  <p className="text-white/50 text-xs mb-3">
                    PIN: <span className="text-cyan-400 font-bold text-sm">{generatedPin}</span>
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
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50"
                >
                  Verify & Complete Registration
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setStep("register");
                    setError("");
                    setPin("");
                  }}
                  variant="ghost"
                  className="w-full text-white/60 hover:text-white"
                >
                  Back to Registration
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}