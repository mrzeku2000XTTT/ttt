import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { EvolveEngine, DEFAULT_CONFIG } from "./evolveEngine";
import { evolveRepo } from "./repo";
import { useScorpionWallet } from "./useScorpionWallet";
import { settlePlayerPayment } from "./evolvePayment";
import { kasToSompi } from "./evolveTxBuilder";

const EvolveContext = createContext(null);

const SPEED_MS = { 1: 1200, 2: 600, 5: 260, 10: 130 };

/**
 * Frontend state for EVOLVE.
 * The engine owns the simulation; React only subscribes to it and re-renders.
 */
export function EvolveProvider({ children }) {
  const engineRef = useRef(null);
  const [engine, setEngine] = useState(null);
  const [, bump] = useState(0);
  const [loading, setLoading] = useState(true);
  const [experimentId, setExperimentId] = useState(null);
  const [genesisStage, setGenesisStage] = useState("");
  const [flash, setFlash] = useState(null);
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [enterMode, setEnterMode] = useState(false);
  const [spawnStep, setSpawnStep] = useState(null); // { country, x, y }
  const [pendingPayment, setPendingPayment] = useState(null);

  const wallet = useScorpionWallet();

  const say = useCallback((message, ok = true) => {
    setFlash({ message, ok, id: Date.now() });
  }, []);

  /** Load the current Base44 user so we can attach a player actor to them. */
  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  /** Reflect the engine's player back into React when it changes. */
  useEffect(() => {
    if (!engine || !user?.id) {
      setPlayer(null);
      return;
    }
    const p = engine.findPlayerByUser?.(user.id);
    setPlayer(p || null);
    const unsub = engine.subscribe(() => {
      const cur = engine.findPlayerByUser?.(user.id);
      setPlayer(cur || null);
    });
    return unsub;
  }, [engine, user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let eng = null;
      try {
        const exp = await evolveRepo.latestExperiment();
        if (exp) {
          const records = await evolveRepo.loadRecords(exp.id);
          eng = new EvolveEngine({ ...DEFAULT_CONFIG, ...exp });
          eng.hydrate({ experiment: exp, ...records });
          if (!cancelled) setExperimentId(exp.id);
        }
      } catch (err) {
        console.error("EVOLVE: could not restore experiment", err);
      }
      if (!eng) eng = new EvolveEngine(DEFAULT_CONFIG);
      if (cancelled) return;
      engineRef.current = eng;
      setEngine(eng);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!engine) return undefined;
    return engine.subscribe(() => bump((v) => v + 1));
  }, [engine]);

  /* Simulation clock. Blockchain confirmation stays wall-clock and is untouched. */
  useEffect(() => {
    if (!engine || engine.paused || !engine.started) return undefined;
    const ms = SPEED_MS[engine.speed] || 260;
    const id = setInterval(() => engine.tick(), ms);
    return () => clearInterval(id);
  }, [engine, engine?.speed, engine?.paused, engine?.started]);

  /* Periodic checkpoint so the civilization survives a reload. */
  useEffect(() => {
    if (!engine || !experimentId || !engine.started) return undefined;
    const id = setInterval(() => {
      evolveRepo.checkpoint(experimentId, engine.toRecords(experimentId)).catch(() => {});
    }, 45000);
    return () => clearInterval(id);
  }, [engine, experimentId]);

  const createGenesis = useCallback(
    async (config) => {
      const eng = new EvolveEngine({ ...DEFAULT_CONFIG, ...config });
      engineRef.current = eng;
      setEngine(eng);
      await eng.bootstrap((stage) => setGenesisStage(stage));
      setGenesisStage("GENESIS COMPLETE");
      try {
        const exp = await evolveRepo.createExperiment(eng.toRecords(null).experiment);
        setExperimentId(exp.id);
        await evolveRepo.saveGenesis(exp.id, eng.toRecords(exp.id));
      } catch (err) {
        console.error("EVOLVE: genesis could not be stored", err);
      }
      setTimeout(() => setGenesisStage(""), 1800);
      return eng;
    },
    []
  );

  /**
   * Spawn the human player into the world using their connected Scorpion TN10
   * address. We do NOT create a wallet — Scorpion is non-custodial. We attach
   * the player's kaspatest: address to their actor and credit starting balance
   * on the mock ledger only (the real TN10 balance is read from Scorpion).
   */
  const spawnPlayer = useCallback(
    async ({ country, position }) => {
      if (!engine) return { ok: false, reason: "NO_ENGINE" };
      if (!user?.id) return { ok: false, reason: "NO_USER" };
      if (!wallet.isTN10 || !wallet.address) {
        return { ok: false, reason: "WALLET_NOT_TN10" };
      }
      const res = engine.spawnPlayer({
        userId: user.id,
        country,
        position,
        walletAddress: wallet.address,
      });
      if (res?.ok) {
        setPlayer(res.player);
        setEnterMode(false);
        setSpawnStep(null);
        say(`${res.player.code} entered ${country}`, true);
      }
      return res;
    },
    [engine, user, wallet]
  );

  /**
   * Prepare a player KAS payment: build the intent and show the PaymentPreview.
   * Scorpion is NOT opened yet — the user must click "REVIEW IN SCORPION" first.
   * `callbacks` ({ onSettle, onRelease }) are stored and fired after confirm/cancel.
   */
  const preparePayment = useCallback(
    ({ toAddress, amountKas, purpose, worldRef, recipient, receive, callbacks }) => {
      if (!wallet.isTN10) return { ok: false, reason: "WALLET_NOT_TN10" };
      if (!player) return { ok: false, reason: "NO_PLAYER" };
      const amountSompi = kasToSompi(amountKas);
      const intent = {
        toAddress,
        amountSompi,
        purpose,
        worldRef,
        receive,
        day: engine?.world?.day || 0,
        sender: { actorId: player.id, code: player.code, address: wallet.address },
        recipient,
        callbacks: callbacks || {},
      };
      setPendingPayment(intent);
      return { ok: true };
    },
    [wallet, player, engine]
  );

  /**
   * Confirm the pending payment: open Scorpion for PIN-signing, record the txid,
   * and settle the world action. On cancel/failure, release the reservation.
   */
  const confirmPayment = useCallback(async () => {
    const intent = pendingPayment;
    if (!intent) return { ok: false, reason: "NO_PENDING" };
    const { callbacks } = intent;
    const res = await settlePlayerPayment({
      wallet,
      base44,
      experimentId,
      intent: { ...intent, callbacks: undefined },
      onSettle: callbacks?.onSettle,
      onRelease: callbacks?.onRelease,
    });
    setPendingPayment(null);
    return res;
  }, [pendingPayment, wallet, experimentId]);

  const cancelPayment = useCallback(() => {
    const intent = pendingPayment;
    if (intent?.callbacks?.onRelease) intent.callbacks.onRelease({ ok: false, reason: "USER_CANCELLED" });
    setPendingPayment(null);
  }, [pendingPayment]);

  const value = {
    engine,
    loading,
    experimentId,
    genesisStage,
    flash,
    say,
    createGenesis,
    user,
    player,
    enterMode,
    setEnterMode,
    spawnStep,
    setSpawnStep,
    spawnPlayer,
    wallet,
    preparePayment,
    confirmPayment,
    cancelPayment,
    pendingPayment,
    setPendingPayment,
  };

  return <EvolveContext.Provider value={value}>{children}</EvolveContext.Provider>;
}

export function useEvolve() {
  const ctx = useContext(EvolveContext);
  if (!ctx) throw new Error("useEvolve must be used inside EvolveProvider");
  return ctx;
}