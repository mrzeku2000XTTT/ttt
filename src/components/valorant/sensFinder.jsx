// ─── Sensitivity Finder logic (Aim Labs-style) ───────────────────────────────
// Algorithm:
//  • Run a fixed scenario (switching) at N different sensitivities
//  • For each sample, track: hits, misses, time-to-hit, overshoot distance
//  • Score each sens: accuracy × speed − overshoot penalty
//  • Recommend the sens with the highest score
//
// Overshoot detection:
//  At the moment of click-miss, we compute how far past the target the
//  crosshair was. If avg overshoot is large → sens too high. If time-to-hit
//  is too long (with low overshoot) → sens too low.

export const SENS_SAMPLES = [2, 4, 6, 8, 10, 12]; // values to try
export const SAMPLE_DURATION_SEC = 15;

export const scoreSample = ({ hits, shots, avgTimeToHit, avgOvershoot }) => {
  const accuracy = shots > 0 ? hits / shots : 0;
  const speedScore = avgTimeToHit > 0 ? Math.min(1, 1.2 / avgTimeToHit) : 0;
  const overshootPenalty = Math.min(0.5, avgOvershoot * 0.15);
  // Accuracy weighted 60%, speed 40%, then subtract overshoot penalty
  return Math.max(0, accuracy * 0.6 + speedScore * 0.4 - overshootPenalty);
};

export const getRecommendation = (samples) => {
  if (!samples.length) return null;
  const scored = samples.map((s) => ({ ...s, score: scoreSample(s) }));
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Verdict reasoning
  const avgOver = samples.reduce((a, b) => a + b.avgOvershoot, 0) / samples.length;
  const avgAcc = samples.reduce((a, b) => a + (b.shots > 0 ? b.hits / b.shots : 0), 0) / samples.length;

  let verdict = "";
  if (avgOver > 2) verdict = "You're overshooting a lot — lower sens improves precision.";
  else if (avgAcc < 0.4) verdict = "Accuracy is low across all sens — try slower, more deliberate shots.";
  else verdict = "Your aim is consistent — the recommended sens maximizes both speed and accuracy.";

  return { best, scored, verdict };
};