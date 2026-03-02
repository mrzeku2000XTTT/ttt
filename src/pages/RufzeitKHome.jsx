import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Video, Phone, PhoneCall, Wallet, RefreshCw, User, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RufzeitKHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [kaspaAddress, setKaspaAddress] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Upsert this user into RufzeitKUser so they appear to others
    upsertRufzeitKUser(user);

    // Load other users
    loadUsers();

    // Poll for incoming calls every 3 seconds
    const interval = setInterval(checkIncomingCalls, 3000);

    // Mark offline on exit
    const handleUnload = () => markOffline();
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      markOffline();
    };
  }, [user]);

  const upsertRufzeitKUser = async (me) => {
    try {
      const existing = await base44.entities.RufzeitKUser.filter({ email: me.email });
      if (existing.length > 0) {
        await base44.entities.RufzeitKUser.update(existing[0].id, {
          is_online: true,
          last_seen: new Date().toISOString(),
          full_name: me.full_name || "",
          kaspa_address: me.kaspa_address || existing[0].kaspa_address || ""
        });
      } else {
        await base44.entities.RufzeitKUser.create({
          email: me.email,
          full_name: me.full_name || "",
          kaspa_address: me.kaspa_address || "",
          is_online: true,
          last_seen: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Failed to upsert RufzeitKUser:", err);
    }
  };

  const markOffline = async () => {
    if (!user) return;
    try {
      const existing = await base44.entities.RufzeitKUser.filter({ email: user.email });
      if (existing.length > 0) {
        await base44.entities.RufzeitKUser.update(existing[0].id, { is_online: false });
      }
    } catch {}
  };

  const loadUser = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      setUser(me);
      setKaspaAddress(me.kaspa_address || "");
    } catch {
      setUser(null);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const allUsers = await base44.entities.RufzeitKUser.list();
      setUsers(allUsers.filter(u => u.email !== user?.email));
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const checkIncomingCalls = async () => {
    if (!user) return;
    try {
      const pending = await base44.entities.CallSession.filter({
        receiver_email: user.email,
        status: "pending"
      });
      if (pending.length > 0) {
        setIncomingCall(pending[0]);
      } else {
        setIncomingCall(null);
      }
    } catch {}
  };

  const connectKasware = async () => {
    setConnectingWallet(true);
    try {
      if (window.kasware) {
        const accounts = await window.kasware.requestAccounts();
        const address = accounts[0];
        await base44.auth.updateMe({ kaspa_address: address });
        setKaspaAddress(address);
        setUser(prev => ({ ...prev, kaspa_address: address }));
      } else {
        setShowManualInput(true);
      }
    } catch (err) {
      console.error("Kasware connect failed:", err);
      setShowManualInput(true);
    }
    setConnectingWallet(false);
  };

  const saveManualAddress = async () => {
    if (!manualAddress.trim()) return;
    await base44.auth.updateMe({ kaspa_address: manualAddress.trim() });
    setKaspaAddress(manualAddress.trim());
    setUser(prev => ({ ...prev, kaspa_address: manualAddress.trim() }));
    setShowManualInput(false);
    setManualAddress("");
  };

  const startCall = async (targetUser) => {
    setCalling(targetUser.id);
    try {
      const res = await base44.functions.invoke("createJitsiRoom", {
        caller_email: user.email,
        receiver_email: targetUser.email
      });
      const roomName = res.data.room_name;

      // Create call session
      await base44.entities.CallSession.create({
        caller_email: user.email,
        receiver_email: targetUser.email,
        caller_kaspa_address: kaspaAddress || "",
        receiver_kaspa_address: targetUser.kaspa_address || "",
        room_name: roomName,
        status: "pending"
      });

      // Navigate to call page
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

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center">
          <h1 className="text-5xl font-black text-white mb-2">RufzeitK</h1>
          <p className="text-white/50 text-lg">One-on-one encrypted video calls</p>
        </div>
        <Button
          onClick={() => base44.auth.redirectToLogin(createPageUrl("RufzeitKHome"))}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 py-3 text-lg"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Login to Start Calling
        </Button>
      </div>
    );
  }

  return (
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
            <div className="text-white font-bold text-xl">{incomingCall.caller_email}</div>
            {incomingCall.caller_kaspa_address && (
              <div className="text-green-400 text-xs font-mono">{shortAddr(incomingCall.caller_kaspa_address)}</div>
            )}
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

          {/* Wallet Status */}
          <div className="mt-4">
            {kaspaAddress ? (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <Wallet className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div>
                  <div className="text-green-400 text-xs font-semibold">Kaspa Wallet Connected</div>
                  <div className="text-white/50 text-xs font-mono">{shortAddr(kaspaAddress)}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={connectKasware}
                  disabled={connectingWallet}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-500/20 border border-cyan-500/40 rounded-xl px-4 py-3 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                >
                  {connectingWallet ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  <span className="text-sm font-semibold">
                    {window.kasware ? "Connect Kasware Wallet" : "Enter Kaspa Address"}
                  </span>
                </button>
                <AnimatePresence>
                  {showManualInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2"
                    >
                      <Input
                        value={manualAddress}
                        onChange={e => setManualAddress(e.target.value)}
                        placeholder="kaspa:qr..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                      />
                      <Button onClick={saveManualAddress} size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold whitespace-nowrap">
                        Save
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="max-w-lg mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Users</h2>
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
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                  {(u.full_name || u.email || "?")[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm truncate">
                      {u.full_name || u.email}
                    </span>
                    {u.is_online && (
                      <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
                    )}
                  </div>
                  {u.kaspa_address ? (
                    <div className="text-green-400/70 text-xs font-mono truncate mt-0.5">
                      {shortAddr(u.kaspa_address)}
                    </div>
                  ) : (
                    <div className="text-white/30 text-xs mt-0.5">No wallet connected</div>
                  )}
                </div>

                {/* Call Button */}
                <button
                  onClick={() => startCall(u)}
                  disabled={calling === u.id}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-bold rounded-xl px-4 py-2 transition-colors flex-shrink-0"
                >
                  {calling === u.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  <span className="text-sm">Call</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}