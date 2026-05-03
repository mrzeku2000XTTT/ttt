import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Layers, BookOpen, MessageCircle } from "lucide-react";

import LearnLanguagePicker from "@/components/voxa/LearnLanguagePicker";
import FlashcardsMode from "@/components/voxa/FlashcardsMode";
import LessonsMode from "@/components/voxa/LessonsMode";
import ConversationMode from "@/components/voxa/ConversationMode";

const MODES = [
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "chat", label: "AI Chat", icon: MessageCircle },
];

export default function VoxaLearnPage() {
  const [language, setLanguage] = useState("es");
  const [mode, setMode] = useState("flashcards");

  useEffect(() => {
    if (!document.head.querySelector("[data-voxa-fonts]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute("data-voxa-fonts", "1");
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Arabic&family=Noto+Sans+Devanagari&family=Noto+Sans+SC&family=Noto+Sans+JP&family=Noto+Sans+KR&family=Noto+Sans+Thai&family=Noto+Sans+Hebrew&family=Noto+Sans+Bengali&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Voxa")}>
            <button className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 transition-all">
              <span className="text-white/70 text-lg leading-none">←</span>
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">Voxa Learn</h1>
              <p className="text-white/40 text-xs">Flashcards · Lessons · AI Conversation</p>
            </div>
          </div>
        </div>

        {/* Language picker */}
        <div className="mb-4">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2 px-1">Language</p>
          <LearnLanguagePicker value={language} onChange={setLanguage} />
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-3 gap-2 mb-5 p-1 rounded-2xl bg-white/6 backdrop-blur-md border border-white/10">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-white text-black shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode body */}
        <div>
          {mode === "flashcards" && <FlashcardsMode key={`fc-${language}`} language={language} />}
          {mode === "lessons" && <LessonsMode key={`ls-${language}`} language={language} />}
          {mode === "chat" && <ConversationMode key={`ch-${language}`} language={language} />}
        </div>
      </div>
    </div>
  );
}