import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, KeyRound, CheckCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BypassCodeModal({ onClose, onSuccess }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!code.trim()) { setError("Please enter a code."); return; }
    setLoading(true);
    setError("");
    try {
      const results = await base44.entities.RufzeitKBypassCode.filter({ code: code.trim(), is_active: true });
      if (results.length === 0) {
        setError("Invalid or expired code.");
        setLoading(false);
        return;
      }
      const bypassCode = results[0];
      // Decrement uses if not unlimited
      if (bypassCode.uses_remaining > 0) {
        const newUses = bypassCode.uses_remaining - 1;
        await base44.entities.RufzeitKBypassCode.update(bypassCode.id, {
          uses_remaining: newUses,
          is_active: newUses > 0
        });
      }
      onSuccess();
    } catch (err) {
      setError("Failed to verify code. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="w-6 h-6 text-yellow-400" />
          <h2 className="text-white font-bold text-xl">Bypass Code</h2>
        </div>
        <p className="text-white/40 text-sm mb-5">Enter an admin-provided code to call without credits.</p>

        <Input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter code..."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 mb-3 tracking-widest font-mono"
          onKeyDown={e => e.key === "Enter" && handleApply()}
        />

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <Button
          onClick={handleApply}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Apply Code
        </Button>
      </div>
    </div>
  );
}