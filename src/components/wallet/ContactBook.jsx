import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, UserCheck, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "ttt_wallet_contacts";

export function useContacts() {
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  const saveContacts = (list) => {
    setContacts(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const addContact = (name, address) => {
    const updated = [...contacts, { id: Date.now(), name: name.trim(), address: address.trim() }];
    saveContacts(updated);
  };

  const removeContact = (id) => saveContacts(contacts.filter(c => c.id !== id));

  return { contacts, addContact, removeContact };
}

export default function ContactBook({ onSelect, onClose }) {
  const { contacts, addContact, removeContact } = useContacts();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!name.trim()) { setError("Enter a name"); return; }
    if (!address.trim().startsWith("kaspa:")) { setError("Address must start with kaspa:"); return; }
    addContact(name, address);
    setName(""); setAddress(""); setError("");
  };

  const handleCopy = async (addr, id) => {
    await navigator.clipboard.writeText(addr);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-bold text-lg">Contacts</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Contact Form */}
        <div className="bg-black border border-zinc-800 rounded-xl p-4 space-y-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Add New Contact</p>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name (e.g. John)"
            className="bg-zinc-900 border-zinc-700 text-white"
          />
          <Input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="kaspa:q..."
            className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <Button
            onClick={handleAdd}
            disabled={!name.trim() || !address.trim()}
            className="w-full bg-cyan-700 hover:bg-cyan-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />Save Contact
          </Button>
        </div>

        {/* Contact List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {contacts.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-4">No contacts saved yet</p>
          )}
          {contacts.map(c => (
            <div key={c.id} className="bg-black border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-sm font-bold">{c.name[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{c.name}</p>
                <p className="text-gray-500 text-xs font-mono truncate">{c.address}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleCopy(c.address, c.id)}
                  className="text-gray-500 hover:text-white p-1"
                  title="Copy address"
                >
                  {copied === c.id ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                {onSelect && (
                  <button
                    onClick={() => { onSelect(c.address); onClose(); }}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold px-2 py-1 bg-cyan-500/10 rounded-lg border border-cyan-500/20"
                  >
                    Use
                  </button>
                )}
                <button
                  onClick={() => removeContact(c.id)}
                  className="text-gray-600 hover:text-red-400 p-1"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}