import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { ethers } from 'npm:ethers@6.13.4';

// IGRA BRIDGE DESK — instant 1:1 KAS ↔ iKAS swaps operated by the Igra Agent.
// KAS → iKAS: user sends KAS to the desk's Kaspa L1 address, we verify on-chain
//             and instantly pay out iKAS from agent alpha's pool on Igra L2.
// iKAS → KAS: user (or a local agent) sends iKAS to alpha, we verify on Igra RPC
//             and instantly pay out KAS from the desk's Kaspa L1 wallet.
const RPC = "https://rpc.igralabs.com:8545";
const CHAIN_ID = 38833;
const EXPLORER = "https://explorer.igralabs.com";
const KASPA_API = "https://api.kaspa.org";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, l1_tx_id, l2_tx_hash, kaspa_address, evm_address, from_pool, amount: reqAmount } = await req.json();
    const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);

    const wallets = await base44.asServiceRole.entities.IgraAgentWallet.list();
    const alpha = wallets.find((w) => w.name === "alpha");
    if (!alpha) return Response.json({ error: "Agent alpha not initialized — open the Igra Agent page first" }, { status: 400 });

    // Auto-forge the desk's Kaspa L1 wallet on first call
    let kasBridge = wallets.find((w) => w.name === "kasbridge");
    if (!kasBridge) {
      // Delegate to the proven createKaspaWallet function — the previous inline
      // derivation produced an invalid Kaspa address
      const forged = await base44.functions.invoke("createKaspaWallet", { action: "generate" });
      const w = forged.data;
      const check = await fetch(`${KASPA_API}/addresses/${w.address}/balance`).then((r) => r.json()).catch(() => ({ detail: "unreachable" }));
      if (check.detail) return Response.json({ error: `Forged bridge address failed validation: ${check.detail}` }, { status: 500 });
      kasBridge = await base44.asServiceRole.entities.IgraAgentWallet.create({
        name: "kasbridge", address: w.address, private_key: w.privateKey || w.private_key,
      });
    }

    if (action === "info") {
      const [balRes, alphaBal] = await Promise.all([
        fetch(`${KASPA_API}/addresses/${kasBridge.address}/balance`).then((r) => r.json()).catch(() => ({ balance: 0 })),
        provider.getBalance(alpha.address),
      ]);
      return Response.json({
        rate: "1 KAS = 1 iKAS",
        kas_deposit_address: kasBridge.address,
        ikas_deposit_address: alpha.address,
        kas_liquidity: Number(balRes.balance || 0) / 1e8,
        ikas_liquidity: ethers.formatEther(alphaBal),
      });
    }

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Login required for bridge swaps" }, { status: 401 });

    if (action === "kas_to_ikas") {
      if (!l1_tx_id) return Response.json({ error: "Missing Kaspa L1 transaction id" }, { status: 400 });
      if (!ethers.isAddress(evm_address || "")) return Response.json({ error: "Invalid 0x destination address" }, { status: 400 });

      const used = await base44.asServiceRole.entities.IgraBridgeSwap.filter({ tx_in: l1_tx_id });
      if (used.length > 0) return Response.json({ error: "This deposit was already claimed" }, { status: 400 });

      const txRes = await fetch(`${KASPA_API}/transactions/${l1_tx_id}?inputs=false&outputs=true`);
      if (!txRes.ok) return Response.json({ error: "Kaspa transaction not found — wait a few seconds and retry" }, { status: 400 });
      const tx = await txRes.json();
      if (tx.is_accepted === false) return Response.json({ error: "Deposit not accepted on Kaspa yet — retry shortly" }, { status: 400 });
      const paidSompi = (tx.outputs || [])
        .filter((o: any) => o.script_public_key_address === kasBridge.address)
        .reduce((s: number, o: any) => s + Number(o.amount), 0);
      if (paidSompi <= 0) return Response.json({ error: `This transaction sends no KAS to the bridge address ${kasBridge.address}` }, { status: 400 });
      const amount = paidSompi / 1e8;

      const amt = ethers.parseEther(String(amount));
      const poolBal = await provider.getBalance(alpha.address);
      if (poolBal < amt) return Response.json({ error: `Insufficient iKAS liquidity in the desk (${ethers.formatEther(poolBal)} iKAS available)` }, { status: 400 });

      const wallet = new ethers.Wallet(alpha.private_key, provider);
      const fee = await provider.getFeeData();
      const out = await wallet.sendTransaction({
        to: evm_address, value: amt,
        gasPrice: fee.gasPrice ?? ethers.parseUnits("2000", "gwei"), gasLimit: 21000n,
      });
      await out.wait(1, 90000);

      await base44.asServiceRole.entities.IgraBridgeSwap.create({
        direction: "kas_to_ikas", tx_in: l1_tx_id, tx_out: out.hash,
        amount, recipient: evm_address, status: "completed",
      });
      return Response.json({
        direction: "kas_to_ikas", amount, recipient: evm_address,
        tx_out: out.hash, explorer_url: `${EXPLORER}/tx/${out.hash}`,
      });
    }

    if (action === "ikas_to_kas") {
      const dest = (kaspa_address || "").startsWith("kaspa:") ? kaspa_address : `kaspa:${kaspa_address || ""}`;
      if (!/^kaspa:[a-z0-9]{61,63}$/.test(dest)) return Response.json({ error: "Invalid kaspa: destination address" }, { status: 400 });

      let amount;
      let txIn;
      if (from_pool) {
        // Swap directly from agent alpha's iKAS pool — no deposit leg needed
        amount = Number(reqAmount);
        if (!amount || amount <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });
        const poolBal = await provider.getBalance(alpha.address);
        if (poolBal < ethers.parseEther(String(amount))) {
          return Response.json({ error: `Agent alpha only holds ${ethers.formatEther(poolBal)} iKAS` }, { status: 400 });
        }
        txIn = `pool-${crypto.randomUUID()}`;
      } else {
        if (!l2_tx_hash) return Response.json({ error: "Missing Igra L2 transaction hash" }, { status: 400 });
        const used = await base44.asServiceRole.entities.IgraBridgeSwap.filter({ tx_in: l2_tx_hash });
        if (used.length > 0) return Response.json({ error: "This deposit was already claimed" }, { status: 400 });

        const tx = await provider.getTransaction(l2_tx_hash);
        if (!tx || tx.blockNumber == null) return Response.json({ error: "Igra deposit not confirmed yet — retry shortly" }, { status: 400 });
        if ((tx.to || "").toLowerCase() !== alpha.address.toLowerCase()) {
          return Response.json({ error: `Deposit must be sent to the bridge pool ${alpha.address}` }, { status: 400 });
        }
        amount = Number(ethers.formatEther(tx.value));
        if (amount <= 0) return Response.json({ error: "Deposit has zero value" }, { status: 400 });
        txIn = l2_tx_hash;
      }

      let payout;
      try {
        const res = await base44.functions.invoke("sendKaspaTransaction", {
          privateKey: kasBridge.private_key, fromAddress: kasBridge.address,
          toAddress: dest, amountKas: amount,
        });
        payout = res.data;
      } catch (err) {
        const msg = err?.response?.data?.error || err.message;
        return Response.json({ error: `KAS payout failed: ${msg}. The desk may need KAS liquidity at ${kasBridge.address}` }, { status: 400 });
      }

      await base44.asServiceRole.entities.IgraBridgeSwap.create({
        direction: "ikas_to_kas", tx_in: txIn, tx_out: String(payout.txId),
        amount, recipient: dest, status: "completed",
      });
      return Response.json({
        direction: "ikas_to_kas", amount, recipient: dest,
        tx_out: payout.txId, kaspa_explorer_url: `https://explorer.kaspa.org/txs/${payout.txId}`,
      });
    }

    return Response.json({ error: "Unknown action — use info, kas_to_ikas or ikas_to_kas" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});