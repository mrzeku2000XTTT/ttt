import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { PhoneOff, RefreshCw, ExternalLink } from "lucide-react";

export default function RufzeitKCall() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callSession, setCallSession] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get("room");
  const role = urlParams.get("role");

  useEffect(() => {
    loadUserAndInit();
  }, []);

  const loadUserAndInit = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
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
    } catch (err) {
      console.error("Failed to init call:", err);
    }
    setLoading(false);
  };

  const handleHangup = async () => {
    if (callSession) {
      await base44.entities.CallSession.update(callSession.id, {
        status: "ended",
        ended_at: new Date().toISOString()
      }).catch(() => {});
    }
    navigate(createPageUrl("RufzeitKHome"));
  };

  if (loading || !roomName) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-white/60">Connecting...</p>
        </div>
      </div>
    );
  }

  // Build Jitsi URL with user display name
  const displayName = encodeURIComponent(user?.full_name || user?.email || "User");
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Jitsi iframe - full Jitsi UI with all native controls */}
      <iframe
        src={jitsiUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        style={{ flex: 1, width: "100%", border: "none", minHeight: 0 }}
        title="RufzeitK Video Call"
      />

      {/* Hangup overlay button */}
      <div className="flex items-center justify-center gap-4 bg-black px-6 py-4 border-t border-white/10">
        <span className="text-white/40 text-xs font-mono truncate max-w-xs">{roomName}</span>
        <button
          onClick={handleHangup}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-6 py-3 transition-colors"
        >
          <PhoneOff className="w-5 h-5" />
          <span>End Call</span>
        </button>
        <a
          href={`https://meet.jit.si/${roomName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-cyan-400/60 hover:text-cyan-400 text-xs transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in new tab
        </a>
      </div>
    </div>
  );
}