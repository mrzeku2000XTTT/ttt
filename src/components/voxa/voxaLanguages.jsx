// Shared subset of common languages for the learning page selector.
// Keeping this list focused (vs Voxa's full 100+) so the picker stays scannable.
export const LEARN_LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh-cn", name: "Chinese (Simplified)" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "he", name: "Hebrew" },
];

export const MULTILANG_FONT = "'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Devanagari', 'Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans Thai', 'Noto Sans Hebrew', 'Noto Sans Bengali', system-ui, sans-serif";

// Speak a string in a target language using the browser's speech synthesis.
export function speakText(text, lang) {
  if (!text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  } catch {}
}