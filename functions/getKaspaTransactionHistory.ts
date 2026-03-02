import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { address } = await req.json();

    if (!address) {
      return Response.json({ error: 'Address required' }, { status: 400 });
    }

    // Normalize: strip kaspa: prefix for URL, keep full address for matching
    const cleanAddress = address.startsWith('kaspa:') ? address.slice(6) : address;
    const fullAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;

    const kaspaApi = Deno.env.get('KASPA_API_KEY');

    // Use resolve_previous_outpoints=light to get sender addresses
    const txRes = await fetch(
      `https://api.kaspa.org/addresses/${cleanAddress}/full-transactions?limit=50&resolve_previous_outpoints=light`,
      { headers: { 'X-API-KEY': kaspaApi || '' } }
    );

    if (!txRes.ok) {
      console.error('Kaspa API error:', txRes.status, await txRes.text());
      return Response.json({ transactions: [] });
    }

    const txData = await txRes.json();
    const transactions = Array.isArray(txData) ? txData : txData.transactions || [];

    const parsed = transactions.map(tx => {
      // Determine if this address is in the outputs (received) or inputs (sent)
      const myOutputs = (tx.outputs || []).filter(
        out => out.script_public_key?.address === cleanAddress ||
               out.script_public_key?.address === fullAddress
      );
      const myInputs = (tx.inputs || []).filter(
        inp => inp.previous_outpoint?.script_public_key?.address === cleanAddress ||
               inp.previous_outpoint?.script_public_key?.address === fullAddress ||
               inp.previous_outpoint?.address === cleanAddress ||
               inp.previous_outpoint?.address === fullAddress
      );

      const isReceived = myOutputs.length > 0 && myInputs.length === 0;
      const isSent = myInputs.length > 0;

      let amount = 0;
      let counterpartyAddress = null;

      if (isReceived) {
        amount = myOutputs.reduce((sum, out) => sum + (out.amount || 0), 0) / 1e8;
        // Find the sender (first input address)
        const senderInp = (tx.inputs || [])[0];
        counterpartyAddress =
          senderInp?.previous_outpoint?.script_public_key?.address ||
          senderInp?.previous_outpoint?.address ||
          null;
      } else if (isSent) {
        // Amount sent = total inputs from this address minus change outputs back to this address
        const totalIn = myInputs.reduce((sum, inp) => sum + (inp.previous_outpoint?.amount || 0), 0) / 1e8;
        const changeBack = myOutputs.reduce((sum, out) => sum + (out.amount || 0), 0) / 1e8;
        amount = Math.max(0, totalIn - changeBack);
        // Find the recipient (first output NOT going back to this address)
        const recipientOut = (tx.outputs || []).find(
          out => out.script_public_key?.address !== cleanAddress &&
                 out.script_public_key?.address !== fullAddress
        );
        counterpartyAddress = recipientOut?.script_public_key?.address || null;
      }

      // block_time from Kaspa API is in milliseconds
      let timestamp = null;
      if (tx.block_time) {
        // Could be ms or seconds — if > 1e12 it's ms
        const ts = tx.block_time > 1e12 ? tx.block_time : tx.block_time * 1000;
        timestamp = new Date(ts).toISOString();
      }

      return {
        id: tx.transaction_id || tx.hash,
        type: isReceived ? 'receive' : isSent ? 'send' : 'other',
        amount: parseFloat(amount.toFixed(8)),
        timestamp,
        counterpartyAddress: counterpartyAddress
          ? (counterpartyAddress.startsWith('kaspa:')
              ? counterpartyAddress
              : `kaspa:${counterpartyAddress}`)
          : null,
      };
    }).filter(tx => tx.type !== 'other' && tx.amount > 0);

    return Response.json({ transactions: parsed });
  } catch (error) {
    console.error('Transaction history error:', error);
    return Response.json({ transactions: [] });
  }
});