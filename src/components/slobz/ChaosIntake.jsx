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
    <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-7 md:p-8">
      <div className="text-center mb-5">
        <h2 className="font-heading text-2xl font-semibold text-[#1F1B2E]">The Chaos Intake</h2>
        <p className="text-xs text-[#7A7290] mt-1.5">Dump your raw, unfiltered thoughts. No forms. No pretense.</p>
      </div>

      <div className="relative rounded-[22px] p-1.5 bg-[#B8A7F0] shadow-[inset_0_2px_6px_rgba(90,60,180,0.25)]">
        <div className="relative bg-[#F4F1FB] rounded-[18px]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"I dropped out of uni 2 years ago. I smoke weed, play MMOs all night, and wake up at 1 PM feeling like garbage. I'm broke. I'm okay at photoshop because I make memes, but I have zero work history and a massive resume gap. I can't handle a toxic manager or a loud office."}
            className="w-full min-h-[170px] bg-transparent rounded-[18px] p-4 text-sm text-[#1F1B2E] placeholder:text-[#8B84A3] outline-none resize-none font-body"
          />
          <button
            onClick={toggleMic}
            className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
              isListening ? "bg-red-500 text-white animate-pulse" : "bg-[#2B2438] text-white hover:bg-[#3A3050]"
            }`}
            title={isListening ? "Stop recording" : "Voice input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={text.trim().length < 10 || isProcessing}
        className="w-full mt-5 py-4 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] hover:from-[#FF7A59] hover:to-[#F05A3B] disabled:from-[#DDD8EC] disabled:to-[#D0CAE4] disabled:text-[#9B94B0] text-white font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(249,107,76,0.4)] transition-all"
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