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

// Desk sustainability fee: 0.5% spread retained by the pools on every swap
// that uses desk liquidity. This is what keeps refilling the KAS L1 wallet
// and alpha's iKAS pool over time.
const DESK_FEE = 0.005;

// ALL desk fees are credited to this wallet — the desk KAS funding wallet.
const DESK_FEE_ADDRESS = "kaspa:qpng00dhlu9mf8n7wdzqc2s5z8mrw5kqd3xql5kyw697flh92m9fwxrw058je";

// Igra's NATIVE exit bridge (KasExitBridge proxy on Igra mainnet).
// requestExit burns iKAS on L2; the Igra multi-sig committee releases KAS on
// Kaspa L1 out-of-band — no desk-side KAS liquidity required.
const EXIT_BRIDGE = "0x4bb88C213d3eD9dc4bae694f1bc1bF745903b2d0";
const EXIT_ABI = [
  "function getConfig() view returns (bytes32 kaspaBridgeEndpoint, address feePolicy, address feeClaimer, uint32 throttleWindowBlocks, uint32 throttleMaxExitsPerWindow, uint64 throttleMaxUnlockAmountPerWindowSompi, uint64 minExitSompi, uint64 maxExitSompi)",
  "function quoteFee(address originBurner, uint64 unlockAmountSompi) view returns (uint64 feeAmountSompi)",
  "function requestExit(string kasPayoutAddress, uint64 unlockAmountSompi) payable returns (uint32 requestId, bytes32 messageId)",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, l1_tx_id, l2_tx_hash, kaspa_address, evm_address, from_pool, amount: reqAmount } = await req.json();
    const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);

    // The desk pool wallets are the GLOBAL ones (no owner_email) — per-user
    // alpha/beta agent wallets are separate and never used as bridge liquidity
    const wallets = await base44.asServiceRole.entities.IgraAgentWallet.filter({ owner_email: null });
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
    // Guarantee fee routing: all desk fees must land in the official funding wallet
    if (kasBridge.address !== DESK_FEE_ADDRESS) {
      return Response.json({ error: `Desk misconfigured — the KAS funding wallet on record (${kasBridge.address}) does not match the official desk fee wallet ${DESK_FEE_ADDRESS}` }, { status: 500 });
    }

    if (action === "info") {
      const exitBridge = new ethers.Contract(EXIT_BRIDGE, EXIT_ABI, provider);
      const [balRes, alphaBal, exitCfg] = await Promise.all([
        fetch(`${KASPA_API}/addresses/${kasBridge.address}/balance`).then((r) => r.json()).catch(() => ({ balance: 0 })),
        provider.getBalance(alpha.address),
        exitBridge.getConfig().catch(() => null),
      ]);
      return Response.json({
        rate: "1 KAS = 1 iKAS",
        kas_deposit_address: kasBridge.address,
        ikas_deposit_address: alpha.address,
        kas_liquidity: Number(balRes.balance || 0) / 1e8,
        ikas_liquidity: ethers.formatEther(alphaBal),
        native_exit_contract: EXIT_BRIDGE,
        exit_min_kas: exitCfg ? Number(exitCfg.minExitSompi) / 1e8 : null,
        desk_fee_pct: DESK_FEE * 100,
      });
    }

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Login required for bridge swaps" }, { status: 401 });

    if (action === "admin_send_kas") {
      // Secure manual KAS send from the desk funding wallet — admin only,
      // key never leaves the server
      if (user.role !== "admin") return Response.json({ error: "Admin only — the desk wallet can only be operated by an app admin" }, { status: 403 });
      const dest = (kaspa_address || "").startsWith("kaspa:") ? kaspa_address : `kaspa:${kaspa_address || ""}`;
      if (!/^kaspa:[a-z0-9]{61,63}$/.test(dest)) return Response.json({ error: "Invalid kaspa: destination address" }, { status: 400 });
      const amount = Number(reqAmount);
      if (!amount || amount <= 0) return Response.json({ error: "Invalid amount" }, { status: 400 });
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        privateKey: kasBridge.private_key, fromAddress: kasBridge.address,
        toAddress: dest, amountKas: amount,
      });
      return Response.json({
        tx_id: res.data.txId, amount, recipient: dest,
        explorer_url: `https://explorer.kaspa.org/txs/${res.data.txId}`,
      });
    }

    if (action === "admin_refund_ikas") {
      // Refund a stuck/failed iKAS deposit from the desk pool — admin only
      if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
      if (!ethers.isAddress(evm_address || "")) return Response.json({ error: "Invalid 0x refund address" }, { status: 400 });
      if (!l2_tx_hash) return Response.json({ error: "Missing the original deposit tx hash" }, { status: 400 });
      const used = await base44.asServiceRole.entities.IgraBridgeSwap.filter({ tx_in: l2_tx_hash });
      if (used.length > 0) return Response.json({ error: "This deposit was already settled/refunded" }, { status: 400 });
      const dep = await provider.getTransaction(l2_tx_hash);
      if (!dep || dep.blockNumber == null) return Response.json({ error: "Deposit tx not found on Igra" }, { status: 400 });
      if ((dep.to || "").toLowerCase() !== alpha.address.toLowerCase()) {
        return Response.json({ error: "That tx is not a deposit to the desk pool" }, { status: 400 });
      }
      const refundAmt = dep.value; // full deposit back, wei
      const poolBal = await provider.getBalance(alpha.address);
      if (poolBal < refundAmt) return Response.json({ error: `Pool holds only ${ethers.formatEther(poolBal)} iKAS` }, { status: 400 });
      const wallet = new ethers.Wallet(alpha.private_key, provider);
      const fee = await provider.getFeeData();
      const out = await wallet.sendTransaction({
        to: evm_address, value: refundAmt,
        gasPrice: fee.gasPrice ?? ethers.parseUnits("2000", "gwei"), gasLimit: 21000n,
      });
      await out.wait(1, 90000);
      await base44.asServiceRole.entities.IgraBridgeSwap.create({
        direction: "ikas_to_kas", tx_in: l2_tx_hash, tx_out: out.hash,
        amount: Number(ethers.formatEther(refundAmt)), recipient: evm_address,
        status: "failed", desk_fee: 0, fee_address: DESK_FEE_ADDRESS,
      });
      return Response.json({
        refunded: true, amount: Number(ethers.formatEther(refundAmt)), recipient: evm_address,
        tx_out: out.hash, explorer_url: `${EXPLORER}/tx/${out.hash}`,
      });
    }

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
      // Retain the desk fee in alpha's pool — payout is amount minus 0.5%
      const payoutIkas = Math.floor(amount * (1 - DESK_FEE) * 1e8) / 1e8;

      const amt = ethers.parseEther(String(payoutIkas));
      const poolBal = await provider.getBalance(alpha.address);
      if (poolBal < amt) return Response.json({ error: `Insufficient iKAS liquidity in the desk (${ethers.formatEther(poolBal)} iKAS available)` }, { status: 400 });

      const wallet = new ethers.Wallet(alpha.private_key, provider);
      const fee = await provider.getFeeData();
      const out = await wallet.sendTransaction({
        to: evm_address, value: amt,
        gasPrice: fee.gasPrice ?? ethers.parseUnits("2000", "gwei"), gasLimit: 21000n,
      });
      await out.wait(1, 90000);

      // Fee is physically collected: the FULL KAS deposit (incl. the 0.5% fee)
      // already sits in the desk funding wallet — only 99.5% leaves as iKAS.
      await base44.asServiceRole.entities.IgraBridgeSwap.create({
        direction: "kas_to_ikas", tx_in: l1_tx_id, tx_out: out.hash,
        amount: payoutIkas, recipient: evm_address, status: "completed",
        desk_fee: amount - payoutIkas, fee_address: DESK_FEE_ADDRESS,
      });
      return Response.json({
        direction: "kas_to_ikas", amount: payoutIkas, desk_fee_kas: amount - payoutIkas,
        fee_paid_to: DESK_FEE_ADDRESS,
        recipient: evm_address,
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

      // NATIVE Igra exit — burn iKAS via KasExitBridge; Igra's multi-sig
      // committee releases the KAS on Kaspa L1. No desk KAS liquidity needed.
      const wallet = new ethers.Wallet(alpha.private_key, provider);
      const exitBridge = new ethers.Contract(EXIT_BRIDGE, EXIT_ABI, wallet);
      const unlockSompi = BigInt(Math.round(amount * 1e8));
      const cfg = await exitBridge.getConfig();
      if (unlockSompi < cfg.minExitSompi) {
        // Below the native contract minimum (10,000 KAS on-chain) — pay small
        // exits instantly from the desk's own KAS L1 liquidity instead
        // Retain the desk fee in the KAS L1 wallet — payout is amount minus 0.5%
        const payoutKas = Math.floor(amount * (1 - DESK_FEE) * 1e8) / 1e8;
        let payout;
        try {
          const res = await base44.functions.invoke("sendKaspaTransaction", {
            privateKey: kasBridge.private_key, fromAddress: kasBridge.address,
            toAddress: dest, amountKas: payoutKas,
          });
          payout = res.data;
        } catch (err) {
          const msg = err?.response?.data?.error || err.message;
          return Response.json({ error: `Small exits (under ${Number(cfg.minExitSompi) / 1e8} KAS) are paid from the desk's own KAS liquidity — but the payout failed: ${msg}. Fund the desk with KAS at ${kasBridge.address} to enable small swaps, or use katbridge.com (trusted-party route, min 10 KAS).` }, { status: 400 });
        }
        // Fee is physically collected: payout leaves the funding wallet minus
        // 0.5% — that 0.5% KAS stays in the desk funding wallet.
        await base44.asServiceRole.entities.IgraBridgeSwap.create({
          direction: "ikas_to_kas", tx_in: txIn, tx_out: String(payout.txId),
          amount: payoutKas, recipient: dest, status: "completed",
          desk_fee: amount - payoutKas, fee_address: DESK_FEE_ADDRESS,
        });
        return Response.json({
          direction: "ikas_to_kas", amount: payoutKas, desk_fee_kas: amount - payoutKas,
          fee_paid_to: DESK_FEE_ADDRESS,
          recipient: dest, via: "desk",
          tx_out: payout.txId, explorer_url: `https://explorer.kaspa.org/txs/${payout.txId}`,
          note: `PAID INSTANTLY FROM DESK KAS LIQUIDITY · 0.5% DESK FEE RETAINED IN ${DESK_FEE_ADDRESS}`,
        });
      }
      if (cfg.maxExitSompi > 0n && unlockSompi > cfg.maxExitSompi) {
        return Response.json({ error: `Native bridge maximum is ${Number(cfg.maxExitSompi) / 1e8} KAS per exit` }, { status: 400 });
      }
      // Both fees are ACTUALLY charged to the swap (not subsidized by the desk):
      // the Igra bridge fee + the 0.5% desk fee come out of the swapped amount,
      // so the desk fee is retained by the desk pools on every exit.
      const deskFeeSompi = BigInt(Math.round(amount * DESK_FEE * 1e8));
      let netUnlockSompi = unlockSompi - deskFeeSompi;
      const quoted = await exitBridge.quoteFee(wallet.address, netUnlockSompi);
      netUnlockSompi -= quoted;
      const feeSompi = await exitBridge.quoteFee(wallet.address, netUnlockSompi);
      if (netUnlockSompi + feeSompi + deskFeeSompi > unlockSompi) netUnlockSompi = unlockSompi - deskFeeSompi - feeSompi;
      if (netUnlockSompi < cfg.minExitSompi) {
        return Response.json({ error: `After fees (${Number(feeSompi) / 1e8} KAS bridge fee + 0.5% desk fee) the exit falls below the native minimum of ${Number(cfg.minExitSompi) / 1e8} KAS — send a larger amount` }, { status: 400 });
      }
      const msgValue = (netUnlockSompi + feeSompi) * 10n ** 10n; // contract invariant: value = (unlock + fee) * 1e10
      const alphaBal = await provider.getBalance(alpha.address);
      if (alphaBal < msgValue) {
        return Response.json({ error: `Agent alpha holds ${ethers.formatEther(alphaBal)} iKAS but the exit needs ${ethers.formatEther(msgValue)} iKAS (amount + ${Number(feeSompi) / 1e8} bridge fee)` }, { status: 400 });
      }
      const out = await exitBridge.requestExit(dest, netUnlockSompi, { value: msgValue, gasLimit: 300000n });
      await out.wait(1, 90000);

      const payoutKas = Number(netUnlockSompi) / 1e8;
      await base44.asServiceRole.entities.IgraBridgeSwap.create({
        direction: "ikas_to_kas", tx_in: txIn, tx_out: out.hash,
        amount: payoutKas, recipient: dest, status: "completed",
        desk_fee: Number(deskFeeSompi) / 1e8, fee_address: DESK_FEE_ADDRESS,
      });
      return Response.json({
        direction: "ikas_to_kas", amount: payoutKas, recipient: dest,
        fee_kas: Number(feeSompi) / 1e8, desk_fee_kas: Number(deskFeeSompi) / 1e8,
        fee_paid_to: DESK_FEE_ADDRESS,
        tx_out: out.hash, explorer_url: `${EXPLORER}/tx/${out.hash}`,
        note: "iKAS burned via Igra's native KasExitBridge — KAS is released on Kaspa L1 by the Igra multi-sig committee (not instant). Bridge fee + 0.5% desk fee deducted from the swap.",
      });
    }

    return Response.json({ error: "Unknown action — use info, kas_to_ikas or ikas_to_kas" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});