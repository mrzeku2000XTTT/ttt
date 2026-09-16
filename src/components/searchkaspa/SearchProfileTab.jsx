import React, { useState } from 'react';
import { AtSign, Globe, BookOpen, ChevronRight } from 'lucide-react';
import SearchKaspaWalletCard from './SearchKaspaWalletCard';
import SearchTransactionsTab from './SearchTransactionsTab';
import XProfileForm from '@/components/agentinternet/XProfileForm';
import ListSiteModal from '@/components/agentinternet/ListSiteModal';

/** Profile tab — the user's funded search wallet plus profile writing and site listing. */
export default function SearchProfileTab({ onOpenDocs }) {
  const [listOpen, setListOpen] = useState(false);
  const [view, setView] = useState('profile');

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 pb-4 pt-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-xs text-white/40">Your wallet, your profile, your listings.</p>
      </header>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
        {(['profile', 'transactions'] ).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`h-9 rounded-lg text-[13px] font-semibold transition-colors ${
              view === v ? 'bg-cyan-500 text-black' : 'text-white/50'
            }`}
          >
            {v === 'profile' ? 'Profile' : 'Transactions'}
          </button>
        ))}
      </div>

      {view === 'transactions' ? (
        <SearchTransactionsTab />
      ) : (
      <>
      <SearchKaspaWalletCard />

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-white">Write your own profile</h2>
        </div>
        <p className="text-xs leading-relaxed text-white/40">
          Add your X handle and website — AI researches the account and gives it its own agent, so anyone can ask about you.
        </p>
        <XProfileForm />
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-white">List a site</h2>
        </div>
        <p className="text-xs leading-relaxed text-white/40">
          Own a Kaspa project or site? It gets security-scanned and added to the search index.
        </p>
        <button onClick={() => setListOpen(true)} className="h-11 w-full rounded-xl bg-cyan-500 text-sm font-bold text-black transition-transform active:scale-95">
          List your site
        </button>
      </section>

      <button
        onClick={onOpenDocs}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.07] active:scale-[0.99]"
      >
        <BookOpen className="h-4 w-4 text-white/50" />
        <span className="flex-1 text-sm font-medium text-white">Developer docs</span>
        <ChevronRight className="h-4 w-4 text-white/30" />
      </button>
      </>
      )}

      <ListSiteModal open={listOpen} onClose={() => setListOpen(false)} onListed={() => setListOpen(false)} />
    </div>
  );
}