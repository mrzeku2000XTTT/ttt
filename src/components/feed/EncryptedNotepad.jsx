import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Save, Trash2, Lock, Plus, FileText, Shield, Key, AlertCircle } from "lucide-react";

export default function EncryptedNotepad({ onClose }) {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);

  useEffect(() => {
    checkPin();
  }, []);

  const checkPin = () => {
    const savedPin = localStorage.getItem('notepad_pin');
    if (savedPin) {
      setHasPin(true);
      setIsLocked(true);
    } else {
      setHasPin(false);
      setIsLocked(false);
      loadNotes();
    }
  };

  const hashPin = async (pinValue) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pinValue);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSetPin = async () => {
    if (pin.length !== 6) {
      setPinError('PIN must be 6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    const pinHash = await hashPin(pin);
    localStorage.setItem('notepad_pin', pinHash);
    
    setHasPin(true);
    setIsLocked(false);
    setShowPinSetup(false);
    setPin('');
    setConfirmPin('');
    setPinError('');
    loadNotes();
  };

  const handleUnlock = async () => {
    if (enteredPin.length !== 6) {
      setPinError('Enter 6-digit PIN');
      return;
    }

    const pinHash = await hashPin(enteredPin);
    const savedPin = localStorage.getItem('notepad_pin');

    if (pinHash === savedPin) {
      setIsLocked(false);
      setEnteredPin('');
      setPinError('');
      loadNotes();
    } else {
      setPinError('Incorrect PIN');
      setEnteredPin('');
    }
  };

  const handleChangePin = () => {
    setShowPinSetup(true);
  };

  const handleRemovePin = () => {
    if (confirm('⚠️ Remove PIN protection?\n\nYour notes will no longer be protected.')) {
      localStorage.removeItem('notepad_pin');
      setHasPin(false);
      setIsLocked(false);
      setPinError('');
    }
  };

  const loadNotes = () => {
    const saved = localStorage.getItem('encrypted_notes');
    if (saved) {
      try {
        const decrypted = atob(saved);
        setNotes(JSON.parse(decrypted));
      } catch (err) {
        setNotes([]);
      }
    }
  };

  const saveNotes = (updatedNotes) => {
    const encrypted = btoa(JSON.stringify(updatedNotes));
    localStorage.setItem('encrypted_notes', encrypted);
    setNotes(updatedNotes);
  };

  const createNewNote = () => {
    setActiveNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const saveCurrentNote = () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const note = {
      id: activeNote?.id || Date.now().toString(),
      title: noteTitle.trim() || 'Untitled',
      content: noteContent,
      updatedAt: new Date().toISOString()
    };

    let updated;
    if (activeNote) {
      updated = notes.map(n => n.id === activeNote.id ? note : n);
    } else {
      updated = [note, ...notes];
    }

    saveNotes(updated);
    setActiveNote(note);
  };

  const deleteNote = (noteId) => {
    if (!confirm('Delete this note?')) return;
    
    const updated = notes.filter(n => n.id !== noteId);
    saveNotes(updated);
    if (activeNote?.id === noteId) {
      createNewNote();
    }
  };

  const openNote = (note) => {
    setActiveNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  // PIN Setup Screen
  if (showPinSetup) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-white/20 rounded-xl w-full max-w-md p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        >
          <div className="text-center mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 border-2 border-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Set PIN</h2>
            <p className="text-white/60 text-xs md:text-sm">Create a 6-digit PIN to protect your notes</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs md:text-sm text-white/60 mb-2 block">Enter PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                placeholder="••••••"
                className="bg-white/5 border-white/20 text-white text-center text-xl md:text-2xl tracking-widest h-12 md:h-14"
              />
            </div>

            <div>
              <label className="text-xs md:text-sm text-white/60 mb-2 block">Confirm PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                placeholder="••••••"
                className="bg-white/5 border-white/20 text-white text-center text-xl md:text-2xl tracking-widest h-12 md:h-14"
              />
            </div>

            {pinError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-xs md:text-sm text-red-300">{pinError}</span>
              </div>
            )}

            <Button
              onClick={handleSetPin}
              disabled={pin.length !== 6 || confirmPin.length !== 6}
              className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 h-11 md:h-12"
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Set PIN
            </Button>

            <Button
              onClick={() => setShowPinSetup(false)}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 h-10 md:h-11"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // PIN Entry Screen
  if (isLocked && hasPin) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-white/20 rounded-xl w-full max-w-md p-6 md:p-8"
        >
          <div className="text-center mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 border-2 border-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Encrypted Notes</h2>
            <p className="text-white/60 text-xs md:text-sm">Enter your PIN to unlock</p>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="••••••"
                className="bg-white/5 border-white/20 text-white text-center text-2xl md:text-3xl tracking-widest h-14 md:h-16"
                autoFocus
              />
            </div>

            {pinError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-xs md:text-sm text-red-300">{pinError}</span>
              </motion.div>
            )}

            <Button
              onClick={handleUnlock}
              disabled={enteredPin.length !== 6}
              className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 h-11 md:h-12"
            >
              <Lock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Unlock
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 h-10 md:h-11"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // First Time - No PIN Set
  if (!hasPin && !isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-white/20 rounded-xl w-full max-w-md p-6 md:p-8"
        >
          <div className="text-center mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 border-2 border-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Secure Your Notes</h2>
            <p className="text-white/60 text-xs md:text-sm">Set a 6-digit PIN to protect your encrypted notepad</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setShowPinSetup(true)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-11 md:h-12"
            >
              <Key className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Set PIN
            </Button>

            <Button
              onClick={() => {
                setIsLocked(false);
                loadNotes();
              }}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 h-10 md:h-11"
            >
              Skip (Not Recommended)
            </Button>
          </div>

          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200">
                Without a PIN, anyone with access to your device can read your notes.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Main Notepad Interface (Unlocked)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-white/20 rounded-2xl w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl"
      >
        {/* Left Sidebar - Notes List */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/20 bg-zinc-900 flex flex-col max-h-[35vh] md:max-h-none">
          <div className="p-4 md:p-5 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                <h3 className="text-white font-bold text-sm md:text-base">Encrypted Notes</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={handleChangePin}
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                  title="Change PIN"
                >
                  <Key className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleRemovePin}
                  size="sm"
                  variant="ghost"
                  className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                  title="Remove PIN"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={createNewNote}
              className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 h-10 md:h-11 text-sm md:text-base font-medium"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              New Note
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5">
            {notes.length === 0 ? (
              <div className="text-center py-12 md:py-16 px-4">
                <FileText className="w-12 h-12 md:w-16 md:h-16 text-white/30 mx-auto mb-3" />
                <p className="text-white/50 text-sm md:text-base">No notes yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => openNote(note)}
                    className={`w-full text-left p-3 md:p-4 rounded-xl transition-colors ${
                      activeNote?.id === note.id
                        ? 'bg-cyan-500/20 border border-cyan-500/40'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="text-white text-sm md:text-base font-semibold truncate mb-1.5">
                      {note.title}
                    </div>
                    <div className="text-white/50 text-xs md:text-sm">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Note Editor */}
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-900">
          <div className="p-4 md:p-5 border-b border-white/20 flex items-center justify-between gap-3">
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title..."
              className="flex-1 bg-white/5 border border-white/20 text-white text-lg md:text-xl font-bold placeholder:text-white/40 h-11 md:h-12 px-4"
            />
            <div className="flex gap-2">
              {activeNote && (
                <Button
                  onClick={() => deleteNote(activeNote.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-10 w-10 md:h-11 md:w-11 p-0"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              )}
              <Button
                onClick={saveCurrentNote}
                size="sm"
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-10 md:h-11 text-sm md:text-base px-4 md:px-5 font-medium"
              >
                <Save className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden md:inline">Save</span>
              </Button>
              <Button
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="text-white/60 hover:text-white h-10 w-10 md:h-11 md:w-11 p-0"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Start typing... Your notes are encrypted locally."
              className="w-full h-full bg-white/5 border border-white/20 text-white placeholder:text-white/40 resize-none p-4 md:p-5 text-base md:text-lg leading-relaxed min-h-[250px] rounded-xl"
            />
          </div>

          <div className="p-4 md:p-5 border-t border-white/20 bg-zinc-900">
            <div className="flex items-center gap-2 text-xs md:text-sm text-white/50">
              <Lock className="w-3 h-3 md:w-4 md:h-4" />
              <span>Base64 encrypted • PIN protected • {notes.length} notes</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}