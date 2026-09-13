import { ETA_COMPONENTS } from './etaComponents';
import { buildETADirectorCore } from './etaDirectorCorePrompt';
import { buildETAComponentRules } from './etaDirectorComponentPrompt';

export function buildETADirectorPrompt(brief, {
  passIndex = 1,
  maxPasses = 1,
  currentPlan = null,
  referenceMediaCount = 0,
} = {}) {
  return [
    buildETADirectorCore({ brief, passIndex, maxPasses, currentPlan, referenceMediaCount }),
    buildETAComponentRules(ETA_COMPONENTS),
  ].join('\n\n');
}