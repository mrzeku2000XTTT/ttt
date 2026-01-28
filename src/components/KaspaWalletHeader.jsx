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

  // Listen for transactions from Kaspa.com iframe
  React.useEffect(() => {
    const handleMessage = (event) => {
      // Only accept messages from Kaspa domain
      if (event.origin !== 'https://wallet.kaspa.com') return;

      const data = event.data;
      
      // Handle transaction sent message
      if (data.type === 'TRANSACTION_SENT') {
        const toAddress = data.toAddress;
        const amount = data.amount;

        // Find and update the contact
        const updated = contacts.map(c => {
          if (c.address === toAddress) {
            return {
              ...c,
              sentAmounts: [...(c.sentAmounts || []), { amount, date: new Date().toISOString() }]
            };
          }
          return c;
        });

        if (updated.some((c, idx) => c !== contacts[idx])) {
          setContacts(updated);
          localStorage.setItem('kaspa_contacts', JSON.stringify(updated));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [contacts]);

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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContacts(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed top-20 right-4 w-96 bg-gradient-to-b from-zinc-900 to-black border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 z-50 max-h-[70vh] overflow-y-auto"
            >
            <div className="p-5 border-b border-cyan-500/20 sticky top-0 bg-gradient-to-b from-black to-black/80 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold text-lg">Saved Addresses</h4>
                <Button
                  onClick={() => setShowAddContact(!showAddContact)}
                  size="sm"
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {showAddContact && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30"
                >
                  <Input
                    placeholder="Contact Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    className="bg-black/40 border-cyan-500/30 text-white h-9 text-sm"
                  />
                  <Input
                    placeholder="kaspa:..."
                    value={newContact.address}
                    onChange={(e) => setNewContact({...newContact, address: e.target.value})}
                    className="bg-black/40 border-cyan-500/30 text-white h-9 text-sm font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddContact}
                      disabled={!newContact.name.trim() || !newContact.address.trim()}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 h-8 text-sm font-semibold"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => setShowAddContact(false)}
                      variant="outline"
                      className="flex-1 h-8 text-sm border-cyan-500/40 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-4 space-y-3">
              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm">No saved addresses yet</p>
                  <p className="text-white/20 text-xs mt-1">Add one to get started</p>
                </div>
              ) : (
                contacts.map(contact => (
                  <motion.div 
                    key={contact.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold">{contact.name}</p>
                        <p className="text-white/50 text-xs font-mono break-all mt-1">
                          {contact.address}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteContact(contact.id)}
                        size="sm"
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 h-7 w-7 p-0 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleCopyAddress(contact.id, contact.address)}
                        size="sm"
                        className={`h-8 text-xs font-semibold transition-all ${copiedId === contact.id ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {copiedId === contact.id ? 'Copied' : 'Copy'}
                      </Button>

                      <motion.div className="relative">
                        <Button
                          onClick={() => setShowAmountForm(showAmountForm === contact.id ? null : contact.id)}
                          size="sm"
                          className="w-full h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {getTotalSent(contact)} KAS
                        </Button>

                        <AnimatePresence>
                          {showAmountForm === contact.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute top-full mt-2 left-0 right-0 bg-black/90 border border-cyan-500/40 rounded-lg p-3 z-50 backdrop-blur-xl shadow-lg"
                            >
                              <p className="text-white/60 text-xs mb-2 font-semibold">Log Amount Sent</p>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  placeholder="KAS amount"
                                  value={amountInput}
                                  onChange={(e) => setAmountInput(e.target.value)}
                                  className="h-8 text-sm bg-white/5 border-cyan-500/30 text-white placeholder:text-white/30"
                                />
                                <Button
                                  onClick={() => handleAddAmount(contact.id)}
                                  className="h-8 px-3 bg-cyan-600 hover:bg-cyan-700 text-sm font-semibold"
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
}