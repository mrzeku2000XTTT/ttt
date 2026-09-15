import React from 'react';
import SearchDeveloperPlayground from './SearchDeveloperPlayground';
import SearchDeveloperExamples from './SearchDeveloperExamples';
import SearchDeveloperProtocol from './SearchDeveloperProtocol';

/** Docs tab — the Search Kaspa developer documentation, in-app. */
export default function SearchDocsTab() {
  return (
    <div className="search-kaspa-docs min-h-full bg-background font-body text-foreground">
      <div className="mx-auto max-w-3xl px-4 pb-4 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Developer docs</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Natural-language discovery with inspectable directory evidence — the working search, a preview client, and the wallet-paid API design.
        </p>
        <div className="mb-8 mt-6 rounded-xl border border-border bg-card p-4 text-xs leading-6">
          <strong>Available:</strong> grounded directory matching, exact evidence quotes, a preview JavaScript client and a link-style Search Kaspa button.
          <br />
          <strong>Not available yet:</strong> treasury settings, paid search/indexing, wallet-bound API keys, an embedded widget or an MCP adapter.
        </div>
        <div className="space-y-12">
          <SearchDeveloperPlayground />
          <SearchDeveloperExamples />
          <SearchDeveloperProtocol />
        </div>
      </div>
    </div>
  );
}