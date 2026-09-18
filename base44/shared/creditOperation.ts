import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getRequestUser } from './requestAuth.ts';

export function invalid(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

export async function creditOperation(req, run, maxBytes = 65536) {
  try {
    if (req.method !== 'POST') throw invalid('Use POST', 405);
    const base44 = createClientFromRequest(req);
    const user = await getRequestUser(base44);
    if (!user) throw invalid('Sign in to use this AI feature.', 401);
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > maxBytes) throw invalid('Request is too large.', 413);
    let input;
    try { input = JSON.parse(raw); } catch { throw invalid('A JSON object is required.'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('A JSON object is required.');
    return Response.json(await run(base44, input, user));
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error('Credit operation failed:', error.message);
    return Response.json({ error: status >= 500 ? 'This AI feature is temporarily unavailable. Please try again.' : error.message }, { status });
  }
}

export function text(value, name, max, optional = false) {
  if (optional && (value === undefined || value === null || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw invalid(`${name} must contain 1–${max} characters.`);
  return value.trim();
}

export function choice(value, values, name) {
  if (!values.includes(value)) throw invalid(`Invalid ${name}.`);
  return value;
}

export function conversation(value, roles, maxMessages = 12, field = 'text') {
  if (!Array.isArray(value) || !value.length || value.length > maxMessages) throw invalid('Invalid conversation length.');
  return value.map(m => ({ role: choice(m?.role, roles, 'message role'), [field]: text(m?.[field], 'Message', 4000) }));
}

export function publicImageUrls(value, max = 3) {
  if (!Array.isArray(value) || value.length > max) throw invalid('Invalid image references.');
  return value.map(v => {
    const url = text(v, 'Image URL', 2048);
    let parsed;
    try { parsed = new URL(url); } catch { throw invalid('Invalid image URL.'); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw invalid('Image URLs must use HTTPS.');
    return url;
  });
}