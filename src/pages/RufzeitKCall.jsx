import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { PhoneOff, Mic, MicOff, Video, VideoOff, RefreshCw } from "lucide-react";

export default function RufzeitKCall() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Connecting...");

  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get("room");
  const role = urlParams.get("role"); // "caller" or "receiver"

  useEffect(() => {
    if (!roomName) {
      navigate(createPageUrl("RufzeitKHome"));
      return;
    }
    init();
    return () => cleanup();
  }, []);

  // Once user is loaded and container is mounted, load Jitsi
  useEffect(() => {
    if (user && ready && containerRef.current && !scriptLoadedRef.current) {
      loadJitsi();
    }
  }, [user, ready]);

  const init = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      // Load + update call session
      const sessions = await base44.entities.CallSession.filter({ room_name: roomName });
      if (sessions.length > 0) {
        setSessionId(sessions[0].id);
        if (role === "receiver" && sessions[0].status === "pending") {
          await base44.entities.CallSession.update(sessions[0].id, {
            status: "active",
            started_at: new Date().toISOString()
          });
        }
      }
      setReady(true);
      setStatus("Starting video...");
    } catch (err) {
      console.error("Init error:", err);
      setStatus("Failed to connect. Please go back and try again.");
    }
  };

  const loadJitsi = () => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // Remove any existing script first
    const existing = document.getElementById("jitsi-script");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = "jitsi-script";
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => startMeeting();
    script.onerror = () => setStatus("Failed to load Jitsi. Check your connection.");
    document.head.appendChild(script);
  };

  const startMeeting = () => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) {
      setStatus("Error: Could not start meeting.");
      return;
    }

    // Clear container
    containerRef.current.innerHTML = "";

    const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName: roomName,
      width: "100%",
      height: "100%",
      parentNode: containerRef.current,
      userInfo: {
        displayName: user?.full_name || user?.email || "User",
        email: user?.email || ""
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        enableNoisyMicDetection: false,
        p2p: { enabled: true },
        analytics: { disabled: true }
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: ['microphone', 'camera', 'hangup'],
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        MOBILE_APP_PROMO: false,
        DEFAULT_BACKGROUND: '#000000'
      }
    });

    apiRef.current = api;
    setStatus("");

    api.addEventListeners({
      readyToClose: () => handleHangup(),
      videoConferenceLeft: () => handleHangup(),
      audioMuteStatusChanged: ({ muted: m }) => setMuted(m),
      videoMuteStatusChanged: ({ muted: m }) => setVideoOff(m),
    });
  };

  const cleanup = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
  };

  const handleHangup = async () => {
    cleanup();
    if (sessionId) {
      await base44.entities.CallSession.update(sessionId, {
        status: "ended",
        ended_at: new Date().toISOString()
      }).catch(() => {});
    }
    navigate(createPageUrl("RufzeitKHome"));
  };

  const toggleMute = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand("toggleAudio");
    }
  };

  const toggleVideo = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand("toggleVideo");
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Status overlay when not yet connected */}
      {(status || !ready) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black gap-4">
          {status === "Failed to connect. Please go back and try again." || status.includes("Error") ? (
            <>
              <p className="text-red-400 text-center px-8">{status}</p>
              <button
                onClick={() => navigate(createPageUrl("RufzeitKHome"))}
                className="bg-white/10 text-white rounded-xl px-6 py-3 text-sm"
              >
                ← Go Back
              </button>
            </>
          ) : (
            <>
              <RefreshCw className="w-10 h-10 animate-spin text-cyan-400" />
              <p className="text-white/60 text-sm">{status || "Connecting..."}</p>
            </>
          )}
        </div>
      )}

      {/* Jitsi container - always mounted so ref is available */}
      <div ref={containerRef} className="flex-1 w-full" style={{ minHeight: 0 }} />

      {/* Custom control bar */}
      {ready && !status && (
        <div className="flex items-center justify-center gap-6 bg-black px-6 py-4 border-t border-white/10 flex-shrink-0">
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
      )}
    </div>
  );
}