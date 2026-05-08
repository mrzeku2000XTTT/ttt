// Curated library of pre-generated Kine videos.
// Used both as featured suggestions AND as fallback previews when the user
// describes a custom video — we semantic-match against `keywords` to pick the
// closest matching demo video.

export const KINE_LIBRARY = [
  {
    label: "Cyberpunk",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d8ab7afa0_generated_image.png",
    video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/036cd0e4c_generated_video.mp4",
    prompt: "A neon cyberpunk fox running through rain-soaked Tokyo streets at night, cinematic wide shot, electric purple and pink lighting",
    keywords: ["cyberpunk", "neon", "tokyo", "night", "rain", "city", "futuristic", "purple", "pink", "synthwave"],
  },
  {
    label: "Cinematic",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/969976cfd_generated_image.png",
    video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/9a1725e5a_generated_video.mp4",
    prompt: "A massive ocean wave breaking in slow motion at golden hour, hyper-realistic, cinematic, drone shot",
    keywords: ["ocean", "wave", "water", "sea", "beach", "golden", "sunset", "cinematic", "nature", "drone"],
  },
  {
    label: "Sci-Fi",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/a015cce9f_generated_image.png",
    video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/d7f40ae9c_generated_video.mp4",
    prompt: "A sleek spacecraft launching from a futuristic city at dawn, volumetric clouds, cinematic wide angle",
    keywords: ["space", "spacecraft", "rocket", "scifi", "sci-fi", "futuristic", "alien", "robot", "tech", "clouds"],
  },
  {
    label: "Artistic",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4cbcf169f_generated_image.png",
    video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/247c485ae_generated_video.mp4",
    prompt: "Liquid gold flowing and morphing into geometric shapes, abstract studio lighting, ultra-glossy, macro shot",
    keywords: ["abstract", "art", "artistic", "liquid", "gold", "geometric", "macro", "morphing", "studio", "glossy"],
  },
  {
    label: "Fantasy",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0b0d2c008_generated_image.png",
    video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/578062a79_generated_video.mp4",
    prompt: "A glowing dragon flying over misty mountains at sunrise, epic cinematic shot, fog and god rays",
    keywords: ["dragon", "fantasy", "magic", "mountain", "mountains", "fog", "mist", "epic", "medieval", "sunrise", "creature"],
  },
  {
    label: "Action",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/74ac324b6_generated_image.png",
    video: "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/780435238_generated_video.mp4",
    prompt: "A bright red sports car drifting through a desert canyon road at sunset, dust trails, cinematic wide angle",
    keywords: ["car", "action", "race", "drift", "desert", "speed", "fast", "vehicle", "explosion", "chase", "motion"],
  },
];

// Pick the closest demo video from the library based on prompt keyword overlap.
// Falls back to "Cinematic" if no good match.
export function matchKineVideo(prompt) {
  const text = (prompt || "").toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const item of KINE_LIBRARY) {
    let score = 0;
    for (const kw of item.keywords) {
      if (text.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best || KINE_LIBRARY[1]; // default → Cinematic
}