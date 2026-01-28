import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function ContactsModal({ isOpen, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      if (user?.email) {
        const items = await base44.entities.Contact.filter({
          user_email: user.email
        });
        setContacts(items);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = async () => {
    if (!newName.trim() || !newAddress.trim()) return;

    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Contact.create({
        name: newName,
        kaspa_address: newAddress,
        user_email: user?.email
      });
      setNewName("");
      setNewAddress("");
      await loadContacts();
    } catch (err) {
      console.error('Failed to add contact:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteContact = async (id) => {
    try {
      await base44.entities.Contact.delete(id);
      await loadContacts();
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  const copyAddress = async (address, id) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-black border border-cyan-500/30 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col"
        style={{ height: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
          <h2 className="text-xl font-bold text-white">Kaspa Contacts</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add New Contact */}
          <div className="bg-zinc-900 border border-cyan-500/20 rounded-lg p-4 space-y-3">
            <h3 className="text-white font-semibold text-sm">Add New Contact</h3>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contact name"
                className="flex-1 bg-black border-zinc-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="kaspa:..."
                className="flex-1 bg-black border-zinc-700 text-white"
              />
            </div>
            <Button
              onClick={addContact}
              disabled={isSaving || !newName.trim() || !newAddress.trim()}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </>
              )}
            </Button>
          </div>

          {/* Contacts List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No contacts yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{contact.name}</p>
                    <p className="text-gray-400 text-xs font-mono truncate">
                      {contact.kaspa_address}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      onClick={() => copyAddress(contact.kaspa_address, contact.id)}
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-cyan-400"
                    >
                      {copiedId === contact.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => deleteContact(contact.id)}
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}