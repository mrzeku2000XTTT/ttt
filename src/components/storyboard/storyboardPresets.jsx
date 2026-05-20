const subjects = [
  "young inventor", "wandering chef", "space courier", "forest guardian", "robot apprentice",
  "street magician", "ocean cartographer", "desert mechanic", "time librarian", "cloud gardener"
];

const worlds = [
  "floating island village", "neon night market", "ancient bamboo academy", "cozy mountain workshop", "underwater city",
  "solar-punk greenhouse", "moon colony kitchen", "enchanted train station", "desert festival arena", "storybook harbor"
];

const conflicts = [
  "must prepare for a festival", "discovers a hidden map", "protects a tiny creature", "repairs a magical machine", "enters a friendly tournament",
  "solves a village mystery", "learns from a strict mentor", "builds a surprising invention", "guides a lost traveler", "unlocks an old family recipe"
];

const moods = [
  "warm and whimsical", "cinematic and emotional", "playful adventure", "premium animation pitch", "cozy handcrafted",
  "epic but family-safe", "funny expressive comedy", "quiet magical realism", "bold toyetic design", "storybook concept art"
];

const styles = ["Character Bible", "Product Storyboard", "YouTube Intro", "Animation Pitch", "Comic Frames", "Game Cutscene"];

export const STORYBOARD_PRESETS = Array.from({ length: 1000 }, (_, index) => {
  const subject = subjects[index % subjects.length];
  const world = worlds[Math.floor(index / subjects.length) % worlds.length];
  const conflict = conflicts[Math.floor(index / 100) % conflicts.length];
  const mood = moods[(index * 7) % moods.length];
  const style = styles[index % styles.length];

  return {
    id: `preset-${index + 1}`,
    title: `${subject} in a ${world}`,
    style,
    idea: `An original ${mood} story about a ${subject} in a ${world} who ${conflict}. Create a polished production storyboard sheet with expressive characters, poses, props, palette, scale reference, and readable labels.`
  };
});