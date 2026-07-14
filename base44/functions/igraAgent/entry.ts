import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { ethers } from 'npm:ethers@6.13.4';

// Igra mainnet — EVM L2 on Kaspa (native token iKAS)
// Docs: https://igra-labs.gitbook.io/igralabs-docs
const RPC = "https://rpc.igralabs.com:8545";
const CHAIN_ID = 38833;
const EXPLORER = "https://explorer.igralabs.com";
const INS_API = "https://insdomains.org/api";
// INS registries (.igra + legacy .ins/.ikas) — ERC-721 name NFTs on Igra
const INS_REGISTRIES = {
  "0x7e7018959bf44045f01d176d8db1594894cbf4e9": "igra", // V2 — active registry
  "0x42c2f5aa0c4aacfd07e5fbe65b898212c1c2879c": "igra", // V1 legacy
  "0x535ff4a6710c2b0d087c5aff01b16fe10bc34d46": "ins",
  "0xe705e38def4970e23617d30d9774062feeeba610": "ikas",
};

// New registrations go to the ACTIVE registries (V2 for .igra)
const REGISTRY_BY_TLD = {
  igra: "0x7e7018959bf44045f01d176d8db1594894cbf4e9",
  ins: "0x535ff4a6710c2b0d087c5aff01b16fe10bc34d46",
  ikas: "0xe705e38def4970e23617d30d9774062feeeba610",
};
// Public registry interface — pay once in native iKAS, own forever (ERC-721)
const REGISTRY_ABI = [
  "function available(string label) view returns (bool)",
  "function priceFor(string label) view returns (uint256)",
  "function ownerOfName(string label) view returns (address)",
  "function register(string label, address target) payable returns (uint256)",
];

const isInsName = (v) => typeof v === "string" && /\.(igra|ins|ikas)$/i.test(v.trim());

const parseInsName = (v) => {
  const m = (v || "").trim().toLowerCase().match(/^([a-z0-9-]{1,32})\.(igra|ins|ikas)$/);
  if (!m) throw new Error(`Invalid INS name "${v}" — use letters/numbers/hyphens plus .igra, .ins or .ikas`);
  return { label: m[1], tld: m[2], full: `${m[1]}.${m[2]}` };
};

async function resolveInsName(name) {
  const res = await fetch(`${INS_API}/resolve?name=${encodeURIComponent(name.trim().toLowerCase())}`);
  if (!res.ok) throw new Error(`INS resolver unreachable (${res.status})`);
  const data = await res.json();
  if (!data.exists || !data.address) throw new Error(`INS name "${name}" is not registered`);
  return { address: data.address, name: data.name || name };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, from, to, amount, private_key, extra } = await req.json();
    const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);

    // Auto-forge the two agent wallets on first call
    let wallets = await base44.asServiceRole.entities.IgraAgentWallet.list();
    for (const name of ["alpha", "beta"]) {
      if (!wallets.some((w) => w.name === name)) {
        const w = ethers.Wallet.createRandom();
        await base44.asServiceRole.entities.IgraAgentWallet.create({
          name, address: w.address, private_key: w.privateKey,
        });
      }
    }
    wallets = await base44.asServiceRole.entities.IgraAgentWallet.list();
    const byName = Object.fromEntries(wallets.map((w) => [w.name, w]));

    if (action === "status") {
      const agents = {};
      for (const name of ["alpha", "beta"]) {
        const bal = await provider.getBalance(byName[name].address);
        agents[name] = { address: byName[name].address, balance_ikas: ethers.formatEther(bal) };
      }
      // Include browser-local agent wallets (addresses only — keys never touch the server)
      if (Array.isArray(extra)) {
        for (const e of extra) {
          if (e?.address && ethers.isAddress(e.address)) {
            const bal = await provider.getBalance(e.address);
            agents[e.name || e.address] = { address: e.address, balance_ikas: ethers.formatEther(bal), local: true };
          }
        }
      }
      return Response.json({ chain_id: CHAIN_ID, rpc: RPC, explorer: EXPLORER, agents });
    }

    if (action === "forge") {
      // Generate a fresh wallet and return it WITHOUT storing — the key lives only in the caller's browser
      const w = ethers.Wallet.createRandom();
      return Response.json({ address: w.address, private_key: w.privateKey, chain_id: CHAIN_ID });
    }

    if (action === "resolve_name") {
      const resolved = await resolveInsName(extra?.name || to);
      return Response.json(resolved);
    }

    if (action === "names") {
      // All INS names owned by an address: primary via reverse API + NFT holdings via Blockscout
      const addr = (extra?.address || "").toLowerCase();
      if (!ethers.isAddress(addr)) return Response.json({ error: "Invalid address" }, { status: 400 });
      let primary = null;
      try {
        const rev = await fetch(`${INS_API}/reverse?address=${addr}`).then((r) => r.json());
        primary = rev.primary || null;
      } catch { /* reverse optional */ }
      const names = [];
      try {
        const nft = await fetch(`${EXPLORER}/api/v2/addresses/${addr}/nft?type=ERC-721`).then((r) => r.json());
        for (const item of nft.items || []) {
          const tld = INS_REGISTRIES[(item.token?.address || item.token?.address_hash || "").toLowerCase()];
          if (!tld) continue;
          const label = item.metadata?.name || item.token_id;
          names.push(String(label).endsWith(`.${tld}`) ? String(label) : `${label}.${tld}`);
        }
      } catch { /* explorer optional */ }
      return Response.json({ address: addr, primary, names });
    }

    if (action === "ins_explorer") {
      // Native INS explorer — live registry stats + latest inscriptions per TLD
      const registries = await Promise.all(Object.entries(REGISTRY_BY_TLD).map(async ([tld, addr]) => {
        try {
          const data = await fetch(`${EXPLORER}/api/v2/tokens/${addr}/instances`).then((r) => r.json());
          const items = data.items || [];
          const token = items[0]?.token;
          return {
            tld: `.${tld}`,
            contract: addr,
            total_names: Number(token?.total_supply ?? items.length),
            holders: Number(token?.holders_count ?? 0),
            recent: items.slice(0, 5).map((i) => ({
              name: i.metadata?.name || `#${i.id}`,
              owner: i.owner?.hash || null,
            })),
          };
        } catch {
          return { tld: `.${tld}`, contract: addr, total_names: null, holders: null, recent: [] };
        }
      }));
      return Response.json({ registries, prices_ikas: { "5+ chars": 500, "4 chars": 800, "3 chars": 1200 } });
    }

    if (action === "name_price") {
      const { label, tld, full } = parseInsName(extra?.name || to);
      const registry = new ethers.Contract(REGISTRY_BY_TLD[tld], REGISTRY_ABI, provider);
      const [avail, price, ownerAddr] = await Promise.all([
        registry.available(label), registry.priceFor(label), registry.ownerOfName(label),
      ]);
      return Response.json({
        name: full,
        available: avail,
        price_ikas: price === ethers.MaxUint256 ? null : ethers.formatEther(price),
        owner: ownerAddr === ethers.ZeroAddress ? null : ownerAddr,
      });
    }

    if (action === "register_name") {
      // Native TTT IGRA INS inscription — register straight on the on-chain
      // registry from OUR backend, paying iKAS from an agent wallet.
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Login required to register names" }, { status: 401 });
      const { label, tld, full } = parseInsName(extra?.name);

      let sender;
      let fromLabel;
      if (private_key) {
        const localWallet = new ethers.Wallet(private_key);
        sender = { address: localWallet.address, private_key };
        fromLabel = from || "local";
      } else {
        fromLabel = from === "beta" ? "beta" : "alpha";
        sender = byName[fromLabel];
      }

      const wallet = new ethers.Wallet(sender.private_key, provider);
      const registry = new ethers.Contract(REGISTRY_BY_TLD[tld], REGISTRY_ABI, wallet);
      const [avail, price] = await Promise.all([registry.available(label), registry.priceFor(label)]);
      if (!avail) {
        const ownerAddr = await registry.ownerOfName(label);
        return Response.json({ error: ownerAddr !== ethers.ZeroAddress
          ? `"${full}" is already owned by ${ownerAddr}`
          : `"${full}" is reserved — not publicly mintable` }, { status: 400 });
      }

      // Ownership target: another agent/0x address, or the paying wallet itself
      let target = wallet.address;
      if (extra?.target) {
        target = (extra.target === "alpha" || extra.target === "beta") ? byName[extra.target].address : extra.target;
        if (!ethers.isAddress(target)) return Response.json({ error: "Invalid target address" }, { status: 400 });
      }

      const balance = await provider.getBalance(wallet.address);
      if (balance < price + ethers.parseEther("0.01")) {
        return Response.json({
          error: `"${full}" costs ${ethers.formatEther(price)} iKAS but agent ${fromLabel} holds ${ethers.formatEther(balance)} iKAS — fund ${wallet.address} first.`,
        }, { status: 400 });
      }

      const fee = await provider.getFeeData();
      const tx = await registry.register(label, target, {
        value: price, gasLimit: 300000n,
        gasPrice: fee.gasPrice ?? ethers.parseUnits("2000", "gwei"),
      });
      const receipt = await tx.wait(1, 90000);

      return Response.json({
        name: full,
        owner: wallet.address,
        target,
        from_agent: fromLabel,
        price_ikas: ethers.formatEther(price),
        tx_hash: tx.hash,
        block: receipt ? Number(receipt.blockNumber) : null,
        explorer_url: `${EXPLORER}/tx/${tx.hash}`,
      });
    }

    if (action === "send") {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Login required to authorize agent transactions" }, { status: 401 });

      // Local agent wallets sign with the key passed transiently from the browser (never stored)
      let sender;
      let fromLabel;
      if (private_key) {
        const localWallet = new ethers.Wallet(private_key);
        sender = { address: localWallet.address, private_key };
        fromLabel = from || "local";
      } else {
        fromLabel = from === "beta" ? "beta" : "alpha";
        sender = byName[fromLabel];
      }
      // INS: resolve .igra / .ins / .ikas names to their 0x address
      let destName = null;
      let dest = (to === "alpha" || to === "beta") ? byName[to].address : to;
      if (isInsName(dest)) {
        const resolved = await resolveInsName(dest);
        destName = resolved.name;
        dest = resolved.address;
      }
      if (!ethers.isAddress(dest)) return Response.json({ error: "Invalid destination address" }, { status: 400 });
      if (!amount || Number(amount) <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });

      const amt = ethers.parseEther(String(amount));
      const balance = await provider.getBalance(sender.address);
      if (balance < amt) {
        return Response.json({
          error: `Agent ${fromLabel} has insufficient iKAS. Balance: ${ethers.formatEther(balance)} iKAS — fund ${sender.address} first.`,
        }, { status: 400 });
      }

      const wallet = new ethers.Wallet(sender.private_key, provider);
      const fee = await provider.getFeeData();
      const gasPrice = fee.gasPrice ?? ethers.parseUnits("2000", "gwei");
      const tx = await wallet.sendTransaction({ to: dest, value: amt, gasPrice, gasLimit: 21000n });
      const receipt = await tx.wait(1, 90000);

      return Response.json({
        tx_hash: tx.hash,
        block: receipt ? Number(receipt.blockNumber) : null,
        from_agent: fromLabel,
        from: sender.address,
        to: dest,
        to_name: destName,
        amount_ikas: String(amount),
        explorer_url: `${EXPLORER}/tx/${tx.hash}`,
      });
    }

    return Response.json({ error: "Unknown action — use status, send, resolve_name, names, name_price or register_name" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});