import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const DONATION_ADDRESS = "kaspa:qr5w9dtp6ru08cwheusawez5kv0f9dmfaz8fwfqejvnx9jk4p74fc2g5wfzdm";
const KASPA_API = "https://api.kaspa.org";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch recent transactions to donation address
    const txRes = await fetch(`${KASPA_API}/addresses/${DONATION_ADDRESS}/transactions?limit=50`);
    const txData = await txRes.json();

    if (!txData.transactions || txData.transactions.length === 0) {
      return Response.json({ message: "No transactions found", newDonations: 0 });
    }

    // Get existing fuel records to check what we've already processed
    const existingFuel = await base44.asServiceRole.entities.DAGFuel.filter({});
    const processedHashes = new Set(existingFuel.map(f => f.tx_hash));

    let newDonations = 0;

    // Process new transactions
    for (const tx of txData.transactions) {
      // Skip if already processed
      if (processedHashes.has(tx.transaction_hash)) continue;

      // Calculate amount sent to donation address
      const donationOutputs = tx.outputs.filter(
        o => o.script_public_key_address === DONATION_ADDRESS
      );
      
      if (donationOutputs.length === 0) continue;

      const totalAmount = donationOutputs.reduce((sum, o) => sum + parseInt(o.amount), 0) / 1e8;

      // Determine fuel type based on amount (boost if >= 100 KAS, cycling otherwise)
      const fuelType = totalAmount >= 100 ? "boost" : "cycling";

      // Create fuel record
      await base44.asServiceRole.entities.DAGFuel.create({
        donor_address: tx.inputs[0]?.previous_outpoint_address || "unknown",
        amount: totalAmount,
        fuel_type: fuelType,
        tx_hash: tx.transaction_hash,
        status: "confirmed",
        utxos_created: 0,
        transactions_sent: 0,
        tps_contribution: Math.floor(totalAmount / 10), // 1 TPS per 10 KAS
        expires_at: fuelType === "boost" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
      });

      newDonations++;
    }

    // Update global stats
    const allFuel = await base44.asServiceRole.entities.DAGFuel.filter({});
    const activeFuel = allFuel.filter(f => {
      if (f.fuel_type === "cycling") return f.status === "active" || f.status === "confirmed";
      if (f.fuel_type === "boost") {
        const notExpired = !f.expires_at || new Date(f.expires_at) > new Date();
        return notExpired && (f.status === "active" || f.status === "confirmed");
      }
      return false;
    });

    const cyclingFuel = activeFuel.filter(f => f.fuel_type === "cycling").reduce((sum, f) => sum + f.amount, 0);
    const boostFuel = activeFuel.filter(f => f.fuel_type === "boost").reduce((sum, f) => sum + f.amount, 0);
    const totalTPS = activeFuel.reduce((sum, f) => sum + (f.tps_contribution || 0), 0);

    // Update or create stats record
    const existingStats = await base44.asServiceRole.entities.DAGStats.filter({});
    if (existingStats.length > 0) {
      await base44.asServiceRole.entities.DAGStats.update(existingStats[0].id, {
        total_cycling_fuel: cyclingFuel,
        total_boost_fuel: boostFuel,
        current_artificial_tps: totalTPS,
        last_updated: new Date().toISOString()
      });
    } else {
      await base44.asServiceRole.entities.DAGStats.create({
        total_cycling_fuel: cyclingFuel,
        total_boost_fuel: boostFuel,
        current_artificial_tps: totalTPS,
        total_transactions_sent: 0,
        total_fees_paid: 0,
        last_updated: new Date().toISOString()
      });
    }

    return Response.json({ 
      success: true, 
      newDonations,
      stats: {
        cyclingFuel,
        boostFuel,
        totalTPS,
        activeFuelRecords: activeFuel.length
      }
    });

  } catch (error) {
    console.error("Monitor error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});