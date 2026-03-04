import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ORANGE = "#ff5a14";
const KASPA_API = 'https://api.kaspa.org';
const FEE_SOMPI = 10000;

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_kivr_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Send KAS directly from browser using stored private key
async function sendKasDirect(fromAddress, toAddress, amountKas, privateKey) {
  const { KaspaWallet } = await import('npm:@okxweb3/coin-kaspa@2.4.9').catch(() => {
    throw new Error('Signing not available in browser. Use a preset instead.');
  });
  const amountSompi = Math.round(parseFloat(amountKas) * 1e8);
  const normalizedFrom = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;
  const normalizedTo = toAddress.startsWith('kaspa:') ? toAddress : `kaspa:${toAddress}`;
  const utxoRes = await fetch(`${KASPA_API}/addresses/${normalizedFrom}/utxos`);
  const utxos = await utxoRes.json();
  const needed = amountSompi + FEE_SOMPI;
  let totalIn = 0;
  const selected = [];
  utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
  for (const utxo of utxos) {
    if (totalIn >= needed) break;
    selected.push(utxo);
    totalIn += Number(utxo.utxoEntry.amount);
  }
  if (totalIn < needed) throw new Error(`Insufficient balance.`);
  const change = totalIn - amountSompi - FEE_SOMPI;
  const inputs = selected.map(u => ({ txId: u.outpoint.transactionId, vOut: u.outpoint.index, address: normalizedFrom, amount: Number(u.utxoEntry.amount) }));
  const outputs = [{ address: normalizedTo, amount: amountSompi }];
  if (change > 0) outputs.push({ address: normalizedFrom, amount: change });
  const wallet = new KaspaWallet();
  const signResult = await wallet.signTransaction({ data: { inputs, outputs, address: normalizedFrom, fee: FEE_SOMPI }, privateKey });
  const signed = typeof signResult === 'string' ? JSON.parse(signResult) : signResult;
  const rawTx = signed.transaction ?? signed.tx ?? signed;
  const submitRes = await fetch(`${KASPA_API}/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transaction: rawTx, allowOrphan: false }) });
  const submitText = await submitRes.text();
  if (!submitRes.ok) throw new Error(`Submit failed: ${submitText.slice(0, 100)}`);
  const submitData = JSON.parse(submitText);
  return submitData.transactionId || submitData.txid;
}

export default function InAppIVRCall({ connectedAddress, presets, contacts = [], onClose }) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState([]);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakSupported, setSpeakSupported] = useState(false);
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [slotPresets, setSlotPresets] = useState([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Contact payment flow state
  const [pendingContact, setPendingContact] = useState(null); // { name, kaspa_address, amount, pin_hash }
  const [pendingAmount, setPendingAmount] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [awaitingContactAmount, setAwaitingContactAmount] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [micPermission, setMicPermission] = useState("unknown"); // unknown | granted | denied

  const mutedRef = useRef(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(null);
  const phaseRef = useRef("idle");

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeakSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => startCall(), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(async (text) => {
    setTranscript(prev => [...prev, { role: "agent", text }]);
    if (mutedRef.current) return;
    return new Promise(resolve => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.92; utt.pitch = 1.15; utt.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const femaleKeywords = ["Samantha", "Victoria", "Karen", "Moira", "Tessa", "Fiona", "Zira", "Susan"];
      const preferred = voices.find(v => v.lang.startsWith("en") && femaleKeywords.some(k => v.name.includes(k))) || voices.find(v => v.lang.startsWith("en-US")) || voices.find(v => v.lang.startsWith("en"));
      if (preferred) utt.voice = preferred;
      utt.onend = resolve; utt.onerror = resolve;
      window.speechSynthesis.speak(utt);
    });
  }, []);

  const requestMicAndListen = useCallback(async (onResult) => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
    } catch {
      setMicPermission("denied");
    }
    startListeningInternal(onResult);
  }, []);

  const startListeningInternal = useCallback((onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setListening(false); return; }
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }
    const rec = new SpeechRecognition();
    rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => {
      const said = e.results[0][0].transcript.trim();
      setTranscript(prev => [...prev, { role: "user", text: said }]);
      onResult(said);
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed") setMicPermission("denied");
    };
    recognitionRef.current = rec;
    rec.start();
  }, []);

  const startListening = useCallback((onResult) => {
    startListeningInternal(onResult);
  }, [startListeningInternal]);

  const extractDigits = (text) => {
    const fromNumbers = text.replace(/[^0-9]/g, "");
    if (fromNumbers) return fromNumbers;
    const wordMap = { zero:"0",one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9" };
    return text.toLowerCase().split(/\s+/).map(w => wordMap[w]).filter(Boolean).join("");
  };

  const extractNumber = (text) => {
    const match = text.match(/[\d]+\.?\d*/);
    return match ? parseFloat(match[0]) : null;
  };

  // Find contact by spoken name (fuzzy match)
  const findContact = (spokenText) => {
    const lower = spokenText.toLowerCase();
    return contacts.find(c => lower.includes(c.contact_name.toLowerCase()));
  };

  const startCall = async () => {
    setPhase("connecting");
    setTranscript([]);
    setError("");
    setResult(null);
    setPendingContact(null);
    await new Promise(r => setTimeout(r, 600));
    setPhase("greeting");

    const hasPresets = presets.filter(p => p.status === "active").length > 0;
    const hasContacts = contacts.length > 0;

    if (!hasPresets && !hasContacts) {
      await speak("Welcome to KivR. You have no presets or contacts set up yet. Please add a contact or preset first.");
      setPhase("done");
      return;
    }

    let intro = "Welcome to KivR. ";
    if (hasContacts && hasPresets) {
      intro += "You can say a contact name to pay them, or say a slot number to use a preset. What would you like to do?";
    } else if (hasContacts) {
      intro += `You have ${contacts.length} contact${contacts.length > 1 ? "s" : ""}. Say a name to pay them.`;
    } else {
      intro += "Say a slot number to send a payment.";
    }

    await speak(intro);
    setPhase("awaiting_intent");
    listenForIntent();
  };

  const listenForIntent = () => {
    startListening(async (said) => {
      // Check contacts first
      const contact = findContact(said);
      if (contact) {
        setPendingContact(contact);
        if (contact.default_amount) {
          setPendingAmount(contact.default_amount.toString());
          await speak(`I found ${contact.contact_name}. The default amount is ${contact.default_amount} KAS. Say your PIN to confirm, or say a different amount.`);
          setPhase("awaiting_contact_pin");
          listenForContactPinOrAmount(contact, contact.default_amount.toString());
        } else {
          setAwaitingContactAmount(true);
          await speak(`I found ${contact.contact_name}. How much KAS would you like to send?`);
          setPhase("awaiting_contact_amount");
          listenForAmount(contact);
        }
        return;
      }

      // Check for slot number (preset flow)
      const digits = extractDigits(said);
      const slotNum = parseInt(digits[0]);
      if (slotNum >= 1 && slotNum <= 9) {
        await speak("Please enter your PIN to continue with preset payment.");
        setPhase("awaiting_pin");
        listenForPin(presets.filter(p => p.status === "active"));
        return;
      }

      // Check for "preset" keyword
      if (said.toLowerCase().includes("preset") || said.toLowerCase().includes("slot")) {
        await speak("Sure, please say your PIN first.");
        setPhase("awaiting_pin");
        listenForPin(presets.filter(p => p.status === "active"));
        return;
      }

      await speak("I didn't catch that. Say a contact name to pay them, or say a slot number for a preset.");
      listenForIntent();
    });
  };

  const listenForAmount = (contact) => {
    startListening(async (said) => {
      const amount = extractNumber(said);
      if (!amount || amount <= 0) {
        await speak("How much KAS would you like to send?");
        listenForAmount(contact);
        return;
      }
      setPendingAmount(amount.toString());
      await speak(`Sending ${amount} KAS to ${contact.contact_name}. Say your PIN to confirm.`);
      setPhase("awaiting_contact_pin");
      listenForContactPinOrAmount(contact, amount.toString());
    });
  };

  const listenForContactPinOrAmount = (contact, currentAmount) => {
    startListening(async (said) => {
      // Check if they said a new amount
      const newAmount = extractNumber(said);
      const digits = extractDigits(said);

      // If it's a long digit string (4+), treat as PIN
      if (digits.length >= 4) {
        await verifyContactPin(contact, digits, currentAmount);
        return;
      }

      // If they said a number with "KAS" or just a small number, it might be an amount
      if (newAmount && said.toLowerCase().includes("kas")) {
        setPendingAmount(newAmount.toString());
        await speak(`Got it, ${newAmount} KAS to ${contact.contact_name}. Now say your PIN to confirm.`);
        listenForContactPinOrAmount(contact, newAmount.toString());
        return;
      }

      await speak("Please say your PIN digits to confirm the payment.");
      listenForContactPinOrAmount(contact, currentAmount);
    });
  };

  const verifyContactPin = async (contact, spokenPin, amount) => {
    setPhase("verifying_pin");
    await speak("Verifying PIN…");
    const pinHash = await hashPin(spokenPin);
    if (pinHash !== contact.pin_hash) {
      await speak("That PIN is incorrect. Please try again.");
      setPhase("awaiting_contact_pin");
      listenForContactPinOrAmount(contact, amount);
      return;
    }
    // PIN correct — send transaction
    await executeContactPayment(contact, amount);
  };

  const executeContactPayment = async (contact, amount) => {
    setPhase("broadcasting");
    await speak(`Sending ${amount} KAS to ${contact.contact_name}…`);
    try {
      const privateKey = getPrivateKey();
      if (!privateKey) {
        await speak("No private key found. Please import your wallet first.");
        setPhase("error");
        setError("No private key. Import your wallet.");
        return;
      }

      const res = await base44.functions.invoke("kivrIVR", {
        action: "broadcast_contact",
        from_address: connectedAddress,
        to_address: contact.kaspa_address,
        amount: parseFloat(amount),
        privateKey,
      });

      if (res.data?.success) {
        setResult({ amount, label: contact.contact_name, tx_id: res.data.tx_id });
        await speak(`Done! ${amount} KAS sent to ${contact.contact_name} successfully.`);
        setPhase("done");
      } else {
        const msg = res.data?.error || "Unknown error";
        setError(msg);
        await speak(`Payment failed: ${msg}`);
        setPhase("error");
      }
    } catch (e) {
      setError(e.message);
      await speak("An error occurred. Please try again.");
      setPhase("error");
    }
  };

  // ── Legacy preset flow (unchanged) ────────────────────────────────────────
  const listenForPin = (activePresets) => {
    startListening(async (said) => {
      const digits = extractDigits(said);
      if (digits.length < 4) {
        await speak("Please say your PIN digits clearly.");
        listenForPin(activePresets);
        return;
      }
      await verifyPin(digits, activePresets);
    });
  };

  const verifyPin = async (digits, activePresets) => {
    setPhase("verifying_pin");
    await speak("Verifying PIN…");
    const res = await base44.functions.invoke("kivrIVR", { action: "get_presets", phone: connectedAddress, pin: digits });
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
    await speak(`PIN accepted. ${slotList}. Which slot?`);
    setPhase("slot_selection");
    listenForSlot(digits, slots);
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

  const getPrivateKey = () => {
    try {
      const wallets = JSON.parse(localStorage.getItem("kivr_wallets") || "[]");
      const wallet = wallets.find(w => w.address === connectedAddress);
      return wallet?.privateKey || null;
    } catch { return null; }
  };

  const triggerSlot = async (pinDigits, slotNum, chosen) => {
    setPhase("broadcasting");
    await speak(`Sending ${chosen.amount} KAS for ${chosen.label}…`);
    const privateKey = getPrivateKey();
    const res = await base44.functions.invoke("kivrIVR", { action: "broadcast", phone: connectedAddress, pin: pinDigits, slot: slotNum, privateKey: privateKey || undefined });
    if (res.data?.success) {
      setResult(res.data);
      await speak(`Success! ${chosen.amount} KAS sent for ${chosen.label}.`);
      setPhase("done");
    } else {
      setError(res.data?.error || "Unknown error");
      await speak(`Transaction failed: ${res.data?.error}`);
      setPhase("error");
    }
  };

  const handleSlotTap = async (slot) => {
    const chosen = slotPresets.find(p => p.slot === slot.slot);
    if (!chosen) return;
    setTranscript(prev => [...prev, { role: "user", text: `Slot ${slot.slot}` }]);
    await triggerSlot(pin, slot.slot, chosen);
  };

  const handleContactTap = async (contact) => {
    setPendingContact(contact);
    setTranscript(prev => [...prev, { role: "user", text: contact.contact_name }]);
    if (contact.default_amount) {
      setPendingAmount(contact.default_amount.toString());
      await speak(`Paying ${contact.contact_name}, ${contact.default_amount} KAS. Say your PIN to confirm.`);
      setPhase("awaiting_contact_pin");
      listenForContactPinOrAmount(contact, contact.default_amount.toString());
    } else {
      setAwaitingContactAmount(true);
      await speak(`How much KAS to send to ${contact.contact_name}?`);
      setPhase("awaiting_contact_amount");
      listenForAmount(contact);
    }
  };

  const handlePinSubmit = async () => {
    if (pinInput.length < 4) return;
    setTranscript(prev => [...prev, { role: "user", text: "••••" }]);
    const activePresets = presets.filter(p => p.status === "active");
    await verifyPin(pinInput, activePresets);
    setPinInput("");
  };

  const endCall = () => {
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    onClose();
  };

  const phaseLabel = {
    idle: "Ready", connecting: "Connecting…", greeting: "Greeting…",
    awaiting_intent: "Listening…",
    awaiting_pin: "Enter PIN", verifying_pin: "Verifying…",
    awaiting_contact_amount: "How much?",
    awaiting_contact_pin: "Say PIN",
    slot_selection: "Choose slot", broadcasting: "Sending…",
    done: "Complete", error: "Error",
  }[phase] || phase;

  const isActive = !["idle", "done", "error"].includes(phase);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={e => e.stopPropagation()}
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm flex flex-col rounded-3xl overflow-hidden"
        style={{ background: "#0d0d0d", border: "1px solid rgba(255,90,20,0.35)", maxHeight: "calc(100vh - 80px)" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="relative w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center"
            style={{ background: isActive ? "rgba(255,90,20,0.15)" : "rgba(255,255,255,0.05)", border: `2px solid ${isActive ? ORANGE : "rgba(255,255,255,0.1)"}` }}>
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
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }}
                    animate={{ scaleY: [1, 2.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.12 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result */}
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

        {/* Contact quick-tap buttons */}
        {phase === "awaiting_intent" && contacts.length > 0 && (
          <div className="px-4 pb-2 flex-shrink-0">
            <p className="text-xs mb-2 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>Say a name or tap</p>
            <div className="flex flex-wrap gap-2">
              {contacts.map(c => (
                <button key={c.id} onClick={() => handleContactTap(c)}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
                  style={{ background: "rgba(255,90,20,0.12)", border: "1px solid rgba(255,90,20,0.3)", color: ORANGE }}>
                  {c.contact_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount input for contact */}
        {phase === "awaiting_contact_amount" && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <input
                autoFocus type="number" placeholder="Amount in KAS…"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && amountInput) {
                    const amt = parseFloat(amountInput);
                    if (amt > 0 && pendingContact) {
                      setTranscript(prev => [...prev, { role: "user", text: `${amt} KAS` }]);
                      setPendingAmount(amt.toString());
                      speak(`Sending ${amt} KAS to ${pendingContact.contact_name}. Say your PIN to confirm.`).then(() => {
                        setPhase("awaiting_contact_pin");
                        listenForContactPinOrAmount(pendingContact, amt.toString());
                      });
                      setAmountInput("");
                    }
                  }
                }}
                className="flex-1 bg-transparent text-white text-sm outline-none"
              />
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  const amt = parseFloat(amountInput);
                  if (amt > 0 && pendingContact) {
                    setTranscript(prev => [...prev, { role: "user", text: `${amt} KAS` }]);
                    setPendingAmount(amt.toString());
                    speak(`Sending ${amt} KAS to ${pendingContact.contact_name}. Say your PIN to confirm.`).then(() => {
                      setPhase("awaiting_contact_pin");
                      listenForContactPinOrAmount(pendingContact, amt.toString());
                    });
                    setAmountInput("");
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: ORANGE, color: "white" }}>
                OK
              </button>
            </div>
          </div>
        )}

        {/* PIN input */}
        {(phase === "awaiting_pin" || phase === "awaiting_contact_pin") && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <input
                autoFocus type="tel" inputMode="numeric" maxLength={8}
                placeholder="Type PIN… (or say it)"
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    if (phase === "awaiting_contact_pin" && pendingContact && pinInput.length >= 4) {
                      setTranscript(prev => [...prev, { role: "user", text: "••••" }]);
                      verifyContactPin(pendingContact, pinInput, pendingAmount);
                      setPinInput("");
                    } else {
                      handlePinSubmit();
                    }
                  }
                }}
                className="flex-1 bg-transparent text-white text-sm outline-none font-mono tracking-widest"
                style={{ WebkitUserSelect: "text", userSelect: "text" }}
              />
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  if (phase === "awaiting_contact_pin" && pendingContact && pinInput.length >= 4) {
                    setTranscript(prev => [...prev, { role: "user", text: "••••" }]);
                    verifyContactPin(pendingContact, pinInput, pendingAmount);
                    setPinInput("");
                  } else {
                    handlePinSubmit();
                  }
                }}
                disabled={pinInput.length < 4}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: pinInput.length >= 4 ? ORANGE : "rgba(255,255,255,0.07)", color: pinInput.length >= 4 ? "white" : "rgba(255,255,255,0.3)" }}>
                OK
              </button>
            </div>
            <p className="text-center text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Or say your PIN aloud</p>
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

        {/* Tap to speak */}
        {speakSupported && !listening && ["awaiting_intent", "awaiting_pin", "awaiting_contact_pin", "awaiting_contact_amount", "slot_selection"].includes(phase) && (
          <div className="px-4 pb-2 flex-shrink-0">
            <button
              onClick={() => {
                if (phase === "awaiting_intent") listenForIntent();
                else if (phase === "awaiting_pin") listenForPin(presets.filter(p => p.status === "active"));
                else if (phase === "awaiting_contact_amount" && pendingContact) listenForAmount(pendingContact);
                else if (phase === "awaiting_contact_pin" && pendingContact) listenForContactPinOrAmount(pendingContact, pendingAmount);
                else if (phase === "slot_selection") listenForSlot(pin, slotPresets);
              }}
              className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: "rgba(255,90,20,0.15)", border: "1px solid rgba(255,90,20,0.35)", color: ORANGE }}
            >
              <Mic size={14} /> Tap to Speak
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="px-5 py-4 flex items-center justify-center gap-5 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setMuted(m => !m)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: muted ? "rgba(255,59,48,0.15)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            {muted ? <MicOff size={18} color="#ff3b30" /> : <Mic size={18} color={listening ? ORANGE : "rgba(255,255,255,0.65)"} />}
          </button>

          {(phase === "idle" || phase === "done" || phase === "error") ? (
            <button onClick={phase === "idle" ? startCall : onClose}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90"
              style={{ background: phase === "done" ? "#34c759" : ORANGE, boxShadow: `0 8px 28px ${phase === "done" ? "rgba(52,199,89,0.45)" : "rgba(255,90,20,0.55)"}` }}>
              {phase === "done" ? <Check size={26} color="white" /> : <Phone size={26} color="white" />}
            </button>
          ) : (
            <button onClick={endCall}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90"
              style={{ background: "#ff3b30", boxShadow: "0 8px 28px rgba(255,59,48,0.5)" }}>
              <PhoneOff size={26} color="white" />
            </button>
          )}

          <button onClick={() => setMuted(m => !m)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            {muted ? <VolumeX size={18} color="#ff3b30" /> : <Volume2 size={18} color="rgba(255,255,255,0.65)" />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}