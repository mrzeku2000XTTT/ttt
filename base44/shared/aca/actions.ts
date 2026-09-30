import { APPS } from './manifests.ts';
import { FIELDS } from './validation.ts';

// Explicit action contract. Every ACA action declares which apps may request it,
// which capability it needs and the arguments it accepts. Both sources of truth are
// already in the codebase (app manifests + the action argument schema), so the
// contract cannot drift away from what the runtime actually accepts.
export const ACTION_CONTRACTS = Object.entries(FIELDS).map(([action_type, args]) => ({
  action_type,
  allowed_app_ids: APPS.filter(app => app.capabilities.includes(action_type)).map(app => app.app_id),
  required_capabilities: [action_type],
  args,
}));

export function contractOf(type) { return ACTION_CONTRACTS.find(c => c.action_type === type); }

// Deterministic rejection detail: what was asked, from where, and what is allowed.
export function mismatchMessage(type, app) {
  const contract = contractOf(type);
  const allowed = contract ? contract.allowed_app_ids.join(', ') : 'none';
  return type + ' cannot run in ' + (app || '(no app declared)') + '; allowed apps: ' + allowed;
}