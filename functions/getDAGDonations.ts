const DONATION_ADDRESS = "kaspa:qprjd3qd9cdfz54vguyhxck5e902p9d0p3aunxq7y65cpnpr58742uc2mkdpk";
const KASPA_API = "https://api.kaspa.org";

Deno.serve(async (req) => {
  try {
    // Fetch balance of donation address
    const balanceRes = await fetch(`${KASPA_API}/addresses/${DONATION_ADDRESS}/balance`);
    const balanceData = await balanceRes.json();
    
    const totalDonated = balanceData.balance ? parseInt(balanceData.balance) / 1e8 : 0;

    // Fetch recent transactions to show donation activity
    const txRes = await fetch(`${KASPA_API}/addresses/${DONATION_ADDRESS}/transactions?limit=50`);
    const txData = await txRes.json();

    const recentDonations = [];
    if (txData.transactions) {
      for (const tx of txData.transactions.slice(0, 10)) {
        const donationOutputs = tx.outputs?.filter(
          o => o.script_public_key_address === DONATION_ADDRESS
        ) || [];
        
        if (donationOutputs.length > 0) {
          const amount = donationOutputs.reduce((sum, o) => sum + parseInt(o.amount || 0), 0) / 1e8;
          recentDonations.push({
            txHash: tx.transaction_hash,
            amount,
            timestamp: tx.block_time || Date.now()
          });
        }
      }
    }

    return Response.json({ 
      success: true,
      totalDonated,
      recentDonations,
      address: DONATION_ADDRESS
    });

  } catch (error) {
    console.error("Get donations error:", error);
    return Response.json({ 
      error: error.message,
      totalDonated: 0,
      recentDonations: []
    }, { status: 500 });
  }
});