import React from 'react';
import { Link } from 'react-router-dom';
import BackToStore from '@/components/BackToStore';
import SearchDeveloperPlayground from '@/components/searchkaspa/SearchDeveloperPlayground';
import SearchDeveloperExamples from '@/components/searchkaspa/SearchDeveloperExamples';
import SearchDeveloperProtocol from '@/components/searchkaspa/SearchDeveloperProtocol';

export default function SearchKaspaDocs() {
  return <div className="search-kaspa-docs min-h-screen bg-background text-foreground font-body">
    <BackToStore/>
    <header className="border-b border-border px-5 py-6 pr-36"><Link to="/SearchKaspa" className="text-sm font-semibold">Search Kaspa / Developers</Link></header>
    <main className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Public search preview · Scorpion / KCC20 payment design</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Find the people building.</h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">Natural-language discovery with inspectable directory evidence. Explore the working search, download a preview client, and review the wallet-paid API specification without confusing planned features with live ones.</p>
      <nav aria-label="Developer documentation" className="my-8 flex flex-wrap gap-3 text-sm">{[['try', 'Try search'], ['integrate', 'Integration reference'], ['payments', 'Wallet & payment design']].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-border px-4 py-2 hover:bg-muted">{label}</a>)}</nav>
      <div className="mb-12 rounded-xl border border-border bg-card p-5 text-sm leading-7"><strong>Available:</strong> grounded directory matching, exact evidence quotes, a preview JavaScript client and a link-style Search Kaspa button.<br/><strong>Not available yet:</strong> treasury settings, paid search/indexing, wallet-bound API keys, an embedded widget or an MCP adapter.</div>
      <div className="space-y-16"><SearchDeveloperPlayground/><SearchDeveloperExamples/><SearchDeveloperProtocol/></div>
    </main>
    <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">Search Kaspa · Experimental developer preview · No KAS payment required</footer>
  </div>;
}