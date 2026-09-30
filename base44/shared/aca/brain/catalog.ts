import { FIELDS } from '../validation.ts';
import { APPS } from '../manifests.ts';

// The permitted action surface for one computer, derived from the SAME sources of
// truth the V0.1 dispatcher enforces (the action argument schema and the app
// manifests), narrowed to the apps actually installed on this computer.
// The Brain can therefore only ever name an action the dispatcher would accept.
export function availableActions(computer) {
  const installed = computer.installed_app_ids || [];
  return Object.entries(FIELDS).flatMap(([action_type, args]) => {
    const apps = APPS.filter(app => installed.includes(app.app_id) && app.capabilities.includes(action_type));
    if (!apps.length) return [];
    return [{
      action_type,
      args,
      allowed_app_ids: apps.map(app => app.app_id),
      default_app_id: apps[0].app_id,
    }];
  });
}