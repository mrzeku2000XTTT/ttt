import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useEvolve } from "@/lib/evolve/useEvolve";

const SOMPI = 100000000;

/**
 * useAgentMarket — the client half of player-to-player agent resale.
 *
 * Buying is reserve → ONE wallet payment straight to the seller → server
 * verifies that payment on TN-10 and moves the agent. The seller never holds
 * the buyer's funds in escrow, and the agent cannot change hands twice: the
 * listing is locked to the buyer before they pay.
 */
export default function useAgentMarket() {
  const { engine, currentPlayer: player, wallet, experimentId, say, persistNow } = useEvolve();
  const [info, setInfo] = useState(null);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!experimentId) return;
    const res = await base44.functions.invoke("evolveAgentMarket", { action: "info", experimentId });
    setInfo(res?.data || res);
  }, [experimentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const run = useCallback(async (fn) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e?.message || "Market action failed");
    } finally {
      setStep("");
      refresh();
    }
  }, [refresh]);

  /** Put one of MY agents up for sale at a tKAS price. */
  const listAgent = useCallback((agent, priceKas, payoutAddress) => run(async () => {
    setStep(`Listing ${agent.code}…`);
    const res = await base44.functions.invoke("evolveAgentMarket", {
      action: "list", experimentId,
      agentId: agent.id, agentCode: agent.code, agentName: agent.name,
      priceKas, payoutAddress, sellerCode: player?.code || "",
    });
    const data = res?.data || res;
    if (!data?.ok) throw new Error(data?.error || "Could not list this agent");
  }), [run, experimentId, player]);

  const cancelListing = useCallback((listingId) => run(async () => {
    setStep("Withdrawing listing…");
    const res = await base44.functions.invoke("evolveAgentMarket", { action: "cancel", experimentId, listingId });
    const data = res?.data || res;
    if (!data?.ok) throw new Error(data?.error || "Could not withdraw the listing");
  }), [run, experimentId]);

  /** Verify a payment already made, then take ownership. Retries while TN-10's index catches up. */
  const claimWithRetry = useCallback(async (listingId, txid, senderAddress) => {
    for (let i = 0; i < 5; i += 1) {
      const res = await base44.functions.invoke("evolveAgentMarket", {
        action: "claim", experimentId, listingId, txid, senderAddress,
      });
      const data = res?.data || res;
      if (data?.ok) {
        engine?.transferAgentOwnership?.(data.agentId, { userId: player?.user_id, playerId: player?.id });
        persistNow?.();
        say?.(`${data.agentCode} bought from ${data.sellerCode || "the market"} — now yours`, true);
        return;
      }
      if (!data?.pending) throw new Error(data?.error || "Purchase failed");
      setStep("TN-10 has not confirmed your payment yet — checking again…");
      await new Promise((r) => setTimeout(r, 4000));
    }
    throw new Error("Your payment is on-chain but TN-10 has not confirmed it yet. Press RETRY on this purchase in a moment — you will not be charged twice.");
  }, [experimentId, engine, player, persistNow, say]);

  /** Buy: reserve the listing, pay the seller from the wallet, then claim it. */
  const buy = useCallback((listing) => run(async () => {
    if (!wallet?.isTN10 || !wallet.address) throw new Error("Connect your Scorpion wallet to buy an agent");

    setStep("Reserving this agent…");
    const r = await base44.functions.invoke("evolveAgentMarket", {
      action: "reserve", experimentId, listingId: listing.id, buyerCode: player?.code || "",
    });
    const reserved = r?.data || r;
    if (!reserved?.ok) throw new Error(reserved?.error || "Could not reserve this agent");

    setStep(`Approve ${reserved.priceKas} tKAS to the seller in your wallet…`);
    const { txId } = await wallet.adapter.sendKaspa({
      to: reserved.sellerAddress,
      amountSompi: BigInt(Math.round(Number(reserved.priceKas) * SOMPI)),
    });

    setStep("Verifying your payment on TN-10…");
    await claimWithRetry(reserved.listingId, txId, wallet.address);
  }), [run, wallet, experimentId, player, claimWithRetry]);

  /** Finish a purchase that already paid but whose verification never returned. */
  const retryClaim = useCallback((listing) => run(async () => {
    if (!listing.paymentTxid) throw new Error("No payment recorded for this purchase yet");
    setStep("Checking your payment on TN-10…");
    await claimWithRetry(listing.id, listing.paymentTxid, wallet?.address);
  }), [run, wallet, claimWithRetry]);

  return { info, step, error, busy: !!step, listAgent, cancelListing, buy, retryClaim, refresh };
}