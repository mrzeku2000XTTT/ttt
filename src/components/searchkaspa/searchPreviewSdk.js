export function previewSdkSource(origin) {
  return `// Search Kaspa preview SDK — no API keys or KAS charges yet.
// Preview contract; not the forthcoming paid API. Use after the app is published.
export function createSearchKaspaClient({ origin = ${JSON.stringify(origin)} } = {}) {
  const endpoint = new URL('/functions/searchKaspaApps', origin).href;
  return {
    async search(query, { category = 'All', limit = 10, signal } = {}) {
      if (typeof query !== 'string' || !query.trim() || query.length > 300) {
        throw new Error('query must contain 1–300 characters');
      }
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, category, limit, natural_language: true }), signal
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Search unavailable');
      return result;
    }
  };
}
`;
}
export function searchButtonExample(origin) {
  return `<a href="${origin}/SearchKaspa" target="_blank" rel="noopener noreferrer">Search Kaspa</a>`;
}