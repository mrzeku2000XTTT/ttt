import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Phone, PhoneCall, PhoneOff, Wallet, RefreshCw, User, LogIn, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RufzeitKHome() {
  const navigate = useNavigate();
  const pollRef = useRef(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [kaspaAddress, setKaspaAddress] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(null); // userId being called
  const [callStatus, setCallStatus] = useState(null); // { sessionId, targetName, status: 'ringing'|'declined'|'missed' }
  const [incomingCall, setIncomingCall] = useState(null);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    upsertRufzeitKUser(user);
    loadUsers();

    // Poll for incoming + call status every 4 seconds (reduce rate limit hits)
    pollRef.current = setInterval(() => {
      checkIncomingCalls();
      if (callStatus?.status === "ringing") checkCallAccepted();
    }, 4000);

    const handleUnload = () => markOffline();
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(pollRef.current);
      window.removeEventListener("beforeunload", handleUnload);
      markOffline();
    };
  }, [user, callStatus]);

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

  const upsertRufzeitKUser = async (me) => {
    try {
      const existing = await base44.entities.RufzeitKUser.filter({ email: me.email });
      const data = {
        is_online: true,
        last_seen: new Date().toISOString(),
        full_name: me.full_name || "",
        kaspa_address: me.kaspa_address || ""
      };
      if (existing.length > 0) {
        await base44.entities.RufzeitKUser.update(existing[0].id, data);
      } else {
        await base44.entities.RufzeitKUser.create({ email: me.email, ...data });
      }
    } catch {}
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

  const loadUsers = async () => {
    try {
      const all = await base44.entities.RufzeitKUser.list();
      setUsers(all.filter(u => u.email !== user?.email));
    } catch {}
  };

  const checkIncomingCalls = async () => {
    if (!user) return;
    try {
      const pending = await base44.entities.CallSession.filter({
        receiver_email: user.email,
        status: "pending"
      });
      setIncomingCall(pending.length > 0 ? pending[0] : null);
    } catch {}
  };

  const checkCallAccepted = async () => {
    if (!callStatus?.sessionId) return;
    try {
      const sessions = await base44.entities.CallSession.filter({ id: callStatus.sessionId });
      if (sessions.length > 0) {
        const s = sessions[0];
        if (s.status === "active") {
          // Receiver accepted — join the call
          clearInterval(pollRef.current);
          navigate(createPageUrl(`RufzeitKCall?room=${s.room_name}&role=caller`));
        } else if (s.status === "declined") {
          setCallStatus({ ...callStatus, status: "declined" });
          setCalling(null);
          setTimeout(() => setCallStatus(null), 3000);
        }
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
        const updated = { ...user, kaspa_address: address };
        setUser(updated);
        upsertRufzeitKUser(updated);
      } else {
        setShowManualInput(true);
      }
    } catch {
      setShowManualInput(true);
    }
    setConnectingWallet(false);
  };

  const saveManualAddress = async () => {
    if (!manualAddress.trim()) return;
    const addr = manualAddress.trim();
    await base44.auth.updateMe({ kaspa_address: addr });
    setKaspaAddress(addr);
    const updated = { ...user, kaspa_address: addr };
    setUser(updated);
    setShowManualInput(false);
    setManualAddress("");
    upsertRufzeitKUser(updated);
  };

  const startCall = async (targetUser) => {
    if (calling) return;
    setCalling(targetUser.id);

    try {
      const res = await base44.functions.invoke("createJitsiRoom", {
        caller_email: user.email,
        receiver_email: targetUser.email
      });
      const roomName = res.data.room_name;

      const session = await base44.entities.CallSession.create({
        caller_email: user.email,
        receiver_email: targetUser.email,
        caller_kaspa_address: kaspaAddress || "",
        receiver_kaspa_address: targetUser.kaspa_address || "",
        room_name: roomName,
        status: "pending"
      });

      setCallStatus({
        sessionId: session.id,
        targetName: targetUser.full_name || targetUser.email,
        roomName,
        status: "ringing"
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      setCalling(null);
    }
  };

  const cancelCall = async () => {
    if (callStatus?.sessionId) {
      await base44.entities.CallSession.update(callStatus.sessionId, { status: "missed" }).catch(() => {});
    }
    setCalling(null);
    setCallStatus(null);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    await base44.entities.CallSession.update(incomingCall.id, {
      status: "active",
      started_at: new Date().toISOString()
    });
    setIncomingCall(null);
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
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7a9ae8d5f_image.png"
          alt="RufzeitK"
          className="w-24 h-24 rounded-3xl shadow-2xl"
        />
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

      {/* ===== INCOMING CALL OVERLAY ===== */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-6"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-[0_0_60px_rgba(6,182,212,0.5)]"
            >
              {(incomingCall.caller_email || "?")[0].toUpperCase()}
            </motion.div>

            <div className="text-white/50 text-sm">Incoming call from</div>
            <div className="text-white font-bold text-2xl">{incomingCall.caller_email}</div>
            {incomingCall.caller_kaspa_address && (
              <div className="text-cyan-400 text-xs font-mono bg-cyan-500/10 px-3 py-1 rounded-full">
                {shortAddr(incomingCall.caller_kaspa_address)}
              </div>
            )}

            <div className="flex gap-8 mt-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={declineCall}
                  className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
                >
                  <Phone className="w-7 h-7 text-white rotate-[135deg]" />
                </button>
                <span className="text-white/40 text-xs">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={acceptCall}
                  className="w-[72px] h-[72px] rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg shadow-green-500/30"
                >
                  <PhoneCall className="w-7 h-7 text-white" />
                </button>
                <span className="text-white/40 text-xs">Accept</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CALLING / RINGING OVERLAY ===== */}
      <AnimatePresence>
        {callStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-6"
          >
            {callStatus.status === "ringing" && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-4xl font-black shadow-[0_0_60px_rgba(6,182,212,0.4)]"
                >
                  {(callStatus.targetName || "?")[0].toUpperCase()}
                </motion.div>
                <div className="text-white font-bold text-2xl">{callStatus.targetName}</div>
                <div className="text-white/50 text-sm">Calling...</div>
                <div className="flex gap-1 mt-2">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-cyan-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay }}
                    />
                  ))}
                </div>
                <button
                  onClick={cancelCall}
                  className="mt-6 w-[72px] h-[72px] rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
                <span className="text-white/40 text-xs">Cancel</span>
              </>
            )}
            {callStatus.status === "declined" && (
              <>
                <X className="w-16 h-16 text-red-500" />
                <div className="text-white font-bold text-xl">{callStatus.targetName}</div>
                <div className="text-red-400 text-sm">Call declined</div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HEADER ===== */}
      <div className="p-6 border-b border-white/10">
        <div className="max-w-lg mx-auto flex items-center gap-4 mb-4">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7a9ae8d5f_image.png"
            alt="RufzeitK"
            className="w-12 h-12 rounded-2xl"
          />
          <div>
            <h1 className="text-2xl font-black text-white leading-none">RufzeitK</h1>
            <p className="text-white/40 text-xs">One-on-one video calls · Kaspa</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          {kaspaAddress ? (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
              <Wallet className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-green-400 text-xs font-semibold">Wallet Connected</div>
                <div className="text-white/50 text-xs font-mono truncate">{kaspaAddress}</div>
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
                <span className="text-sm font-semibold">Connect Kaspa Wallet</span>
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

      {/* ===== USERS LIST ===== */}
      <div className="max-w-lg mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/60 text-sm font-semibold uppercase tracking-wider">
            Users ({users.length})
          </h2>
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
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {(u.full_name || u.email || "?")[0].toUpperCase()}
                  </div>
                  {u.is_online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-black" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">
                    {u.full_name || u.email}
                  </div>
                  {u.kaspa_address ? (
                    <div className="text-green-400/70 text-xs font-mono truncate mt-0.5">
                      {shortAddr(u.kaspa_address)}
                    </div>
                  ) : (
                    <div className="text-white/30 text-xs mt-0.5">No wallet</div>
                  )}
                  {u.is_online && <div className="text-green-400 text-[10px] mt-0.5">● Online</div>}
                </div>

                <button
                  onClick={() => startCall(u)}
                  disabled={!!calling}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl px-4 py-2.5 transition-colors flex-shrink-0"
                >
                  <Video className="w-4 h-4" />
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