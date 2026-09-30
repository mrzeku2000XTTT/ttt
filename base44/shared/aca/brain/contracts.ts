// ACA V0.2 — Brain contracts. Bounded constants only; no behaviour lives here.
export const BRAIN_VERSION = '0.2.0';

// Run statuses that mean "this run owns the computer".
export const ACTIVE_STATUSES = ['STARTING', 'RUNNING', 'THINKING', 'ACTING', 'PAUSED', 'STOPPING'];
// Run statuses that mean "no further step will execute".
export const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED', 'BUDGET_EXCEEDED'];
// Operator states that a finishing step must never overwrite.
export const OPERATOR_HELD_STATUSES = ['CANCELLED', 'PAUSED', 'STOPPING', 'BUDGET_EXCEEDED', 'COMPLETED', 'FAILED'];

export const DECISION_TYPES = ['ACTION', 'GOAL_COMPLETE', 'CANNOT_CONTINUE'];

// Approved conservative defaults.
export const DEFAULT_BUDGET = {
  max_steps: 15,
  // Measured `automatic` model latency is ~65s per decision, so a 120s wall-clock
  // budget would abort a real run after two steps. Raised so 15 steps are reachable.
  max_duration_ms: 1200000,
  max_consecutive_failures: 3,
  max_identical_retries: 2,
  sim_compute_budget: 40,
};

// Server-side only. The client never learns or supplies a model.
export const MODEL_CONFIGURATION = 'automatic';

// Bounded sizes.
export const MAX_INTENT_CHARS = 240;
export const MAX_RESULT_CHARS = 8000;
export const MAX_GOAL_CHARS = 600;
export const MAX_ERROR_CHARS = 500;

export const DATASET_PATH = '/workspace/inventory.csv';
export const SUMMARY_PATH = '/workspace/inventory_summary.md';
export const DEFAULT_GOAL = 'Inspect /workspace/inventory.csv and create a useful persisted summary note describing the dataset.';