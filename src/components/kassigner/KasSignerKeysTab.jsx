import React, { useState } from "react";
import {
  getPublicKey,
  savePrivateKey,
  generatePrivateKey,
  clearPrivateKey,
} from "./kasSignerKeys";

export default function KasSignerKeysTab() {
  const [pubkey, setPubkey] = useState(() => getPublicKey());
  const [importHex, setImportHex] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState(null); // {type, text}

  const notify = (type, text) => setMessage({ type, text });

  const handleImport = () => {
    try {
      savePrivateKey(importHex);
      setPubkey(getPublicKey());
      setImportHex("");
      notify("ok", "Private key imported and saved to this device.");
    } catch (err) {
      notify("err", err.message);
    }
  };

  const handleGenerate = () => {
    const hex = generatePrivateKey();
    setPubkey(getPublicKey());
    notify("ok", `New key generated. BACK IT UP NOW: ${hex}`);
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearPrivateKey();
    setPubkey(null);
    setConfirmClear(false);
    notify("ok", "Key cleared from this device.");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#16161d] border border-white/10 p-5">
        <h3 className="text-white/80 font-semibold text-sm mb-2">Current Public Key</h3>
        {pubkey ? (
          <p className="text-emerald-300 font-mono text-xs break-all">{pubkey}</p>
        ) : (
          <p className="text-white/40 text-sm">No key stored — import or generate one below.</p>
        )}
      </div>

      <div className="rounded-2xl bg-[#16161d] border border-white/10 p-5">
        <h3 className="text-white/80 font-semibold text-sm mb-3">Import Private Key</h3>
        <input
          type="password"
          value={importHex}
          onChange={(e) => setImportHex(e.target.value)}
          placeholder="64-char hex private key"
          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-[#6366f1]"
        />
        <button
          onClick={handleImport}
          disabled={!importHex.trim()}
          className="w-full h-11 rounded-xl bg-[#6366f1] hover:bg-[#5457e0] text-white font-semibold text-sm mt-2 disabled:opacity-40 transition-colors"
        >
          Save Key
        </button>
      </div>

      <div className="rounded-2xl bg-[#16161d] border border-white/10 p-5">
        <h3 className="text-white/80 font-semibold text-sm mb-3">Generate New Key</h3>
        <button
          onClick={handleGenerate}
          className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors"
        >
          Generate Random 32-Byte Key
        </button>
      </div>

      <div className="rounded-2xl bg-[#16161d] border border-red-500/30 p-5">
        <h3 className="text-red-300 font-semibold text-sm mb-3">Danger Zone</h3>
        <button
          onClick={handleClear}
          className={`w-full h-11 rounded-xl font-semibold text-sm transition-colors ${
            confirmClear
              ? "bg-red-500 text-white"
              : "bg-red-500/15 text-red-300 border border-red-500/40"
          }`}
        >
          {confirmClear ? "Tap again to confirm — key will be erased" : "Clear Key"}
        </button>
        {confirmClear && (
          <button
            onClick={() => setConfirmClear(false)}
            className="w-full h-9 text-white/40 hover:text-white text-xs mt-1"
          >
            Cancel
          </button>
        )}
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-xs break-all ${
            message.type === "ok"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}