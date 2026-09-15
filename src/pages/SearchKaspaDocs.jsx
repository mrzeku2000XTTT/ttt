import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SearchDeveloperPlayground from '@/components/searchkaspa/SearchDeveloperPlayground';
import SearchDeveloperExamples from '@/components/searchkaspa/SearchDeveloperExamples';
import SearchDeveloperProtocol from '@/components/searchkaspa/SearchDeveloperProtocol';

export default function SearchKaspaDocs() {
  const navigate = useNavigate();
  const backToSearch = () => navigate('/SearchKaspa');
  return <div className="search-kaspa-docs min-h-screen bg-background text-foreground font-body">
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-5">
        <button onClick={backToSearch} aria-label="Back to Search Kaspa" className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted active:scale-95">
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Back to Search Kaspa</span>
        </button>
        <span className="ml-auto hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">Developer docs</span>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-5 md:py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Public search preview · Scorpion / KCC20 payment design</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">Find the people building.</h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">Natural-language discovery with inspectable directory evidence. Explore the working search, download a preview client, and review the wallet-paid API specification without confusing planned features with live ones.</p>
      <nav aria-label="Developer documentation" className="my-8 flex flex-wrap gap-2 text-sm sm:gap-3">{[['try', 'Try search'], ['integrate', 'Integration reference'], ['payments', 'Wallet & payment design']].map(([id, label]) => <a key={id} href={`#${id}`} className="min-h-[44px] rounded-full border border-border px-4 py-2 leading-7 hover:bg-muted active:scale-95">{label}</a>)}</nav>
      <div className="mb-12 rounded-xl border border-border bg-card p-5 text-sm leading-7"><strong>Available:</strong> grounded directory matching, exact evidence quotes, a preview JavaScript client and a link-style Search Kaspa button.<br/><strong>Not available yet:</strong> treasury settings, paid search/indexing, wallet-bound API keys, an embedded widget or an MCP adapter.</div>
      <div className="space-y-16"><SearchDeveloperPlayground/><SearchDeveloperExamples/><SearchDeveloperProtocol/></div>
    </main>
    <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground sm:px-5">Search Kaspa · Experimental developer preview · No KAS payment required</footer>
  </div>;
}