// Refresh survival for the NICHE auto-pilot's builds: the in-flight job is
// checkpointed to localStorage (script, per-scene prompts, and every
// already-generated scene image/narration URL — those are permanent files),
// so an accidental reload or an iOS tab kill never throws away minutes of
// generation. On reload the user gets a "Resume build" offer that
// regenerates ONLY the missing pieces and then stitches.
const KEY = (email) => `niche_studio_job${email ? ':' + email : ''}`;

export const saveBuildJob = (email, job) => {
  try { localStorage.setItem(KEY(email), JSON.stringify(job)); } catch {}
};

export const loadBuildJob = (email) => {
  try {
    const job = JSON.parse(localStorage.getItem(KEY(email)) || 'null');
    if (!job || !Array.isArray(job.scenes) || !job.scenes.length) return null;
    const fill = (arr) => new Array(job.scenes.length).fill(null).map((_, i) => arr?.[i] || null);
    return { ...job, images: fill(job.images), audios: fill(job.audios) };
  } catch { return null; }
};

export const updateBuildJob = (email, patch) => {
  const cur = loadBuildJob(email);
  if (!cur) return;
  saveBuildJob(email, { ...cur, ...patch });
};

export const clearBuildJob = (email) => {
  try { localStorage.removeItem(KEY(email)); } catch {}
};