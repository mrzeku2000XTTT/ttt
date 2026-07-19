// Turns a raw Kaspa transaction (api.kaspa.org format) into a plain-English story.

const KAS = (sompi) => Number(sompi || 0) / 1e8;

export function shortAddr(addr) {
  if (!addr) return "an unknown wallet";
  const clean = addr.replace("kaspa:", "");
  return `wallet ending in "${clean.slice(-6)}"`;
}

export function friendlyAmount(kas) {
  if (kas >= 1) return `${kas.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS`;
  if (kas >= 0.01) return `${kas.toFixed(4)} KAS`;
  return `${kas.toFixed(8)} KAS (a tiny amount)`;
}

export function friendlyFee(feeKas) {
  if (feeKas <= 0) return "free (no fee)";
  if (feeKas < 0.001) return `less than a penny (${feeKas.toFixed(8)} KAS)`;
  return `${feeKas.toFixed(5)} KAS`;
}

export function friendlyTime(ms) {
  if (!ms) return "unknown time";
  const d = new Date(Number(ms));
  return d.toLocaleString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export function explainKaspaTx(tx) {
  const inputs = tx.inputs || [];
  const outputs = (tx.outputs || []).map((o) => ({
    address: o.script_public_key_address || o.script_public_key?.address || null,
    amount: KAS(o.amount),
  }));

  const isCoinbase = inputs.length === 0;
  const inputTotal = inputs.reduce(
    (s, i) => s + KAS(i.previous_outpoint_amount || i.previous_outpoint?.amount), 0
  );
  const outputTotal = outputs.reduce((s, o) => s + o.amount, 0);

  const senders = [...new Set(
    inputs.map((i) => i.previous_outpoint_address || i.previous_outpoint?.script_public_key?.address).filter(Boolean)
  )];
  const senderSet = new Set(senders);

  // Money going to addresses the sender doesn't own = the real payment.
  // Money going back to the sender = "change" (like getting change at a store).
  const paidOut = outputs.filter((o) => o.address && !senderSet.has(o.address));
  const changeBack = outputs.filter((o) => o.address && senderSet.has(o.address));

  const fee = isCoinbase ? 0 : Math.max(0, inputTotal - outputTotal);
  const isSelfSend = !isCoinbase && paidOut.length === 0;
  const confirmed = tx.is_accepted === true || !!tx.accepting_block_hash;

  // Group recipients (an address can appear in multiple outputs)
  const recipients = {};
  for (const o of paidOut) recipients[o.address] = (recipients[o.address] || 0) + o.amount;
  const recipientList = Object.entries(recipients)
    .map(([address, amount]) => ({ address, amount }))
    .sort((a, b) => b.amount - a.amount);

  const sentAmount = recipientList.reduce((s, r) => s + r.amount, 0);
  const changeAmount = changeBack.reduce((s, o) => s + o.amount, 0);

  let headline;
  if (isCoinbase) {
    headline = `⛏️ This is a mining reward — the Kaspa network paid ${friendlyAmount(outputTotal)} to a miner for helping run the network.`;
  } else if (isSelfSend) {
    headline = `🔄 Someone moved ${friendlyAmount(outputTotal)} between their own wallets — like moving cash from one pocket to another. No money changed hands.`;
  } else if (recipientList.length === 1) {
    headline = `💸 Someone sent ${friendlyAmount(sentAmount)} to another person.`;
  } else {
    headline = `💸 Someone sent money to ${recipientList.length} different people, totaling ${friendlyAmount(sentAmount)}.`;
  }

  return {
    headline,
    isCoinbase,
    isSelfSend,
    confirmed,
    senders,
    recipientList,
    sentAmount,
    changeAmount,
    fee,
    timeMs: tx.block_time || tx.accepting_block_time || null,
    txId: tx.transaction_id,
  };
}