import {
  CalendarDays, MapPin, ListChecks, Mail, Clock, MessageCircle, CloudSun,
  Dumbbell, StickyNote, Phone, Music, Wallet, HeartPulse, Briefcase,
  Video, Users, Plane, Utensils, GraduationCap, ShoppingBag, Bell,
} from "lucide-react";

// The app tile that sits at the top of every notification. Real iOS notifications
// are identified by their app icon, so each one gets a recognisable tile — and any
// app name the agent invents falls back to a stable colour derived from its name.

const PRESETS = {
  calendar: { Icon: CalendarDays, bg: "linear-gradient(#ffffff, #f1f1f4)", fg: "#ff3b30" },
  maps: { Icon: MapPin, bg: "linear-gradient(#5fd07a, #2f9cf4)", fg: "#ffffff" },
  reminders: { Icon: ListChecks, bg: "linear-gradient(#ffffff, #f1f1f4)", fg: "#ff9500" },
  mail: { Icon: Mail, bg: "linear-gradient(#4aa3ff, #1c6ef2)", fg: "#ffffff" },
  clock: { Icon: Clock, bg: "linear-gradient(#3a3a3c, #000000)", fg: "#ffffff" },
  messages: { Icon: MessageCircle, bg: "linear-gradient(#5ce07a, #34c759)", fg: "#ffffff" },
  weather: { Icon: CloudSun, bg: "linear-gradient(#54b7ff, #0a84ff)", fg: "#ffffff" },
  fitness: { Icon: Dumbbell, bg: "linear-gradient(#2c2c2e, #0b0b0d)", fg: "#d7ff3d" },
  notes: { Icon: StickyNote, bg: "linear-gradient(#ffd60a, #ffb800)", fg: "#3a2c00" },
  phone: { Icon: Phone, bg: "linear-gradient(#5ce07a, #34c759)", fg: "#ffffff" },
  music: { Icon: Music, bg: "linear-gradient(#ff5f7e, #fa2b56)", fg: "#ffffff" },
  wallet: { Icon: Wallet, bg: "linear-gradient(#3a3a3c, #000000)", fg: "#ffffff" },
  health: { Icon: HeartPulse, bg: "linear-gradient(#ffffff, #f1f1f4)", fg: "#ff2d55" },
  work: { Icon: Briefcase, bg: "linear-gradient(#8e8e93, #5856d6)", fg: "#ffffff" },
  meet: { Icon: Video, bg: "linear-gradient(#4aa3ff, #1c6ef2)", fg: "#ffffff" },
  teams: { Icon: Users, bg: "linear-gradient(#8e8e93, #5856d6)", fg: "#ffffff" },
  travel: { Icon: Plane, bg: "linear-gradient(#54b7ff, #0a84ff)", fg: "#ffffff" },
  food: { Icon: Utensils, bg: "linear-gradient(#ffb340, #ff9500)", fg: "#ffffff" },
  school: { Icon: GraduationCap, bg: "linear-gradient(#8e8e93, #5856d6)", fg: "#ffffff" },
  shop: { Icon: ShoppingBag, bg: "linear-gradient(#5ce07a, #34c759)", fg: "#ffffff" },
};

const TINTS = [
  ["#4aa3ff", "#1c6ef2"], ["#5ce07a", "#34c759"], ["#ffb340", "#ff9500"],
  ["#ff5f7e", "#fa2b56"], ["#a08cff", "#5856d6"], ["#54d8e0", "#0aa2b8"],
];

function hash(name) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

/** → { Icon, bg, fg } for any app name the agent returns. */
export function appIdentity(appName) {
  const name = String(appName || "Calendar").trim();
  const preset = PRESETS[name.toLowerCase()];
  if (preset) return preset;
  const [a, b] = TINTS[hash(name) % TINTS.length];
  return { Icon: Bell, bg: `linear-gradient(${a}, ${b})`, fg: "#ffffff" };
}

/** Tone → the small accent used on the notification rail. */
export const TONE_LABEL = {
  now: "Happening now",
  next: "Up next",
  later: "Later",
  "heads-up": "Heads-up",
  conflict: "Clash",
};