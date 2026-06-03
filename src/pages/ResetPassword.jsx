import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const resetToken = new URLSearchParams(window.location.search).get("token");
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
      setError(err?.message || "Reset failed. The link may have expired.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl font-black text-white mb-1">New password</h1>
        <p className="text-sm text-white/50 mb-6">Choose a new password</p>

        {!resetToken ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Invalid or missing reset link.
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                required
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-500/60"
              />
              <input
                type="password"
                required
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-500/60"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-xs text-white/50">
          <Link to="/login" className="text-cyan-400 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}