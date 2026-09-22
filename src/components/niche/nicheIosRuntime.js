// Platform handling only: scene prompts, models, effects and output stay shared.
export const isNicheIos = () => /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function prepareNicheIosAudio(ac) {
  await Promise.race([ac.resume(), new Promise((resolve) => setTimeout(resolve, 1500))]);
  if (document.hidden || ac.state !== 'running') {
    throw new Error('Keep Niche Studio open, then tap Resume build to start the saved scenes with audio.');
  }
}

export async function loadNicheIosAssets(items, load) {
  const result = [];
  for (const item of items) result.push(await load(item));
  return result;
}