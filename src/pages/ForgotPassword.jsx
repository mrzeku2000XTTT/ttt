import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch (err) {
      // Always show generic success regardless of outcome.
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-white font-black text-4xl tracking-tight">TTT</span>
          <p className="mt-2 text-white/50 text-sm">Reset your password</p>
        </div>

        {sent ? (
          <p className="text-center text-white/70 text-sm">
            If an account exists for <span className="text-white">{email}</span>, a password reset link has been sent.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input type="email" required placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-white/50 text-sm">
          <Link to="/login" className="text-cyan-400 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}