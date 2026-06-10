import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock } from "lucide-react";

export default function Register() {
  const [step, setStep] = useState("form"); // 'form' | 'otp'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep("otp");
    } catch (err) {
      setError(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.auth.verifyOtp({ email, otpCode: otp });
      const token = res?.access_token || res?.data?.access_token;
      if (token) base44.auth.setToken(token);
      window.location.href = "/";
    } catch (err) {
      setError(err?.message || "Invalid code.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
    } catch (err) {
      setError(err?.message || "Could not resend code.");
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await base44.auth.loginWithProvider("google", window.location.origin + "/");
    } catch (err) {
      setError(err?.message || "Google sign-in failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-white font-black text-4xl tracking-tight">TTT</span>
          <p className="mt-2 text-white/50 text-sm">
            {step === "form" ? "Create your account" : "Verify your email"}
          </p>
        </div>

        {step === "form" ? (
          <>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input type="email" required placeholder="Email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input type="password" required placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input type="password" required placeholder="Confirm password" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/30 text-xs">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Button onClick={handleGoogle} variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-white/50 text-sm text-center">
              Enter the code we sent to <span className="text-white">{email}</span>
            </p>
            <Input type="text" required placeholder="Verification code" value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-center tracking-widest" />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
            </Button>
            <button type="button" onClick={handleResend} className="w-full text-cyan-400 text-sm hover:underline">
              Resend code
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-white/50 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:underline">Sign in</Link>
        </p>
        <p className="mt-4 text-center">
          <Link to="/" className="text-white/30 text-xs hover:text-white/60">← Continue as guest</Link>
        </p>
      </div>
    </div>
  );
}