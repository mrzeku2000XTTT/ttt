import { fail } from './contracts.ts';
import { csvText, parseTable } from './csv.ts';
export const REQUIRED = ['sku','name','price','category'];
export function cleanInventory(text, filename) {
  const {columns, rows} = parseTable(text, filename);
  if (REQUIRED.some(c => !columns.includes(c))) fail('MISSING_COLUMNS');
  const out = [], seen = new Set(); let duplicatesRemoved = 0, invalidRowsRemoved = 0, normalizedFields = 0;
  const ix = Object.fromEntries(columns.map((c,i) => [c,i]));
  for (const original of rows) {
    if (original.length !== columns.length || original.every(v => !v.trim())) { invalidRowsRemoved++; continue; }
    const row = original.map(v => v.trim().replace(/\s+/g, ' '));
    row[ix.sku] = row[ix.sku].toUpperCase(); row[ix.category] = row[ix.category].toLowerCase();
    const price = row[ix.price];
    if (REQUIRED.some(c => !row[ix[c]]) || !/^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(price)) { invalidRowsRemoved++; continue; }
    const amount = Number(price.replace(/[$,]/g, ''));
    if (!Number.isFinite(amount) || amount > 1000000) { invalidRowsRemoved++; continue; }
    row[ix.price] = amount.toFixed(2);
    if (seen.has(row[ix.sku])) { duplicatesRemoved++; continue; }
    seen.add(row[ix.sku]); normalizedFields += row.filter((v,i) => v !== original[i]).length; out.push(row);
  }
  return {text:csvText(columns,out), summary:{inputRows:rows.length,outputRows:out.length,duplicatesRemoved,invalidRowsRemoved,normalizedFields}, columns};
}