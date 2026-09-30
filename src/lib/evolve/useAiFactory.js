import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useEvolve } from "@/lib/evolve/useEvolve";

const SOMPI = 100000000;
const kasToSompi = (kas) => BigInt(Math.round(Number(kas) * SOMPI));

// A just-broadcast tx may not be indexed yet — retry the verification a few times.
async function invokeUntilVisible(payload, tries = 4) {
  let data = null;
  for (let i = 0; i < tries; i += 1) {
    const res = await base44.functions.invoke("evolveFactory", payload);
    data = res?.data || res;
    if (data?.ok || !data?.pending) return data;
    await new Promise((r) => setTimeout(r, 4000));
  }
  return data;
}

/**
 * useAiFactory — Factory births with ONE wallet approval.
 * The buyer signs a single TN-10 payment of the full total to the Factory.
 * The Factory mints the agent's own wallet and forwards its starting capital
 * server-side, so no second signature is ever needed.
 */
export default function useAiFactory() {
  const { engine, currentPlayer: player, wallet, experimentId, say, persistNow } = useEvolve();
  const [info, setInfo] = useState(null);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!experimentId) return;
    const res = await base44.functions.invoke("evolveFactory", { action: "info", experimentId });
    setInfo(res?.data || res);
  }, [experimentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const run = useCallback(async (fn) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e?.message || "Factory action failed");
    } finally {
      setStep("");
      refresh();
    }
  }, [refresh]);

  /** Bring a paid birth into the world (engine side) once its wallet exists. */
  const spawnInEngine = useCallback(({ agentId, address, feeTxid, capitalTxid }) => {
    const result = engine.createAgentForPlayer({ player, address, agentId, origin: "FACTORY", feeTxid, capitalTxid });
    persistNow?.();
    say(`${result.agent.code} created at the AI Factory`, true);
  }, [engine, player, persistNow, say]);

  /** Create an agent: ONE signature, then the Factory does the rest. */
  const createAgent = useCallback(() => run(async () => {
    const seq = engine.agentSeq + 1 + (info.pending?.length || 0);
    const agentId = `AGT_${String(seq).padStart(4, "0")}`;
    setStep(`Approve ${info.totalKas} tKAS in your wallet…`);
    const { txId } = await wallet.adapter.sendKaspa({ to: info.factoryAddress, amountSompi: kasToSompi(info.totalKas) });
    setStep("Verifying payment and creating the agent…");
    const data = await invokeUntilVisible({
      action: "birth", experimentId, agentId, agentCode: engine.code(seq), txid: txId, senderAddress: wallet.address,
    });
    if (!data?.ok) throw new Error(data?.error || "Factory payment verification failed");
    spawnInEngine({ agentId, address: data.address, feeTxid: txId, capitalTxid: data.capitalTxid });
    if (data.capitalPending) setError(`Agent created, but its starting capital could not be sent yet: ${data.error}`);
  }), [run, info, engine, wallet, experimentId, spawnInEngine]);

  /** Retry ONLY the capital forward for a birth that already paid — no new payment. */
  const resume = useCallback((pending) => run(async () => {
    setStep("Funding the new agent's wallet…");
    const data = await invokeUntilVisible({ action: "fund", experimentId, agentId: pending.agentId }, 2);
    if (!data?.ok) throw new Error(data?.error || "Funding failed");
    spawnInEngine({ agentId: pending.agentId, address: data.address, capitalTxid: data.capitalTxid });
  }), [run, experimentId, spawnInEngine]);

  return { info, step, error, busy: !!step, createAgent, resume };
}