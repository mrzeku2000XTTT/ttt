import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Send } from "lucide-react";

export default function ChaosIntake({ onProcess, isProcessing }) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let full = "";
        for (let i = 0; i < e.results.length; i++) {
          full += e.results[i][0].transcript;
        }
        setText(full);
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      recognitionRef.current = rec;
    }
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setText("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = () => {
    if (text.trim().length > 10 && !isProcessing) {
      onProcess(text.trim());
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.04)] border border-[#EDE9E1] p-8 md:p-10">
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl md:text-3xl font-medium text-[#1A1A1A]">The Chaos Intake</h2>
        <p className="text-sm text-[#8A857C] mt-2">Dump your raw, unfiltered thoughts. No forms. No pretense.</p>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"I dropped out of uni 2 years ago. I smoke weed, play MMOs all night, and wake up at 1 PM feeling like garbage. I'm broke. I'm okay at photoshop because I make memes, but I have zero work history and a massive resume gap. I can't handle a toxic manager or a loud office."}
          className="w-full min-h-[140px] bg-[#FBF7F0] border border-[#E8E4DD] rounded-xl p-4 text-sm text-[#1A1A1A] placeholder:text-[#B5B0A6] outline-none focus:border-[#0D5B3A] focus:ring-2 focus:ring-[#0D5B3A]/10 resize-none font-body"
        />
        <button
          onClick={toggleMic}
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isListening ? "bg-red-500 text-white animate-pulse" : "bg-[#F0EDE5] text-[#8A857C] hover:bg-[#E8E4DD]"
          }`}
          title={isListening ? "Stop recording" : "Voice input"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={text.trim().length < 10 || isProcessing}
        className="w-full mt-5 h-13 py-4 rounded-xl bg-[#0D5B3A] hover:bg-[#0A4A30] disabled:bg-[#E0DDD5] disabled:text-[#B5B0A6] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        {isProcessing ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> SAE ANALYZING YOUR MESS...</>
        ) : (
          <><Send className="w-4 h-4" /> PROCESS MY CHAOS</>
        )}
      </button>
    </div>
  );
}