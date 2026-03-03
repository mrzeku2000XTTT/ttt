import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ORANGE = "#ff5a14";

export default function InAppIVRCall({ connectedAddress, presets, onClose }) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState([]);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [slotPresets, setSlotPresets] = useState([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const mutedRef = useRef(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(null);

  // Keep mutedRef in sync
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // Auto-start on mount
  useEffect(() => {
    const timer = setTimeout(() => startCall(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text) => {
    setTranscript(prev => [...prev, { role: "agent", text }]);

    if (mutedRef.current) return;

    return new Promise(resolve => {
      if (!window.speechSynthesis) { resolve(); return; }

      window.speechSynthesis.cancel(); // cancel any ongoing

      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.92;
      utt.pitch = 1;
      utt.volume = 1;

      // Pick a good voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith("en") && (v.name.includes("Samantha") || v.name.includes("Google") || v.name.includes("Natural"))
      ) || voices.find(v => v.lang.startsWith("en"));
      if (preferred) utt.voice = preferred;

      utt.onend = resolve;
      utt.onerror = resolve;

      window.speechSynthesis.speak(utt);

      // iOS Safari workaround: voices may not be loaded yet
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
    });
  }, []);

  // ── Speech recognition ─────────────────────────────────────────────────────
  const startListening = useCallback((onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // no speech recognition — user must type
      setListening(false);
      return;
    }
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }

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

  // ── Digit extraction ───────────────────────────────────────────────────────
  const extractDigits = (text) => {
    const fromNumbers = text.replace(/[^0-9]/g, "");
    if (fromNumbers) return fromNumbers;
    const wordMap = { zero:"0",one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9" };
    return text.toLowerCase().split(/\s+/).map(w => wordMap[w]).filter(Boolean).join("");
  };

  // ── IVR Flow ───────────────────────────────────────────────────────────────
  const startCall = async () => {
    setPhase("connecting");
    setTranscript([]);
    setError("");
    setPin("");
    setPinInput("");

    await new Promise(r => setTimeout(r, 600));
    setPhase("greeting");

    const activePresets = presets.filter(p => p.status === "active");
    if (activePresets.length === 0) {
      await speak("Welcome to KivR. You have no active payment presets. Please create one first.");
      setPhase("done");
      return;
    }

    await speak("Welcome to KivR. Please enter your 4-digit PIN.");
    setPhase("awaiting_pin");
    listenForPin(activePresets);
  };

  const listenForPin = (activePresets) => {
    startListening(async (said) => {
      const digits = extractDigits(said);
      if (digits.length < 4) {
        await speak("I didn't catch that. Please say your PIN digits clearly, or type them below.");
        listenForPin(activePresets);
        return;
      }
      await verifyPin(digits, activePresets);
    });
  };

  const verifyPin = async (digits, activePresets) => {
    setPhase("verifying_pin");
    await speak("Verifying PIN…");
    try {
      const res = await base44.functions.invoke("kivrIVR", {
        action: "get_presets",
        phone: connectedAddress,
        pin: digits,
      });
      if (!res.data?.valid) {
        await speak("That PIN is incorrect. Please try again.");
        setPhase("awaiting_pin");
        listenForPin(activePresets);
        return;
      }
      setPin(digits);
      const slots = res.data.presets;
      setSlotPresets(slots);
      const slotList = slots.map(p => `Slot ${p.slot}: ${p.label}, ${p.amount} KAS`).join(". ");
      await speak(`PIN accepted. You have ${slots.length} preset${slots.length !== 1 ? "s" : ""}. ${slotList}. Which slot would you like to trigger?`);
      setPhase("slot_selection");
      listenForSlot(digits, slots);
    } catch (e) {
      await speak("Error verifying PIN. Please try again.");
      setPhase("awaiting_pin");
      listenForPin(activePresets);
    }
  };

  const listenForSlot = (pinDigits, slots) => {
    startListening(async (said) => {
      const digits = extractDigits(said);
      const slotNum = parseInt(digits[0]);
      if (!slotNum || slotNum < 1 || slotNum > 9) {
        await speak("Please say a slot number between 1 and 9.");
        listenForSlot(pinDigits, slots);
        return;
      }
      const chosen = slots.find(p => p.slot === slotNum);
      if (!chosen) {
        await speak(`Slot ${slotNum} is not available. Please choose another.`);
        listenForSlot(pinDigits, slots);
        return;
      }
      await triggerSlot(pinDigits, slotNum, chosen);
    });
  };

  const triggerSlot = async (pinDigits, slotNum, chosen) => {
    setPhase("broadcasting");
    await speak(`Sending ${chosen.amount} KAS for ${chosen.label}…`);
    try {
      const res = await base44.functions.invoke("kivrIVR", {
        action: "broadcast",
        phone: connectedAddress,
        pin: pinDigits,
        slot: slotNum,
      });
      if (res.data?.success) {
        setResult(res.data);
        await speak(`Success! ${chosen.amount} KAS sent for ${chosen.label}. Thank you for using KivR.`);
        setPhase("done");
      } else {
        const msg = res.data?.error || "Unknown error";
        setError(msg);
        await speak(`Transaction failed: ${msg}`);
        setPhase("error");
      }
    } catch (e) {
      setError(e.message);
      await speak("Broadcast failed. Please try again.");
      setPhase("error");
    }
  };

  const handlePinSubmit = async () => {
    if (pinInput.length < 4) return;
    setTranscript(prev => [...prev, { role: "user", text: "••••" }]);
    const activePresets = presets.filter(p => p.status === "active");
    await verifyPin(pinInput, activePresets);
    setPinInput("");
  };

  const handleSlotTap = async (slot) => {
    const chosen = slotPresets.find(p => p.slot === slot.slot);
    if (!chosen) return;
    setTranscript(prev => [...prev, { role: "user", text: `Slot ${slot.slot}` }]);
    await triggerSlot(pin, slot.slot, chosen);
  };

  const endCall = () => {
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    onClose();
  };

  const phaseLabel = {
    idle: "Ready",
    connecting: "Connecting…",
    greeting: "Greeting…",
    awaiting_pin: "Enter PIN",
    verifying_pin: "Verifying…",
    slot_selection: "Choose slot",
    broadcasting: "Sending…",
    done: "Complete",
    error: "Error",
  }[phase] || phase;

  const isActive = !["idle", "done", "error"].includes(phase);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
    onClick={e => e.stopPropagation()}
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm flex flex-col rounded-3xl overflow-hidden"
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,90,20,0.35)",
          maxHeight: "calc(100vh - 80px)",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 text-center flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="relative w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center"
            style={{
              background: isActive ? "rgba(255,90,20,0.15)" : "rgba(255,255,255,0.05)",
              border: `2px solid ${isActive ? ORANGE : "rgba(255,255,255,0.1)"}`
            }}>
            {isActive && (
              <motion.div className="absolute inset-0 rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                style={{ background: ORANGE }} />
            )}
            <Phone size={20} color={isActive ? ORANGE : "rgba(255,255,255,0.3)"} />
          </div>
          <p className="text-white font-bold text-base">KivR AI Agent</p>
          <p className="text-xs mt-0.5 font-medium" style={{ color: isActive ? ORANGE : "rgba(255,255,255,0.3)" }}>
            {phaseLabel}
          </p>
        </div>

        {/* Transcript */}
        <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[120px] max-h-[200px]"
          style={{ scrollbarWidth: "none" }}>
          {transcript.length === 0 ? (
            <p className="text-center text-xs py-6" style={{ color: "rgba(255,255,255,0.2)" }}>Starting…</p>
          ) : transcript.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[82%] rounded-2xl px-3 py-1.5 text-xs leading-relaxed"
                style={{
                  background: msg.role === "user" ? "rgba(255,90,20,0.18)" : "rgba(255,255,255,0.07)",
                  border: msg.role === "user" ? "1px solid rgba(255,90,20,0.35)" : "1px solid rgba(255,255,255,0.09)",
                  color: msg.role === "user" ? ORANGE : "rgba(255,255,255,0.75)",
                }}>
                {msg.text}
              </div>
            </div>
          ))}
          {listening && (
            <div className="flex justify-end">
              <div className="rounded-2xl px-3 py-1.5 flex items-center gap-1"
                style={{ background: "rgba(255,90,20,0.1)", border: "1px solid rgba(255,90,20,0.25)" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }}
                    animate={{ scaleY: [1, 2.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.12 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result / Error banners */}
        {result && (
          <div className="mx-4 mb-2 rounded-xl px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
            style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)" }}>
            <Check size={14} color="#34c759" />
            <div>
              <p className="text-xs font-bold" style={{ color: "#34c759" }}>Sent!</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{result.amount} KAS · {result.label}</p>
            </div>
          </div>
        )}
        {error && phase === "error" && (
          <div className="mx-4 mb-2 rounded-xl px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
            style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)" }}>
            <X size={14} color="#ff3b30" />
            <p className="text-xs" style={{ color: "#ff3b30" }}>{error}</p>
          </div>
        )}

        {/* PIN input */}
        {phase === "awaiting_pin" && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <input
                autoFocus
                type="tel"
                inputMode="numeric"
                maxLength={8}
                placeholder="Type PIN…"
                value={pinInput}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPinInput(val);
                }}
                onKeyDown={e => { if (e.key === "Enter") handlePinSubmit(); }}
                className="flex-1 bg-transparent text-white text-sm outline-none font-mono tracking-widest"
                style={{ WebkitUserSelect: "text", userSelect: "text" }}
              />
              <button
                onPointerDown={e => { e.preventDefault(); handlePinSubmit(); }}
                disabled={pinInput.length < 4}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  background: pinInput.length >= 4 ? ORANGE : "rgba(255,255,255,0.07)",
                  color: pinInput.length >= 4 ? "white" : "rgba(255,255,255,0.3)"
                }}>
                OK
              </button>
            </div>
            <p className="text-center text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              Or say your PIN digits aloud
            </p>
          </div>
        )}

        {/* Slot tap buttons */}
        {phase === "slot_selection" && slotPresets.length > 0 && (
          <div className="px-4 pb-2 flex-shrink-0">
            <p className="text-xs mb-2 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>Tap a slot or say the number</p>
            <div className="grid grid-cols-3 gap-2">
              {slotPresets.map(p => (
                <button key={p.slot} onClick={() => handleSlotTap(p)}
                  className="rounded-xl py-2 px-2 text-center transition-all active:scale-95"
                  style={{ background: "rgba(255,90,20,0.12)", border: "1px solid rgba(255,90,20,0.3)" }}>
                  <p className="text-xs font-bold" style={{ color: ORANGE }}>Slot {p.slot}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{p.amount} KAS</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="px-5 py-4 flex items-center justify-center gap-5 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Mute mic */}
          <button onClick={() => setMuted(m => !m)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: muted ? "rgba(255,59,48,0.15)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${muted ? "rgba(255,59,48,0.4)" : "rgba(255,255,255,0.12)"}`
            }}>
            {muted ? <MicOff size={18} color="#ff3b30" /> : <Mic size={18} color="rgba(255,255,255,0.65)" />}
          </button>

          {/* Main button */}
          {(phase === "idle" || phase === "done" || phase === "error") ? (
            <button onClick={phase === "idle" ? startCall : onClose}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90"
              style={{
                background: phase === "done" ? "#34c759" : ORANGE,
                boxShadow: `0 8px 28px ${phase === "done" ? "rgba(52,199,89,0.45)" : "rgba(255,90,20,0.55)"}`
              }}>
              {phase === "done" ? <Check size={26} color="white" /> : <Phone size={26} color="white" />}
            </button>
          ) : (
            <button onClick={endCall}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90"
              style={{ background: "#ff3b30", boxShadow: "0 8px 28px rgba(255,59,48,0.5)" }}>
              <PhoneOff size={26} color="white" />
            </button>
          )}

          {/* Speaker / mute audio */}
          <button onClick={() => {
            setMuted(m => {
              const next = !m;
              if (!next && window.speechSynthesis) {
                // Re-enable: do a silent utterance to unlock audio on iOS
                const utt = new SpeechSynthesisUtterance(" ");
                utt.volume = 0;
                window.speechSynthesis.speak(utt);
              }
              return next;
            });
          }}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)"
            }}>
            {muted ? <VolumeX size={18} color="#ff3b30" /> : <Volume2 size={18} color="rgba(255,255,255,0.65)" />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}