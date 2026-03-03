import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, RefreshCw, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ORANGE = "#ff5a14";

// ── Call states ─────────────────────────────────────────────────────────────
// idle → connecting → greeting → awaiting_pin → verifying_pin → slot_selection → broadcasting → done | error

export default function InAppIVRCall({ connectedAddress, presets, onClose }) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState([]);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const inputRef = useRef("");

  // ── TTS via ElevenLabs or browser fallback ─────────────────────────────────
  const speak = useCallback(async (text) => {
    if (muted) return;
    setTranscript(prev => [...prev, { role: "agent", text }]);
    try {
      const res = await base44.functions.invoke("elevenLabsTTS", { text, voice_id: "21m00Tcm4TlvDq8ikWAM" });
      if (res.data?.audio_url) {
        const audio = new Audio(res.data.audio_url);
        await new Promise(resolve => { audio.onended = resolve; audio.onerror = resolve; audio.play(); });
        return;
      }
    } catch {}
    // Browser TTS fallback
    if (window.speechSynthesis) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95; utt.pitch = 1;
      window.speechSynthesis.speak(utt);
      await new Promise(resolve => { utt.onend = resolve; utt.onerror = resolve; });
    }
  }, [muted]);

  // ── Speech recognition ─────────────────────────────────────────────────────
  const startListening = useCallback((onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => {
      const said = e.results[0][0].transcript.trim();
      setTranscript(prev => [...prev, { role: "user", text: said }]);
      onResult(said);
    };
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
  }, []);

  // ── Parse spoken digits from speech ───────────────────────────────────────
  const extractDigits = (text) => {
    return text.replace(/[^0-9]/g, "")
      || text.toLowerCase().split(/\s+/).map(w => ({
        zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9
      }[w])).filter(n => n !== undefined).join("");
  };

  // ── IVR Flow ───────────────────────────────────────────────────────────────
  const startCall = async () => {
    setPhase("connecting");
    setTranscript([]);
    setError("");
    setPin("");
    await new Promise(r => setTimeout(r, 800));
    setPhase("greeting");

    const activePresets = presets.filter(p => p.status === "active");
    if (activePresets.length === 0) {
      await speak("Welcome to KivR. You have no active payment presets. Please create a preset first, then call again.");
      setPhase("done");
      return;
    }

    await speak("Welcome to KivR. Please enter or say your 4-digit PIN.");
    setPhase("awaiting_pin");
    askForPin(activePresets);
  };

  const askForPin = (activePresets) => {
    startListening(async (said) => {
      const digits = extractDigits(said);
      if (digits.length < 4) {
        await speak("I didn't catch that. Please say your PIN digits clearly.");
        askForPin(activePresets);
        return;
      }
      setPhase("verifying_pin");
      await speak("Verifying your PIN, please wait.");

      const phone = connectedAddress; // use wallet address as identifier
      try {
        const res = await base44.functions.invoke("kivrIVR", {
          action: "get_presets",
          phone: connectedAddress,
          pin: digits,
        });
        if (!res.data?.valid) {
          setError("Invalid PIN");
          await speak("That PIN is incorrect. Please try again.");
          setPhase("awaiting_pin");
          askForPin(activePresets);
          return;
        }
        setPin(digits);
        const slotPresets = res.data.presets;
        const slotList = slotPresets.map(p => `Slot ${p.slot}: ${p.label}, ${p.amount} KAS`).join(". ");
        await speak(`PIN accepted. You have ${slotPresets.length} preset${slotPresets.length > 1 ? "s" : ""}. ${slotList}. Which slot would you like to trigger?`);
        setPhase("slot_selection");
        askForSlot(digits, slotPresets);
      } catch (e) {
        await speak("There was an error verifying your PIN. Please try again.");
        setPhase("awaiting_pin");
        askForPin(activePresets);
      }
    });
  };

  const askForSlot = (pinDigits, slotPresets) => {
    startListening(async (said) => {
      const digits = extractDigits(said);
      const slot = parseInt(digits[0]);
      if (!slot || slot < 1 || slot > 9) {
        await speak("Please say a slot number between 1 and 9.");
        askForSlot(pinDigits, slotPresets);
        return;
      }
      const chosen = slotPresets.find(p => p.slot === slot);
      if (!chosen) {
        await speak(`Slot ${slot} is not available. Please choose another slot.`);
        askForSlot(pinDigits, slotPresets);
        return;
      }
      await speak(`Sending ${chosen.amount} KAS for ${chosen.label}. Confirming...`);
      setPhase("broadcasting");

      try {
        const res = await base44.functions.invoke("kivrIVR", {
          action: "broadcast",
          phone: connectedAddress,
          pin: pinDigits,
          slot,
        });
        if (res.data?.success) {
          setResult(res.data);
          await speak(`Success! ${chosen.amount} KAS has been sent for ${chosen.label}. Transaction confirmed. Thank you for using KivR.`);
          setPhase("done");
        } else {
          await speak(`Transaction failed: ${res.data?.error || "unknown error"}. Please check your balance and try again.`);
          setPhase("error");
          setError(res.data?.error || "Broadcast failed");
        }
      } catch (e) {
        await speak("Transaction broadcast failed. Please try again later.");
        setPhase("error");
        setError(e.message);
      }
    });
  };

  const endCall = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    onClose();
  };

  // ── Phase label ────────────────────────────────────────────────────────────
  const phaseLabel = {
    idle: "Ready",
    connecting: "Connecting...",
    greeting: "Greeting...",
    awaiting_pin: "Waiting for PIN",
    verifying_pin: "Verifying PIN...",
    slot_selection: "Choose a slot",
    broadcasting: "Sending transaction...",
    done: "Call complete",
    error: "Error",
  }[phase] || phase;

  const isActive = !["idle", "done", "error"].includes(phase);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,90,20,0.3)" }}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4 text-center"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center relative"
            style={{ background: isActive ? "rgba(255,90,20,0.15)" : "rgba(255,255,255,0.05)", border: `2px solid ${isActive ? ORANGE : "rgba(255,255,255,0.1)"}` }}>
            {isActive && (
              <motion.div className="absolute inset-0 rounded-full"
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ background: ORANGE, borderRadius: "50%" }} />
            )}
            <Phone size={24} color={isActive ? ORANGE : "rgba(255,255,255,0.3)"} />
          </div>
          <p className="text-white font-bold text-lg">KivR AI Agent</p>
          <p className="text-xs mt-0.5" style={{ color: isActive ? ORANGE : "rgba(255,255,255,0.3)" }}>
            {phaseLabel}
          </p>
        </div>

        {/* Transcript */}
        <div className="px-4 py-3 h-48 overflow-y-auto space-y-2"
          style={{ scrollbarWidth: "none" }}>
          {transcript.length === 0 && (
            <p className="text-center text-xs py-8" style={{ color: "rgba(255,255,255,0.2)" }}>
              Tap Call to start
            </p>
          )}
          {transcript.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%] rounded-2xl px-3 py-2 text-xs"
                style={{
                  background: msg.role === "user" ? "rgba(255,90,20,0.15)" : "rgba(255,255,255,0.06)",
                  border: msg.role === "user" ? "1px solid rgba(255,90,20,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  color: msg.role === "user" ? ORANGE : "rgba(255,255,255,0.7)",
                }}>
                {msg.text}
              </div>
            </div>
          ))}
          {listening && (
            <div className="flex justify-end">
              <div className="rounded-2xl px-3 py-2 flex items-center gap-1.5"
                style={{ background: "rgba(255,90,20,0.08)", border: "1px solid rgba(255,90,20,0.2)" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: ORANGE }}
                    animate={{ scaleY: [1, 2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="mx-4 mb-3 rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)" }}>
            <Check size={16} color="#34c759" />
            <div>
              <p className="text-xs font-bold" style={{ color: "#34c759" }}>Transaction Sent!</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                {result.amount} KAS · {result.label}
              </p>
            </div>
          </div>
        )}

        {error && phase === "error" && (
          <div className="mx-4 mb-3 rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)" }}>
            <X size={16} color="#ff3b30" />
            <p className="text-xs" style={{ color: "#ff3b30" }}>{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="px-5 pb-6 pt-2 flex items-center justify-center gap-4">
          {/* Mute */}
          <button onClick={() => setMuted(m => !m)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: muted ? "rgba(255,59,48,0.15)" : "rgba(255,255,255,0.07)", border: `1px solid ${muted ? "rgba(255,59,48,0.4)" : "rgba(255,255,255,0.1)"}` }}>
            {muted ? <MicOff size={18} color="#ff3b30" /> : <Mic size={18} color="rgba(255,255,255,0.6)" />}
          </button>

          {/* Main action */}
          {phase === "idle" || phase === "done" || phase === "error" ? (
            <button onClick={phase === "idle" ? startCall : onClose}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
              style={{ background: phase === "done" ? "#34c759" : ORANGE, boxShadow: `0 8px 24px ${phase === "done" ? "rgba(52,199,89,0.4)" : "rgba(255,90,20,0.5)"}` }}>
              {phase === "done" ? <Check size={26} color="white" /> : <Phone size={26} color="white" />}
            </button>
          ) : (
            <button onClick={endCall}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
              style={{ background: "#ff3b30", boxShadow: "0 8px 24px rgba(255,59,48,0.5)" }}>
              <PhoneOff size={26} color="white" />
            </button>
          )}

          {/* Volume indicator */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Volume2 size={18} color={listening ? ORANGE : "rgba(255,255,255,0.4)"} />
          </div>
        </div>

        {/* Hint */}
        {phase === "awaiting_pin" || phase === "slot_selection" ? (
          <p className="text-center text-xs pb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
            {phase === "awaiting_pin" ? "Say your PIN digits aloud or use keypad below" : "Say the slot number (e.g. 'one', 'two')"}
          </p>
        ) : null}

        {/* Manual digit input for PIN */}
        {phase === "awaiting_pin" && (
          <div className="px-5 pb-5 space-y-2">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <input
                type="password" inputMode="numeric" maxLength={8}
                placeholder="Type PIN + Enter"
                className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={async e => {
                  if (e.key === "Enter" && e.target.value.length >= 4) {
                    const digits = e.target.value;
                    setTranscript(prev => [...prev, { role: "user", text: "••••" }]);
                    setPhase("verifying_pin");
                    await speak("Verifying your PIN, please wait.");
                    const activePresets = presets.filter(p => p.status === "active");
                    try {
                      const res = await base44.functions.invoke("kivrIVR", {
                        action: "get_presets",
                        phone: connectedAddress,
                        pin: digits,
                      });
                      if (!res.data?.valid) {
                        await speak("That PIN is incorrect. Please try again.");
                        setPhase("awaiting_pin");
                        askForPin(activePresets);
                        return;
                      }
                      setPin(digits);
                      const slotPresets = res.data.presets;
                      const slotList = slotPresets.map(p => `Slot ${p.slot}: ${p.label}, ${p.amount} KAS`).join(". ");
                      await speak(`PIN accepted. ${slotList}. Which slot would you like to trigger?`);
                      setPhase("slot_selection");
                      askForSlot(digits, slotPresets);
                    } catch {
                      await speak("Error verifying PIN. Please try again.");
                      setPhase("awaiting_pin");
                      askForPin(activePresets);
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}