import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { EvolveEngine, DEFAULT_CONFIG } from "./evolveEngine";
import { evolveRepo } from "./repo";
import { useScorpionWallet } from "./useScorpionWallet";
import { preparePayment as preparePersistentPayment, broadcastPayment } from "./evolvePayment";
import { isolatedMockEnabled, tn10BlockedMessage, blockedPayment } from '@/lib/evolve/tn10Safety';
import { makeIdempotencyKey } from "./paymentIntentService";
import { useConfirmationWatcher } from "./confirmationWatcher";
import { TxStatus } from "./txStateMachine";
import { kasToSompi } from "./evolveTxBuilder";
import { COUNTRIES, countryByName, latLngToGrid } from "./countryMap";
import { geoCellToEnginePos } from "./geoCells";

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
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [pendingTxCount, setPendingTxCount] = useState(0);

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
      if (!isolatedMockEnabled) eng.paused = true;
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

  /* Persist right now — the AI a user generated must still be here after a refresh. */
  const persistNow = useCallback(() => {
    const eng = engineRef.current;
    if (!eng || !experimentId || !eng.started) return;
    evolveRepo.checkpoint(experimentId, eng.toRecords(experimentId)).catch(() => {});
  }, [experimentId]);

  /* Periodic checkpoint so the civilization survives a reload. */
  useEffect(() => {
    if (!engine || !experimentId || !engine.started) return undefined;
    const id = setInterval(() => {
      evolveRepo.checkpoint(experimentId, engine.toRecords(experimentId)).catch(() => {});
    }, 45000);
    return () => clearInterval(id);
  }, [engine, experimentId]);

  /* Flush the latest state when the tab is hidden or the page is being left. */
  useEffect(() => {
    if (!engine || !experimentId) return undefined;
    const flush = () => persistNow();
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [engine, experimentId, persistNow]);

  const createGenesis = useCallback(
    async (config) => {
      if (!isolatedMockEnabled) {
        say(tn10BlockedMessage, false);
        return blockedPayment();
      }
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

  const selectCountry = useCallback((country) => {
    if (country && typeof country === "object") {
      setSelectedCountry(country);
    } else {
      const c = countryByName(country) || COUNTRIES.find((x) => x.name === country);
      setSelectedCountry(c || null);
    }
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
      if (!isolatedMockEnabled) return blockedPayment();
      const addr = wallet.isTN10 && wallet.address ? wallet.address : `mock:player:${user.id}`;
      // Geographic cell (from geoCells) → engine X/Y position (simulation substrate).
      // The user-facing selection is the precise geographic cell; the engine
      // keeps its internal grid. Both are stored on the player record.
      let enginePos = position;
      let geoCellId = "";
      let geoLat = null;
      let geoLng = null;
      if (position && position.cellId) {
        enginePos = geoCellToEnginePos(position, engine.world);
        geoCellId = position.cellId;
        geoLat = position.centerLat;
        geoLng = position.centerLng;
      } else if (position && Number.isFinite(position.centerLat)) {
        enginePos = latLngToGrid(position.centerLat, position.centerLng, engine.world.width, engine.world.height);
      }
      const res = engine.spawnPlayer({
        userId: user.id,
        country,
        position: enginePos,
        walletAddress: addr,
      });
      if (res?.ok) {
        if (geoCellId) {
          res.player.geo_cell_id = geoCellId;
          res.player.geo_lat = geoLat;
          res.player.geo_lng = geoLng;
        }
        setPlayer(res.player);
        setPlayerMode("player");
        setCameraMode("FOLLOW_ME");
        setSelectedCountry(null);
        setSelectedSpawnCell(null);
        persistNow();
        say(`${res.player.code} entered ${country}`, true);
      }
      return res;
    },
    [engine, user, wallet, persistNow]
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

  /**
   * Generate a fresh AI agent on Kaspa TN-10. Mints a real kaspatest: wallet
   * server-side (mnemonic never reaches the browser) and adds the agent to
   * the world owned by the current human player.
   */
  const generateAgent = useCallback(
    async ({ name } = {}) => {
      if (!engine || !player || !experimentId) return { ok: false, reason: "NO_PLAYER" };
      const nextSeq = engine.agentSeq + 1;
      const agentId = `AGT_${String(nextSeq).padStart(4, "0")}`;
      const agentCode = `A#${String(nextSeq).padStart(3, "0")}`;
      try {
        const res = await base44.functions.invoke("evolveCreateAgentWallet", {
          experimentId,
          agentId,
          agentCode,
          label: name || agentCode,
        });
        const data = res?.data || res;
        if (!data?.ok || !data.address) {
          say(data?.error || "Could not create agent wallet", false);
          return { ok: false, reason: "WALLET_FAILED" };
        }
        const result = engine.createAgentForPlayer({
          player,
          address: data.address,
          name,
        });
        if (result?.ok) {
          persistNow();
          say(`${result.agent.code} generated on Kaspa TN-10`, true);
        }
        return result;
      } catch (e) {
        say(e?.message || "Agent generation failed", false);
        return { ok: false, reason: "EXCEPTION" };
      }
    },
    [engine, player, experimentId, persistNow]
  );

  /* --------------------------------------------------- payment flow
   * Prepare a player KAS payment: build the intent and show the PaymentPreview.
   * Scorpion is NOT opened yet — the user must click "REVIEW IN SCORPION" first.
   */
  const preparePayment = useCallback(
    ({ toAddress, amountKas, purpose, worldRef, recipient, receive, callbacks, idempotencySuffix }) => {
      if (!wallet.isTN10) return { ok: false, reason: "WALLET_NOT_TN10" };
      if (!player) return { ok: false, reason: "NO_PLAYER" };
      const amountSompi = kasToSompi(amountKas);
      const idempotencyKey = makeIdempotencyKey(purpose, worldRef || player.id, idempotencySuffix || "");
      const intent = {
        toAddress,
        amountSompi,
        purpose,
        worldRef,
        receive,
        day: engine?.world?.day || 0,
        sender: { actorId: player.id, code: player.code, address: wallet.address, type: "player" },
        recipient,
        callbacks: callbacks || {},
        idempotencyKey,
      };
      setPendingPayment(intent);
      return { ok: true };
    },
    [wallet, player, engine]
  );

  const confirmPayment = useCallback(async () => {
    const pending = pendingPayment;
    if (!pending) return { ok: false, reason: "NO_PENDING" };
    const { callbacks, idempotencyKey } = pending;

    // 1. Backend readiness check precedes intent creation and Scorpion approval.
    const prepRes = await preparePersistentPayment({
      base44,
      experimentId,
      idempotencyKey,
      sender: pending.sender,
      recipient: pending.recipient,
      amountSompi: pending.amountSompi,
      purpose: pending.purpose,
      provider: "SCORPION",
      relatedEntityType: pending.worldRef ? "world_action" : "",
      relatedEntityId: pending.worldRef || "",
      settlementData: pending.receive ? { receive: pending.receive } : null,
      day: pending.day,
    });

    if (!prepRes.ok) {
      if (prepRes.reason === "DUPLICATE" && prepRes.existing) {
        // An in-flight intent already exists — don't create another payment.
        setPendingPayment(null);
        setPaymentStatus({
          intent: prepRes.existing,
          txId: prepRes.existing.tx_id,
          status: prepRes.existing.status,
          receive: pending.receive,
        });
        return { ok: false, reason: "DUPLICATE", existing: prepRes.existing };
      }
      say(prepRes.message || tn10BlockedMessage, false);
      setPendingPayment(null);
      return prepRes;
    }

    const intent = prepRes.intent;

    // 2. Broadcast through Scorpion (user signs).
    const broadcastRes = await broadcastPayment({
      wallet,
      base44,
      experimentId,
      intent: {
        id: intent.id,
        sender_actor_id: pending.sender.actorId,
        sender_code: pending.sender.code,
        sender_address: pending.sender.address,
        recipient_actor_id: pending.recipient?.actorId,
        recipient_code: pending.recipient?.code,
        recipient_address: pending.toAddress,
        amount_sompi: pending.amountSompi,
        purpose: pending.purpose,
        related_entity_id: pending.worldRef || "",
        reservation_id: "",
        idempotency_key: idempotencyKey,
        day: pending.day,
      },
      onBroadcast: (txId) => {
        setPaymentStatus({
          intent: { ...intent, tx_id: txId },
          txId,
          status: TxStatus.BROADCAST,
          receive: pending.receive,
        });
      },
    });

    setPendingPayment(null);

    if (!broadcastRes.ok) {
      if (callbacks?.onRelease) callbacks.onRelease(broadcastRes);
      setPaymentStatus({
        intent: { ...intent, tx_id: broadcastRes.txId },
        txId: broadcastRes.txId,
        status: TxStatus.FAILED,
        receive: pending.receive,
        onRetry: callbacks?.onRetry,
      });
      return broadcastRes;
    }

    // 3. DO NOT settle here — the confirmation watcher will detect CONFIRMED
    // and the settlement callback will transfer world resources.
    return { ok: true, txId: broadcastRes.txId, intent };
  }, [pendingPayment, wallet, experimentId]);

  const cancelPayment = useCallback(() => {
    const pending = pendingPayment;
    if (pending?.callbacks?.onRelease) pending.callbacks.onRelease({ ok: false, reason: "USER_CANCELLED" });
    setPendingPayment(null);
  }, [pendingPayment]);

  // Observe only: never transfer resources or turn CONFIRMED into SETTLED locally.
  const handleSettled = useCallback((intent, result) => {
    if (!result?.ok || result.status !== TxStatus.SETTLED) return;
    setPaymentStatus(prev => prev?.intent?.id === intent.id ? { ...prev, status: TxStatus.SETTLED } : prev);
  }, []);

  const handleFailed = useCallback(async (intent, failResult) => {
    const pending = pendingPayment;
    const callbacks = pending?.callbacks;
    if (callbacks?.onRelease) {
      await callbacks.onRelease(failResult);
    }
    setPaymentStatus((prev) => prev ? { ...prev, status: TxStatus.FAILED } : null);
  }, [pendingPayment]);

  // Confirmation watcher — polls pending intents and checks TN10 status.
  useConfirmationWatcher({
    experimentId,
    enabled: !!experimentId && !!player,
    onSettled: handleSettled,
    onFailed: handleFailed,
  });

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
    generateAgent,
    // wallet / payment
    wallet,
    preparePayment,
    confirmPayment,
    cancelPayment,
    pendingPayment,
    setPendingPayment,
    paymentStatus,
    setPaymentStatus,
    pendingTxCount,
  };

  return <EvolveContext.Provider value={value}>{children}</EvolveContext.Provider>;
}

export function useEvolve() {
  const ctx = useContext(EvolveContext);
  if (!ctx) throw new Error("useEvolve must be used inside EvolveProvider");
  return ctx;
}