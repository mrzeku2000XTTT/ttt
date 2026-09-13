import React,{useState,useRef} from 'react';
import { Heart,Loader2 } from 'lucide-react';
import { kcc20Provider } from '@/lib/kcc20Pwa';
import { validTip } from '@/components/clutchkas/clutchMedia';
let walletRequestPending=false;
export default function ClutchHeart({clip,address,amount,onConfigure,onRefresh}){
  const receiptKey=`clutch-tip-${address}-${clip.id}`;
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState(()=>{try{return JSON.parse(localStorage.getItem(receiptKey)||'null');}catch{return null;}}),lock=useRef(false);
  const own=clip.creator_wallet.replace(/^kaspa:/,'')===address.replace(/^kaspa:/,'');
  const send=async()=>{
    if(lock.current||own)return;if(walletRequestPending){setError('Finish the open Scorpion request first.');return;}if(!validTip(amount)){onConfigure();return;}
    walletRequestPending=true;lock.current=true;setBusy(true);setError('');setReceipt(null);
    try{
      const wallet=kcc20Provider();if(!wallet?.sendKas)throw new Error('Refresh and reconnect Scorpion to use its latest KAS tipping support.');
      const result=await wallet.sendKas({dest:clip.creator_wallet,amount:String(amount)});
      const txId=result?.txId||result?.txid;
      if(!/^[a-f0-9]{64}$/i.test(txId||''))throw new Error('No transaction receipt returned. Check Scorpion history before trying again to avoid tipping twice.');
      const submitted={txId,amount:result.amountKas??amount};setReceipt(submitted);
      try{localStorage.setItem(receiptKey,JSON.stringify(submitted));}catch{/* The wallet already sent the tip; storage failure must not invite another send. */}
      onRefresh();
    }catch(err){setError(err?.message||'Wallet request failed.');}finally{walletRequestPending=false;lock.current=false;setBusy(false);}
  };
  return <div className="clutch-heart-wrap"><button className="clutch-heart" onClick={send} disabled={busy||own} aria-label={own?'Your highlight':validTip(amount)?`Tip ${amount} KAS to ${clip.creator_name}`:'Set your KAS tip amount'}>{busy?<Loader2 className="animate-spin"/>:<Heart fill={receipt?'currentColor':'none'}/>}<span>{own?'Your clip':busy?'Approve…':validTip(amount)?`${amount} KAS`:'Set tip'}</span></button>{receipt&&<a className="clutch-receipt" href={`https://kaspastream.com/tx/${receipt.txId}`} target="_blank" rel="noreferrer">{receipt.amount} KAS submitted ↗</a>}{error&&<p className="clutch-error" role="alert">{error}</p>}</div>;
}