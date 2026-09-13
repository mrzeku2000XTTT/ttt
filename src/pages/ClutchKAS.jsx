import React,{useState} from 'react';
import { useKcc20Wallet,shortKaspaAddress } from '@/lib/useKcc20Wallet';
import ClutchHeader from '@/components/clutchkas/ClutchHeader';
import ClutchLanding from '@/components/clutchkas/ClutchLanding';
import ClutchWorkspace from '@/components/clutchkas/ClutchWorkspace';
import '@/components/clutchkas/clutch.css';
export default function ClutchKAS(){
  const wallet=useKcc20Wallet(),[entered,setEntered]=useState(()=>sessionStorage.getItem('clutch_entered')==='1'),[error,setError]=useState('');
  const home=()=>{sessionStorage.removeItem('clutch_entered');setEntered(false);};
  const enter=async()=>{setError('');try{if(!wallet.address){const result=await wallet.connect();if(!result?.address)return;}sessionStorage.setItem('clutch_entered','1');setEntered(true);}catch(err){setError(err?.message||'Wallet connection cancelled.');}};
  const inside=entered&&!!wallet.address;
  return <div className="clutch-page"><ClutchHeader onHome={home}>{inside&&<><span className="clutch-wallet">Scorpion · {shortKaspaAddress(wallet.address)}</span><button onClick={()=>{home();wallet.disconnect();}}>Disconnect</button></>}</ClutchHeader>{inside?<ClutchWorkspace key={wallet.address} wallet={wallet}/>:<ClutchLanding wallet={wallet} onEnter={enter} error={error||wallet.error}/>}</div>;
}