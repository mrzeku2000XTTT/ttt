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
 * useAiFactory — Factory births. Two Scorpion-signed TN-10 payments:
 *  1. generation cost → Factory wallet (verified server-side, then the agent's wallet is minted)
 *  2. starting capital → the new agent's own wallet (verified, then the agent spawns)
 * A birth whose fee is paid but capital isn't stays "pending" and can be resumed.
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

  const fundAndSpawn = useCallback(async ({ agentId, address, feeTxid }, capitalKas) => {
    setStep("Approve starting capital in Scorpion…");
    const { txId: capitalTxid } = await wallet.adapter.sendKaspa({ to: address, amountSompi: kasToSompi(capitalKas) });
    setStep("Verifying capital on TN-10…");
    const data = await invokeUntilVisible({ action: "spawn", experimentId, agentId, capitalTxid });
    if (!data?.ok) throw new Error(data?.error || "Capital verification failed");
    const result = engine.createAgentForPlayer({ player, address, agentId, origin: "FACTORY", feeTxid, capitalTxid });
    persistNow?.();
    say(`${result.agent.code} created at the AI Factory`, true);
  }, [wallet, experimentId, engine, player, persistNow, say]);

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

  const createAgent = useCallback((capitalKas) => run(async () => {
    const p = info.params;
    const seq = engine.agentSeq + 1 + (info.pending?.length || 0);
    const agentId = `AGT_${String(seq).padStart(4, "0")}`;
    setStep("Approve generation cost in Scorpion…");
    const { txId: feeTxid } = await wallet.adapter.sendKaspa({ to: info.factoryAddress, amountSompi: kasToSompi(p.generation_cost_kas) });
    setStep("Verifying Factory payment on TN-10…");
    const birth = await invokeUntilVisible({
      action: "birth", experimentId, agentId, agentCode: engine.code(seq), feeTxid, senderAddress: wallet.address,
    });
    if (!birth?.ok) throw new Error(birth?.error || "Factory payment verification failed");
    await fundAndSpawn({ agentId, address: birth.address, feeTxid }, capitalKas);
  }), [run, info, engine, wallet, experimentId, fundAndSpawn]);

  const resume = useCallback((pending, capitalKas) => run(() => fundAndSpawn(pending, capitalKas)), [run, fundAndSpawn]);

  return { info, step, error, busy: !!step, createAgent, resume };
}