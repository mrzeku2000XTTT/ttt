import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { ethers } from 'npm:ethers@6.13.4';

// Igra mainnet — EVM L2 on Kaspa (native token iKAS)
// Docs: https://igra-labs.gitbook.io/igralabs-docs
const RPC = "https://rpc.igralabs.com:8545";
const CHAIN_ID = 38833;
const EXPLORER = "https://explorer.igralabs.com";

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
      const dest = (to === "alpha" || to === "beta") ? byName[to].address : to;
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
        amount_ikas: String(amount),
        explorer_url: `${EXPLORER}/tx/${tx.hash}`,
      });
    }

    return Response.json({ error: "Unknown action — use status or send" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});