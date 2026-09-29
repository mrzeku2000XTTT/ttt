import React, { useMemo, useState } from "react";
import TopStatusHUD from "./TopStatusHUD";
import LeftNavigation from "./LeftNavigation";
import EarthViewport from "./EarthViewport";
import WorldToolbar from "./WorldToolbar";
import RightIntelPanel from "./RightIntelPanel";
import SelectedTileInspector from "./SelectedTileInspector";
import AgentList from "./AgentList";
import AgentInspector from "./AgentInspector";
import LineageViewer from "./LineageViewer";
import AssetInspector from "./AssetInspector";
import JobMarket from "./JobMarket";
import JobInspector from "./JobInspector";
import EconomyPanel from "./EconomyPanel";
import TreasuryPanel from "./TreasuryPanel";
import FactionsGrid from "./FactionsGrid";
import FactionPanel from "./FactionPanel";
import OrganizationInspector from "./OrganizationInspector";
import ResearchPanel from "./ResearchPanel";
import EventExplorer from "./EventExplorer";
import AttackPlanner from "./AttackPlanner";
import TradePanel from "./TradePanel";
import GenesisModal from "./GenesisModal";
import SimulationControls from "./SimulationControls";
import DebugPanel from "./DebugPanel";
import { PaneModeProvider } from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import PlayerWalletBar from "./PlayerWalletBar";
import PaymentPreview from "./PaymentPreview";
import PlayerHome from "./PlayerHome";
import CountrySelect from "./CountrySelect";
import CellSelect from "./CellSelect";
import PlayerHUD from "./PlayerHUD";
import PlayerActionBar from "./PlayerActionBar";
import PlayerJobs from "./PlayerJobs";
import PlayerTrade from "./PlayerTrade";
import PlayerBuild from "./PlayerBuild";
import PlayerMove from "./PlayerMove";
import ActorInspector from "./ActorInspector";
import PlayerContracts from "./PlayerContracts";
import PlayerNotifications from "./PlayerNotifications";
import PaymentStatusOverlay from "./PaymentStatusOverlay";
import TransactionActivityPanel from "./TransactionActivityPanel";
import ObserverTransactionInspector from "./ObserverTransactionInspector";
import "./evolve.css";

/**
 * EVOLVE — AppShell.
 * The world map is the product; everything else is HUD arranged around it.
 * Desktop and landscape phones get the same console, only the panel widths change.
 */
export default function EvolveApp() {
  const {
    engine, loading, flash, genesisStage, wallet, player, pendingPayment,
    confirmPayment, cancelPayment, paymentStatus, setPaymentStatus,
    playerMode, enterObserverMode, enterPlayerMode,
    selectedCountry, selectCountry, selectedSpawnCell, selectSpawnCell, spawnPlayer,
    movePlayer, postPlayerJob, createTradeOffer, acceptTradeOffer, buildAsset,
    createContract, acceptContract, proposeOrganization, joinOrganization, leaveOrganization,
    currentPlayer,
  } = useEvolve();
  const [view, setView] = useState("WORLD");
  const [cam, setCam] = useState({ x: 0, y: 0, scale: 6 });
  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });
  const [sheet, setSheet] = useState(null);
  const [playerSheet, setPlayerSheet] = useState(null); // MOVE/JOBS/TRADE/BUILD/CONTRACTS/NOTIFICATIONS
  const [actorInspector, setActorInspector] = useState(null); // { id, type }
  const [showHome, setShowHome] = useState(true);
  const [enterFlow, setEnterFlow] = useState(null); // null | "COUNTRY" | "CELL"
  const [txInspector, setTxInspector] = useState(null); // chain tx for ObserverTransactionInspector

  const topAgent = useMemo(() => {
    if (!engine) return null;
    return [...engine.agents].filter((a) => a.status !== "archived").sort((a, b) => b.fitness - a.fitness)[0] || null;
  }, [engine]);

  if (loading) {
    return (
      <div className="ev-root" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#54657c" }}>RESTORING EXPERIMENT…</div>
      </div>
    );
  }

  if (!engine) return null;

  const open = (type, id) => setSheet({ type, id });
  const close = () => setSheet(null);

  /* --------------------------------------------------------- centre views */
  const centre = () => {
    switch (view) {
      case "AGENTS":
        return <AgentList onClose={() => setView("WORLD")} onSelect={(id) => open("agent", id)} />;
      case "JOBS":
        return <JobMarket onClose={() => setView("WORLD")} onSelectJob={(id) => open("job", id)} />;
      case "ECONOMY":
        return <EconomyPanel onClose={() => setView("WORLD")} />;
      case "FACTIONS":
        return <FactionsGrid onClose={() => setView("WORLD")} onSelect={(id) => open("faction", id)} onSelectOrg={(id) => open("org", id)} />;
      case "RESEARCH":
        return <ResearchPanel onClose={() => setView("WORLD")} onSelectAgent={(id) => open("agent", id)} />;
      case "LINEAGE":
        return topAgent ? <LineageViewer agentId={topAgent.id} onClose={() => setView("WORLD")} onSelect={(id) => open("agent", id)} /> : null;
      case "EVENTS":
        return <EventExplorer onClose={() => setView("WORLD")} onPick={handleEvent} />;
      default:
        return null;
    }
  };

  function handleEvent(e) {
    if (!e) return;
    const agent = engine.agents.find((a) => a.code === e.actor_code);
    if (agent) return open("agent", agent.id);
    if (e.target_id && engine.world.findAsset(e.target_id)) return open("asset", e.target_id);
  }

  return (
    <div className="ev-root">
      <div className="ev-hud">
        <TopStatusHUD onMenu={() => open("sim")} onView={setView} onTreasury={() => open("treasury")} />
        {wallet.connState !== "DISCONNECTED" && wallet.connState !== "CONNECTING" && (
          <PlayerWalletBar onActivity={() => open("chainTx")} />
        )}
      </div>

      <div className="ev-mid">
        <LeftNavigation
          view={view}
          onView={setView}
          onDebug={() => open("debug")}
          onTransactions={() => open("txs")}
        />

        {view === "WORLD" ? (
          <div style={{ flex: 1, minWidth: 0, position: "relative", display: "flex" }}>
            <EarthViewport cam={cam} setCam={setCam} onSize={setMapSize} />
            {engine.selection && (
              <div style={{ position: "absolute", left: 8, bottom: 8, zIndex: 20 }}>
                <SelectedTileInspector
                  onAttack={(asset) => open("attack", asset.sim_id)}
                  onTrade={(asset) => open("trade", asset.sim_id)}
                  onFortify={(asset) => engine.fortify(asset.sim_id, engine.agentById.get(asset.owner_id)?.id || "")}
                  onInspectAsset={(asset) => open("asset", asset.sim_id)}
                />
              </div>
            )}
          </div>
        ) : (
          <PaneModeProvider value="center">{centre()}</PaneModeProvider>
        )}

        <RightIntelPanel cam={cam} setCam={setCam} mapSize={mapSize} onPickEvent={handleEvent} />
      </div>

      <WorldToolbar onOpenJobs={() => open("jobs")} />

      {/* -------------------------------------------------- player overlays */}
      {engine?.started && showHome && playerMode === "observer" && !enterFlow && (
        <PlayerHome
          onObserve={() => setShowHome(false)}
          onEnterWorld={() => {
            if (currentPlayer) {
              enterPlayerMode();
              setShowHome(false);
            } else {
              setEnterFlow("COUNTRY");
            }
          }}
        />
      )}

      {enterFlow === "COUNTRY" && (
        <CountrySelect
          onExplore={(c) => { selectCountry(c); setEnterFlow("CELL"); }}
          onStartHere={(c) => { selectCountry(c); setEnterFlow("CELL"); }}
          onClose={() => setEnterFlow(null)}
        />
      )}

      {enterFlow === "CELL" && selectedCountry && (
        <CellSelect onClose={() => setEnterFlow(null)} />
      )}

      {playerMode === "player" && currentPlayer && (
        <PlayerHUD />
      )}

      {playerMode === "player" && currentPlayer && (
        <PlayerActionBar
          active={playerSheet}
          onAction={(id) => {
            const map = { MARKET: "TRADE", PEOPLE: "MORE", ORGS: "MORE", RESEARCH: "MORE", DEFEND: "MORE" };
            const target = map[id] || id;
            if (target === "MORE") {
              setPlayerSheet(playerSheet === "MORE" ? null : "MORE");
            } else {
              setPlayerSheet(playerSheet === target ? null : target);
            }
          }}
        />
      )}

      {/* player action bar sheets */}
      {playerSheet === "MOVE" && <PlayerMove onClose={() => setPlayerSheet(null)} />}
      {playerSheet === "JOBS" && <PlayerJobs onClose={() => setPlayerSheet(null)} />}
      {playerSheet === "TRADE" && <PlayerTrade onClose={() => setPlayerSheet(null)} />}
      {playerSheet === "BUILD" && <PlayerBuild onClose={() => setPlayerSheet(null)} />}
      {playerSheet === "CONTRACTS" && <PlayerContracts onClose={() => setPlayerSheet(null)} />}
      {playerSheet === "NOTIFICATIONS" && <PlayerNotifications onClose={() => setPlayerSheet(null)} />}
      {playerSheet === "MORE" && (
        <div className="ev-sheet" style={{ bottom: 56, left: 60, right: 12, padding: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "#54657c", marginBottom: 8 }}>MORE ACTIONS</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="ev-btn" onClick={() => { setPlayerSheet("CONTRACTS"); }}>CONTRACTS</button>
            <button className="ev-btn" onClick={() => { setPlayerSheet("NOTIFICATIONS"); }}>NOTIFICATIONS</button>
            <button className="ev-btn ev-btn-ghost" onClick={() => { setView("AGENTS"); setPlayerSheet(null); }}>PEOPLE</button>
            <button className="ev-btn ev-btn-ghost" onClick={() => { setView("FACTIONS"); setPlayerSheet(null); }}>ORGS</button>
            <button className="ev-btn ev-btn-ghost" onClick={() => { setView("RESEARCH"); setPlayerSheet(null); }}>RESEARCH</button>
            <button className="ev-btn ev-btn-ghost" onClick={() => { enterObserverMode(); setShowHome(true); setPlayerSheet(null); }}>OBSERVER MODE</button>
          </div>
        </div>
      )}

      {/* actor inspector (clicking AI/human markers) */}
      {actorInspector && (
        <ActorInspector
          actorId={actorInspector.id}
          actorType={actorInspector.type}
          onClose={() => setActorInspector(null)}
          onAction={(action, actor) => {
            if (action === "TRADE") setPlayerSheet("TRADE");
            if (action === "CONTRACT" || action === "COOPERATE") setPlayerSheet("CONTRACTS");
          }}
        />
      )}

      {/* ------------------------------------------------------------ sheets */}
      {sheet?.type === "agent" && (
        <AgentInspector agentId={sheet.id} onClose={close} onLineage={(id) => open("lineage", id)} />
      )}
      {sheet?.type === "lineage" && (
        <LineageViewer agentId={sheet.id} onClose={close} onSelect={(id) => open("agent", id)} />
      )}
      {sheet?.type === "asset" && (
        <AssetInspector
          simId={sheet.id}
          onClose={close}
          onAttack={(asset) => open("attack", asset.sim_id)}
          onFortify={(asset) => engine.fortify(asset.sim_id, "")}
        />
      )}
      {sheet?.type === "jobs" && <JobMarket onClose={close} onSelectJob={(id) => open("job", id)} />}
      {sheet?.type === "job" && <JobInspector jobId={sheet.id} onClose={close} />}
      {sheet?.type === "treasury" && <TreasuryPanel onClose={close} />}
      {sheet?.type === "faction" && (
        <FactionPanel factionId={sheet.id} onClose={close} onSelectAgent={(id) => open("agent", id)} />
      )}
      {sheet?.type === "org" && (
        <OrganizationInspector orgId={sheet.id} onClose={close} onSelectAgent={(id) => open("agent", id)} />
      )}
      {sheet?.type === "attack" && <AttackPlanner simId={sheet.id} onClose={close} />}
      {sheet?.type === "trade" && <TradePanel simId={sheet.id} onClose={close} />}
      {sheet?.type === "sim" && <SimulationControls onClose={close} />}
      {sheet?.type === "debug" && <DebugPanel onClose={close} />}
      {sheet?.type === "txs" && <TransactionActivityPanel onClose={close} />}

      {!engine.started && <GenesisModal />}
      {genesisStage && engine.started && (
        <div style={{ position: "absolute", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(3,6,11,0.9)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, letterSpacing: "0.22em", color: "#22d3ee", fontWeight: 800 }}>{genesisStage}</div>
            <div style={{ fontSize: 10, color: "#54657c", marginTop: 6, letterSpacing: "0.14em" }}>WORLD ONLINE</div>
          </div>
        </div>
      )}

      {flash && <Toast flash={flash} />}

      {pendingPayment && (
        <PaymentPreview
          intent={pendingPayment}
          onConfirm={confirmPayment}
          onCancel={cancelPayment}
        />
      )}

      {paymentStatus && (
        <PaymentStatusOverlay
          payment={paymentStatus}
          onDismiss={() => setPaymentStatus(null)}
        />
      )}

      {txInspector && (
        <ObserverTransactionInspector
          tx={txInspector}
          onClose={() => setTxInspector(null)}
        />
      )}
    </div>
  );
}

function Toast({ flash }) {
  return (
    <div
      key={flash.id}
      style={{
        position: "absolute", bottom: 84, left: "50%", transform: "translateX(-50%)", zIndex: 80,
        background: "rgba(9,14,24,0.96)", border: `1px solid ${flash.ok ? "rgba(34,211,238,0.45)" : "rgba(248,113,113,0.45)"}`,
        color: flash.ok ? "#22d3ee" : "#f87171", padding: "7px 14px", borderRadius: 6,
        fontSize: 10.5, letterSpacing: "0.08em", whiteSpace: "nowrap", maxWidth: "90vw", overflow: "hidden", textOverflow: "ellipsis",
      }}
    >
      {flash.message}
    </div>
  );
}