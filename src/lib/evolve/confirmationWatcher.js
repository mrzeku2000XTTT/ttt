/**
 * ConfirmationWatcher — polls EvolvePaymentIntent records that are in
 * BROADCAST or CONFIRMING state and checks their on-chain status.
 *
 * This runs in the frontend as a periodic poll. The actual TN10 confirmation
 * check is done by a backend function (evolveConfirmTick) which this calls.
 *
 * On reload, loadPendingIntents() finds all BROADCAST/CONFIRMING intents
 * and resumes watching — no second payment is needed.
 */

import { useCallback, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TxStatus } from "./txStateMachine";
import { loadPendingIntents } from "./paymentIntentService";

const POLL_INTERVAL_MS = 8000;

/**
 * React hook that watches pending payment intents and polls the backend
 * confirmation function. Calls onSettled / onFailed when intents reach
 * final states.
 */
export function useConfirmationWatcher({ experimentId, enabled, onSettled, onFailed }) {
  const timerRef = useRef(null);
  const callbacksRef = useRef({ onSettled, onFailed });
  callbacksRef.current = { onSettled, onFailed };

  const tick = useCallback(async () => {
    if (!experimentId) return;
    try {
      const pending = await loadPendingIntents(experimentId);
      if (!pending.length) return;

      // Call the backend confirmation function for each pending intent.
      // The backend checks TN10 status and updates the intent + chain tx.
      for (const intent of pending) {
        try {
          const result = await base44.functions.invoke("evolveConfirmTick", {
            experimentId,
            intentId: intent.id,
            txId: intent.tx_id,
          });
          if (result?.status === TxStatus.CONFIRMED || result?.status === TxStatus.SETTLED) {
            callbacksRef.current.onSettled?.(intent, result);
          } else if (result?.status === TxStatus.FAILED || result?.status === TxStatus.EXPIRED) {
            callbacksRef.current.onFailed?.(intent, result);
          }
        } catch (e) {
          // Backend function may not be deployed yet — silent in dev.
        }
      }
    } catch (e) {
      // Non-fatal — will retry next tick.
    }
  }, [experimentId]);

  useEffect(() => {
    if (!enabled || !experimentId) return undefined;
    // Immediate check on mount (resume watches after reload).
    tick();
    timerRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [enabled, experimentId, tick]);

  return { tick };
}