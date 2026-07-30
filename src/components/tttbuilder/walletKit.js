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
})(typeof window !== 'undefined' ? window : this);
`;

export const WALLET_RULE = `

KASPA WALLET PROTOCOL — ALWAYS AVAILABLE:
- The project already contains ${WALLET_KIT_PATH} (do NOT rewrite it, do NOT delete it). It exposes a global \`TTTWallet\`.
- Static mode: include it BEFORE your own script: <script src="${WALLET_KIT_PATH}"></script>
- React/npm mode: import it once for its side effect in src/main.jsx — \`import '../${WALLET_KIT_PATH}';\` — then use \`window.TTTWallet\`.
- API: TTTWallet.connect() (KasWare extension), TTTWallet.watch(address) (watch-only), TTTWallet.getState(), TTTWallet.onChange(cb), TTTWallet.getBalance(), TTTWallet.getTransactions(), TTTWallet.getPrice(), TTTWallet.send(to, amountKas) -> txId, TTTWallet.receiveQR(amount) -> QR image URL, TTTWallet.receiveURI(), TTTWallet.isValidAddress(a), TTTWallet.explorerUrl(txId).
- Whenever the app involves a wallet, payments, tipping, balances or receiving KAS, build the UI on top of this kit — never invent your own wallet logic and never ask the user for a seed phrase or private key.
- MANDATORY IN EVERY APP, NO EXCEPTIONS (even if the app has nothing to do with crypto): render a wallet widget INSIDE the app's own header/top bar, aligned to the TOP RIGHT, labelled "TTT Kaspa". Disconnected state = a compact "TTT Kaspa · Connect" button; connected state = the same pill showing the truncated address (kaspa:qz...abcd) and the live KAS balance, and clicking it opens an in-app panel/modal with Receive (QR + copy address) and Send. It must be part of the generated app's markup — never a separate page, never omitted, never placed only at the bottom.
- Always ship: a Connect button (with a watch-only address fallback when no extension is present), live balance in KAS + USD, a Receive panel with the QR and copyable address, and a Send form that validates the address/amount and links the returned txId to the explorer. Surface real errors from the kit.`;