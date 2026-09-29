import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { EvolveEngine, DEFAULT_CONFIG } from "./evolveEngine";
import { evolveRepo } from "./repo";

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

  const say = useCallback((message, ok = true) => {
    setFlash({ message, ok, id: Date.now() });
  }, []);

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

  const value = {
    engine,
    loading,
    experimentId,
    genesisStage,
    flash,
    say,
  };

  return <EvolveContext.Provider value={value}>{children}</EvolveContext.Provider>;
}

export function useEvolve() {
  const ctx = useContext(EvolveContext);
  if (!ctx) throw new Error("useEvolve must be used inside EvolveProvider");
  return ctx;
}