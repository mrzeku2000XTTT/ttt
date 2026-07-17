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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl shadow-gray-200/40">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">The Chaos Intake</h2>
          <p className="text-xs text-gray-500 mt-1">Dump your raw, unfiltered thoughts. No forms. No pretense.</p>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"I dropped out of uni 2 years ago. I smoke weed, play MMOs all night, and wake up at 1 PM feeling like garbage. I'm broke. I'm okay at photoshop because I make memes, but I have zero work history and a massive resume gap. I can't handle a toxic manager or a loud office."}
            className="w-full min-h-[140px] bg-white/50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none"
          />
          <button
            onClick={toggleMic}
            className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={isListening ? "Stop recording" : "Voice input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={text.trim().length < 10 || isProcessing}
          className="w-full mt-4 h-14 rounded-2xl bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {isProcessing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> SAE ANALYZING YOUR MESS...</>
          ) : (
            <><Send className="w-4 h-4" /> PROCESS MY CHAOS</>
          )}
        </button>
      </div>
    </div>
  );
}