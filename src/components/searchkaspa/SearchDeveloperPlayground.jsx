import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import SearchMatchEvidence from '@/components/agentinternet/SearchMatchEvidence';

export default function SearchDeveloperPlayground() {
  const [query, setQuery] = useState('Any builders working on a messaging platform?');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const submit = async event => {
    event.preventDefault(); const id = ++request.current; setLoading(true); setError(''); setResult(null);
    try { const response = await base44.functions.invoke('searchKaspaApps', { query: query.trim(), natural_language: true, limit: 10 }); if (!response.data.success) throw new Error(response.data.error); if (id === request.current) setResult(response.data); }
    catch (e) { if (id === request.current) setError(e.response?.data?.error || e.message || 'Search unavailable'); }
    finally { if (id === request.current) setLoading(false); }
  };
  return <section id="try" className="scroll-mt-8 space-y-5">
    <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Try the actual search</p><h2 className="mt-2 text-2xl font-semibold">Ask for the work, not just a name</h2></div>
    <p className="text-sm leading-7 text-muted-foreground">Searches select existing profiles or projects and show the exact indexed description behind each match. No live web answer is mixed into this mode; source accuracy and freshness still depend on the directory.</p>
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row"><input aria-label="Natural-language search" required maxLength={300} value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-input bg-card px-4 py-3 text-card-foreground"/><button disabled={loading || !query.trim()} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? 'Matching evidence…' : 'Search Kaspa'}</button></form>
    {error && <p role="alert" className="rounded-lg border border-border p-4 text-sm">{error}</p>}
    <div aria-live="polite" className="space-y-3">{result && <p className="text-xs text-muted-foreground">{result.results.length} directory matches · {result.intent?.target}{result.coverage?.truncated ? ' · Partial index coverage' : ''}</p>}{result?.no_match_reason && <p className="text-sm leading-7">{result.no_match_reason}</p>}{result?.results.map(app => <article key={app.id} className="rounded-xl border border-border bg-card p-5"><a href={app.url} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">{app.name}</a><span className="ml-3 text-xs text-muted-foreground">{app.result_kind}</span><SearchMatchEvidence evidence={app.match_evidence}/></article>)}</div>
  </section>;
}