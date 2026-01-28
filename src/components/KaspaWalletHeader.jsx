import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Users, Plus, Copy, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function KaspaWalletHeader({ onClose }) {
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('kaspa_contacts');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', address: '' });
  const [copiedId, setCopiedId] = useState(null);
  const [showAmountForm, setShowAmountForm] = useState(null);
  const [amountInput, setAmountInput] = useState('');

  const handleAddContact = () => {
    if (newContact.name.trim() && newContact.address.trim()) {
      const updated = [...contacts, { id: Date.now(), ...newContact }];
      setContacts(updated);
      localStorage.setItem('kaspa_contacts', JSON.stringify(updated));
      setNewContact({ name: '', address: '' });
      setShowAddContact(false);
    }
  };

  const handleDeleteContact = (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    localStorage.setItem('kaspa_contacts', JSON.stringify(updated));
  };

  const handleCopyAddress = (id, address) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddAmount = (id) => {
    if (amountInput.trim()) {
      const updated = contacts.map(c => 
        c.id === id 
          ? { ...c, sentAmounts: [...(c.sentAmounts || []), { amount: amountInput, date: new Date().toISOString() }] }
          : c
      );
      setContacts(updated);
      localStorage.setItem('kaspa_contacts', JSON.stringify(updated));
      setAmountInput('');
      setShowAmountForm(null);
    }
  };

  const getTotalSent = (contact) => {
    return (contact.sentAmounts || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/6bee04b5b_image.png"
            alt="Kaspa"
            className="w-6 h-6 object-contain"
          />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Kaspa Wallet</h3>
          <p className="text-white/60 text-xs">Onboarding Guide</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => setShowContacts(!showContacts)}
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10 flex items-center gap-2"
          title="Saved Contacts"
        >
          <Users className="w-4 h-4" />
          <span className="text-xs">{contacts.length}</span>
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Contacts Sidebar */}
      <AnimatePresence>
        {showContacts && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-16 right-4 w-80 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-white/10 sticky top-0 bg-black/80">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">Saved Addresses</h4>
                <Button
                  onClick={() => setShowAddContact(!showAddContact)}
                  size="sm"
                  variant="ghost"
                  className="text-cyan-400 hover:text-cyan-300 h-6 w-6 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {showAddContact && (
                <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Input
                    placeholder="Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    className="bg-white/5 border-white/10 text-white h-8 text-sm"
                  />
                  <Input
                    placeholder="Kaspa Address"
                    value={newContact.address}
                    onChange={(e) => setNewContact({...newContact, address: e.target.value})}
                    className="bg-white/5 border-white/10 text-white h-8 text-sm font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddContact}
                      disabled={!newContact.name.trim() || !newContact.address.trim()}
                      size="sm"
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 h-7 text-xs"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => setShowAddContact(false)}
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs border-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 space-y-2">
              {contacts.length === 0 ? (
                <p className="text-white/40 text-xs text-center py-4">No saved addresses yet</p>
              ) : (
                contacts.map(contact => (
                  <motion.div key={contact.id} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">{contact.name}</p>
                        <p className="text-white/60 text-xs font-mono truncate">
                          {contact.address}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteContact(contact.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400/60 hover:text-red-400 h-6 w-6 p-0 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCopyAddress(contact.id, contact.address)}
                        size="sm"
                        variant="outline"
                        className={`flex-1 h-7 text-xs border-white/10 transition-all ${copiedId === contact.id ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'text-white/60 hover:text-white'}`}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {copiedId === contact.id ? 'Copied!' : 'Copy'}
                      </Button>

                      <motion.div className="relative flex-1">
                        <Button
                          onClick={() => setShowAmountForm(showAmountForm === contact.id ? null : contact.id)}
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs border-white/10 text-cyan-400 hover:text-cyan-300"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {getTotalSent(contact) || '0'} KAS
                        </Button>

                        <AnimatePresence>
                          {showAmountForm === contact.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full mt-1 left-0 right-0 bg-white/10 border border-white/10 rounded-lg p-2 z-50"
                            >
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  placeholder="KAS amount"
                                  value={amountInput}
                                  onChange={(e) => setAmountInput(e.target.value)}
                                  className="h-6 text-xs bg-white/5 border-white/10"
                                />
                                <Button
                                  onClick={() => handleAddAmount(contact.id)}
                                  size="sm"
                                  className="h-6 px-2 bg-cyan-600 hover:bg-cyan-700 text-xs"
                                >
                                  Add
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}