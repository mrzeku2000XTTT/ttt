import React from 'react';
import { searchTerms } from '@/components/agentinternet/smartAppSearch';
export default function SearchHighlight({ text, query, className = '' }) {
  const terms = searchTerms(query).sort((a, b) => b.length - a.length);
  if (!text || !terms.length) return <span className={className}>{text}</span>;
  const pattern = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = String(text).split(new RegExp(`(${pattern})`, 'ig'));
  return <span className={className}>{parts.map((part, index) => terms.some(term => term.toLowerCase() === part.toLowerCase()) ? <mark key={index} className="rounded-sm bg-cyan-300/20 px-0.5 text-cyan-100">{part}</mark> : part)}</span>;
}