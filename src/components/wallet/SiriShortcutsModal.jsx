import React, { useState } from "react";
import { X, Copy, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function SiriShortcutsModal({ walletAddress, contacts = [], onClose }) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(null);

  const baseUrl = window.location.origin;

  const shortcuts = [
    {
      id: "open_wallet",
      label: "Open My Wallet",
      phrase: "Hey Siri, open my Kaspa wallet",
      url: `${baseUrl}/Wallet`,
    },
    {
      id: "receive",
      label: "Receive KAS",
      phrase: "Hey Siri, receive Kaspa",
      url: `${baseUrl}/Receive`,
    },
    ...(toAddress
      ? [
          {
            id: "send_custom",
            label: `Send${amount ? ` ${amount} KAS` : " KAS"} to address`,
            phrase: `Hey Siri, send${amount ? ` ${amount}` : ""} Kaspa`,
            url: `${baseUrl}/Wallet?action=send&to=${encodeURIComponent(toAddress)}${amount ? `&amount=${amount}` : ""}`,
          },
        ]
      : []),
    ...contacts.map((c) => ({
      id: `contact_${c.id}`,
      label: `Send KAS to ${c.name}`,
      phrase: `Hey Siri, send Kaspa to ${c.name}`,
      url: `${baseUrl}/Wallet?action=send&to=${encodeURIComponent(c.address)}`,
    })),
  ];

  const handleCopy = async (url, id) => {
    await navigator.clipboard.writeText(url);
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
        className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-bold text-lg">Siri Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* How it works */}
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 space-y-1">
          <p className="text-cyan-300 text-xs font-bold uppercase tracking-wider">How it works</p>
          <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside leading-relaxed">
            <li>Copy a shortcut URL below</li>
            <li>Open the <span className="text-white font-semibold">Shortcuts</span> app on iOS</li>
            <li>Tap <span className="text-white">+</span> → Add Action → <span className="text-white">Open URL</span></li>
            <li>Paste the URL, then assign a voice phrase</li>
            <li>Say the phrase to Siri — it opens your wallet pre-filled!</li>
          </ol>
        </div>

        {/* Custom Send Shortcut Builder */}
        <div className="bg-black border border-zinc-800 rounded-xl p-4 space-y-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Build a Send Shortcut</p>
          <Input
            value={toAddress}
            onChange={e => setToAddress(e.target.value)}
            placeholder="kaspa:q... (optional)"
            className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
          />
          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount in KAS (optional)"
            className="bg-zinc-900 border-zinc-700 text-white"
          />
          <p className="text-zinc-600 text-[10px]">Leave blank to just open the Send screen</p>
        </div>

        {/* Shortcut List */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Your Shortcuts</p>
          {shortcuts.map(s => (
            <div key={s.id} className="bg-black border border-zinc-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-white text-sm font-semibold">{s.label}</p>
                <button
                  onClick={() => handleCopy(s.url, s.id)}
                  className="text-gray-400 hover:text-white"
                  title="Copy URL"
                >
                  {copied === s.id
                    ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                    : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-cyan-400 text-xs italic">"{s.phrase}"</p>
              <p className="text-zinc-600 text-[10px] font-mono truncate">{s.url}</p>
            </div>
          ))}
        </div>

        <p className="text-zinc-700 text-[10px] text-center">
          Siri will open the wallet with details pre-filled. You still confirm before sending.
        </p>
      </motion.div>
    </motion.div>
  );
}