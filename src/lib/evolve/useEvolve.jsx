import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { EvolveEngine, DEFAULT_CONFIG } from "./evolveEngine";
import { evolveRepo } from "./repo";
import { useScorpionWallet } from "./useScorpionWallet";
import { settlePlayerPayment } from "./evolvePayment";
import { kasToSompi } from "./evolveTxBuilder";
import { COUNTRIES, countryByName } from "./countryMap";

const EvolveContext = createContext(null);

const SPEED_MS = { 1: 1200, 2: 600, 5: 260, 10: 130 };

/**
 * Frontend state for EVOLVE.
 * The engine owns the simulation; React only subscribes to it and re-renders.
 *
 * Player mode vs observer mode:
 *  - OBSERVER: camera free, no player actor, can inspect everything
 *  - PLAYER: has a player actor, camera can follow actor, action bar active
 *
 * Returning authenticated users do NOT re-spawn — we load their existing
 * player actor, cell, assets, wallet, organization, and economic history.
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
  const [playerMode, setPlayerMode] = useState("observer");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedSpawnCell, setSelectedSpawnCell] = useState(null);
  const [cameraMode, setCameraMode] = useState("FREE");
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

  /** Reflect the engine's player back into React when it changes.
   *  Returning authenticated users get their existing player loaded automatically. */
  useEffect(() => {
    if (!engine || !user?.id) {
      setPlayer(null);
      setPlayerMode("observer");
      return;
    }
    const existing = engine.findPlayerByUser?.(user.id);
    if (existing) {
      setPlayer(existing);
      setPlayerMode("player");
    } else {
      setPlayer(null);
    }
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

  /* --------------------------------------------------- player mode actions */
  const enterObserverMode = useCallback(() => {
    setPlayerMode("observer");
    setCameraMode("FREE");
  }, []);

  const enterPlayerMode = useCallback(() => {
    if (player) {
      setPlayerMode("player");
      setCameraMode("FOLLOW_ME");
    }
  }, [player]);

  const selectCountry = useCallback((countryName) => {
    const c = countryByName(countryName) || COUNTRIES.find((x) => x.name === countryName);
    setSelectedCountry(c || null);
    setSelectedSpawnCell(null);
  }, []);

  const selectSpawnCell = useCallback((cell) => {
    setSelectedSpawnCell(cell);
  }, []);

  /**
   * Spawn the human player into the world. We do NOT create a wallet —
   * Scorpion is non-custodial. We attach the player's kaspatest: address
   * to their actor and credit starting balance on the mock ledger only.
   *
   * For the development ledger (no Scorpion yet), we allow spawning with a
   * mock address so the player loop works end-to-end. When Scorpion is
   * connected, we use the real TN10 address.
   */
  const spawnPlayer = useCallback(
    async ({ country, position }) => {
      if (!engine) return { ok: false, reason: "NO_ENGINE" };
      if (!user?.id) return { ok: false, reason: "NO_USER" };
      const addr = wallet.isTN10 && wallet.address ? wallet.address : `kaspatest:dev_${user.id.slice(-8)}`;
      const res = engine.spawnPlayer({
        userId: user.id,
        country,
        position,
        walletAddress: addr,
      });
      if (res?.ok) {
        setPlayer(res.player);
        setPlayerMode("player");
        setCameraMode("FOLLOW_ME");
        setSelectedCountry(null);
        setSelectedSpawnCell(null);
        say(`${res.player.code} entered ${country}`, true);
      }
      return res;
    },
    [engine, user, wallet]
  );

  /* --------------------------------------------------- player game actions
   * Every action delegates to the engine. The engine is the single mutation
   * point — these wrappers just feed it and report results.
   * All economic settlement goes through the engine (mock ledger now,
   * ScorpionWalletAdapter + TN10 PaymentIntent later). No UI component
   * modifies balances directly.
   */
  const movePlayer = useCallback(
    (x, y) => {
      if (!engine || !player) return { ok: false, message: "No player" };
      const res = engine.playerMove(player.id, x, y);
      if (res?.ok) say(res.message);
      return res;
    },
    [engine, player]
  );

  const postPlayerJob = useCallback(
    (jobData) => {
      if (!engine || !player) return { ok: false, message: "No player" };
      const res = engine.playerPostJob(player.id, jobData);
      if (res?.ok) say(res.message);
      return res;
    },
    [engine, player]
  );

  const createTradeOffer = useCallback(
    (offerData) => {
      if (!engine || !player) return { ok: false, message: "No player" };
      const res = engine.playerPostTradeOffer(player.id, offerData);
      if (res?.ok) say(res.message);
      return res;
    },
    [engine, player]
  );

  const acceptTradeOffer = useCallback(
    (offerId) => {
      if (!engine || !player) return { ok: false, message: "No player" };
      const offer = engine.tradeOffers.find((o) => o.id === offerId);
      if (!offer) return { ok: false, message: "Offer not found" };
      const res = engine.playerTrade(player.id, {
        resource: offer.resource,
        qty: offer.qty,
        direction: offer.direction === "sell" ? "buy" : "sell",
      });
      if (res?.ok) {
        engine.tradeOffers = engine.tradeOffers.filter((o) => o.id !== offerId);
        say(res.message);
      }
      return res;
    },
    [engine, player]
  );

  const buildAsset = useCallback(
    (buildData) => {
      if (!engine || !player) return { ok: false, message: "No player" };
      const res = engine.playerBuild(player.id, buildData);
      if (res?.ok) say(res.message);
      return res;
    },
    [engine, player]
  );

  const createContract = useCallback(
    (contractData) => {
      if (!engine || !player) return { ok: false, message: "No player" };
      const res = engine.playerProposeContract(player.id, contractData);
      if (res?.ok) say(res.message);
      return res;
    },
    [engine, player]
  );

  const acceptContract = useCallback(
    (contractId) => {
      if (!engine || !player) return { ok: false, message: "No player" };
      const contract = engine.contracts.find((c) => c.id === contractId);
      if (!contract) return { ok: false, message: "Contract not found" };
      if (contract.status !== "PROPOSED") return { ok: false, message: "Contract is not open" };
      contract.accepted_by = [...(contract.accepted_by || []), player.id];
      contract.status = "ACCEPTED";
      engine.notify();
      say(`You accepted contract ${contract.id}`);
      return { ok: true, message: `Accepted ${contract.id}` };
    },
    [engine, player]
  );

  const proposeOrganization = useCallback(
    (orgData) => {
      if (!engine || !player) return { ok: false, message: "No player" };
      const res = engine.playerFormOrg(player.id, orgData);
      if (res?.ok) say(res.message);
      return res;
    },
    [engine, player]
  );

  const joinOrganization = useCallback(
    (orgId) => {
      if (!engine || !player) return { ok: false, message: "No player" };
      const org = engine.orgs.find((o) => o.id === orgId);
      if (!org) return { ok: false, message: "Organization not found" };
      if (player.organization_id) return { ok: false, message: "You already belong to an organization" };
      org.members.push(player.id);
      player.organization_id = org.id;
      engine.notify();
      say(`You joined ${org.name}`);
      return { ok: true, message: `Joined ${org.name}` };
    },
    [engine, player]
  );

  const leaveOrganization = useCallback(() => {
    if (!engine || !player) return { ok: false, message: "No player" };
    const res = engine.playerLeaveOrg(player.id);
    if (res?.ok) say(res.message);
    return res;
  }, [engine, player]);

  /* --------------------------------------------------- payment flow
   * Prepare a player KAS payment: build the intent and show the PaymentPreview.
   * Scorpion is NOT opened yet — the user must click "REVIEW IN SCORPION" first.
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

  /* --------------------------------------------------- derived state */
  const playerNotifications = player?.notifications || [];
  const contracts = engine?.contracts || [];
  const tradeOffers = engine?.tradeOffers || [];
  const players = engine?.players || [];

  const value = {
    engine,
    loading,
    experimentId,
    genesisStage,
    flash,
    say,
    createGenesis,
    user,
    // player state
    currentPlayer: player,
    player,
    players,
    contracts,
    tradeOffers,
    playerNotifications,
    playerMode,
    selectedCountry,
    selectedSpawnCell,
    cameraMode,
    setCameraMode,
    // mode
    enterObserverMode,
    enterPlayerMode,
    selectCountry,
    selectSpawnCell,
    // player actions
    spawnPlayer,
    movePlayer,
    postPlayerJob,
    createTradeOffer,
    acceptTradeOffer,
    buildAsset,
    createContract,
    acceptContract,
    proposeOrganization,
    joinOrganization,
    leaveOrganization,
    // wallet / payment
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