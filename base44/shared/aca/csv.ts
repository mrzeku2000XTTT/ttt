import { fail, MAX_ROWS } from './contracts.ts';
export function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) { if (ch === '"') { if (source[i+1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } } else cell += ch; continue; }
    if (ch === '"') { if (cell || closed) fail('INVALID_CSV'); quoted = true; }
    else if (ch === ',') { row.push(cell); cell = ''; closed = false; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && source[i+1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; closed = false; }
    else { if (closed) fail('INVALID_CSV'); cell += ch; }
    if (rows.length > MAX_ROWS + 1) fail('ROW_LIMIT');
  }
  if (quoted) fail('INVALID_CSV', 'Unclosed quoted field');
  if (cell || row.length || closed) { row.push(cell); rows.push(row); }
  const columns = rows.shift() || [];
  if (!columns.length || columns.some(c => !c.trim()) || new Set(columns).size !== columns.length) fail('INVALID_COLUMNS');
  return { columns, rows };
}
export function csvText(columns, rows) {
  const quote = v => /[",\r\n]/.test(String(v ?? '')) ? '"' + String(v ?? '').replace(/"/g, '""') + '"' : String(v ?? '');
  return [columns, ...rows].map(row => row.map(quote).join(',')).join('\n') + '\n';
}
export function parseTable(text, filename) {
  if (filename.toLowerCase().endsWith('.csv')) return parseCsv(text);
  if (!filename.toLowerCase().endsWith('.json')) fail('UNSUPPORTED_FORMAT');
  const parsed = JSON.parse(text); const records = Array.isArray(parsed) ? parsed : parsed.records;
  if (!Array.isArray(records) || !records.length || records.length > MAX_ROWS || records.some(r => !r || Array.isArray(r) || typeof r !== 'object')) fail('INVALID_TABLE');
  const columns = [...new Set(records.flatMap(Object.keys))];
  return {columns, rows:records.map(r => columns.map(c => r[c] == null ? '' : String(r[c])))};
}