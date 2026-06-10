import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err?.message || "Invalid email or password.");
      setLoading(false);
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
          <p className="mt-2 text-white/50 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-cyan-400 text-sm hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
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

        <p className="mt-6 text-center text-white/50 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-cyan-400 hover:underline">Sign up</Link>
        </p>
        <p className="mt-4 text-center">
          <Link to="/" className="text-white/30 text-xs hover:text-white/60">← Continue as guest</Link>
        </p>
      </div>
    </div>
  );
}