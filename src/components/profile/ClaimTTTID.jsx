import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, CheckCircle2, Zap } from "lucide-react";

export default function ClaimTTTID({ walletAddress, username, seals, onClaimed }) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);

  const existing = seals?.find(s => s.type !== 'wallet_seal' && s.kaspa_address === walletAddress);

  const handleClaim = async () => {
    if (!walletAddress) return;
    setIsClaiming(true);
    setError(null);
    try {
      const message = `TTT-ID-CLAIM:${walletAddress}:${Date.now()}`;
      let signature = null;

      // Try Kasware signature on desktop for a real cryptographic seal
      if (window.kasware) {
        try {
          const accounts = await window.kasware.getAccounts();
          if (accounts?.[0] === walletAddress) {
            signature = await window.kasware.signMessage(message);
          }
        } catch (e) {
          console.log('Kasware sign skipped:', e);
        }
      }

      // Fallback (mobile / manual address): self-declared claim hash
      if (!signature) {
        const data = new TextEncoder().encode(message);
        const hashBuf = await crypto.subtle.digest('SHA-256', data);
        signature = 'CLAIM-' + Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
      }

      await base44.entities.TTTID.create({
        kaspa_address: walletAddress,
        seal_signature: signature,
        seal_message: message,
        ttt_id: `TTT-${walletAddress.slice(-8).toUpperCase()}`,
        display_name: username || "",
        verified_date: new Date().toISOString(),
        is_active: true,
      });

      onClaimed?.();
    } catch (err) {
      console.error('TTT ID claim failed:', err);
      setError('Failed to claim TTT ID. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (existing) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-white font-semibold text-sm">TTT ID Claimed</div>
            <div className="text-emerald-300 font-mono text-xs">{existing.ttt_id}</div>
          </div>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">Active</Badge>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-cyan-400" />
        <h3 className="text-cyan-400 font-semibold text-sm">Claim Your TTT Profile ID</h3>
      </div>
      {walletAddress ? (
        <>
          <p className="text-xs text-gray-400 mb-3">
            One-click claim using your connected wallet: <span className="font-mono text-white/70">{walletAddress.slice(0, 16)}...{walletAddress.slice(-6)}</span>
          </p>
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 font-bold"
          >
            {isClaiming ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Claim TTT ID</>
            )}
          </Button>
        </>
      ) : (
        <p className="text-xs text-gray-400">
          Connect Kasware or add your Kaspa address above to claim your TTT ID.
        </p>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}