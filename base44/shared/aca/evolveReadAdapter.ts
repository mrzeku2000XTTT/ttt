export async function jobs(ctx) {
  return (await ctx.sr.entities.EvolveJob.filter({experiment_id:ctx.c.experiment_id},'-created_date',120)).map(j => ({id:j.id,code:j.code,title:j.title,brief:j.brief,type:j.type,status:j.status,reward:j.reward,verification:j.verification,submission:j.submission || '',inputStatus:'No ACA input artifact attached',execution:'Legacy EVOLVE record · ACA inspection only'}));
}
export async function wallet(ctx) {
  const identities = await ctx.sr.entities.EvolveAgentWallet.filter({experiment_id:ctx.c.experiment_id,agent_id:ctx.c.agent_id},'-created_date',1);
  const address = identities[0]?.address || ctx.agent.address || '';
  const txs = address ? await ctx.sr.entities.EvolveChainTx.filter({experiment_id:ctx.c.experiment_id,network:'kaspa_testnet_10',status:{$in:['CONFIRMED','SETTLED']},$or:[{sender_address:address},{recipient_address:address}]},'-created_date',50) : [];
  let balance_sompi=null;
  if(address.startsWith('kaspatest:')) { const response=await ctx.sr.functions.invoke('evolveTn10Balances',{addresses:[address]});balance_sompi=response.data.balances?.[address] ?? null; }
  return {address,balance_sompi,observed_at:new Date().toISOString(),network:'kaspa_testnet_10',transactions:txs.filter(t => /^[a-f0-9]{64}$/i.test(t.txid || '')).map(t => ({txid:t.txid,amount_sompi:t.amount_sompi,sender_address:t.sender_address,recipient_address:t.recipient_address,status:t.status,purpose:t.purpose}))};
}