import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";

export default function ResetPassword() {
  const resetToken = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword: password });
      window.location.href = "/login";
    } catch (err) {
      setError(err?.message || "Could not reset password. The link may have expired.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-white font-black text-4xl tracking-tight">TTT</span>
          <p className="mt-2 text-white/50 text-sm">Choose a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input type="password" required placeholder="New password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input type="password" required placeholder="Confirm new password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
          </Button>
        </form>

        <p className="mt-6 text-center text-white/50 text-sm">
          <Link to="/login" className="text-cyan-400 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}