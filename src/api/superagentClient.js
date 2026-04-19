import { createClient } from '@base44/sdk';

// Cross-app client pointed at Superagent's Base44 app.
// Used to subscribe to VideoRender entity updates pushed by Superagent
// when an imposter video render finishes — replaces polling.
const SUPERAGENT_APP_ID = '69e00a3b3c4957544571e863';

export const superagentClient = createClient({
  appId: SUPERAGENT_APP_ID,
  requiresAuth: false,
});