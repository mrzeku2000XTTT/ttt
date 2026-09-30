export const VERSION = '0.1.0';
export const ROOTS = ['workspace', 'documents', 'artifacts', 'jobs', 'downloads'];
export const MAX_BYTES = 262144;
export const MAX_ROWS = 5000;
export function fail(code, message = code) { const e = new Error(message); e.code = code; throw e; }
export function pathOf(value, allowRoot = false) {
  if (typeof value !== 'string' || value.length > 180 || /[\\\x00-\x1f]/.test(value) || value.includes('://') || value.includes(':')) fail('INVALID_PATH');
  if (!value.startsWith('/') || value.includes('//') || value.split('/').some(s => s === '..' || s === '.')) fail('INVALID_PATH');
  const path = value.length > 1 ? value.replace(/\/$/, '') : value;
  if (allowRoot && path === '/') return path;
  if (!ROOTS.includes(path.split('/')[1])) fail('PATH_FORBIDDEN');
  return path;
}
export function textOf(value, max = MAX_BYTES) {
  if (typeof value !== 'string' || new TextEncoder().encode(value).length > max) fail('INVALID_INPUT', 'Text missing or exceeds size limit');
  return value;
}
export const iso = () => new Date().toISOString();