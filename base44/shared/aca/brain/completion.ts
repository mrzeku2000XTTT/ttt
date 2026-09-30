import { entries, readFile } from '../workspace.ts';
import { parseTable } from '../csv.ts';
import { DATASET_PATH, SUMMARY_PATH } from './contracts.ts';

// A GOAL_COMPLETE claim is never accepted on the model's word. This reads the
// persisted output and the real dataset through the authorized server-side ACA
// read path (the same mechanism V0.1's verification.ts uses) and checks the
// claim against actual evidence. It cannot modify anything.
// A goal verdict is always produced, never thrown: a validator failure must not be able to
// crash a step or strand the run in a transient phase. The cause is surfaced in the summary.
export async function validateGoal(ctx) {
  try { return await runChecks(ctx); }
  catch (e) {
    return {
      passed: false,
      checks: blankChecks(),
      summary: { message: 'Goal verification could not complete: ' + String(e?.code || e?.message || 'UNKNOWN') },
    };
  }
}
function blankChecks() {
  return { fileExists: false, revisionPersisted: false, nonEmpty: false, mentionsDataset: false, datasetPresent: false, columnsMentioned: false, rowCountStated: false, noContradiction: false };
}
async function runChecks(ctx) {
  const checks = blankChecks();
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
  // The dataset is deliberately messy, so a strict table parse may legitimately fail. A parse
  // failure must not crash verification or permanently block completion: fall back to a
  // lenient header read and a line-based row count, and still judge the stated count.
  let dataRows = 0, columns = null, uniqueSkus = null;
  try {
    const table = parseTable(dataset.text, dataset.path);
    dataRows = table.rows.length;
    columns = table.columns;
    const skuIndex = columns.indexOf('sku');
    uniqueSkus = skuIndex >= 0 ? new Set(table.rows.map(r => r[skuIndex])).size : null;
  } catch {
    const lines = dataset.text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim().length);
    dataRows = Math.max(0, lines.length - 1);
    columns = (lines[0] || '').split(',').map(c => c.trim()).filter(Boolean);
  }

  checks.columnsMentioned = columns.length > 0 && columns.every(c => text.includes(c));
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
      dataset_columns: columns,
      unique_skus: uniqueSkus,
      message: passed ? 'Persisted summary verified against the real dataset' : 'The persisted summary did not agree with the real dataset',
    },
  };
}