import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import KaspaSearchBrowser from '@/components/agentinternet/KaspaSearchBrowser';
import SearchKaspaTabBar from '@/components/searchkaspa/SearchKaspaTabBar';
import SearchDocsTab from '@/components/searchkaspa/SearchDocsTab';
import SearchProfileTab from '@/components/searchkaspa/SearchProfileTab';
import { searchKaspaFromStore } from '@/lib/searchKaspaOrigin';

/** Search Kaspa app — iOS-style shell with Search / Docs / Profile bottom tabs.
 * Only admins pay the KAS micro-search fee — everyone else searches for free.
 * Exits route back to wherever the user opened the app from (store or landing). */
export default function SearchKaspa() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('search');
  const [isAdmin, setIsAdmin] = useState(false);
  // Persisted locally — survives refresh and stays correct per origin.
  const [fromStore] = useState(() => searchKaspaFromStore());

  useEffect(() => {
    base44.auth.me()
      .then(u => setIsAdmin(u?.role === 'admin'))
      .catch(() => setIsAdmin(false));
  }, []);

  const exitToOrigin = () => navigate(fromStore ? '/AppStoreV2' : '/');

  return <>
    <KaspaSearchBrowser
      open
      onClose={exitToOrigin}
      initialQuery={params.get('q') || ''}
      paidSearch={isAdmin}
      embedded
      onRequireFunding={() => setTab('profile')}
      headerExtra={fromStore ? (
        <button
          onClick={exitToOrigin}
          title="Exit to store"
          aria-label="Exit to store"
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/15 text-white/60 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors active:scale-95"
        >
          <Store className="w-3.5 h-3.5" />
        </button>
      ) : null}
    />

    <AnimatePresence>
      {tab !== 'search' && (
        <motion.div
          key={tab}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-[280] overflow-y-auto bg-black"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
        >
          {tab === 'docs'
            ? <SearchDocsTab />
            : <SearchProfileTab onOpenDocs={() => setTab('docs')} />}
        </motion.div>
      )}
    </AnimatePresence>

    <SearchKaspaTabBar active={tab} onChange={setTab} />
  </>;
}