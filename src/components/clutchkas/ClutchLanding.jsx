import React from 'react';
import { ArrowUpRight, Heart } from 'lucide-react';
import { CLUTCH_HERO } from '@/components/clutchkas/clutchMedia';

const steps = [
  ['01 /', 'DROP YOUR CLIP', 'Upload a highlight or paste your YouTube link. YouTube videos stay on YouTube.'],
  ['02 /', 'SCROLL THE PLAYS', 'A full-screen, swipeable feed built for aces, clutches, and unforgettable rounds.'],
  ['03 /', 'HEART MEANS KAS', 'Set your tip amount. Tap the heart. Approve in Scorpion. Support goes to the creator’s wallet.']
];

export default function ClutchLanding({wallet,onEnter,error}){
  return <main className="clutch-viral">
    <section className="clutch-viral-grid">
      <article className="viral-copy"><p className="clutch-eyebrow">VALORANT HIGHLIGHTS. REAL FAN SUPPORT.</p><h1>Your clutch.<br/>Their hype.<br/><span>Real Kaspa.</span></h1><p>That ace deserves more than a like. Share your best plays, discover the next one, and send KAS straight to the player behind it.</p></article>
      <div className="viral-image viral-image-small" style={{backgroundImage:`url(${CLUTCH_HERO})`}} aria-label="Tactical esports highlight artwork"/>
      <article className="viral-step viral-step-one"><strong>{steps[0][0]}</strong><h2>{steps[0][1]}</h2><p>{steps[0][2]}</p></article>
      <button className="viral-image viral-image-wide" style={{backgroundImage:`url(${CLUTCH_HERO})`}} onClick={onEnter} aria-label="Enter highlights"><span><Heart fill="currentColor"/>Watch highlights</span></button>
      <div className="viral-image viral-image-large" style={{backgroundImage:`url(${CLUTCH_HERO})`}} aria-hidden="true"/>
      <article className="viral-receipt"><span>RECEIPT</span><Heart fill="currentColor"/><ol><li>Set your amount</li><li>Approve in Scorpion</li><li>Support sent to creator</li></ol></article>
      <article className="viral-step viral-step-two"><strong>{steps[1][0]}</strong><h2>{steps[1][1]}</h2><p>{steps[1][2]}</p></article>
      <article className="viral-step viral-step-three"><strong>{steps[2][0]}</strong><h2>{steps[2][1]}</h2><p>{steps[2][2]}</p></article>
      <div className="viral-blank viral-blank-one" aria-hidden="true"/>
      <div className="viral-mark" aria-hidden="true"><span/></div>
      <div className="viral-blank viral-blank-two" aria-hidden="true"/>
      <button className="viral-connect" onClick={onEnter} disabled={wallet.loading}><span>{wallet.loading?'Connecting…':wallet.address?'Enter Highlights':'Connect Scorpion'}</span><ArrowUpRight/><small>KCC20 wallet connection · You choose your heart amount · Wallet approval per tip</small></button>
    </section>
    {error&&<p className="clutch-error viral-error" role="alert">{error}</p>}
    <footer className="clutch-footer">Independent fan app. Not affiliated with Riot Games. Fan tips are voluntary; earnings are not guaranteed.</footer>
  </main>;
}