// Wrap InvokeLLM with retry-on-transient-network-error so flaky mobile
// connections don't kill a build. Only retries transport failures (network
// drop, timeout, abort) — genuine model/logic errors still throw immediately.

import { base44 } from "@/api/base44Client";

const TRANSIENT = /network|failed to fetch|timeout|timed out|aborted|err_network|econnreset|socket hang up|load failed|networkerror|network request failed/;

export function isTransientError(err) {
  const m = String(err?.message || err || "").toLowerCase();
  if (!m) return true; // an empty thrown error is almost always a transport drop
  return TRANSIENT.test(m);
}

export async function invokeLLMWithRetry(args, opts = {}) {
  const max = opts.retries != null ? opts.retries : 3;
  let lastErr = null;
  for (let attempt = 0; attempt <= max; attempt++) {
    try {
      return await base44.integrations.Core.InvokeLLM(args);
    } catch (err) {
      lastErr = err;
      if (attempt === max || !isTransientError(err)) throw err;
      // backoff: ~900ms, 1800ms, 3600ms
      await new Promise((r) => setTimeout(r, 900 * Math.pow(2, attempt)));
    }
  }
  throw lastErr;
}