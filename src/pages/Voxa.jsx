import React, { useState, useEffect, useRef } from "react";

const MULTILANG_FONT = "'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Devanagari', 'Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans Thai', 'Noto Sans Hebrew', 'Noto Sans Bengali', system-ui, sans-serif";
import { ArrowLeftRight, Volume2, Copy, X, ChevronDown, Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = [
  { code: "af", name: "Afrikaans" }, { code: "sq", name: "Albanian" }, { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" }, { code: "hy", name: "Armenian" }, { code: "az", name: "Azerbaijani" },
  { code: "eu", name: "Basque" }, { code: "be", name: "Belarusian" }, { code: "bn", name: "Bengali" },
  { code: "bs", name: "Bosnian" }, { code: "bg", name: "Bulgarian" }, { code: "ca", name: "Catalan" },
  { code: "ceb", name: "Cebuano" }, { code: "ny", name: "Chichewa" }, { code: "zh-cn", name: "Chinese (Simplified)" },
  { code: "zh-tw", name: "Chinese (Traditional)" }, { code: "co", name: "Corsican" }, { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" }, { code: "da", name: "Danish" }, { code: "nl", name: "Dutch" },
  { code: "en", name: "English" }, { code: "eo", name: "Esperanto" }, { code: "et", name: "Estonian" },
  { code: "tl", name: "Filipino" }, { code: "fi", name: "Finnish" }, { code: "fr", name: "French" },
  { code: "fy", name: "Frisian" }, { code: "gl", name: "Galician" }, { code: "ka", name: "Georgian" },
  { code: "de", name: "German" }, { code: "el", name: "Greek" }, { code: "gu", name: "Gujarati" },
  { code: "ht", name: "Haitian Creole" }, { code: "ha", name: "Hausa" }, { code: "haw", name: "Hawaiian" },
  { code: "iw", name: "Hebrew" }, { code: "hi", name: "Hindi" }, { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Hungarian" }, { code: "is", name: "Icelandic" }, { code: "ig", name: "Igbo" },
  { code: "id", name: "Indonesian" }, { code: "ga", name: "Irish" }, { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" }, { code: "jw", name: "Javanese" }, { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" }, { code: "km", name: "Khmer" }, { code: "rw", name: "Kinyarwanda" },
  { code: "ko", name: "Korean" }, { code: "ku", name: "Kurdish" }, { code: "ky", name: "Kyrgyz" },
  { code: "lo", name: "Lao" }, { code: "la", name: "Latin" }, { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" }, { code: "lb", name: "Luxembourgish" }, { code: "mk", name: "Macedonian" },
  { code: "mg", name: "Malagasy" }, { code: "ms", name: "Malay" }, { code: "ml", name: "Malayalam" },
  { code: "mt", name: "Maltese" }, { code: "mi", name: "Maori" }, { code: "mr", name: "Marathi" },
  { code: "mn", name: "Mongolian" }, { code: "my", name: "Myanmar (Burmese)" }, { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" }, { code: "or", name: "Odia" }, { code: "ps", name: "Pashto" },
  { code: "fa", name: "Persian" }, { code: "pl", name: "Polish" }, { code: "pt", name: "Portuguese" },
  { code: "pa", name: "Punjabi" }, { code: "ro", name: "Romanian" }, { code: "ru", name: "Russian" },
  { code: "sm", name: "Samoan" }, { code: "gd", name: "Scots Gaelic" }, { code: "sr", name: "Serbian" },
  { code: "st", name: "Sesotho" }, { code: "sn", name: "Shona" }, { code: "sd", name: "Sindhi" },
  { code: "si", name: "Sinhala" }, { code: "sk", name: "Slovak" }, { code: "sl", name: "Slovenian" },
  { code: "so", name: "Somali" }, { code: "es", name: "Spanish" }, { code: "su", name: "Sundanese" },
  { code: "sw", name: "Swahili" }, { code: "sv", name: "Swedish" }, { code: "tg", name: "Tajik" },
  { code: "ta", name: "Tamil" }, { code: "tt", name: "Tatar" }, { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" }, { code: "tr", name: "Turkish" }, { code: "tk", name: "Turkmen" },
  { code: "uk", name: "Ukrainian" }, { code: "ur", name: "Urdu" }, { code: "ug", name: "Uyghur" },
  { code: "uz", name: "Uzbek" }, { code: "vi", name: "Vietnamese" }, { code: "cy", name: "Welsh" },
  { code: "xh", name: "Xhosa" }, { code: "yi", name: "Yiddish" }, { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" }
];

function LanguagePicker({ value, onChange, exclude }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const selected = LANGUAGES.find(l => l.code === value);
  const filtered = LANGUAGES.filter(l => l.code !== exclude && l.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-sm hover:bg-white/15 transition-all"
      >
        <span>{selected?.name || "Select"}</span>
        <ChevronDown className="w-4 h-4 text-white/60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 z-50 w-56 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/10">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/10">
                <Search className="w-3.5 h-3.5 text-white/50" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search language..."
                  className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-white/40"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { onChange(lang.code); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${value === lang.code ? "text-blue-400 font-semibold" : "text-white/80"}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VoxaPage() {
  useEffect(() => {
    if (!document.head.querySelector('[data-voxa-fonts]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('data-voxa-fonts', '1');
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Arabic&family=Noto+Sans+Devanagari&family=Noto+Sans+SC&family=Noto+Sans+JP&family=Noto+Sans+KR&family=Noto+Sans+Thai&family=Noto+Sans+Hebrew&family=Noto+Sans+Bengali&display=swap';
      document.head.appendChild(link);
    }
  }, []);
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [loading, setLoading] = useState(false);
  const [romanization, setRomanization] = useState("");
  const [speakingSource, setSpeakingSource] = useState(false);
  const [speakingTarget, setSpeakingTarget] = useState(false);
  const debounceRef = useRef(null);

  const translate = async (text, from, to) => {
    if (!text.trim()) { setTranslatedText(""); setRomanization(""); return; }
    setLoading(true);
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&dt=rm&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      const result = data[0]?.map(item => item[0]).join("") || "";
      const roman = data[0]?.map(item => item[3]).filter(Boolean).join("") || "";
      setTranslatedText(result);
      setRomanization(roman);
    } catch (err) {
      toast.error("Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      translate(sourceText, sourceLang, targetLang);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [sourceText, sourceLang, targetLang]);

  const speak = (text, lang, setSpeaking) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const swapLanguages = () => {
    const newSource = targetLang;
    const newTarget = sourceLang;
    const newText = translatedText;
    setSourceLang(newSource);
    setTargetLang(newTarget);
    setSourceText(newText);
    setTranslatedText("");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("AppStore")}>
            <button className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 transition-all">
              <span className="text-white/70 text-lg leading-none">←</span>
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-gray-300 flex items-center justify-center shadow-lg">
              <span className="text-xl">🗣️</span>
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">Voxa</h1>
              <p className="text-white/40 text-xs">200+ languages · Instant</p>
            </div>
          </div>
        </div>

        {/* Language Selector Bar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <LanguagePicker value={sourceLang} onChange={setSourceLang} exclude={targetLang} />
          <button
            onClick={swapLanguages}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4 text-white/70" />
          </button>
          <LanguagePicker value={targetLang} onChange={setTargetLang} exclude={sourceLang} />
        </div>

        {/* Source Input Card */}
        <motion.div
          className="rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/12 p-5 mb-3 shadow-2xl"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
              {LANGUAGES.find(l => l.code === sourceLang)?.name}
            </p>
            <div className="flex gap-2">
              {sourceText && (
                <button onClick={() => { setSourceText(""); setTranslatedText(""); }} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                  <X className="w-3.5 h-3.5 text-white/60" />
                </button>
              )}
              <button
                onClick={() => speak(sourceText, sourceLang, setSpeakingSource)}
                disabled={!sourceText}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${speakingSource ? "bg-blue-500 animate-pulse" : "bg-white/10 hover:bg-white/20"} disabled:opacity-30`}
              >
                <Volume2 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
          <textarea
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder="Enter text to translate..."
            rows={5}
            className="w-full bg-transparent text-white text-lg placeholder:text-white/25 outline-none resize-none leading-relaxed"
            style={{ fontFamily: MULTILANG_FONT }}
          />
        </motion.div>

        {/* Translated Output Card */}
        <motion.div
          className="rounded-3xl backdrop-blur-2xl border p-5 shadow-2xl relative overflow-hidden"
          style={{ background: "rgba(59,130,246,0.08)", borderColor: "rgba(99,179,237,0.2)" }}
        >
          {/* subtle inner glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-blue-300/60 text-xs font-medium uppercase tracking-wider">
                {LANGUAGES.find(l => l.code === targetLang)?.name}
              </p>
              <div className="flex gap-2">
                {translatedText && (
                  <button onClick={() => copyToClipboard(translatedText)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <Copy className="w-3.5 h-3.5 text-white/60" />
                  </button>
                )}
                <button
                  onClick={() => speak(translatedText, targetLang, setSpeakingTarget)}
                  disabled={!translatedText}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${speakingTarget ? "bg-blue-500 animate-pulse" : "bg-white/10 hover:bg-white/20"} disabled:opacity-30`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-white/40 text-sm">Translating...</span>
              </div>
            ) : (
              <div className="min-h-[120px]">
                <p className="text-white text-lg leading-relaxed whitespace-pre-wrap" style={{ fontFamily: MULTILANG_FONT }}>
                  {translatedText || <span className="text-white/20">Translation will appear here...</span>}
                </p>
                {romanization && translatedText && (
                  <p className="text-white/50 text-sm mt-2 italic" style={{ fontFamily: "system-ui, sans-serif" }}>
                    {romanization}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick language chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[["es","Spanish"],["fr","French"],["de","German"],["ja","Japanese"],["ar","Arabic"],["zh-cn","Chinese"],["hi","Hindi"],["pt","Portuguese"]].map(([code, name]) => (
            <button
              key={code}
              onClick={() => setTargetLang(code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all backdrop-blur-md ${
                targetLang === code
                  ? "bg-blue-500/30 border-blue-400/50 text-blue-300"
                  : "bg-white/6 border-white/12 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}