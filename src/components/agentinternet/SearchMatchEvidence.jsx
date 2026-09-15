import React from 'react';

export default function SearchMatchEvidence({ evidence }) {
  if (!evidence?.quote) return null;
  const date = evidence.indexed_at ? new Date(evidence.indexed_at) : null;
  return <div className="my-3 border-l-2 border-current/25 pl-3 text-xs leading-relaxed">
    <p className="mb-1 font-semibold">Why this matched · directory evidence</p>
    <blockquote className="opacity-80">“{evidence.quote}”</blockquote>
    <p className="mt-1 text-[10px] opacity-60">Not independently verified{date && !Number.isNaN(date.getTime()) ? ` · Indexed ${date.toLocaleDateString()}` : ''}</p>
    <a href={evidence.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block underline underline-offset-2">{/(x|twitter)\.com\//i.test(evidence.source_url || '') ? 'Check this profile' : 'Check this project'}</a>
  </div>;
}