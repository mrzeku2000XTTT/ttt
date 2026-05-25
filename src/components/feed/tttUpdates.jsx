// ─────────────────────────────────────────────────────────────
// TTT Platform Updates Registry
// ─────────────────────────────────────────────────────────────
// Add your newest feature/app/release at the TOP of this list.
// The NewsToast component automatically surfaces the most recent
// 3 entries here before rotating into live Kaspa news.
//
// Format:
//   { id, title, summary, tag, date (YYYY-MM-DD), link? }
// ─────────────────────────────────────────────────────────────

export const TTT_UPDATES = [
  {
    id: "quick-storyboard-crab-ai",
    title: "Quick Storyboard Crab AI Upgraded",
    summary: "StoryboardCrabBot now has a cleaner Crab AI button plus continuous voice input for faster creative direction and storyboard feedback.",
    tag: "AI Studio",
    date: "2026-05-25",
    link: "/QuickStoryboard",
  },
  {
    id: "moodboard-continuity-studio",
    title: "Mood Board Continuity Tools",
    summary: "Mood Board now helps extend storyboard scenes with stronger continuity prompts, scene logic, and copy-ready motion cut direction.",
    tag: "Creative Tools",
    date: "2026-05-24",
    link: "/MoodBoard",
  },
  {
    id: "hiro-launch",
    title: "Hiro — AI Typography Studio",
    summary: "Design on-brand fonts, wordmarks, and type systems. Build your Type Kit once, generate letterforms that actually belong to your brand.",
    tag: "New App",
    date: "2026-04-19",
    link: "/Hiro",
  },
  {
    id: "listing-apps",
    title: "List Your App",
    summary: "Anyone can now submit apps to the TTT App Store. Admin-reviewed, one-click approval flow.",
    tag: "Platform",
    date: "2026-04-19",
    link: "/AppStoreV2",
  },
  {
    id: "oneshot-studio",
    title: "OneShot Studio",
    summary: "Clone any UI and vibe-code with AI clusters. Live preview, chat-driven edits, full studio workspace.",
    tag: "New App",
    date: "2026-04-10",
    link: "/OneShotStudio",
  },
  {
    id: "tttv2-launch",
    title: "TTT 2.0 is Live",
    summary: "Redesigned landing, new hero, community videos, cleaner navigation. The Kaspa super-app, refined.",
    tag: "Release",
    date: "2026-04-01",
    link: "/TTTV2",
  },
];

/** Returns the N most recent updates sorted by date desc. */
export function getLatestUpdates(limit = 3) {
  return [...TTT_UPDATES]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit)
    .map((u) => ({ ...u, isPlatformUpdate: true }));
}