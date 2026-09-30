import { parseTable, parseCsv } from './csv.ts';
export function verifyInventory(inputText, filename, outputText) {
  const input = parseTable(inputText, filename), output = parseCsv(outputText);
  const required = ['sku','name','price','category']; const ix = Object.fromEntries(input.columns.map((c,i) => [c,i]));
  const expected = new Map();
  for (const raw of input.rows) {
    if (raw.length !== input.columns.length) continue;
    const row = raw.map(s => s.replace(/\s+/g, ' ').trim());
    if (required.some(c => !row[ix[c]])) continue;
    const p = row[ix.price].replace(/^\$/, '');
    const parts = p.split('.');
    const integerValid = /^\d+$/.test(parts[0]) || /^\d{1,3}(,\d{3})+$/.test(parts[0]);
    if (!integerValid || parts.length > 2 || (parts.length === 2 && !/^\d{1,2}$/.test(parts[1]))) continue;
    const value = Number(p.replace(/,/g,'')); if (!Number.isFinite(value) || value > 1000000) continue;
    row[ix.sku] = row[ix.sku].toUpperCase(); row[ix.category] = row[ix.category].toLowerCase(); row[ix.price] = value.toFixed(2);
    if (!expected.has(row[ix.sku])) expected.set(row[ix.sku], row);
  }
  const ox = Object.fromEntries(output.columns.map((c,i) => [c,i]));
  const skus = output.rows.map(r => r[ox.sku]);
  const checks = {
    csvParses:true, requiredColumns:required.every(c => output.columns.includes(c)),
    columnsPreserved:JSON.stringify(output.columns) === JSON.stringify(input.columns),
    nonEmpty:output.rows.length > 0, skuUnique:new Set(skus).size === skus.length,
    priceValid:output.rows.every(r => /^\d+\.\d{2}$/.test(r[ox.price] || '') && Number(r[ox.price]) <= 1000000),
    requiredValues:output.rows.every(r => required.every(c => typeof r[ox[c]] === 'string' && r[ox[c]].trim().length > 0)),
    rowConstraints:output.rows.every(r => r.length === output.columns.length),
    expectedValidRowsPreserved:output.rows.length === expected.size && output.rows.every(r => JSON.stringify(r) === JSON.stringify(expected.get(r[ox.sku]))),
    duplicatePolicy:JSON.stringify(output.rows) === JSON.stringify([...expected.values()]),
    encoding:true,
  };
  return {status:Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL', checks, expectedRows:expected.size};
}