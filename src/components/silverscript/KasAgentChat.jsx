import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles, ChevronDown, ChevronUp, Loader2, Copy, Check, FileCode, Play, ExternalLink, Rocket, Key, ChevronRight, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EXAMPLE_PROMPTS = [
  "Create a contract that locks KAS until a specific date",
  "Make a 2-of-3 multisig wallet for a DAO treasury",
  "Build an escrow contract where a buyer pays a seller with arbiter dispute resolution",
  "Write a subscription contract that allows monthly payments",
  "Create a contract that verifies a public key hash before spending",
  "Build a dead man's switch: send KAS to backup if not accessed in 1 year",
];

function ContractCodeBlock({ code, fileName, onLoadToEditor }) {
  const [copied, setCopied] = useState(false);
  const [compiled, setCompiled] = useState(null);
  const [compileOutput, setCompileOutput] = useState([]);
  const [contractName, setContractName] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [deployError, setDeployError] = useState(null);
  const [deployNetwork, setDeployNetwork] = useState('testnet');
  const [deployPK, setDeployPK] = useState(() => localStorage.getItem('ttt_wallet_pk') || '');
  const [deployAddress, setDeployAddress] = useState(() => localStorage.getItem('ttt_wallet_address') || '');
  const [showDeployForm, setShowDeployForm] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setCompiled(null);
    await new Promise(r => setTimeout(r, 600));
    const errors = [];
    if (!code.includes('pragma silverscript')) errors.push({ t: 'error', msg: 'ERROR: Missing pragma declaration' });
    if (!code.includes('contract ')) errors.push({ t: 'error', msg: 'ERROR: No contract definition found' });
    if (!code.includes('entrypoint function')) errors.push({ t: 'warn', msg: 'WARN: No entrypoint functions defined' });
    if ((code.match(/{/g) || []).length !== (code.match(/}/g) || []).length)
      errors.push({ t: 'error', msg: 'ERROR: Mismatched braces' });

    const hasErrors = errors.some(e => e.t === 'error');
    if (!hasErrors) {
      const nameMatch = code.match(/contract\s+(\w+)/);
      const entrypoints = [...code.matchAll(/entrypoint function\s+(\w+)/g)].map(m => m[1]);
      const name = nameMatch?.[1] || 'Contract';
      setContractName(name);
      setCompiled('success');
      setCompileOutput([
        { t: 'success', msg: '✓ Compilation successful' },
        { t: 'info', msg: `Contract: ${name}` },
        ...(entrypoints.length ? [{ t: 'info', msg: `Entrypoints: ${entrypoints.join(', ')}` }] : []),
        ...errors,
        { t: 'success', msg: '✓ Ready for Kaspa Testnet-12' },
      ]);
    } else {
      setCompiled('error');
      setCompileOutput([{ t: 'error', msg: '✗ Compilation failed' }, ...errors]);
    }
    setIsCompiling(false);
  };

  const isValidTx = /^[0-9a-fA-F]{64}$/.test(txHash.trim());

  const openExplorer = (net) => {
    const base = net === 'testnet'
      ? 'https://explorer-tn12.kaspa.org/txs/'
      : 'https://explorer.kaspa.org/txs/';
    window.open(base + txHash.trim(), '_blank');
  };

  const handleDeploy = async () => {
    if (!deployAddress.trim() || !deployPK.trim()) {
      setDeployError('Wallet address and private key are required.');
      return;
    }
    setIsDeploying(true);
    setDeployError(null);
    setDeployResult(null);
    try {
      const res = await base44.functions.invoke('deployKaspaContract', {
        contractCode: code,
        contractName: contractName || fileName,
        fromAddress: deployAddress.trim(),
        privateKey: deployPK.trim(),
        network: deployNetwork,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setDeployResult(res.data);
    } catch (e) {
      setDeployError(e?.message || 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-zinc-700 overflow-hidden">
      {/* File header */}
      <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <FileCode className="w-3 h-3 text-cyan-500" />
          <span className="text-[10px] text-zinc-400 font-mono">{fileName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleCopy} className="text-zinc-500 hover:text-zinc-200 transition-colors">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
          {onLoadToEditor && (
            <button
              onClick={() => onLoadToEditor(fileName, code)}
              className="px-2 py-0.5 bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 text-[9px] rounded font-semibold transition-colors"
            >
              Editor
            </button>
          )}
        </div>
      </div>

      {/* Code */}
      <pre className="bg-zinc-950 text-zinc-300 text-[10px] p-3 overflow-x-auto leading-relaxed font-mono max-h-48">
        {code}
      </pre>

      {/* Compile button */}
      <div className="bg-zinc-900 px-3 py-2 border-t border-zinc-800 flex items-center gap-2">
        <button
          onClick={handleCompile}
          disabled={isCompiling}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white text-[10px] rounded font-semibold transition-colors"
        >
          {isCompiling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {isCompiling ? 'Compiling...' : 'Compile'}
        </button>
        {compiled === 'success' && !isCompiling && (
          <span className="text-emerald-400 text-[10px] font-semibold">✓ Ready to Deploy</span>
        )}
        {compiled === 'error' && !isCompiling && (
          <span className="text-red-400 text-[10px]">✗ Fix errors first</span>
        )}
      </div>

      {/* Compile output */}
      {compiled && compileOutput.length > 0 && (
        <div className={`px-3 py-2 border-t border-zinc-800 space-y-0.5 ${compiled === 'success' ? 'bg-emerald-950/20' : 'bg-red-950/20'}`}>
          {compileOutput.map((line, i) => (
            <div key={i} className={`text-[10px] font-mono ${
              line.t === 'success' ? 'text-emerald-400' :
              line.t === 'error' ? 'text-red-400' :
              line.t === 'warn' ? 'text-yellow-400' :
              'text-zinc-500'
            }`}>{line.msg}</div>
          ))}
        </div>
      )}

      {/* Deploy section */}
      {compiled === 'success' && (
        <div className="px-3 py-2.5 border-t border-zinc-700 bg-zinc-900/80 space-y-2">
          <button
            onClick={() => setShowDeployForm(p => !p)}
            className="w-full flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <Rocket className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] text-zinc-300 font-semibold flex-1 text-left">Deploy to Blockchain</span>
            <span className="text-[9px] text-zinc-600">{showDeployForm ? '▲' : '▼'}</span>
          </button>

          {showDeployForm && (
            <div className="space-y-2">
              {/* Network selector */}
              <div className="flex gap-1.5">
                {['testnet', 'mainnet'].map(net => (
                  <button
                    key={net}
                    onClick={() => setDeployNetwork(net)}
                    className={`flex-1 py-1 text-[10px] rounded border transition-colors font-semibold ${
                      deployNetwork === net
                        ? net === 'mainnet' ? 'bg-orange-600/30 border-orange-500/60 text-orange-300' : 'bg-cyan-700/30 border-cyan-600/60 text-cyan-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {net === 'testnet' ? 'Testnet-12' : '⚠️ Mainnet'}
                  </button>
                ))}
              </div>

              {/* From address */}
              <div>
                <label className="text-[9px] text-zinc-500 block mb-0.5">Your Kaspa Address</label>
                <input
                  value={deployAddress}
                  onChange={e => setDeployAddress(e.target.value.trim())}
                  placeholder="kaspa:q..."
                  className="w-full bg-zinc-800 text-zinc-200 text-[10px] px-2 py-1.5 rounded border border-zinc-700 outline-none focus:border-cyan-600 font-mono"
                  style={{ fontSize: '14px' }}
                />
              </div>

              {/* Private key */}
              <div>
                <label className="text-[9px] text-zinc-500 block mb-0.5">Private Key (stays on device)</label>
                <input
                  type="password"
                  value={deployPK}
                  onChange={e => setDeployPK(e.target.value.trim())}
                  placeholder="Your wallet private key..."
                  className="w-full bg-zinc-800 text-zinc-200 text-[10px] px-2 py-1.5 rounded border border-zinc-700 outline-none focus:border-cyan-600 font-mono"
                  style={{ fontSize: '14px' }}
                />
                <p className="text-[9px] text-zinc-600 mt-0.5">Auto-loaded from TTT Wallet if available</p>
              </div>

              {/* Deploy error */}
              {deployError && (
                <div className="flex items-start gap-1.5 bg-red-950/40 border border-red-800/40 rounded px-2 py-1.5">
                  <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-300">{deployError}</p>
                </div>
              )}

              {/* Deploy result */}
              {deployResult && (
                <div className="bg-emerald-950/40 border border-emerald-700/40 rounded px-2 py-2 space-y-1">
                  <p className="text-[10px] text-emerald-400 font-semibold">✓ Deployed to {deployResult.network}!</p>
                  <div className="text-[9px] text-zinc-400 font-mono break-all">
                    <span className="text-zinc-600">TX: </span>{deployResult.txHash}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-mono break-all">
                    <span className="text-zinc-600">Contract Address: </span>{deployResult.contractAddress}
                  </div>
                  <button
                    onClick={() => window.open(deployResult.explorerUrl, '_blank')}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on Explorer
                  </button>
                </div>
              )}

              {/* Deploy button */}
              {!deployResult && (
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !deployAddress.trim() || !deployPK.trim()}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded text-[10px] font-bold transition-colors disabled:opacity-40 ${
                    deployNetwork === 'mainnet'
                      ? 'bg-orange-600 hover:bg-orange-500 text-white'
                      : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                  }`}
                >
                  {isDeploying ? (
                    <><Loader2 className="w-3 h-3 animate-spin" />Deploying...</>
                  ) : (
                    <><Rocket className="w-3 h-3" />Deploy to {deployNetwork === 'mainnet' ? 'Mainnet' : 'Testnet-12'}</>
                  )}
                </button>
              )}
              {deployResult && (
                <button
                  onClick={() => { setDeployResult(null); setDeployError(null); }}
                  className="w-full py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Deploy Again
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg, onLoadToEditor }) {
  return (
    <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role === 'assistant' && (
        <div className="w-5 h-5 rounded-full bg-cyan-800/60 border border-cyan-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3 h-3 text-cyan-400" />
        </div>
      )}
      <div className={`max-w-[90%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {msg.role === 'user' ? (
          <div className="bg-zinc-700/60 text-zinc-100 text-[11px] px-3 py-2 rounded-xl rounded-tr-sm leading-relaxed">
            {msg.content}
          </div>
        ) : (
          <div className="space-y-1 w-full">
            {msg.explanation && (
              <div className="text-zinc-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                {msg.explanation}
              </div>
            )}
            {msg.contractCode && (
              <ContractCodeBlock
                code={msg.contractCode}
                fileName={msg.contractName || 'contract.sil'}
                onLoadToEditor={onLoadToEditor}
              />
            )}
            {msg.error && (
              <div className="text-red-400 text-[11px] bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                {msg.error}
              </div>
            )}
          </div>
        )}
        <span className="text-[9px] text-zinc-700 px-1">{msg.time}</span>
      </div>
    </div>
  );
}

export default function KasAgentChat({ onLoadToEditor, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      explanation: "Hey! I'm kasAgent 🤖 — your SilverScript contract AI.\n\nPaste your **testnet pubkey** above so I can use it in contracts. Then describe what you want in plain English and I'll write it for you.",
      contractCode: null,
      contractName: null,
      time: 'now',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [pubkey, setPubkey] = useState(() => localStorage.getItem('kasagent_pubkey') || '');
  const [showPubkeyInput, setShowPubkeyInput] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const savePubkey = (val) => {
    setPubkey(val);
    localStorage.setItem('kasagent_pubkey', val);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const prompt = text || input.trim();
    if (!prompt || loading) return;
    setInput('');
    setShowExamples(false);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: prompt, time };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = messages.slice(1).map(m => ({
      role: m.role,
      content: m.role === 'user' ? m.content : (m.explanation || '') + (m.contractCode ? '\n```silverscript\n' + m.contractCode + '\n```' : ''),
    }));

    // Prepend pubkey context to prompt if set
    const enrichedPrompt = pubkey.trim()
      ? `[My testnet pubkey: ${pubkey.trim()}]\n\n${prompt}`
      : prompt;

    try {
      const res = await base44.functions.invoke('kasAgent', { prompt: enrichedPrompt, history });
      const data = res.data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        explanation: data.explanation,
        contractCode: data.contractCode,
        contractName: data.contractName,
        error: data.error || null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        explanation: null,
        contractCode: null,
        contractName: null,
        error: 'kasAgent error: ' + err.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col bg-zinc-950" style={{ height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
        <div className="w-5 h-5 rounded-full bg-cyan-800/60 border border-cyan-600/40 flex items-center justify-center">
          <Bot className="w-3 h-3 text-cyan-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-100 text-xs font-bold">kasAgent</span>
            <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
          </div>
          <div className="text-[9px] text-zinc-600">AI SilverScript Contract Writer</div>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Testnet Pubkey Banner */}
      <div className="border-b border-zinc-800 bg-zinc-900/80">
        <button
          onClick={() => setShowPubkeyInput(p => !p)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-zinc-800/40 transition-colors"
        >
          <Key className="w-3 h-3 text-yellow-500 flex-shrink-0" />
          <span className="text-[10px] text-zinc-400 flex-1">
            {pubkey.trim() ? (
              <span className="text-yellow-400 font-mono truncate block">🔑 {pubkey.slice(0, 16)}…{pubkey.slice(-8)}</span>
            ) : (
              <span className="text-zinc-500">Paste testnet pubkey (used in all contracts)</span>
            )}
          </span>
          <ChevronRight className={`w-3 h-3 text-zinc-600 transition-transform ${showPubkeyInput ? 'rotate-90' : ''}`} />
        </button>
        {showPubkeyInput && (
          <div className="px-3 pb-2 space-y-1">
            <input
              value={pubkey}
              onChange={e => savePubkey(e.target.value.trim())}
              placeholder="02abc123... (33-byte compressed pubkey)"
              className="w-full bg-zinc-800 text-yellow-300 text-[10px] px-2 py-1.5 rounded border border-zinc-700 outline-none focus:border-yellow-600 font-mono placeholder-zinc-600"
              style={{ fontSize: '14px' }}
              spellCheck={false}
            />
            <p className="text-[9px] text-zinc-600">Saved locally · kasAgent will hardcode it into generated contracts</p>
          </div>
        )}
      </div>

      {/* Messages — flex-1 so it fills space, min-h-0 so it can shrink */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} onLoadToEditor={onLoadToEditor} />
        ))}

        {loading && (
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-cyan-800/60 border border-cyan-600/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2">
              <Loader2 className="w-3 h-3 text-cyan-500 animate-spin" />
              <span className="text-zinc-500 text-[11px] animate-pulse">Writing contract...</span>
            </div>
          </div>
        )}

        {showExamples && !loading && (
          <div className="space-y-1.5">
            <button
              onClick={() => setShowExamples(p => !p)}
              className="flex items-center gap-1 text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-wider font-bold"
            >
              <Sparkles className="w-2.5 h-2.5" />
              Try an example
              {showExamples ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
            <div className="grid gap-1">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  className="w-full text-left text-[10px] text-zinc-500 hover:text-cyan-300 px-2 py-1.5 rounded-lg hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/40 transition-all"
                >
                  <span className="text-zinc-700 mr-1.5">›</span>{p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input — always pinned to bottom */}
      <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-800 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Describe your contract..."
            rows={2}
            className="flex-1 bg-zinc-800 text-zinc-100 px-3 py-2 rounded-lg border border-zinc-700 outline-none focus:border-cyan-600 resize-none leading-relaxed placeholder-zinc-600"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-9 h-9 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-30 text-white rounded-lg transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[9px] text-zinc-700 mt-1 px-1">Enter to send · Shift+Enter new line</p>
      </div>
    </div>
  );
}