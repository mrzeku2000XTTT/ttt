// ─────────────────────────────────────────────────────────────────────────
// Better Ideas — verified channel memory
// Source video (seed): https://www.youtube.com/watch?v=MFLF9c1x8a8
// Channel: Better Ideas  ·  Handle: @betterideas
// Creator: Joey Schweitzer  ·  Second channel: @JoeySchweitzer
//
// Every entry below was verified by fetching its YouTube watch page and
// confirming the uploader is either "Better Ideas" (main) or
// "Joey Schweitzer" (second channel). Hallucinated / wrong-channel IDs were
// discarded. This is a VERIFIED SUBSET — the channel has more uploads;
// pulling the complete list requires the YouTube Data API.
// ─────────────────────────────────────────────────────────────────────────

export const BETTER_IDEAS_CHANNEL = {
  name: "Better Ideas",
  handle: "@betterideas",
  creator: "Joey Schweitzer",
  secondChannel: "@JoeySchweitzer",
  theme: "Self-improvement, productivity & discipline — cinematic, story-driven essays.",
  tagline: "Inaction is a Slow Death.",
  seedVideoId: "MFLF9c1x8a8",
};

// Seed video — the one the user asked us to "think about". Distilled method below.
export const SEED_VIDEO = {
  videoId: "MFLF9c1x8a8",
  title: "How To Make the Best To-Do List For School",
  channel: "Better Ideas",
  uploadedAt: "2017-01-31",
  length: "03:22",
  views: 80018,
  url: "https://www.youtube.com/watch?v=MFLF9c1x8a8",
  distilledMethod: [
    "Brain dump — empty every short-term task/goal onto paper to free mental RAM.",
    "Prioritize — rank every task from most to least urgent.",
    "Cut — move anything that can wait to a separate list; ignore it until the main list is done.",
    "Chunk — break each main-list item into sub-parts of ~30 min or less, then chip away.",
    "A mountain is climbed one step at a time — repeat daily and tasks stop feeling overwhelming.",
  ],
};

// Verified main-channel (@betterideas) uploads, sorted oldest → newest.
export const BETTER_IDEAS_VIDEOS = [
  {
    videoId: "MFLF9c1x8a8",
    title: "How To Make the Best To-Do List For School",
    uploadedAt: "2017-01-31",
    length: "03:22",
    views: 80018,
  },
  {
    videoId: "daPmenMTbU4",
    title: "How the way you watch movies affects your life",
    uploadedAt: "2019-07-13",
    length: "09:05",
    views: 1924569,
  },
  {
    videoId: "Vd_Lcub_OxA",
    title: "How to quickly get out of a rut",
    uploadedAt: "2019-09-30",
    length: "09:41",
    views: 12164126,
  },
  {
    videoId: "GtNEf9UyOLg",
    title: "The simple method for sticking to habits",
    uploadedAt: "2019-12-31",
    length: "07:42",
    views: 251873,
  },
  {
    videoId: "Olzc15hIcyI",
    title: "How to change your life in a year",
    uploadedAt: "2021-12-25",
    length: "14:00",
    views: 3663969,
  },
  {
    videoId: "RIVVQkZtnAU",
    title: "Inaction Is A Slow Death",
    uploadedAt: "2022-02-25",
    length: "04:17",
    views: 1402682,
  },
  {
    videoId: "cAdcaLIALiU",
    title: "23 habits that will (quickly) ruin your life",
    uploadedAt: "2025-03-11",
    length: "10:04",
    views: 553245,
  },
  {
    videoId: "3aSVj7oDg8U",
    title: "How to unf*** your motivation",
    uploadedAt: "2025-07-20",
    length: "10:39",
    views: 195808,
  },
  {
    videoId: "RYKybDrj-Eg",
    title: "Your life's greatest chapter begins now",
    uploadedAt: "2025-12-26",
    length: "11:42",
    views: 221369,
  },
  {
    videoId: "TgCAbYoslXI",
    title: "Ranking the WORST Bad Habits (to ruin your life FAST)",
    uploadedAt: "unconfirmed",
    length: "14:12",
    views: null,
    note: "Uploader not confirmed (page gated) — title matches Better Ideas style; treat as likely.",
  },
];

// Verified uploads from Joey's second channel (@JoeySchweitzer) — same creator.
export const JOEY_SECOND_CHANNEL_VIDEOS = [
  {
    videoId: "kW56L-dOdR4",
    title: "Do you have a girlfriend?? | Answering Your Questions #1",
    uploadedAt: "2020-06-10",
    length: "18:17",
    views: 37161,
  },
  {
    videoId: "6iieLZNks8Y",
    title: "...is Better Ideas cooked?",
    uploadedAt: "2025-07-02",
    length: "12:44",
    views: 11707,
  },
  {
    videoId: "NNuR5fbUOMU",
    title: "Ranking Conspiracy Theories... 😬",
    uploadedAt: "2025-09-02",
    length: "16:11",
    views: 5260,
  },
];

// Rejected during verification (wrong channel / hallucinated) — kept for reference.
export const REJECTED_IDS = [
  { videoId: "J2T1pR9_5fo", reason: "Uploaded by Tom Benson, not Better Ideas." },
  { videoId: "jZo7G0zLXKE", reason: "Uploader unconfirmed; title unrelated to channel." },
  { videoId: "xY7zAbCdEfG", reason: "Hallucinated — video unavailable." },
  { videoId: "wV9uT8sR7qP", reason: "Hallucinated — video unavailable." },
  { videoId: "mN6bV5cXz1Q", reason: "Hallucinated — video unavailable." },
  { videoId: "kL9jH8gF6dD", reason: "Hallucinated — video unavailable." },
  { videoId: "pP0oI9uY7tT", reason: "Hallucinated — video unavailable." },
  { videoId: "qW2eR3tY4uI", reason: "Hallucinated — video unavailable." },
];

export const ALL_VERIFIED = [
  ...BETTER_IDEAS_VIDEOS,
  ...JOEY_SECOND_CHANNEL_VIDEOS.map((v) => ({ ...v, channel: "Joey Schweitzer (2nd)" })),
];

export const buildYouTubeUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
export const buildThumbnail = (id) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;