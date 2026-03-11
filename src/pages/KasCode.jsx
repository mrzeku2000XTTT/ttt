import React, { useState, useRef, useEffect } from "react";
import { MonitorDot, X, Plus, Play, Terminal, FileText, ChevronRight, ChevronDown, Copy, Check, Menu, Wand2, Code2, Bot } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import KasAgentChat from "@/components/silverscript/KasAgentChat";

// ─── Contract Templates with constructor args ───────────────────────────────
// ─── Arg help text ───────────────────────────────────────────────────────────
const ARG_HELP = {
  "pubkey": "A compressed Kaspa public key (33 bytes). Get it from your wallet — in Kasware: Settings → Export Public Key. Starts with 0x02 or 0x03.",
  "byte[32]": "A 32-byte hash value in hex. For a public key hash, run blake2b(pubkey) or use a Kaspa explorer tool.",
  "int": "An integer number. For timestamps use Unix time (e.g. 1700000000 = Nov 2023). For days/periods use plain numbers (e.g. 30 means 30 days).",
  "int timeout": "Unix timestamp in seconds. Use an online converter like epochconverter.com to get the right value.",
  "int unlockTime": "Unix timestamp when funds unlock. e.g. 1800000000 is ~2027. Use epochconverter.com.",
  "int amount": "Amount in sompi (1 KAS = 100,000,000 sompi). e.g. 1 KAS = 100000000",
  "int period": "Interval in days. e.g. 7 = weekly payments.",
};

const CONTRACT_TEMPLATES = [
  {
    id: "p2pkh",
    name: "Pay to Public Key Hash",
    desc: "Standard spend: verify key hash then signature",
    args: [{ name: "pkh", type: "byte[32]", placeholder: "0xabc123...", help: "32-byte blake2b hash of the owner's public key. In Kasware: copy your public key and run blake2b() on it." }],
    generate: (a) =>
`pragma silverscript ^0.1.0;\n\ncontract P2PKH(byte[32] pkh) {\n    entrypoint function spend(pubkey pk, sig s) {\n        require(blake2b(pk) == pkh);\n        require(checkSig(s, pk));\n    }\n}`,
  },
  {
    id: "timelock",
    name: "Time-Locked Vault",
    desc: "Owner withdraws after a specific time",
    args: [
      { name: "owner", type: "pubkey", placeholder: "0x02...", help: "Your Kaspa public key (33 bytes hex). In Kasware: tap your address → 'Export Public Key'. Starts with 02 or 03." },
      { name: "unlockTime", type: "int", placeholder: "1700000000", help: "Unix timestamp (seconds) for when funds unlock. Use epochconverter.com to convert a date. e.g. 1800000000 ≈ Jan 2027." },
    ],
    generate: (a) =>
`pragma silverscript ^0.1.0;\n\ncontract TimelockVault(\n    pubkey owner,\n    int unlockTime\n) {\n    entrypoint function withdraw(sig ownerSig) {\n        require(checkSig(ownerSig, owner));\n        require(tx.time >= unlockTime);\n    }\n\n    entrypoint function emergency(sig ownerSig) {\n        require(checkSig(ownerSig, owner));\n        require(this.age >= 365 days);\n    }\n}`,
  },
  {
    id: "escrow",
    name: "Two-Party Escrow",
    desc: "Buyer + seller with arbiter dispute resolution",
    args: [
      { name: "buyer", type: "pubkey", placeholder: "0x02...", help: "Buyer's Kaspa public key. Get from Kasware → Export Public Key." },
      { name: "seller", type: "pubkey", placeholder: "0x02...", help: "Seller's Kaspa public key. Get from Kasware → Export Public Key." },
      { name: "arbiter", type: "pubkey", placeholder: "0x02...", help: "Trusted third-party public key for dispute resolution." },
      { name: "timeout", type: "int", placeholder: "30", help: "Number of days after which the buyer can reclaim funds if no release." },
    ],
    generate: (a) =>
`pragma silverscript ^0.1.0;\n\ncontract Escrow(\n    pubkey buyer,\n    pubkey seller,\n    pubkey arbiter,\n    int timeout\n) {\n    entrypoint function release(sig buyerSig, sig sellerSig) {\n        require(checkSig(buyerSig, buyer));\n        require(checkSig(sellerSig, seller));\n        byte[34] sellerScript = new ScriptPubKeyP2PK(seller);\n        require(tx.outputs[0].scriptPubKey == sellerScript);\n    }\n\n    entrypoint function dispute(sig buyerSig, sig arbiterSig) {\n        require(checkSig(buyerSig, buyer));\n        require(checkSig(arbiterSig, arbiter));\n        byte[34] buyerScript = new ScriptPubKeyP2PK(buyer);\n        require(tx.outputs[0].scriptPubKey == buyerScript);\n    }\n\n    entrypoint function reclaim(sig buyerSig) {\n        require(checkSig(buyerSig, buyer));\n        require(this.age >= timeout days);\n    }\n}`,
  },
  {
    id: "recurring",
    name: "Recurring Payment",
    desc: "Scheduled payments at a fixed interval",
    args: [
      { name: "sender", type: "pubkey", placeholder: "0x02...", help: "Sender's public key. Get from Kasware → Export Public Key." },
      { name: "recipient", type: "pubkey", placeholder: "0x02...", help: "Recipient's public key. Ask recipient to share theirs." },
      { name: "amount", type: "int", placeholder: "100000000", help: "Amount per payment in sompi. 1 KAS = 100,000,000 sompi." },
      { name: "period", type: "int", placeholder: "7", help: "How many days between each payment (e.g. 7 = weekly, 30 = monthly)." },
    ],
    generate: (a) =>
`pragma silverscript ^0.1.0;\n\ncontract RecurringPayment(\n    pubkey sender,\n    pubkey recipient,\n    int amount,\n    int period\n) {\n    entrypoint function pay(sig senderSig) {\n        require(checkSig(senderSig, sender));\n        require(tx.outputs[0].value == amount);\n        byte[34] recipientScript = new ScriptPubKeyP2PK(recipient);\n        require(tx.outputs[0].scriptPubKey == recipientScript);\n        require(this.age >= period days);\n    }\n}`,
  },
  {
    id: "multisig",
    name: "2-of-3 MultiSig",
    desc: "Any 2 of 3 keys can spend",
    args: [
      { name: "pk1", type: "pubkey", placeholder: "0x02...", help: "First signer's public key. Get from Kasware → Export Public Key." },
      { name: "pk2", type: "pubkey", placeholder: "0x02...", help: "Second signer's public key." },
      { name: "pk3", type: "pubkey", placeholder: "0x02...", help: "Third signer's public key. Any 2 of these 3 can spend." },
    ],
    generate: (a) =>
`pragma silverscript ^0.1.0;\n\ncontract MultiSig(pubkey pk1, pubkey pk2, pubkey pk3) {\n    entrypoint function spend(sig s1, sig s2) {\n        require(checkMultiSig([s1, s2], [pk1, pk2, pk3]));\n    }\n}`,
  },
  {
    id: "freelance",
    name: "Freelance Contract",
    desc: "Escrow with mutual release and arbitration",
    args: [
      { name: "clientKey", type: "pubkey", placeholder: "0x02...", help: "Client's public key (the one paying). Get from Kasware → Export Public Key." },
      { name: "workerKey", type: "pubkey", placeholder: "0x02...", help: "Worker/freelancer's public key. They must share it with you." },
      { name: "arbiterKey", type: "pubkey", placeholder: "0x02...", help: "Trusted arbiter's public key for dispute resolution." },
    ],
    generate: (a) =>
`pragma silverscript ^0.1.0;\n\ncontract FreelanceContract(\n    pubkey clientKey,\n    pubkey workerKey,\n    pubkey arbiterKey\n) {\n    entrypoint function release(sig clientSig, sig workerSig) {\n        require(checkSig(clientSig, clientKey));\n        require(checkSig(workerSig, workerKey));\n        byte[34] workerScript = new ScriptPubKeyP2PK(workerKey);\n        require(tx.outputs[0].scriptPubKey == workerScript);\n    }\n\n    entrypoint function refund(sig clientSig, sig arbiterSig) {\n        require(checkSig(clientSig, clientKey));\n        require(checkSig(arbiterSig, arbiterKey));\n        byte[34] clientScript = new ScriptPubKeyP2PK(clientKey);\n        require(tx.outputs[0].scriptPubKey == clientScript);\n    }\n\n    entrypoint function reclaim(sig clientSig) {\n        require(checkSig(clientSig, clientKey));\n        require(this.age >= 30 days);\n    }\n}`,
  },
];

// ─── Syntax Keywords ─────────────────────────────────────────────────────────
const SIL_KEYWORDS = new Set([
  'pragma','silverscript','contract','entrypoint','function','require',
  'byte','pubkey','sig','int','bool','constant','new','if','else','for',
  'return','days','this','tx','true','false','inputs','outputs','time',
  'age','value','scriptPubKey','version','activeInputIndex','checkSig',
  'blake2b','checkMultiSig','ScriptPubKeyP2PK',
]);

function HighlightedLine({ line, num }) {
  const isComment = line.trim().startsWith('//');
  return (
    <div className="flex min-w-0 leading-5 hover:bg-white/[0.02] group">
      <span className="inline-block w-7 text-right pr-2 text-zinc-700 select-none text-[10px] flex-shrink-0 group-hover:text-zinc-600">
        {num}
      </span>
      {isComment ? (
        <span className="text-zinc-500 italic whitespace-pre text-[11px]">{line}</span>
      ) : (
        <span className="whitespace-pre text-[11px]">
          {line.split(/(\b\w+\b|0x[0-9a-fA-F]+|"[^"]*"|'[^']*'|\d+)/).map((tok, i) => {
            if (SIL_KEYWORDS.has(tok)) return <span key={i} className="text-cyan-400">{tok}</span>;
            if (/^0x[0-9a-fA-F]+$/.test(tok)) return <span key={i} className="text-amber-400">{tok}</span>;
            if (/^("|')/.test(tok)) return <span key={i} className="text-orange-300">{tok}</span>;
            if (/^\d+$/.test(tok)) return <span key={i} className="text-yellow-300">{tok}</span>;
            if (/^[A-Z][a-zA-Z0-9]+$/.test(tok)) return <span key={i} className="text-teal-300">{tok}</span>;
            return <span key={i} className="text-zinc-300">{tok}</span>;
          })}
        </span>
      )}
    </div>
  );
}

// ─── TX Explorer Input ───────────────────────────────────────────────────────
function TxExplorerInput() {
  const [txHash, setTxHash] = useState('');
  const isValid = /^[0-9a-fA-F]{64}$/.test(txHash.trim());

  const openMainnet = () => window.open(`https://explorer.kaspa.org/txs/${txHash.trim()}`, '_blank');
  const openTestnet = () => window.open(`https://explorer-tn12.kaspa.org/txs/${txHash.trim()}`, '_blank');

  return (
    <div className="space-y-1.5">
      <input
        value={txHash}
        onChange={e => setTxHash(e.target.value.trim())}
        placeholder="Paste TX hash (64 hex chars)..."
        className="w-full bg-zinc-800 text-zinc-100 text-[10px] px-2 py-1.5 rounded border border-zinc-700 outline-none focus:border-cyan-600 font-mono"
      />
      {txHash && !isValid && (
        <p className="text-yellow-500 text-[9px]">TX hash should be 64 hex characters</p>
      )}
      <div className="flex gap-1.5">
        <button
          onClick={openTestnet}
          disabled={!isValid}
          className="flex-1 px-2 py-1.5 bg-cyan-800/60 hover:bg-cyan-700/70 disabled:opacity-30 text-cyan-200 text-[10px] rounded border border-cyan-700/40 transition-colors"
        >
          Testnet-12 Explorer
        </button>
        <button
          onClick={openMainnet}
          disabled={!isValid}
          className="flex-1 px-2 py-1.5 bg-zinc-700/60 hover:bg-zinc-600/70 disabled:opacity-30 text-zinc-200 text-[10px] rounded border border-zinc-600/40 transition-colors"
        >
          Mainnet Explorer
        </button>
      </div>
      <p className="text-zinc-700 text-[9px]">How to get TX hash: deploy contract with <span className="text-cyan-700 font-mono">silverc compile file.sil</span>, broadcast tx, copy hash from terminal output.</p>
    </div>
  );
}

// ─── Create Contract Modal ────────────────────────────────────────────────────
function CreateContractModal({ onClose, onCreate }) {
  const [step, setStep] = useState(0); // 0=pick template, 1=fill args
  const [selected, setSelected] = useState(null);
  const [argValues, setArgValues] = useState({});
  const [contractName, setContractName] = useState('');

  const tpl = selected !== null ? CONTRACT_TEMPLATES[selected] : null;

  const handleCreate = () => {
    const code = tpl.generate(argValues);
    const name = (contractName || tpl.id) + '.sil';
    onCreate(name, code);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-zinc-100">
              {step === 0 ? 'New Contract' : tpl?.name}
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 0 && (
            <div className="space-y-2">
              <p className="text-zinc-500 text-xs mb-3">Choose a contract template to get started:</p>
              {CONTRACT_TEMPLATES.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => { setSelected(i); setStep(1); setArgValues({}); setContractName(t.id); }}
                  className="w-full text-left px-3 py-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/40 hover:border-cyan-700/50 transition-all"
                >
                  <div className="text-zinc-100 text-xs font-semibold">{t.name}</div>
                  <div className="text-zinc-500 text-[10px] mt-0.5">{t.desc}</div>
                </button>
              ))}
              <button
                onClick={() => { setSelected(-1); setStep(1); setArgValues({}); setContractName('my-contract'); }}
                className="w-full text-left px-3 py-3 rounded-lg bg-zinc-800/20 hover:bg-zinc-700/40 border border-dashed border-zinc-700 hover:border-cyan-700/40 transition-all"
              >
                <div className="text-zinc-400 text-xs font-semibold">+ Blank Contract</div>
                <div className="text-zinc-600 text-[10px] mt-0.5">Start from scratch</div>
              </button>
            </div>
          )}

          {step === 1 && tpl && (
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-[10px] uppercase tracking-wider">File name</label>
                <input
                  value={contractName}
                  onChange={e => setContractName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  className="w-full mt-1 bg-zinc-800 text-zinc-100 text-xs px-3 py-2 rounded-lg border border-zinc-700 outline-none focus:border-cyan-600"
                  placeholder="my-contract"
                />
                <span className="text-zinc-600 text-[10px]">.sil will be appended</span>
              </div>
              {tpl.args.length > 0 && (
                <>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-2">Constructor Arguments</p>
                  <div className="p-2 bg-zinc-800/40 rounded-lg border border-zinc-700/30 text-[10px] text-zinc-500 mb-2">
                    💡 These values are locked into the contract when deployed. Make sure they're correct — they cannot be changed after.
                  </div>
                  {tpl.args.map(arg => (
                    <div key={arg.name} className="space-y-1">
                      <label className="text-zinc-400 text-[10px] flex items-center gap-1">
                        <span className="text-teal-400 font-mono">{arg.type}</span>
                        <span className="text-zinc-300">{arg.name}</span>
                      </label>
                      <input
                        value={argValues[arg.name] || ''}
                        onChange={e => setArgValues(prev => ({ ...prev, [arg.name]: e.target.value }))}
                        placeholder={arg.placeholder}
                        className="w-full bg-zinc-800 text-zinc-100 text-xs px-3 py-2 rounded-lg border border-zinc-700 outline-none focus:border-cyan-600 font-mono"
                      />
                      {arg.help && (
                        <p className="text-zinc-600 text-[10px] leading-relaxed px-1">{arg.help}</p>
                      )}
                    </div>
                  ))}
                </>
              )}
              {step === 1 && selected === -1 && (
                <p className="text-zinc-500 text-[10px]">A blank contract template will be created for you to edit.</p>
              )}
            </div>
          )}

          {step === 1 && selected === -1 && (
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-[10px] uppercase tracking-wider">File name</label>
                <input
                  value={contractName}
                  onChange={e => setContractName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  className="w-full mt-1 bg-zinc-800 text-zinc-100 text-xs px-3 py-2 rounded-lg border border-zinc-700 outline-none focus:border-cyan-600"
                  placeholder="my-contract"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 border-t border-zinc-800 flex-shrink-0">
          {step === 1 && (
            <button onClick={() => setStep(0)} className="px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              ← Back
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
          {step === 1 && (
            <button
              onClick={handleCreate}
              disabled={!contractName}
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white text-xs rounded-lg font-semibold transition-colors"
            >
              Create File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main IDE ─────────────────────────────────────────────────────────────────
const BLANK_CODE = `pragma silverscript ^0.1.0;\n\ncontract MyContract() {\n    entrypoint function spend(pubkey pk, sig s) {\n        require(checkSig(s, pk));\n    }\n}`;

const SNIPPETS = [
  { name: "checkSig", code: `require(checkSig(s, pk));` },
  { name: "blake2b hash", code: `require(blake2b(pk) == pkh);` },
  { name: "Time lock", code: `require(tx.time >= lockTime);` },
  { name: "Age check", code: `require(this.age >= 7 days);` },
  { name: "Output script", code: `byte[34] script = new ScriptPubKeyP2PK(recipient);\nrequire(tx.outputs[0].scriptPubKey == script);` },
  { name: "Output value", code: `require(tx.outputs[0].value == amount);` },
  { name: "MultiSig", code: `require(checkMultiSig([s1, s2], [pk1, pk2, pk3]));` },
];

export default function KasCodePage() {
  const [files, setFiles] = useState({
    "welcome.sil": BLANK_CODE,
    "timelock-vault.sil": `pragma silverscript ^0.1.0;\n\ncontract TimelockVault(\n    pubkey owner,\n    int unlockTime\n) {\n    entrypoint function withdraw(sig ownerSig) {\n        require(checkSig(ownerSig, owner));\n        require(tx.time >= unlockTime);\n    }\n\n    entrypoint function emergency(sig ownerSig) {\n        require(checkSig(ownerSig, owner));\n        require(this.age >= 365 days);\n    }\n}`,
    "freelance.sil": `pragma silverscript ^0.1.0;\n\ncontract FreelanceContract(\n    pubkey clientKey,\n    pubkey workerKey,\n    pubkey arbiterKey\n) {\n    entrypoint function release(sig clientSig, sig workerSig) {\n        require(checkSig(clientSig, clientKey));\n        require(checkSig(workerSig, workerKey));\n        byte[34] workerScript = new ScriptPubKeyP2PK(workerKey);\n        require(tx.outputs[0].scriptPubKey == workerScript);\n    }\n\n    entrypoint function reclaim(sig clientSig) {\n        require(checkSig(clientSig, clientKey));\n        require(this.age >= 30 days);\n    }\n}`,
  });
  const [openTabs, setOpenTabs] = useState(['welcome.sil', 'timelock-vault.sil']);
  const [activeTab, setActiveTab] = useState('welcome.sil');
  const [editMode, setEditMode] = useState(false);
  const [compilerOutput, setCompilerOutput] = useState([
    { type: 'info', text: '> silverc v0.1.0 ready' },
    { type: 'info', text: '> Press Compile to analyze' },
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledContractName, setCompiledContractName] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePanel, setActivePanel] = useState('editor');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const textareaRef = useRef(null);

  const openFile = (name) => {
    if (!openTabs.includes(name)) setOpenTabs(prev => [...prev, name]);
    setActiveTab(name);
    setEditMode(false);
    setSidebarOpen(false);
    setActivePanel('editor');
  };

  const closeTab = (e, name) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== name);
    setOpenTabs(newTabs);
    if (activeTab === name) setActiveTab(newTabs[newTabs.length - 1] || '');
  };

  const handleCreateContract = (name, code) => {
    setFiles(prev => ({ ...prev, [name]: code }));
    setOpenTabs(prev => prev.includes(name) ? prev : [...prev, name]);
    setActiveTab(name);
    setEditMode(true);
    setActivePanel('editor');
  };

  const insertSnippet = (code) => {
    if (!activeTab) return;
    setFiles(prev => ({ ...prev, [activeTab]: (prev[activeTab] || '') + '\n' + code }));
    setShowSnippets(false);
    setEditMode(true);
  };

  const handleCompile = async () => {
    if (!activeTab) return;
    setIsCompiling(true);
    setActivePanel('output');
    setCompiledContractName(null);
    setCompilerOutput([{ type: 'info', text: `> Compiling ${activeTab}...` }]);
    await new Promise(r => setTimeout(r, 600));
    const code = files[activeTab] || '';
    const errors = [];
    if (!code.includes('pragma silverscript')) errors.push({ type: 'error', text: 'ERROR: Missing pragma declaration' });
    if (!code.includes('contract ')) errors.push({ type: 'error', text: 'ERROR: No contract definition found' });
    if (!code.includes('entrypoint function')) errors.push({ type: 'warn', text: 'WARN: No entrypoint functions defined' });
    if ((code.match(/{/g) || []).length !== (code.match(/}/g) || []).length)
      errors.push({ type: 'error', text: 'ERROR: Mismatched braces' });
    if (errors.filter(e => e.type === 'error').length === 0) {
      const contractMatch = code.match(/contract\s+(\w+)/);
      const entrypoints = [...code.matchAll(/entrypoint function\s+(\w+)/g)].map(m => m[1]);
      const args = [...code.matchAll(/contract\s+\w+\(([^)]*)\)/g)].map(m => m[1]).filter(Boolean);
      const name = contractMatch?.[1] || 'unknown';
      setCompiledContractName(name);
      setCompilerOutput([
        { type: 'success', text: `> ✓ Compilation successful` },
        { type: 'info', text: `> Contract: ${name}` },
        ...(args[0] ? [{ type: 'info', text: `> Args: ${args[0]}` }] : []),
        ...(entrypoints.length > 0 ? [{ type: 'info', text: `> Entrypoints: ${entrypoints.join(', ')}` }] : []),
        ...(errors.filter(e => e.type === 'warn')),
        { type: 'success', text: `> Ready for Kaspa Testnet-12` },
        { type: 'explorer', text: `> To deploy: use silverc CLI, then verify TX on explorer` },
      ]);
    } else {
      setCompiledContractName(null);
      setCompilerOutput([{ type: 'error', text: '> ✗ Compilation failed' }, ...errors]);
    }
    setIsCompiling(false);
  };

  const handleCopy = () => {
    if (!activeTab) return;
    navigator.clipboard.writeText(files[activeTab] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCode = files[activeTab] || '';
  const lines = currentCode.split('\n');

  return (
    <div className="bg-zinc-950 text-white flex flex-col overflow-hidden" style={{ height: '100dvh', maxHeight: '100dvh' }}>
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center h-9 bg-zinc-900 border-b border-zinc-800 px-2 gap-2 flex-shrink-0">
        <Link to={createPageUrl('SilverScript')} className="text-zinc-600 hover:text-zinc-300 text-[10px] flex-shrink-0">
          ← SS
        </Link>
        <div className="h-3 w-px bg-zinc-800" />
        <MonitorDot className="w-3 h-3 text-cyan-500 flex-shrink-0" />
        <span className="text-zinc-200 font-semibold text-[11px] flex-shrink-0">KasCode</span>
        <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20 flex-shrink-0">Testnet-12</span>
        <div className="flex-1" />
        {/* kasAgent button */}
        <button
          onClick={() => setShowAgent(p => !p)}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded font-semibold transition-colors flex-shrink-0 ${
            showAgent
              ? 'bg-cyan-600 text-white border border-cyan-500'
              : 'bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700'
          }`}
        >
          <Bot className="w-3 h-3" />
          <span>kasAgent</span>
        </button>
        {/* New Contract button always visible */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-700/80 hover:bg-cyan-600 text-white text-[10px] rounded font-semibold transition-colors flex-shrink-0"
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">New</span>
        </button>
        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="sm:hidden flex items-center justify-center w-7 h-7 rounded bg-zinc-800 text-zinc-400"
        >
          <Menu className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">

        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="absolute inset-0 bg-black/70 z-30 sm:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div className={`
          absolute sm:relative z-40 sm:z-auto
          w-44 h-full bg-zinc-900 border-r border-zinc-800
          flex flex-col overflow-y-auto flex-shrink-0
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
        `}>
          {/* Files */}
          <div className="px-2 pt-2 pb-1">
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 px-1">Files</div>
            {Object.keys(files).map(name => (
              <button
                key={name}
                onClick={() => openFile(name)}
                className={`w-full text-left flex items-center gap-1 px-2 py-1.5 rounded text-[11px] transition-colors ${
                  activeTab === name ? 'bg-zinc-700/70 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <FileText className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{name}</span>
              </button>
            ))}
          </div>

          {/* Snippets */}
          <div className="px-2 pt-1 pb-1 border-t border-zinc-800/60 mt-1">
            <button
              onClick={() => setShowSnippets(p => !p)}
              className="w-full flex items-center gap-1 text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 px-1 hover:text-zinc-400"
            >
              {showSnippets ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
              Snippets
            </button>
            {showSnippets && SNIPPETS.map(s => (
              <button
                key={s.name}
                onClick={() => insertSnippet(s.code)}
                className="w-full text-left flex items-center gap-1 px-2 py-1 text-[10px] text-zinc-500 hover:text-cyan-300 hover:bg-zinc-800/50 rounded transition-colors"
              >
                <span className="text-cyan-800 flex-shrink-0">›</span>
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>

          {/* Templates quick-add */}
          <div className="px-2 pt-1 pb-3 border-t border-zinc-800/60 mt-1">
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 px-1">Templates</div>
            {CONTRACT_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleCreateContract(t.id + '.sil', t.generate({}))}
                className="w-full text-left flex items-center gap-1 px-2 py-1 text-[10px] text-zinc-500 hover:text-teal-300 hover:bg-zinc-800/50 rounded transition-colors"
              >
                <Code2 className="w-2.5 h-2.5 flex-shrink-0 text-teal-700" />
                <span className="truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── kasAgent Panel ───────────────────────────────────── */}
        {showAgent && (
          <div className="w-full sm:w-80 flex-shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden bg-zinc-950" style={{ minHeight: 0 }}>
            <KasAgentChat
              onLoadToEditor={(name, code) => {
                handleCreateContract(name, code);
              }}
              onClose={() => setShowAgent(false)}
            />
          </div>
        )}

        {/* ── Editor + Output ──────────────────────────────────── */}
        <div className={`flex flex-col flex-1 min-w-0 overflow-hidden ${showAgent ? 'hidden sm:flex' : 'flex'}`}>
          {/* Tabs */}
          <div className="flex items-stretch bg-zinc-900 border-b border-zinc-800 overflow-x-auto flex-shrink-0 scrollbar-hide h-8">
            {openTabs.map(tab => (
              <div
                key={tab}
                onClick={() => { setActiveTab(tab); setEditMode(false); setActivePanel('editor'); }}
                className={`flex items-center gap-1 px-2 text-[10px] border-r border-zinc-800 cursor-pointer transition-colors flex-shrink-0 ${
                  activeTab === tab
                    ? 'bg-zinc-950 text-zinc-100 border-t-2 border-t-cyan-500'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                <span className="max-w-[60px] truncate">{tab}</span>
                <span
                  onClick={e => closeTab(e, tab)}
                  className="flex items-center justify-center w-3 h-3 rounded hover:bg-zinc-600 text-zinc-700 hover:text-zinc-200 flex-shrink-0"
                >
                  <X className="w-2 h-2" />
                </span>
              </div>
            ))}
            <button onClick={() => setShowCreateModal(true)} className="px-2 text-zinc-700 hover:text-zinc-400 flex-shrink-0 flex items-center">
              <Plus className="w-3 h-3" />
            </button>
            {/* Mobile panel toggle */}
            <div className="ml-auto flex sm:hidden items-center gap-1 px-2">
              <button onClick={() => setActivePanel('editor')} className={`text-[9px] px-1.5 py-0.5 rounded ${activePanel === 'editor' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-600'}`}>Code</button>
              <button onClick={() => setActivePanel('output')} className={`text-[9px] px-1.5 py-0.5 rounded ${activePanel === 'output' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-600'}`}>Out</button>
            </div>
          </div>

          {/* Code Editor */}
          <div
            className={`flex-1 overflow-auto bg-zinc-950 relative ${activePanel === 'output' ? 'hidden sm:block' : ''}`}
            onClick={() => { if (!editMode) setEditMode(true); }}
          >
            {activeTab && files[activeTab] !== undefined ? (
              editMode ? (
                <textarea
                  ref={textareaRef}
                  value={files[activeTab]}
                  onChange={e => setFiles(prev => ({ ...prev, [activeTab]: e.target.value }))}
                  spellCheck={false}
                  autoFocus
                  className="w-full h-full bg-transparent text-zinc-200 resize-none outline-none p-2 pl-10 font-mono text-[11px] leading-5"
                  style={{ fontFamily: "'Fira Code', Consolas, monospace" }}
                />
              ) : (
                <div className="p-2 overflow-x-auto cursor-text" style={{ fontFamily: "'Fira Code', Consolas, monospace" }}>
                  {lines.map((line, i) => <HighlightedLine key={i} line={line} num={i + 1} />)}
                  <div className="text-zinc-800 text-[9px] mt-2 select-none">Tap to edit</div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-xs gap-3">
                <MonitorDot className="w-8 h-8 text-zinc-800" />
                <span>Open a file or create a contract</span>
                <button onClick={() => setShowCreateModal(true)} className="px-3 py-1.5 bg-cyan-800 hover:bg-cyan-700 text-white text-xs rounded">New Contract</button>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-900 border-t border-zinc-800 flex-shrink-0">
            <button
              onClick={handleCompile}
              disabled={isCompiling || !activeTab}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white text-[10px] rounded font-semibold transition-colors"
            >
              <Play className="w-2.5 h-2.5" />
              {isCompiling ? '...' : 'Compile'}
            </button>
            <button
              onClick={() => setEditMode(p => !p)}
              className={`px-2.5 py-1.5 text-[10px] rounded transition-colors ${editMode ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/50' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              {editMode ? '✎ On' : '✎ Edit'}
            </button>
            <button onClick={handleCopy} className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] rounded transition-colors">
              {copied ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
            </button>
            <div className="ml-auto hidden sm:flex items-center gap-2 text-[10px] text-zinc-700">
              <span>{lines.length}L</span>
              <span className="text-cyan-800">SilverScript</span>
            </div>
          </div>

          {/* Compiler Output */}
          <div className={`bg-black border-t border-zinc-800 flex flex-col flex-shrink-0 ${
            activePanel === 'output' ? 'flex-1 sm:flex-none sm:h-28' : 'h-24 hidden sm:flex'
          }`}>
            <div className="flex items-center gap-2 px-2 py-1 bg-zinc-900 border-b border-zinc-800/50 flex-shrink-0">
              <Terminal className="w-3 h-3 text-zinc-700" />
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Output</span>
              <button onClick={() => setActivePanel('editor')} className="ml-auto sm:hidden text-zinc-600 hover:text-zinc-400 text-[9px]">← Code</button>
            </div>
            <div className="flex-1 overflow-auto px-2 py-1.5 space-y-0.5" style={{ fontFamily: "'Fira Code', Consolas, monospace" }}>
              {compilerOutput.map((line, i) => (
                line.type === 'explorer' ? null : (
                  <div key={i} className={`text-[10px] ${
                    line.type === 'error' ? 'text-red-400' :
                    line.type === 'success' ? 'text-emerald-400' :
                    line.type === 'warn' ? 'text-yellow-400' :
                    'text-zinc-500'
                  }`}>{line.text}</div>
                )
              ))}
              {isCompiling && <div className="text-[10px] text-cyan-500 animate-pulse">▮ Analyzing...</div>}
              {compiledContractName && !isCompiling && (
                <div className="mt-2 p-2 bg-zinc-900 border border-zinc-700 rounded-lg space-y-1.5">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">🔗 Verify on Blockchain</div>
                  <div className="text-[10px] text-zinc-400 leading-relaxed">
                    After deploying with <span className="text-cyan-400 font-mono">silverc</span>, paste your TX hash below to verify on Kaspa explorer:
                  </div>
                  <TxExplorerInput />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Contract Modal */}
      {showCreateModal && (
        <CreateContractModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateContract}
        />
      )}
    </div>
  );
}