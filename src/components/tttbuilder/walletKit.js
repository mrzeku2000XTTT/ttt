// Drop-in Kaspa wallet protocol for every app TTT Builder generates.
// Native (Terra-style) wallet: no browser extension, real keys in the browser.

import { NATIVE_WALLET_SOURCE } from "./walletKitNative";

export const WALLET_KIT_PATH = "scripts/kaspa-wallet.js";
export const WALLET_KIT_SOURCE = NATIVE_WALLET_SOURCE;

// Guarantees the wallet kit exists AND is loaded by the app.
// If the project already carries a kit file (possibly customized by the builder
// or an agent), that version is KEPT — we never overwrite edits.
export function ensureWalletKit(files) {
  const isNpm = files.some(f => f.path === "package.json");
  const existing = files.find(f => (f.path === WALLET_KIT_PATH || f.path === "public/kaspa-wallet.js") && f.content && f.content.length > 200);
  // Keep the project's kit only if it's the current generation or newer — outdated
  // stock kits (no version tag / older tag) are upgraded to the latest source.
  const ver = (s) => Number((String(s).match(/KIT v(\d+)/) || [])[1] || 0);
  const keepExisting = existing && ver(existing.content) >= ver(WALLET_KIT_SOURCE);
  let out = files.filter(f => f.path !== WALLET_KIT_PATH && f.path !== "public/kaspa-wallet.js");
  out.push({ path: isNpm ? "public/kaspa-wallet.js" : WALLET_KIT_PATH, content: keepExisting ? existing.content : WALLET_KIT_SOURCE });

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
- The wallet kit is injected automatically and loaded via a script tag in index.html. NEVER import it from JS/JSX and never add it to package.json. Normally just use the global \`window.TTTWallet\` at runtime.
- The kit file (scripts/kaspa-wallet.js or public/kaspa-wallet.js) IS EDITABLE: if the user explicitly asks to change wallet behavior (balance handling, fees, UI of the fallback pill, extra methods), edit that file directly and return its FULL updated content — your version is kept. Do not touch it otherwise.
- LIVE BALANCE: the kit polls the balance every 10s and refreshes in a burst right after send(). \`TTTWallet.onChange(cb)\` fires with \`{address, mode, connected, balance}\` whenever the balance changes — drive your widget's balance display from \`state.balance\` in that callback instead of manual getBalance() polling, so sends/receives update the UI automatically. \`TTTWallet.refreshBalance()\` forces an immediate refresh.
- It is a NATIVE Kaspa wallet (like TTT Terra): the user creates or imports a real seed phrase in the browser, and the kit derives the address, reads balances and signs + submits real mainnet transactions. There is NO browser extension, NO KasWare. Never mention KasWare, MetaMask or "install an extension" anywhere in the UI.
- REACT/VITE PROJECTS: the file lives at public/kaspa-wallet.js and index.html loads it with <script src="/kaspa-wallet.js"></script>. Do NOT import it, do NOT put it in src/. Read it inside a useEffect via \`window.TTTWallet\` and subscribe with \`TTTWallet.onChange(cb)\` to drive React state.
- YOUR widget is the visible one. Put \`data-ttt-wallet\` on the root element of the wallet widget you build — that disables the kit's fallback overlay. If you forget it, a floating pill appears on top of your UI, which is a bug.
- API: TTTWallet.connect() (loads the saved wallet or creates one), TTTWallet.createWallet() -> {address, mnemonic}, TTTWallet.importWallet(mnemonic), TTTWallet.exportMnemonic(), TTTWallet.watch(address), TTTWallet.disconnect(), TTTWallet.forget(), TTTWallet.getState(), TTTWallet.onChange(cb), TTTWallet.getBalance(), TTTWallet.getTransactions(), TTTWallet.getPrice(), TTTWallet.send(to, amountKas) -> txId, TTTWallet.receiveQR(amount) -> QR image URL, TTTWallet.receiveURI(), TTTWallet.isValidAddress(a), TTTWallet.explorerUrl(txId). All async calls can throw — show the real message.
- When a new wallet is created you MUST show the seed phrase once with a "save this, it cannot be recovered" warning, and offer an import field for an existing phrase. Never ask for a private key.
- MANDATORY IN EVERY APP, NO EXCEPTIONS (even if the app has nothing to do with crypto): render a wallet widget INSIDE the app's own header/top bar, aligned to the TOP RIGHT, labelled "TTT Kaspa". Disconnected state = a compact "TTT Kaspa · Connect" button; connected state = the same pill showing the truncated address (kaspa:qz...abcd) and the live KAS balance, and clicking it opens an in-app panel/modal with Receive (QR + copy address) and Send. It must be part of the generated app's markup — never a separate page, never omitted, never placed only at the bottom.

WALLET POSITIONING — NEVER OVERLAP CONTENT (violating this is a failed build):
- The wallet pill (the "TTT Kaspa · Connect" / address button) MUST live in normal document flow INSIDE the app's header bar. Use flexbox or grid to place it in the header row. NEVER use position:absolute or position:fixed on the pill itself — that pulls it out of flow and causes overlaps.
- The wallet PANEL (the Receive/Send/Export card that opens when you click the pill) must use ONE of these two patterns, never a third:
  (A) DROPDOWN anchored to the pill: the header is position:relative; the panel is position:absolute; top:100%; right:0; so it drops down directly below the pill, sized to a fixed width (~320px), with a max-height and overflow-y:auto. Add a click-outside listener (or a full-screen transparent backdrop div with position:fixed; inset:0; z-index just below the panel) to close it.
  (B) CENTERED MODAL: a position:fixed; inset:0; backdrop with rgba(0,0,0,0.5) that dims the whole page, and the panel centered with transform. Clicking the backdrop closes it.
- NEVER render the wallet panel as a bare position:fixed/absolute card floating over the page content with NO backdrop and NO close trigger — that overlaps the app beneath it, blocks interaction, and is the exact bug you must avoid. The panel must always have either a backdrop (modal) or a click-outside handler (dropdown).
- The panel must have a visible close control: an X button in its header AND either backdrop-click or click-outside closing. It must never be stuck open over the content.
- On mobile (viewport < 640px) prefer the centered MODAL pattern so the panel never overflows the narrow screen.
- Always ship: create/import wallet, live balance in KAS + USD, a Receive panel with the QR and copyable address, a Send form that validates the address/amount and links the returned txId to the explorer, AND an Export panel with two buttons: "Export seed phrase" (calls TTTWallet.exportMnemonic()) and "Export private key" (calls TTTWallet.exportPrivateKey()). Both must show the value in a secure alert/modal with a "keep this secret, never share it" warning. Watch-only wallets show "not available" for export.
- LOCAL ONLY: always display a visible note near the wallet: "Keys generated locally in this browser. Never sent to any server." The seed phrase and private key NEVER leave the browser — no fetch(), no API call, no telemetry. Only the signed transaction broadcast goes to api.kaspa.org.

TEXT OUTPUT RULE: write real characters in file content — never emit literal escape sequences like \\u2014, \\u00b7 or \\u21bb inside strings/JSX. Use plain ASCII punctuation (a hyphen "-" instead of an em dash) so nothing renders as gibberish.`;