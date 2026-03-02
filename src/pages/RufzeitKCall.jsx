import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { PhoneOff, Mic, MicOff, Video, VideoOff, RefreshCw } from "lucide-react";

export default function RufzeitKCall() {
  const navigate = useNavigate();
  const jitsiContainer = useRef(null);
  const jitsiApi = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callSession, setCallSession] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get("room");
  const role = urlParams.get("role");

  useEffect(() => {
    loadUserAndInit();
    return () => {
      if (jitsiApi.current) {
        jitsiApi.current.dispose();
      }
    };
  }, []);

  const loadUserAndInit = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      await loadCallSession(me);
      initJitsi(me);
    } catch (err) {
      console.error("Failed to init call:", err);
    }
    setLoading(false);
  };

  const loadCallSession = async (me) => {
    if (!roomName) return;
    try {
      const sessions = await base44.entities.CallSession.filter({ room_name: roomName });
      if (sessions.length > 0) {
        setCallSession(sessions[0]);
        // Update to active if receiver just joined
        if (role === "receiver" && sessions[0].status === "pending") {
          await base44.entities.CallSession.update(sessions[0].id, {
            status: "active",
            started_at: new Date().toISOString()
          });
        }
      }
    } catch {}
  };

  const initJitsi = (me) => {
    if (!roomName || !jitsiContainer.current) return;

    // Load Jitsi External API script dynamically
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => {
      if (!window.JitsiMeetExternalAPI) return;

      const domain = "meet.jit.si";
      const options = {
        roomName: roomName,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainer.current,
        userInfo: {
          displayName: me.full_name || me.email,
          email: me.email
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableNoisyMicDetection: false
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [],
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          MOBILE_APP_PROMO: false
        }
      };

      jitsiApi.current = new window.JitsiMeetExternalAPI(domain, options);

      jitsiApi.current.addEventListeners({
        readyToClose: handleHangup,
        participantLeft: (e) => {
          // If other participant left, end call
          handleHangup();
        }
      });
    };
    document.head.appendChild(script);
  };

  const handleHangup = async () => {
    if (jitsiApi.current) {
      jitsiApi.current.dispose();
      jitsiApi.current = null;
    }
    if (callSession) {
      await base44.entities.CallSession.update(callSession.id, {
        status: "ended",
        ended_at: new Date().toISOString()
      }).catch(() => {});
    }
    navigate(createPageUrl("RufzeitKHome"));
  };

  const toggleMute = () => {
    if (jitsiApi.current) {
      jitsiApi.current.executeCommand("toggleAudio");
      setMuted(m => !m);
    }
  };

  const toggleVideo = () => {
    if (jitsiApi.current) {
      jitsiApi.current.executeCommand("toggleVideo");
      setVideoOff(v => !v);
    }
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

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Jitsi Video Container */}
      <div ref={jitsiContainer} className="flex-1 w-full" style={{ minHeight: 0 }} />

      {/* Custom Controls */}
      <div className="flex items-center justify-center gap-6 bg-black/80 backdrop-blur-xl px-6 py-5 border-t border-white/10">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            muted ? "bg-red-600 hover:bg-red-700" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {muted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={handleHangup}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            videoOff ? "bg-red-600 hover:bg-red-700" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {videoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  );
}