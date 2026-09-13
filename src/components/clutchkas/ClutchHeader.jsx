import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Home } from 'lucide-react';
export default function ClutchHeader({onHome,children}){
  return <header className="clutch-header"><button className="clutch-brand" onClick={onHome} aria-label="ClutchKAS home">CLUTCHKAS</button><nav>{children}{onHome&&<button onClick={onHome}><Home size={16}/><span>Home</span></button>}<Link to="/AppStoreV2">Exit to Store<ArrowUpRight size={16}/></Link></nav></header>;
}