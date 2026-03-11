import React, { useState, useRef } from "react";
import { X, Plus, Play, Terminal, FileText, ChevronRight, ChevronDown } from "lucide-react";

const INITIAL_FILES = {
  "welcome.sil": `pragma silverscript ^0.1.0;\n\n// Welcome to KasCode IDE\n// Your SilverScript development environment\n\ncontract Welcome() {\n    entrypoint function hello(pubkey pk, sig s) {\n        require(checkSig(s, pk));\n    }\n}`,
  "timelock-vault.sil": `pragma silverscript ^0.1.0;\n\ncontract TimelockVault(\n    pubkey owner,\n    int unlockTime\n) {\n    // Owner can withdraw after unlockTime\n    entrypoint function withdraw(sig ownerSig) {\n        require(checkSig(ownerSig, owner));\n        require(tx.time >= unlockTime);\n    }\n\n    // Emergency reclaim after 365 days\n    entrypoint function emergency(sig ownerSig) {\n        require(checkSig(ownerSig, owner));\n        require(this.age >= 365 days);\n    }\n}`,
  "recurring-payment.sil": `pragma silverscript ^0.1.0;\n\ncontract RecurringPayment(\n    pubkey sender,\n    pubkey recipient,\n    int amount,\n    int period\n) {\n    entrypoint function pay(sig senderSig) {\n        require(checkSig(senderSig, sender));\n        require(tx.outputs[0].value == amount);\n        byte[34] recipientScript = new ScriptPubKeyP2PK(recipient);\n        require(tx.outputs[0].scriptPubKey == recipientScript);\n        require(this.age >= period);\n    }\n}`,
  "freelancecontract.sil": `pragma silverscript ^0.1.0;\n\n// FreelanceContract\n// Payroll / Freelance Contract — locks funds for work\n// With arbitration support and timeout protection.\n\ncontract FreelanceContract() {\n    pubkey constant clientKey = 0xca1b0ba58ccd6267fe983aa9b58cc1789ef44b92b19e6ee77b690ea77e8491;\n    pubkey constant workerKey = 0x9b06f468e74cb4904e4258c5edaa028451d5e4a4e5040e80888f7b8b5a4e5f;\n    pubkey constant arbiterKey = 0x8125983f2b2021b29c39de4a91d3206932279eb795ac81b7b0ae73c0ca316e;\n\n    // Path A: Mutual Release (happy path) ————\n    // Client and worker both agree work is complete.\n    // Payment goes to the worker.\n    entrypoint function release(sig clientSig, sig workerSig) {\n        require(checkSig(clientSig, clientKey));\n        require(checkSig(workerSig, workerKey));\n        byte[34] workerScript = new ScriptPubKeyP2PK(workerKey);\n        require(tx.outputs[0].scriptPubKey == workerScript);\n    }\n\n    // Path B: Refund by Arbitration ————\n    // Client and arbiter agree to refund the client.\n    // Use when the worker did not deliver.\n    entrypoint function refund(sig clientSig, sig arbiterSig) {\n        require(checkSig(clientSig, clientKey));\n        require(checkSig(arbiterSig, arbiterKey));\n        byte[34] clientScript = new ScriptPubKeyP2PK(clientKey);\n        require(tx.outputs[0].scriptPubKey == clientScript);\n    }\n\n    // Path C: Payout by Arbitration ————\n    // Worker and arbiter agree the work is done.\n    // Use when the client is unresponsive or disputes unfairly.\n    entrypoint function arbitrate(sig workerSig, sig arbiterSig) {\n        require(checkSig(workerSig, workerKey));\n        require(checkSig(arbiterSig, arbiterKey));\n        byte[34] workerScript = new ScriptPubKeyP2PK(workerKey);\n        require(tx.outputs[0].scriptPubKey == workerScript);\n    }\n\n    // Path D: Timeout Reclaim ————\n    // If the contract expires with no resolution,\n    // the client can reclaim their funds unilaterally.\n    entrypoint function reclaim(sig clientSig) {\n        require(checkSig(clientSig, clientKey));\n        require(this.age >= 30 days);\n        byte[34] clientScript = new ScriptPubKeyP2PK(clientKey);\n        require(tx.outputs[0].scriptPubKey == clientScript);\n    }\n}`
};

const SNIPPETS = [
  { name: "Start Here", code: `pragma silverscript ^0.1.0;\n\ncontract MyContract() {\n    entrypoint function spend(pubkey pk, sig s) {\n        require(checkSig(s, pk));\n    }\n}` },
  { name: "Empty Contract", code: `contract MyContract() {\n\n}` },
  { name: "Constant Value", code: `int constant FEE = 1000;\npubkey constant ownerKey = 0x...;` },
  { name: "Require (Assert)", code: `require(checkSig(s, pk));` },
  { name: "Who Can Spend", code: `entrypoint function spend(pubkey pk, sig s) {\n    require(blake2b(pk) == pkh);\n    require(checkSig(s, pk));\n}` },
  { name: "Who Can't Spend", code: `require(tx.time >= lockTime);\nrequire(this.age >= 7 days);` },
  { name: "Where Does It Go", code: `byte[34] script = new ScriptPubKeyP2PK(recipient);\nrequire(tx.outputs[0].scriptPubKey == script);\nrequire(tx.outputs[0].value == amount);` },
  { name: "Complete Contracts", code: `// Complete contracts are in the FILES panel` },
];

const BUG_TEMPLATES = [
  { name: "Pay to Public Key", color: "bg-emerald-500" },
  { name: "Time-Locked Vault", color: "bg-blue-500" },
  { name: "Two-Party Escrow", color: "bg-emerald-500" },
  { name: "Recurring Payment", color: "bg-emerald-500" },
  { name: "Payroll / Freelance", color: "bg-emerald-500" },
  { name: "Simple Covenant", color: "bg-emerald-500" },
];

const SIL_KEYWORDS = new Set([
  'pragma','silverscript','contract','entrypoint','function','require',
  'byte','pubkey','sig','int','bool','constant','new','if','else','for',
  'return','days','this','tx','true','false','inputs','outputs','time',
  'age','value','scriptPubKey','version','activeInputIndex'
]);

function tokenizeLine(line) {
  const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|0x[0-9a-fA-F]+|\d+(?:\.\d+)?|[a-zA-Z_]\w*|[^\s\w]|\s+)/g;
  return [...line.matchAll(regex)].map(m => m[0]);
}

function renderLine(line, lineNum) {
  const numEl = (
    <span className="inline-block w-10 text-right pr-4 text-zinc-600 select-none text-xs flex-shrink-0">
      {lineNum}
    </span>
  );

  if (line.trim().startsWith('//')) {
    return (
      <div key={lineNum} className="flex leading-6 hover:bg-white/[0.02]">
        {numEl}
        <span className="text-zinc-500 italic whitespace-pre">{line}</span>
      </div>
    );
  }

  const tokens = tokenizeLine(line);
  const tokenEls = tokens.map((tok, i) => {
    if (SIL_KEYWORDS.has(tok)) return <span key={i} className="text-cyan-400">{tok}</span>;
    if (/^0x[0-9a-fA-F]+$/.test(tok)) return <span key={i} className="text-amber-400">{tok}</span>;
    if (tok.startsWith('"') || tok.startsWith("'")) return <span key={i} className="text-orange-300">{tok}</span>;
    if (/^\d+$/.test(tok)) return <span key={i} className="text-yellow-300">{tok}</span>;
    if (/^[A-Z][a-zA-Z0-9]*$/.test(tok)) return <span key={i} className="text-teal-300">{tok}</span>;
    const prev = tokens.slice(0, i).filter(t => t.trim()).at(-1);
    if (/^[a-z_]\w+$/.test(tok) && prev === 'function') return <span key={i} className="text-yellow-300">{tok}</span>;
    if (/^[a-z_]\w+$/.test(tok) && !SIL_KEYWORDS.has(tok)) return <span key={i} className="text-zinc-200">{tok}</span>;
    if (/^[{}\[\]();,]$/.test(tok)) return <span key={i} className="text-zinc-400">{tok}</span>;
    if (/^(==|!=|>=|<=|>|<|\+|-|\*|\/)$/.test(tok)) return <span key={i} className="text-cyan-300">{tok}</span>;
    return <span key={i} className="text-zinc-300">{tok}</span>;
  });

  return (
    <div key={lineNum} className="flex leading-6 hover:bg-white/[0.02]">
      {numEl}
      <span className="whitespace-pre">{tokenEls}</span>
    </div>
  );
}

export default function KasCodeIDE() {
  const [files, setFiles] = useState({ ...INITIAL_FILES });
  const [openTabs, setOpenTabs] = useState(['welcome.sil', 'timelock-vault.sil', 'recurring-payment.sil', 'freelancecontract.sil']);
  const [activeTab, setActiveTab] = useState('freelancecontract.sil');
  const [editMode, setEditMode] = useState(false);
  const [compilerOutput, setCompilerOutput] = useState([
    { type: 'info', text: '> silverc v0.1.0 ready' },
    { type: 'info', text: '> Open a file and press ▶ Compile to analyze' },
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [expandSnippets, setExpandSnippets] = useState(true);
  const [expandBugData, setExpandBugData] = useState(true);

  const openFile = (name) => {
    if (!openTabs.includes(name)) setOpenTabs(prev => [...prev, name]);
    setActiveTab(name);
    setEditMode(false);
  };

  const closeTab = (e, name) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== name);
    setOpenTabs(newTabs);
    if (activeTab === name) setActiveTab(newTabs[newTabs.length - 1] || '');
  };

  const addNewFile = () => {
    const idx = Object.keys(files).length + 1;
    const name = `contract${idx}.sil`;
    setFiles(prev => ({ ...prev, [name]: `pragma silverscript ^0.1.0;\n\ncontract MyContract${idx}() {\n    entrypoint function spend(pubkey pk, sig s) {\n        require(checkSig(s, pk));\n    }\n}` }));
    setOpenTabs(prev => [...prev, name]);
    setActiveTab(name);
    setEditMode(true);
  };

  const insertSnippet = (code) => {
    if (!activeTab) return;
    setFiles(prev => ({ ...prev, [activeTab]: (prev[activeTab] || '') + '\n\n' + code }));
  };

  const handleCompile = async () => {
    if (!activeTab) return;
    setIsCompiling(true);
    setCompilerOutput([{ type: 'info', text: `> Compiling ${activeTab}...` }]);
    await new Promise(r => setTimeout(r, 700));
    const code = files[activeTab] || '';
    const errors = [];
    if (!code.includes('pragma silverscript')) errors.push({ type: 'error', text: 'ERROR: Missing pragma declaration' });
    if (!code.includes('contract ')) errors.push({ type: 'error', text: 'ERROR: No contract definition found' });
    if ((code.match(/{/g) || []).length !== (code.match(/}/g) || []).length)
      errors.push({ type: 'error', text: 'ERROR: Mismatched braces' });

    if (errors.length === 0) {
      const contractMatch = code.match(/contract\s+(\w+)/);
      const entrypoints = [...code.matchAll(/entrypoint function\s+(\w+)/g)].map(m => m[1]);
      setCompilerOutput([
        { type: 'success', text: `> ✓ Compilation successful` },
        { type: 'info', text: `> Contract: ${contractMatch?.[1] || 'unknown'}` },
        ...(entrypoints.length > 0 ? [{ type: 'info', text: `> Entrypoints: ${entrypoints.join(', ')}` }] : []),
        { type: 'success', text: `> Ready for Kaspa Testnet-12` },
      ]);
    } else {
      setCompilerOutput([{ type: 'error', text: '> ✗ Compilation failed' }, ...errors]);
    }
    setIsCompiling(false);
  };

  return (
    <div
      className="flex flex-col bg-zinc-950 text-zinc-300 rounded-xl overflow-hidden border border-zinc-800"
      style={{ height: '80vh', fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace" }}
    >
      {/* Menu Bar */}
      <div className="flex items-center h-8 bg-zinc-900 border-b border-zinc-800 px-3 gap-4 flex-shrink-0">
        <span className="text-zinc-200 font-semibold text-xs tracking-wide">SilverScript Studio</span>
        <div className="h-3 w-px bg-zinc-700" />
        {['File', 'Build', 'Compile', 'Contracts', 'Help'].map(m => (
          <button key={m} className="text-zinc-500 hover:text-zinc-200 text-xs transition-colors">{m}</button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-cyan-600 text-xs">KasCode v0.1.0</span>
          <span className="text-zinc-600 text-xs">Testnet-12</span>
        </div>
      </div>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 bg-zinc-900/40 border-r border-zinc-800 flex flex-col overflow-y-auto flex-shrink-0 text-xs">
          {/* FILES */}
          <div className="px-2 pt-3 pb-1">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 px-1">Files</div>
            {Object.keys(files).map(name => (
              <button
                key={name}
                onClick={() => openFile(name)}
                className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                  activeTab === name ? 'bg-zinc-700/60 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{name}</span>
              </button>
            ))}
            <button
              onClick={addNewFile}
              className="w-full text-left flex items-center gap-1.5 px-2 py-1 text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
            >
              <Plus className="w-3 h-3" />
              <span>New file</span>
            </button>
          </div>

          {/* SNIPPETS */}
          <div className="px-2 pt-2 pb-1 border-t border-zinc-800/50 mt-1">
            <button
              onClick={() => setExpandSnippets(p => !p)}
              className="w-full flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 px-1"
            >
              {expandSnippets ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Snippets
            </button>
            {expandSnippets && SNIPPETS.map(s => (
              <button
                key={s.name}
                onClick={() => insertSnippet(s.code)}
                className="w-full text-left flex items-center gap-1.5 px-2 py-1 text-zinc-500 hover:text-cyan-300 hover:bg-zinc-800/50 rounded transition-colors"
              >
                <span className="text-cyan-700">•</span>
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>

          {/* BUG DATA */}
          <div className="px-2 pt-2 pb-3 border-t border-zinc-800/50 mt-1">
            <button
              onClick={() => setExpandBugData(p => !p)}
              className="w-full flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 px-1"
            >
              {expandBugData ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Bug Data
            </button>
            {expandBugData && BUG_TEMPLATES.map(b => (
              <div key={b.name} className="flex items-center gap-2 px-2 py-1 text-zinc-500 rounded">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${b.color}`} />
                <span className="truncate">{b.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-end bg-zinc-900/60 border-b border-zinc-800 overflow-x-auto flex-shrink-0" style={{ minHeight: '2.25rem' }}>
            {openTabs.map(tab => (
              <div
                key={tab}
                onClick={() => { setActiveTab(tab); setEditMode(false); }}
                className={`flex items-center gap-2 px-4 py-2 text-xs border-r border-zinc-800 cursor-pointer transition-colors flex-shrink-0 ${
                  activeTab === tab
                    ? 'bg-zinc-950 text-zinc-100 border-t-2 border-t-cyan-500'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                <span>{tab}</span>
                <span
                  onClick={(e) => closeTab(e, tab)}
                  className="flex items-center justify-center w-4 h-4 rounded hover:bg-zinc-600 text-zinc-600 hover:text-zinc-200 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </div>
            ))}
            <button onClick={addNewFile} className="px-3 py-2 text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Code view */}
          <div className="flex-1 overflow-auto bg-zinc-950 relative" onDoubleClick={() => !editMode && setEditMode(true)}>
            {activeTab && files[activeTab] !== undefined ? (
              editMode ? (
                <textarea
                  value={files[activeTab]}
                  onChange={e => setFiles(prev => ({ ...prev, [activeTab]: e.target.value }))}
                  onBlur={() => setEditMode(false)}
                  autoFocus
                  spellCheck={false}
                  className="w-full h-full bg-transparent text-zinc-200 resize-none outline-none p-4 pl-16 font-mono text-sm leading-6"
                />
              ) : (
                <div className="p-4 font-mono text-sm cursor-text">
                  {files[activeTab].split('\n').map((line, i) => renderLine(line, i + 1))}
                  <div className="text-zinc-700 text-xs mt-4 select-none">Double-click to edit</div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                Open a file from the sidebar
              </div>
            )}
          </div>

          {/* Status / Action bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border-t border-zinc-800 flex-shrink-0">
            <button
              onClick={handleCompile}
              disabled={isCompiling || !activeTab}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white text-xs rounded transition-colors"
            >
              <Play className="w-3 h-3" />
              {isCompiling ? 'Compiling...' : '▶ Compile'}
            </button>
            {activeTab && (
              <button
                onClick={() => setEditMode(p => !p)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
                  editMode ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/50' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {editMode ? '✎ Editing' : '✎ Edit'}
              </button>
            )}
            <div className="ml-auto flex items-center gap-3 text-xs text-zinc-600">
              {activeTab && <span>{(files[activeTab] || '').split('\n').length} lines</span>}
              <span>UTF-8</span>
              <span className="text-cyan-700">SilverScript</span>
            </div>
          </div>

          {/* Compiler Output */}
          <div className="h-28 bg-black border-t border-zinc-800 flex flex-col flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/80 border-b border-zinc-800/50 flex-shrink-0">
              <Terminal className="w-3 h-3 text-zinc-600" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Compiler Output</span>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-0.5">
              {compilerOutput.map((line, i) => (
                <div key={i} className={`text-xs font-mono ${
                  line.type === 'error' ? 'text-red-400' :
                  line.type === 'success' ? 'text-emerald-400' :
                  'text-zinc-500'
                }`}>
                  {line.text}
                </div>
              ))}
              {isCompiling && <div className="text-xs font-mono text-cyan-500 animate-pulse">▮ Analyzing...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}