import { FIELDS } from '../validation.ts';
import { MAX_INTENT_CHARS } from './contracts.ts';

function reject(code, message) { return { ok: false, code, message }; }

// The model's output is untrusted. Nothing reaches the dispatcher until it has
// been checked here against the same schema V0.1 enforces.
export function validateDecision(raw, actions) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return reject('INVALID_DECISION', 'The model did not return a decision object');

  const type = raw.decision_type;
  if (!['ACTION', 'GOAL_COMPLETE', 'CANNOT_CONTINUE'].includes(type)) return reject('INVALID_DECISION_TYPE', 'Unsupported decision type: ' + String(type));

  const intent_summary = String(raw.intent_summary || '').replace(/\s+/g, ' ').trim().slice(0, MAX_INTENT_CHARS);
  if (!intent_summary) return reject('MISSING_INTENT', 'The decision did not describe what it intends to do');

  if (type !== 'ACTION') return { ok: true, decision: { decision_type: type, intent_summary } };

  const action_type = raw.action_type;
  const catalog_entry = actions.find(a => a.action_type === action_type);
  if (!catalog_entry) return reject('ACTION_NOT_AVAILABLE', 'Not a permitted action on this computer: ' + String(action_type));

  const app_id = raw.app_id || catalog_entry.default_app_id;
  if (!catalog_entry.allowed_app_ids.includes(app_id)) {
    return reject('APP_ACTION_MISMATCH', action_type + ' cannot run in ' + String(app_id) + '; allowed apps: ' + catalog_entry.allowed_app_ids.join(', '));
  }

  const rawArgs = raw.args;
  const args = {};
  if (rawArgs != null) {
    if (typeof rawArgs !== 'object' || Array.isArray(rawArgs)) return reject('INVALID_ARGS', 'Action arguments must be an object');
    const allowed = FIELDS[action_type] || [];
    for (const [key, value] of Object.entries(rawArgs)) {
      if (!allowed.includes(key)) return reject('INVALID_ARGS', 'Unsupported parameter for ' + action_type + ': ' + key);
      if (key === 'descending') {
        if (typeof value !== 'boolean') return reject('INVALID_ARGS', 'Parameter descending must be a boolean');
        args[key] = value;
        continue;
      }
      if (typeof value !== 'string') return reject('INVALID_ARGS', 'Parameter ' + key + ' must be text');
      args[key] = value;
    }
  }
  args.app_id = app_id;

  return { ok: true, decision: { decision_type: 'ACTION', intent_summary, action: { action_type, app_id, args } } };
}