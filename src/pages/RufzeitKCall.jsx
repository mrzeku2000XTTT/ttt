import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { PhoneOff, RefreshCw, Copy, Check } from "lucide-react";

const APP_ID = "vpaas-magic-cookie-6d8ee8df5feb4465a4186740b0dd5b55";

export default function RufzeitKCall() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [callSession, setCallSession] = useState(null);
  const [copied, setCopied] = useState(false);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [credits, setCredits] = useState(0);
  const creditTimerRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get("room");
  const role = urlParams.get("role");

  useEffect(() => {
    init();
    return () => {
      if (apiRef.current) apiRef.current.dispose();
      if (creditTimerRef.current) clearInterval(creditTimerRef.current);
    };
  }, []);

  const init = async () => {
    // Load identity from localStorage (no login required)
    let identity = null;
    try {
      const saved = localStorage.getItem("rufzeitk_identity");
      if (saved) identity = JSON.parse(saved);
    } catch {}

    try {
      if (roomName) {
        const sessions = await base44.entities.CallSession.filter({ room_name: roomName });
        if (sessions.length > 0) {
          setCallSession(sessions[0]);
          if (role === "receiver" && sessions[0].status === "pending") {
            await base44.entities.CallSession.update(sessions[0].id, {
              status: "active",
              started_at: new Date().toISOString()
            });
          }
        }
      }

      // Load user credits from RufzeitKUser by kaspa address
      if (identity?.kaspaAddress) {
        try {
          const rufUsers = await base44.entities.RufzeitKUser.filter({ kaspa_address: identity.kaspaAddress });
          if (rufUsers.length > 0) setCredits(rufUsers[0].call_credits || 0);
        } catch {}
      }

      // Load JaaS external API script
      const script = document.createElement("script");
      script.src = `https://8x8.vc/${APP_ID}/external_api.js`;
      script.async = true;
      script.onload = () => {
        if (!containerRef.current) return;
        const jaasRoomName = `${APP_ID}/${roomName || "RufzeitKDefaultRoom"}`;
        apiRef.current = new window.JitsiMeetExternalAPI("8x8.vc", {
          roomName: jaasRoomName,
          parentNode: containerRef.current,
          userInfo: {
            displayName: identity?.displayName || identity?.kaspaAddress || "User",
            email: identity?.kaspaAddress || ""
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true
          }
        });

        apiRef.current.addEventListeners({
          readyToClose: handleHangup
        });

        setLoading(false);

        // Deduct 1 credit per minute if caller (when other user joins)
          let participantCount = 1;
          if (role === "caller" && apiRef.current) {
            apiRef.current.addEventListeners({
              participantJoined: () => {
                participantCount = 2;
                console.log("Participant joined, starting credit deduction");
                if (!creditTimerRef.current) startCreditTimer();
              },
              participantLeft: () => {
                participantCount = 1;
              }
            });
          }

          const startCreditTimer = () => {
            creditTimerRef.current = setInterval(async () => {
              setMinutesUsed(prev => prev + 1);
              setCredits(prev => {
                const newCredits = Math.max(0, prev - 1);
                base44.entities.RufzeitKUser.filter({ kaspa_address: identity.kaspaAddress }).then(users => {
                  if (users.length > 0) {
                    base44.entities.RufzeitKUser.update(users[0].id, { call_credits: newCredits });
                  }
                }).catch(() => {});
                if (newCredits <= 0) handleHangup();
                return newCredits;
              });
            }, 60000);
          };
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error("Failed to init call:", err);
      setLoading(false);
    }
  };

  const handleHangup = async () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    if (callSession) {
      await base44.entities.CallSession.update(callSession.id, {
        status: "ended",
        ended_at: new Date().toISOString()
      }).catch(() => {});
    }
    navigate(createPageUrl("RufzeitKHome"));
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 9999 }}>
      {loading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <div className="text-center text-white">
            <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-white/60">Connecting...</p>
          </div>
        </div>
      )}

      {/* JaaS container */}
      <div ref={containerRef} style={{ flex: 1, width: "100%", minHeight: 0 }} />

      {/* Hangup bar */}
      {!loading && (
        <div className="flex items-center justify-center gap-4 bg-black px-6 py-4 border-t border-white/10 flex-wrap">
          {role === "caller" && (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm">
              <span className="text-cyan-400 font-bold">{credits}</span>
              <span className="text-white/40">min left</span>
            </div>
          )}
          <button
            onClick={() => {
              const joinUrl = `${window.location.origin}/#/RufzeitKCall?room=${roomName}&role=receiver`;
              navigator.clipboard.writeText(joinUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-full px-4 py-2 text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied!" : "Copy Invite Link"}</span>
          </button>
          <button
            onClick={handleHangup}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-6 py-3 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>
      )}
    </div>
  );
}