import { entries, readFile } from '../workspace.ts';
import { parseTable } from '../csv.ts';
import { DATASET_PATH, SUMMARY_PATH } from './contracts.ts';

// A GOAL_COMPLETE claim is never accepted on the model's word. This reads the
// persisted output and the real dataset through the authorized server-side ACA
// read path (the same mechanism V0.1's verification.ts uses) and checks the
// claim against actual evidence. It cannot modify anything.
export async function validateGoal(ctx) {
  const checks = { fileExists: false, revisionPersisted: false, nonEmpty: false, mentionsDataset: false, datasetPresent: false, columnsMentioned: false, rowCountStated: false, noContradiction: false };
  const list = await entries(ctx);

  const summaryEntry = list.find(e => e.path === SUMMARY_PATH && e.kind === 'FILE');
  checks.fileExists = !!summaryEntry;
  if (!summaryEntry) return { passed: false, checks, summary: { message: 'No persisted file at ' + SUMMARY_PATH } };
  checks.revisionPersisted = !!summaryEntry.revision_id;

  const summary = await readFile(ctx, { file_id: summaryEntry.id });
  const text = summary.text;
  checks.nonEmpty = text.trim().length > 0;
  checks.mentionsDataset = /inventory/i.test(text);

  const datasetEntry = list.find(e => e.path === DATASET_PATH && e.kind === 'FILE');
  checks.datasetPresent = !!datasetEntry;
  if (!datasetEntry) return { passed: false, checks, summary: { message: 'Dataset not found at ' + DATASET_PATH } };

  const dataset = await readFile(ctx, { file_id: datasetEntry.id });
  const table = parseTable(dataset.text, dataset.path);
  const dataRows = table.rows.length;
  const skuIndex = table.columns.indexOf('sku');
  const uniqueSkus = skuIndex >= 0 ? new Set(table.rows.map(r => r[skuIndex])).size : null;

  checks.columnsMentioned = table.columns.every(c => text.includes(c));
  checks.rowCountStated = new RegExp('(^|\\D)' + dataRows + '(\\D|$)').test(text);

  // Any stated count must agree with the real dataset. "lines" may include the header row.
  const claims = [...text.matchAll(/(\d[\d,]*)\s*(rows|records|entries|lines)/gi)]
    .map(m => ({ value: Number(m[1].replace(/,/g, '')), unit: m[2].toLowerCase() }));
  checks.noContradiction = claims.every(c => c.unit === 'lines' ? (c.value === dataRows || c.value === dataRows + 1) : c.value === dataRows);

  const passed = Object.values(checks).every(Boolean);
  return {
    passed,
    checks,
    summary: {
      path: SUMMARY_PATH,
      file_id: summaryEntry.id,
      revision_id: summaryEntry.revision_id,
      size_bytes: summary.revision?.size_bytes ?? null,
      sha256: summary.revision?.sha256 || '',
      dataset_path: dataset.path,
      dataset_rows: dataRows,
      dataset_columns: table.columns,
      unique_skus: uniqueSkus,
      message: passed ? 'Persisted summary verified against the real dataset' : 'The persisted summary did not agree with the real dataset',
    },
  };
}