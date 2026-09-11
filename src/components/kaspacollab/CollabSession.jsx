import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Plus, Trash2, Loader2, Shield, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { shortKaspaAddress } from "@/lib/useKcc20Wallet";

export default function CollabSession({ session, myWallet, onBack, onDelete }) {
  const [pad, setPad] = useState(session.pad_content || "");
  const [notes, setNotes] = useState(session.notes || []);
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const debounceRef = useRef(null);
  const lastSavedRef = useRef(session.pad_content || "");

  // Live subscribe to session updates so both wallets see changes in real time
  useEffect(() => {
    const unsub = base44.entities.KaspaCollab.subscribe((event) => {
      if (event.id !== session.id) return;
      if (event.type === "update" && event.data) {
        if (event.data.pad_content != null && event.data.pad_content !== lastSavedRef.current) {
          setPad(event.data.pad_content);
          lastSavedRef.current = event.data.pad_content;
        }
        if (event.data.notes) setNotes(event.data.notes);
      }
      if (event.type === "delete") onBack();
    });
    return unsub;
  }, [session.id, onBack]);

  // Debounced pad save
  const savePad = useCallback((content) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (content === lastSavedRef.current) return;
      setSaving(true);
      try {
        await base44.entities.KaspaCollab.update(session.id, { pad_content: content });
        lastSavedRef.current = content;
      } catch (e) {
        console.error("pad save failed", e);
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [session.id]);

  const handlePadChange = (e) => {
    const v = e.target.value;
    setPad(v);
    savePad(v);
  };

  const addNote = async () => {
    if (!noteInput.trim()) return;
    setLoadingNotes(true);
    const newNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: noteInput.trim(),
      author_wallet: myWallet,
      created_date: new Date().toISOString(),
    };
    const updated = [...notes, newNote];
    try {
      await base44.entities.KaspaCollab.update(session.id, { notes: updated });
      setNotes(updated);
      setNoteInput("");
    } catch (e) {
      console.error("note add failed", e);
    } finally {
      setLoadingNotes(false);
    }
  };

  const deleteNote = async (noteId) => {
    const updated = notes.filter((n) => n.id !== noteId);
    try {
      await base44.entities.KaspaCollab.update(session.id, { notes: updated });
      setNotes(updated);
    } catch (e) {
      console.error("note delete failed", e);
    }
  };

  const partnerWallet = session.wallet_a === myWallet ? session.wallet_b : session.wallet_a;
  const isCreator = session.wallet_a === myWallet;

  return (
    <div className="flex flex-col h-full">
      {/* Session header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-sm sm:text-base truncate">{session.title}</h2>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-white/50">
              <Shield className="w-3 h-3 text-[#00ff99]" />
              <span className="font-mono">Covenant · {shortKaspaAddress(partnerWallet)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00ff99]" />}
          {isCreator && (
            <button
              onClick={() => onDelete(session)}
              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete session"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Shared notepad */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Shared Pad</span>
          <span className="text-[10px] text-[#00ff99]/60 font-mono">live · auto-save</span>
        </div>
        <textarea
          value={pad}
          onChange={handlePadChange}
          placeholder="Start typing… both wallets see this in real time. Only you and your partner can read this."
          className="flex-1 w-full resize-none bg-transparent px-4 py-2 text-sm text-white/90 placeholder-white/30 outline-none font-mono leading-relaxed min-h-[180px]"
        />
      </div>

      {/* Notes list */}
      <div className="border-t border-white/10 bg-black/40 flex flex-col max-h-[40%]">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Notes</span>
          <span className="text-[10px] text-white/30">{notes.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2 scrollbar-hide">
          {notes.length === 0 && (
            <p className="text-white/30 text-xs text-center py-4">No notes yet. Add one below.</p>
          )}
          {notes.map((n) => {
            const mine = n.author_wallet === myWallet;
            return (
              <div key={n.id} className={`group flex flex-col rounded-lg px-3 py-2 ${mine ? "bg-[#00ff99]/5 border border-[#00ff99]/20" : "bg-white/5 border border-white/10"}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono text-white/40">{mine ? "You" : shortKaspaAddress(n.author_wallet)}</span>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm text-white/80 whitespace-pre-wrap break-words">{n.text}</p>
              </div>
            );
          })}
        </div>
        <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
          <input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
            placeholder="Add a note…"
            className="flex-1 bg-white/5 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder-white/30 border border-white/10 focus:border-[#00ff99]/40"
          />
          <button
            onClick={addNote}
            disabled={loadingNotes || !noteInput.trim()}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#00ff99] text-black disabled:opacity-40 hover:opacity-90 transition"
          >
            {loadingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}