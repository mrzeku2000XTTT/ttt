import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Phone, PhoneCall, Wallet, RefreshCw, User, X, Clock, Plus, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TopupModal from "@/components/rufzeitk/TopupModal";
import BypassCodeModal from "@/components/rufzeitk/BypassCodeModal";

const LOCAL_KEY = "rufzeitk_identity";
const BYPASS_KEY = "rufzeitk_bypass";

export default function RufzeitKHome() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState(null); // { kaspaAddress, displayName, rufUserId }
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callCredits, setCallCredits] = useState(0);
  const [showTopup, setShowTopup] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const [hasBypass, setHasBypass] = useState(false);

  // Setup form
  const [setupAddress, setSetupAddress] = useState("");
  const [setupName, setSetupName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      try { setIdentity(JSON.parse(saved)); } catch {}
    }
    setHasBypass(localStorage.getItem(BYPASS_KEY) === "true");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!identity) return;
    registerAndLoad();
    const interval = setInterval(checkIncomingCalls, 8000);
    const handleUnload = () => markOffline();
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      markOffline();
    };
  }, [identity]);

  const registerAndLoad = async () => {
    if (!identity) return;
    try {
      const existing = await base44.entities.RufzeitKUser.filter({ kaspa_address: identity.kaspaAddress });
      if (existing.length > 0) {
        await base44.entities.RufzeitKUser.update(existing[0].id, {
          is_online: true,
          last_seen: new Date().toISOString(),
          full_name: identity.displayName
        });
        setCallCredits(existing[0].call_credits || 0);
        setIdentity(prev => ({ ...prev, rufUserId: existing[0].id }));
      } else {
        const created = await base44.entities.RufzeitKUser.create({
          email: identity.kaspaAddress, // use address as unique key
          full_name: identity.displayName,
          kaspa_address: identity.kaspaAddress,
          is_online: true,
          last_seen: new Date().toISOString(),
          call_credits: 0
        });
        setIdentity(prev => ({ ...prev, rufUserId: created.id }));
      }
    } catch (err) {
      console.error("Failed to register:", err);
    }
    loadUsers();
  };

  const markOffline = async () => {
    if (!identity?.rufUserId) return;
    try {
      await base44.entities.RufzeitKUser.update(identity.rufUserId, { is_online: false });
    } catch {}
  };

  const loadUsers = async () => {
    try {
      const allUsers = await base44.entities.RufzeitKUser.list();
      setUsers(allUsers.filter(u => u.kaspa_address !== identity?.kaspaAddress));
    } catch {}
  };

  const checkIncomingCalls = async () => {
    if (!identity) return;
    try {
      const pending = await base44.entities.CallSession.filter({
        receiver_email: identity.kaspaAddress,
        status: "pending"
      });
      setIncomingCall(pending.length > 0 ? pending[0] : null);
    } catch {}
  };

  const connectKasware = async () => {
    setConnecting(true);
    setSetupError("");
    try {
      if (window.kasware) {
        const accounts = await window.kasware.requestAccounts();
        setSetupAddress(accounts[0]);
      } else {
        setSetupError("Kasware wallet not found. Please enter your address manually.");
      }
    } catch (err) {
      setSetupError("Could not connect Kasware. Enter address manually.");
    }
    setConnecting(false);
  };

  const saveIdentity = async () => {
    const addr = setupAddress.trim();
    const name = setupName.trim();
    if (!addr) { setSetupError("Please enter a Kaspa address."); return; }
    if (!name) { setSetupError("Please enter a display name."); return; }
    if (!addr.startsWith("kaspa:")) { setSetupError("Address must start with 'kaspa:'"); return; }
    const id = { kaspaAddress: addr, displayName: name, rufUserId: null };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(id));
    setIdentity(id);
  };

  const disconnect = () => {
    markOffline();
    localStorage.removeItem(LOCAL_KEY);
    setIdentity(null);
    setUsers([]);
    setCallCredits(0);
  };

  const startCall = async (targetUser) => {
    if (callCredits < 1 && !hasBypass) { setShowTopup(true); return; }
    setCalling(targetUser.id);
    try {
      const res = await base44.functions.invoke("createJitsiRoom", {
        caller_email: identity.kaspaAddress,
        receiver_email: targetUser.kaspa_address || targetUser.email
      });
      const roomName = res.data.room_name;
      await base44.entities.CallSession.create({
        caller_email: identity.kaspaAddress,
        receiver_email: targetUser.kaspa_address || targetUser.email,
        caller_kaspa_address: identity.kaspaAddress,
        receiver_kaspa_address: targetUser.kaspa_address || "",
        room_name: roomName,
        status: "pending"
      });
      navigate(createPageUrl(`RufzeitKCall?room=${roomName}&role=caller`));
    } catch (err) {
      console.error("Failed to start call:", err);
    }
    setCalling(null);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    await base44.entities.CallSession.update(incomingCall.id, { status: "active", started_at: new Date().toISOString() });
    navigate(createPageUrl(`RufzeitKCall?room=${incomingCall.room_name}&role=receiver`));
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    await base44.entities.CallSession.update(incomingCall.id, { status: "declined" });
    setIncomingCall(null);
  };

  const shortAddr = (addr) => addr ? `${addr.slice(0, 10)}...${addr.slice(-6)}` : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Setup screen (no login required)
  if (!identity) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-5xl font-black text-white mb-2">RufzeitK</h1>
            <p className="text-white/50">One-on-one video calls · Powered by Kaspa</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg">Connect Your Wallet</h2>

            <button
              onClick={connectKasware}
              disabled={connecting}
              className="w-full flex items-center justify-center gap-2 bg-cyan-500/20 border border-cyan-500/40 rounded-xl px-4 py-3 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
            >
              {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              <span className="font-semibold text-sm">
                {window.kasware ? "Connect Kasware" : "Auto-detect Kasware"}
              </span>
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 h-px bg-white/10" />
              <span className="px-3 text-white/30 text-xs">or enter manually</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-white/50 text-xs mb-1 block">Kaspa Address</label>
                <Input
                  value={setupAddress}
                  onChange={e => setSetupAddress(e.target.value)}
                  placeholder="kaspa:qr..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm"
                />
                {setupAddress.startsWith("kaspa:") && (
                  <div className="flex items-center gap-1 mt-1 text-green-400 text-xs">
                    <CheckCircle className="w-3 h-3" /> Valid address
                  </div>
                )}
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Display Name</label>
                <Input
                  value={setupName}
                  onChange={e => setSetupName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm"
                />
              </div>
            </div>

            {setupError && (
              <p className="text-red-400 text-xs">{setupError}</p>
            )}

            <Button
              onClick={saveIdentity}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
            >
              Enter RufzeitK
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-black text-white">
      {/* Incoming call overlay */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-0 right-0 z-[999] bg-gradient-to-b from-green-900 to-black p-6 flex flex-col items-center gap-4 shadow-2xl"
          >
            <div className="text-white/60 text-sm">Incoming call from</div>
            <div className="text-white font-bold text-xl">{incomingCall.caller_kaspa_address ? shortAddr(incomingCall.caller_kaspa_address) : incomingCall.caller_email}</div>
            <div className="flex gap-4">
              <button onClick={declineCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors">
                <Phone className="w-7 h-7 text-white rotate-[135deg]" />
              </button>
              <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors animate-pulse">
                <PhoneCall className="w-7 h-7 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="max-w-lg mx-auto">
          <h1 className="text-4xl font-black text-white mb-1">RufzeitK</h1>
          <p className="text-white/40 text-sm">One-on-one video calls · Powered by Kaspa</p>

          {/* Identity card */}
          <div className="mt-4 flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
            <Wallet className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-green-400 text-xs font-semibold">{identity.displayName}</div>
              <div className="text-white/50 text-xs font-mono truncate">{shortAddr(identity.kaspaAddress)}</div>
            </div>
            <button onClick={disconnect} className="flex items-center gap-1 text-red-400/70 hover:text-red-400 text-xs transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          </div>

          {/* Credits Balance */}
          <div className="mt-3 flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-cyan-400 text-xs font-semibold">Call Credits</div>
              <div className="text-white font-black text-lg leading-none">{callCredits} <span className="text-white/40 text-xs font-normal">minutes</span></div>
            </div>
            <button
              onClick={() => setShowTopup(true)}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs rounded-lg px-3 py-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Top Up
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="max-w-lg mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Online Users</h2>
          <button onClick={loadUsers} className="text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No other users yet</p>
            <p className="text-xs mt-1">Invite others to join RufzeitK</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                  {(u.full_name || u.kaspa_address || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm truncate">{u.full_name || shortAddr(u.kaspa_address)}</span>
                    {u.is_online && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />}
                  </div>
                  {u.kaspa_address && (
                    <div className="text-green-400/70 text-xs font-mono truncate mt-0.5">{shortAddr(u.kaspa_address)}</div>
                  )}
                </div>
                <button
                  onClick={() => startCall(u)}
                  disabled={calling === u.id}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-bold rounded-xl px-4 py-2 transition-colors flex-shrink-0"
                >
                  {calling === u.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                  <span className="text-sm">Call</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>

    <AnimatePresence>
      {showTopup && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onSuccess={(credits) => {
            setCallCredits(prev => prev + credits);
            setShowTopup(false);
          }}
          kaspaAddress={identity?.kaspaAddress}
          rufUserId={identity?.rufUserId}
        />
      )}
    </AnimatePresence>
    </>
  );
}