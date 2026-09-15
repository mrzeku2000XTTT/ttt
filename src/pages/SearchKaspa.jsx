import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import KaspaSearchBrowser from '@/components/agentinternet/KaspaSearchBrowser';
import BackToStore from '@/components/BackToStore';
import SearchKaspaTabBar from '@/components/searchkaspa/SearchKaspaTabBar';
import SearchDocsTab from '@/components/searchkaspa/SearchDocsTab';
import SearchProfileTab from '@/components/searchkaspa/SearchProfileTab';

/** Search Kaspa app — iOS-style shell with Search / Docs / Profile bottom tabs.
 * Only admins pay the KAS micro-search fee — everyone else searches for free. */
export default function SearchKaspa() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('search');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then(u => setIsAdmin(u?.role === 'admin'))
      .catch(() => setIsAdmin(false));
  }, []);

  return <>
    <KaspaSearchBrowser
      open
      onClose={() => navigate('/')}
      initialQuery={params.get('q') || ''}
      paidSearch={isAdmin}
      embedded
      onRequireFunding={() => setTab('profile')}
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
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
        >
          {tab === 'docs'
            ? <SearchDocsTab />
            : <SearchProfileTab onOpenDocs={() => setTab('docs')} />}
        </motion.div>
      )}
    </AnimatePresence>

    <SearchKaspaTabBar active={tab} onChange={setTab} />

    <div className="relative z-[300] [&_button]:top-3 [&_button]:bottom-auto"><BackToStore /></div>
  </>;
}