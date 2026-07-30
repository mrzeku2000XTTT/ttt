// Drop-in Kaspa wallet protocol for every app TTT Builder generates.
// Pure client-side: no server, no seed phrases stored, works in the static
// preview iframe AND in the live npm sandbox.

export const WALLET_KIT_PATH = "scripts/kaspa-wallet.js";

export const WALLET_KIT_SOURCE = `/* TTT Kaspa Wallet Kit — connect, balance, receive, send.
   Usage:
     await TTTWallet.connect();                  // KasWare extension
     TTTWallet.watch('kaspa:qr...');             // watch-only address
     await TTTWallet.getBalance();               // KAS number
     await TTTWallet.send('kaspa:qr...', 12.5);  // returns txId
     TTTWallet.receiveQR();                      // QR image URL for current address
     TTTWallet.onChange(cb);                     // fires on connect/watch/disconnect
*/
(function (global) {
  var API = 'https://api.kaspa.org';
  var state = { address: null, mode: null }; // mode: 'kasware' | 'watch'
  var listeners = [];

  function emit() { listeners.forEach(function (fn) { try { fn(getState()); } catch (e) {} }); }
  function getState() { return { address: state.address, mode: state.mode, connected: !!state.address }; }
  function normalize(a) {
    if (!a) return null;
    var s = String(a).trim();
    return s.indexOf('kaspa:') === 0 ? s : 'kaspa:' + s;
  }
  function isValid(a) { return /^kaspa:[a-z0-9]{60,70}$/.test(normalize(a) || ''); }

  var TTTWallet = {
    hasExtension: function () { return typeof global.kasware !== 'undefined'; },

    connect: async function () {
      if (!TTTWallet.hasExtension()) {
        throw new Error('KasWare wallet not found. Install the KasWare extension, or use watch-only mode.');
      }
      var accounts = await global.kasware.requestAccounts();
      if (!accounts || !accounts.length) throw new Error('No account returned by the wallet.');
      state.address = normalize(accounts[0]);
      state.mode = 'kasware';
      if (global.kasware.on) {
        global.kasware.on('accountsChanged', function (accs) {
          state.address = accs && accs.length ? normalize(accs[0]) : null;
          if (!state.address) state.mode = null;
          emit();
        });
      }
      emit();
      return state.address;
    },

    watch: function (address) {
      if (!isValid(address)) throw new Error('That is not a valid Kaspa address.');
      state.address = normalize(address);
      state.mode = 'watch';
      emit();
      return state.address;
    },

    disconnect: function () { state.address = null; state.mode = null; emit(); },

    getState: getState,
    onChange: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },

    getBalance: async function (address) {
      var addr = normalize(address || state.address);
      if (!addr) throw new Error('No wallet connected.');
      var res = await fetch(API + '/addresses/' + encodeURIComponent(addr) + '/balance');
      if (!res.ok) throw new Error('Balance lookup failed (' + res.status + ')');
      var data = await res.json();
      return Number(data.balance || 0) / 1e8;
    },

    getTransactions: async function (address, limit) {
      var addr = normalize(address || state.address);
      if (!addr) throw new Error('No wallet connected.');
      var res = await fetch(API + '/addresses/' + encodeURIComponent(addr) + '/full-transactions?limit=' + (limit || 10) + '&resolve_previous_outpoints=no');
      if (!res.ok) throw new Error('Transaction lookup failed (' + res.status + ')');
      return await res.json();
    },

    getPrice: async function () {
      var res = await fetch(API + '/info/price');
      if (!res.ok) throw new Error('Price lookup failed');
      var data = await res.json();
      return Number(data.price || 0);
    },

    send: async function (toAddress, amountKas) {
      if (state.mode !== 'kasware') throw new Error('Connect a KasWare wallet to send KAS. Watch-only wallets cannot sign.');
      if (!isValid(toAddress)) throw new Error('Invalid recipient address.');
      var amt = Number(amountKas);
      if (!(amt > 0)) throw new Error('Enter an amount greater than 0.');
      return await global.kasware.sendKaspa(normalize(toAddress), Math.round(amt * 1e8));
    },

    receiveURI: function (amountKas) {
      if (!state.address) throw new Error('No wallet connected.');
      return state.address + (amountKas ? '?amount=' + amountKas : '');
    },

    receiveQR: function (amountKas, size) {
      var uri = TTTWallet.receiveURI(amountKas);
      return 'https://api.qrserver.com/v1/create-qr-code/?size=' + (size || 240) + 'x' + (size || 240) + '&data=' + encodeURIComponent(uri);
    },

    isValidAddress: isValid,
    normalizeAddress: normalize,
    explorerUrl: function (txId) { return 'https://explorer.kaspa.org/txs/' + txId; },
  };

  global.TTTWallet = TTTWallet;
  if (typeof module !== 'undefined' && module.exports) module.exports = TTTWallet;

  /* ---- Built-in "TTT Kaspa" header pill (top right of every app) ---- */
  function short(a) { return a ? a.slice(0, 10) + '…' + a.slice(-4) : ''; }

  function mount() {
    if (!global.document || document.getElementById('ttt-kaspa-widget')) return;
    // The app built its own TTT Kaspa widget — don't double up with the fallback overlay.
    if (document.querySelector('[data-ttt-wallet]')) return;
    var host = document.createElement('div');
    host.id = 'ttt-kaspa-widget';
    host.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483000;font-family:system-ui,sans-serif;';
    host.innerHTML =
      '<button id="ttt-kaspa-pill" style="display:flex;align-items:center;gap:8px;background:rgba(112,199,186,.15);border:1px solid rgba(112,199,186,.45);color:#70C7BA;font-size:12px;font-weight:700;padding:7px 12px;border-radius:999px;cursor:pointer;backdrop-filter:blur(8px)">' +
      '<span style="width:7px;height:7px;border-radius:999px;background:#70C7BA;display:inline-block"></span><span id="ttt-kaspa-label">TTT Kaspa · Connect</span></button>' +
      '<div id="ttt-kaspa-panel" style="display:none;margin-top:8px;width:270px;background:#0d1117;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;color:#fff;font-size:12px;box-shadow:0 20px 50px rgba(0,0,0,.6)"></div>';
    document.body.appendChild(host);

    var pill = host.querySelector('#ttt-kaspa-pill');
    var label = host.querySelector('#ttt-kaspa-label');
    var panel = host.querySelector('#ttt-kaspa-panel');

    function render() {
      var s = getState();
      if (!s.connected) {
        panel.innerHTML =
          '<div style="font-weight:800;margin-bottom:10px">Connect TTT Kaspa</div>' +
          '<button id="ttt-kw" style="width:100%;padding:9px;border-radius:10px;border:0;background:#70C7BA;color:#000;font-weight:800;cursor:pointer">Connect KasWare</button>' +
          '<div style="margin:10px 0 6px;opacity:.5">or watch an address</div>' +
          '<input id="ttt-watch" placeholder="kaspa:qz..." style="width:100%;box-sizing:border-box;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#fff" />' +
          '<button id="ttt-watch-go" style="width:100%;margin-top:8px;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:transparent;color:#fff;cursor:pointer">Watch</button>' +
          '<div id="ttt-err" style="color:#f87171;margin-top:8px"></div>';
        panel.querySelector('#ttt-kw').onclick = function () {
          TTTWallet.connect().catch(function (e) { panel.querySelector('#ttt-err').textContent = e.message; });
        };
        panel.querySelector('#ttt-watch-go').onclick = function () {
          try { TTTWallet.watch(panel.querySelector('#ttt-watch').value); }
          catch (e) { panel.querySelector('#ttt-err').textContent = e.message; }
        };
      } else {
        panel.innerHTML =
          '<div style="font-weight:800;margin-bottom:6px">TTT Kaspa</div>' +
          '<div style="word-break:break-all;opacity:.7;margin-bottom:10px">' + s.address + '</div>' +
          '<img src="' + TTTWallet.receiveQR(null, 180) + '" alt="QR" style="width:100%;border-radius:10px;background:#fff;padding:6px;box-sizing:border-box" />' +
          '<button id="ttt-copy" style="width:100%;margin-top:8px;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:transparent;color:#fff;cursor:pointer">Copy address</button>' +
          '<input id="ttt-to" placeholder="Send to kaspa:qz..." style="width:100%;box-sizing:border-box;margin-top:10px;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#fff" />' +
          '<input id="ttt-amt" placeholder="Amount KAS" style="width:100%;box-sizing:border-box;margin-top:6px;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#fff" />' +
          '<button id="ttt-send" style="width:100%;margin-top:8px;padding:9px;border-radius:10px;border:0;background:#70C7BA;color:#000;font-weight:800;cursor:pointer">Send KAS</button>' +
          '<button id="ttt-dc" style="width:100%;margin-top:6px;padding:7px;border-radius:10px;border:0;background:transparent;color:#f87171;cursor:pointer">Disconnect</button>' +
          '<div id="ttt-err" style="margin-top:8px;color:#f87171;word-break:break-all"></div>';
        panel.querySelector('#ttt-copy').onclick = function () { navigator.clipboard.writeText(s.address); };
        panel.querySelector('#ttt-dc').onclick = function () { TTTWallet.disconnect(); };
        panel.querySelector('#ttt-send').onclick = function () {
          var err = panel.querySelector('#ttt-err'); err.textContent = '';
          TTTWallet.send(panel.querySelector('#ttt-to').value, panel.querySelector('#ttt-amt').value)
            .then(function (tx) { err.style.color = '#70C7BA'; err.innerHTML = 'Sent: <a style="color:#70C7BA" target="_blank" href="' + TTTWallet.explorerUrl(tx) + '">' + tx + '</a>'; })
            .catch(function (e) { err.style.color = '#f87171'; err.textContent = e.message; });
        };
      }
    }

    function refreshPill() {
      var s = getState();
      if (!s.connected) { label.textContent = 'TTT Kaspa · Connect'; return; }
      label.textContent = 'TTT Kaspa · ' + short(s.address);
      TTTWallet.getBalance().then(function (b) {
        label.textContent = 'TTT Kaspa · ' + short(s.address) + ' · ' + b.toFixed(2) + ' KAS';
      }).catch(function () {});
    }

    pill.onclick = function () {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      if (panel.style.display === 'block') render();
    };
    TTTWallet.onChange(function () { refreshPill(); if (panel.style.display === 'block') render(); });
    refreshPill();
  }

  if (global.document) {
    // Wait for the app (incl. React) to render its own widget first.
    var boot = function () { setTimeout(mount, 2000); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof window !== 'undefined' ? window : this);
`;

// Guarantees the wallet kit exists AND is loaded by the app, whatever the agent wrote.
export function ensureWalletKit(files) {
  const isNpm = files.some(f => f.path === "package.json");
  let out = files.filter(f => f.path !== WALLET_KIT_PATH && f.path !== "public/kaspa-wallet.js");
  out.push({ path: isNpm ? "public/kaspa-wallet.js" : WALLET_KIT_PATH, content: WALLET_KIT_SOURCE });

  const tag = isNpm
    ? '<script src="/kaspa-wallet.js"></script>'
    : `<script src="${WALLET_KIT_PATH}"></script>`;

  return out.map(f => {
    if (f.path !== "index.html") return f;
    if (f.content.includes("kaspa-wallet.js")) return f;
    const content = f.content.includes("</body>")
      ? f.content.replace("</body>", `  ${tag}\n</body>`)
      : f.content + `\n${tag}`;
    return { ...f, content };
  });
}

export const WALLET_RULE = `

KASPA WALLET PROTOCOL — ALWAYS AVAILABLE:
- The wallet kit is injected automatically and loaded via a script tag in index.html. NEVER import it from JS/JSX, never add it to package.json, never rewrite or delete it. Just use the global \`window.TTTWallet\` at runtime.
- REACT/VITE PROJECTS: the file lives at public/kaspa-wallet.js and index.html loads it with <script src="/kaspa-wallet.js"></script>. Do NOT import it, do NOT put it in src/. Read it inside a useEffect via \`window.TTTWallet\` (it is guaranteed to exist by the time components mount) and subscribe with \`TTTWallet.onChange(cb)\` to drive React state.
- YOUR widget is the visible one. Put \`data-ttt-wallet\` on the root element of the wallet widget you build — that disables the kit's fallback overlay. If you forget it, a floating pill appears on top of your UI, which is a bug.
- API: TTTWallet.connect() (KasWare extension), TTTWallet.watch(address) (watch-only), TTTWallet.getState(), TTTWallet.onChange(cb), TTTWallet.getBalance(), TTTWallet.getTransactions(), TTTWallet.getPrice(), TTTWallet.send(to, amountKas) -> txId, TTTWallet.receiveQR(amount) -> QR image URL, TTTWallet.receiveURI(), TTTWallet.isValidAddress(a), TTTWallet.explorerUrl(txId).
- Whenever the app involves a wallet, payments, tipping, balances or receiving KAS, build the UI on top of this kit — never invent your own wallet logic and never ask the user for a seed phrase or private key.
- MANDATORY IN EVERY APP, NO EXCEPTIONS (even if the app has nothing to do with crypto): render a wallet widget INSIDE the app's own header/top bar, aligned to the TOP RIGHT, labelled "TTT Kaspa". Disconnected state = a compact "TTT Kaspa · Connect" button; connected state = the same pill showing the truncated address (kaspa:qz...abcd) and the live KAS balance, and clicking it opens an in-app panel/modal with Receive (QR + copy address) and Send. It must be part of the generated app's markup — never a separate page, never omitted, never placed only at the bottom.
- Always ship: a Connect button (with a watch-only address fallback when no extension is present), live balance in KAS + USD, a Receive panel with the QR and copyable address, and a Send form that validates the address/amount and links the returned txId to the explorer. Surface real errors from the kit.`;