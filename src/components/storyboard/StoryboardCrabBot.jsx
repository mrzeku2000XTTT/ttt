import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function StoryboardCrabBot({ active = false, sceneCount = 0, storyboard, scene, scenes = [] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [pendingVoiceText, setPendingVoiceText] = useState("");
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const thinkingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("storyboard_crab_ai_memory") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("storyboard_crab_ai_memory", JSON.stringify(messages.slice(-16)));
  }, [messages]);

  useEffect(() => {
    thinkingRef.current = thinking;
  }, [thinking]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setRecognitionSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let liveText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += transcript;
        else liveText += transcript;
      }

      const heardText = (finalText || liveText).trim();
      if (heardText) setInput(heardText);

      if (finalText.trim()) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (listeningRef.current && !thinkingRef.current) setPendingVoiceText(finalText.trim());
        }, 650);
      }
    };
    recognition.onend = () => {
      if (listeningRef.current) {
        setTimeout(() => recognition.start(), 250);
      } else {
        setListening(false);
      }
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listeningRef.current) {
      listeningRef.current = false;
      recognitionRef.current.stop();
      setListening(false);
    } else {
      listeningRef.current = true;
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const speak = (text) => {
    if (!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const askCrab = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || thinkingRef.current) return;
    const userMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Crab Architect, a senior storyboard/script architect bot visible as a 2D crab in the Mood Board. Analyze continuity, repeated visual patterns, scene stitching, camera logic, character consistency, and next-scene structure. Learn from this conversation memory and respond like a practical creative director.

Original storyboard: ${storyboard?.idea || "No storyboard loaded"}
Style: ${storyboard?.style || "Unknown"}
Current scene idea: ${scene?.scene_idea || "No active scene"}
Current scene prompt: ${scene?.scene_prompt || "No active prompt"}
Total generated scenes: ${scenes.length}
Recent memory: ${nextMessages.slice(-8).map((m) => `${m.role}: ${m.content}`).join("\n")}

User asks: ${userMessage.content}

Give a concise but useful answer. If helpful, suggest exact wording for the next extension prompt.`
    });

    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    speak(response);
    setThinking(false);
  };

  useEffect(() => {
    if (!pendingVoiceText) return;
    askCrab(pendingVoiceText);
    setPendingVoiceText("");
  }, [pendingVoiceText]);

  return (
    <>
      {open && (
        <div className="fixed bottom-32 right-4 z-[130] w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-cyan-200/20 bg-black/85 p-3 text-white shadow-2xl shadow-cyan-500/20 backdrop-blur-2xl">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Crab Architect</p>
              <p className="text-xs text-white/50">Realtime scene stitching AI</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/20">Close</button>
          </div>

          <div className="max-h-64 space-y-2 overflow-auto rounded-2xl bg-white/5 p-2">
            {messages.length === 0 && <p className="text-sm text-white/55">Click me anytime. I’ll analyze patterns, continuity, and how to stitch the next scene.</p>}
            {messages.slice(-8).map((message, index) => (
              <div key={index} className={`rounded-2xl px-3 py-2 text-sm leading-5 ${message.role === "user" ? "ml-8 bg-cyan-400/20 text-cyan-50" : "mr-8 bg-white/10 text-white/75"}`}>
                {message.content}
              </div>
            ))}
            {thinking && <div className="mr-8 rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/60">Crab is reading the scene patterns...</div>}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setVoiceOn((value) => !value)} className={`rounded-full px-3 py-2 text-xs font-black ${voiceOn ? "bg-cyan-300 text-black" : "bg-white/10 text-white"}`}>
              Voice {voiceOn ? "On" : "Off"}
            </button>
            <button onClick={toggleListening} disabled={!recognitionSupported} className={`rounded-full px-3 py-2 text-xs font-black ${listening ? "bg-red-400 text-black" : "bg-white/10 text-white"} disabled:opacity-40`}>
              {listening ? "Live Mic On" : "Live Mic Off"}
            </button>
          </div>

          <p className="mt-2 text-[10px] leading-4 text-white/35">Realtime mic uses your browser permission over HTTPS. Only final recognized text is sent to Crab AI.</p>

          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askCrab()}
              placeholder="Ask about scene continuity..."
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-cyan-200/50"
            />
            <button onClick={askCrab} disabled={thinking || !input.trim()} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-black disabled:opacity-50">Ask</button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-[120] rounded-full border border-cyan-200/30 bg-black/80 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl"
      >
        Crab AI · {active ? "stitching" : sceneCount ? `scene ${sceneCount}` : "ready"}
      </button>
    </>
  );
}