import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Plus, Play, RefreshCw, Film } from "lucide-react";
import { motion } from "framer-motion";

import DeckCard from "@/components/slidedeck/DeckCard";
import NewDeckModal from "@/components/slidedeck/NewDeckModal";
import SlideCard from "@/components/slidedeck/SlideCard";
import StatusBadge from "@/components/slidedeck/StatusBadge";
import StyleDot, { STYLE_OPTIONS } from "@/components/slidedeck/StyleDot";

export default function SlideDeckBuilder() {
  const [view, setView] = useState("grid"); // grid | editor
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeDeck, setActiveDeck] = useState(null);
  const [slides, setSlides] = useState([]);
  const [rendering, setRendering] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const loadDecks = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.SlideDeck.list("-updated_date", 100);
      setDecks(all);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadDecks(); }, [loadDecks]);

  const loadSlides = useCallback(async (deckId) => {
    const all = await base44.entities.Slide.filter({ deck_id: deckId });
    const sorted = [...all].sort((a, b) => (a.order || 0) - (b.order || 0));
    setSlides(sorted);
  }, []);

  const openDeck = async (deck) => {
    setActiveDeck(deck);
    setView("editor");
    setStatusMsg(deck.render_log || "");
    await loadSlides(deck.id);
  };

  const createDeck = async ({ title, description, style }) => {
    const created = await base44.entities.SlideDeck.create({
      title, description, style, status: "draft", total_slides: 0, total_duration: 0,
    });
    setShowNewModal(false);
    await loadDecks();
    openDeck(created);
  };

  const deleteDeck = async (deck) => {
    if (!confirm(`Delete "${deck.title}"? This removes all its slides too.`)) return;
    const deckSlides = await base44.entities.Slide.filter({ deck_id: deck.id });
    await Promise.all(deckSlides.map(s => base44.entities.Slide.delete(s.id)));
    await base44.entities.SlideDeck.delete(deck.id);
    await loadDecks();
  };

  const addSlide = async () => {
    if (!activeDeck) return;
    const nextOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order || 0)) + 1 : 0;
    const created = await base44.entities.Slide.create({
      deck_id: activeDeck.id,
      order: nextOrder,
      prompt: "",
      voiceover: "",
      duration: 5,
      style: activeDeck.style || "auto",
      status: "pending",
    });
    setSlides(prev => [...prev, created]);
  };

  const updateSlide = async (slideId, patch) => {
    await base44.entities.Slide.update(slideId, patch);
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, ...patch } : s));
  };

  const deleteSlide = async (slideId) => {
    await base44.entities.Slide.delete(slideId);
    setSlides(prev => prev.filter(s => s.id !== slideId));
  };

  const refreshDeck = async () => {
    if (!activeDeck) return;
    const fresh = await base44.entities.SlideDeck.get(activeDeck.id);
    setActiveDeck(fresh);
    if (fresh.status === "done") setStatusMsg("✅ Render complete! Click Watch Video.");
    else if (fresh.status === "rendering") setStatusMsg("⏳ Still rendering…");
    else if (fresh.status === "error") setStatusMsg(`❌ ${fresh.render_log || "Render failed"}`);
    else setStatusMsg(fresh.render_log || "");
    await loadSlides(activeDeck.id);
  };

  const renderVideo = async () => {
    if (!activeDeck || rendering) return;
    if (slides.length === 0) {
      setStatusMsg("⚠️ Add at least one slide before rendering.");
      return;
    }
    setRendering(true);
    setStatusMsg("🎬 Kicking off render…");
    try {
      const res = await base44.functions.invoke("slideDeckRender", { deck_id: activeDeck.id });
      if (res.data?.error) throw new Error(res.data.error);
      setStatusMsg("✅ Render queued! Superagent is processing…");
      await refreshDeck();
    } catch (err) {
      setStatusMsg(`❌ Failed: ${err.message}`);
      await base44.entities.SlideDeck.update(activeDeck.id, {
        status: "error", render_log: err.message,
      });
      await refreshDeck();
    }
    setRendering(false);
  };

  // Grid view
  if (view === "grid") {
    return (
      <div className="min-h-screen text-white" style={{ background: "#0a0d13" }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <Film className="w-6 h-6" style={{ color: "#00c8b4" }} />
                Slide Deck Video Builder
              </h1>
              <p className="text-white/50 text-sm mt-1">Create video presentations powered by Superagent.</p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "#00c8b4", color: "#000" }}
            >
              <Plus className="w-4 h-4" /> New Deck
            </button>
          </div>

          {loading ? (
            <div className="text-white/50 text-center py-16">Loading decks…</div>
          ) : decks.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <Film className="w-12 h-12 mx-auto mb-3 text-white/30" />
              <div className="text-white/70 font-semibold mb-1">No decks yet</div>
              <div className="text-white/40 text-sm mb-4">Click "New Deck" to create your first video presentation.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {decks.map(deck => (
                <DeckCard key={deck.id} deck={deck} onOpen={openDeck} onDelete={deleteDeck} />
              ))}
            </div>
          )}
        </div>

        {showNewModal && <NewDeckModal onClose={() => setShowNewModal(false)} onCreate={createDeck} />}
      </div>
    );
  }

  // Editor view
  return (
    <div className="min-h-screen text-white" style={{ background: "#0a0d13" }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <button
            onClick={() => { setView("grid"); setActiveDeck(null); setSlides([]); loadDecks(); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {activeDeck?.video_url && (
              <a
                href={activeDeck.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.35)" }}
              >
                <Play className="w-3.5 h-3.5" /> Watch Video
              </a>
            )}
            <button
              onClick={refreshDeck}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5"
              title="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={renderVideo}
              disabled={rendering || activeDeck?.status === "rendering"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#00c8b4", color: "#000" }}
            >
              <Play className="w-3.5 h-3.5" /> Render Video
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StyleDot style={activeDeck?.style} />
          <h2 className="text-xl font-bold">{activeDeck?.title}</h2>
          <StatusBadge status={activeDeck?.status || "draft"} />
        </div>
        {activeDeck?.description && (
          <p className="text-white/50 text-sm mb-4">{activeDeck.description}</p>
        )}

        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(0,200,180,0.08)", border: "1px solid rgba(0,200,180,0.25)", color: "rgba(0,200,180,0.95)" }}
          >
            {statusMsg}
          </motion.div>
        )}

        <div className="space-y-2">
          {slides.map((slide, idx) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              index={idx}
              onUpdate={updateSlide}
              onDelete={deleteSlide}
            />
          ))}

          <button
            onClick={addSlide}
            className="w-full py-4 rounded-xl text-sm font-semibold text-white/60 hover:text-teal-400 transition-colors flex items-center justify-center gap-2"
            style={{ border: "2px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}
          >
            <Plus className="w-4 h-4" /> Add Slide
          </button>
        </div>
      </div>
    </div>
  );
}