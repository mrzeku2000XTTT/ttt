# ACA V0.1 — verification report

Status: **ACA V0.1 UI ACCEPTANCE — PASS** (1 item NOT RUN: forced error-boundary crash)
Verdict rule applied: no PASS where a required test was not actually executed.

Verification method: persisted-record inspection, live backend invocation of the
deployed ACA functions, builder-supplied ACA screenshots, and inspection of the ACA
render path. No code was modified during this pass.

## Identity

| Field | Value |
|---|---|
| COMPUTER | ACA_0011 (record 6abc93b991075097eb902681) |
| AGENT | AGT_0011 / A#011 (record 6abc7fd1dfd19dc3f96bdb02) |
| SESSION | ACA_SESSION_cc8e4681-a118-47c8-93c1-5783edbd04a6 (record 6abc940361aac6bd62300bc6) |
| TRIGGER | MANUAL_TEST |
| STARTED / ENDED | 2026-09-30T04:45:55.890Z / 2026-09-30T04:55:08.158Z |
| SESSION STATUS | COMPLETED |
| ACTIONS | 9 |
| EVENTS | 9 |
| SIM COMPUTE USED | 9 |
| TOOL / PAYMENT COST | 0 (no transaction) |
| APPS INSTALLED | 14 |

## 1. Stored files are real (read from persisted records, nothing regenerated)

INPUT
- workspace entry ID: 6abc94859fa5b8e89a8f03e7
- revision ID: 6abc94850c2c0b1e20b2cc16
- filename: /workspace/inventory.csv
- byte size: 22881
- SHA-256: d4cea4ad5c706d891aefcdfd4055ac5a352492e1588af0606ee01d9fd83886a7
- row count: 500 (recorded in the CREATE_FIXTURE / OPEN_FILE output_reference)
- storage: private, no public URL (storage_reference stripped from every public payload)

OUTPUT
- workspace entry ID: 6abc9558df5617657ba6cfed
- revision ID: 6abc95588231b4289e3223c0
- filename: /workspace/cleaned_inventory.csv
- byte size: 15384
- SHA-256: 85970a08153cf6da7c618a17a19d2aaa5fe7b5dd84c2578943c5f5beb7cab05a
- row count: 423

- artifact ID: 6abc959b040ae772148643e6 (type CSV, text/csv, 15384 bytes, sha 85970a08…, revision 6abc95588231b4289e3223c0, execution 6abc959a525476dbcbd37ae7)
- verification ID: 6abc9559e532c76b0da083e2
- verification result: PASS (11/11 checks true)
- checks: csvParses, requiredColumns, columnsPreserved, nonEmpty, skuUnique, priceValid, requiredValues, rowConstraints, expectedValidRowsPreserved, duplicatePolicy, encoding

## 2. 500 → 423 reconciliation

Persisted transform summary (from the DATA_TRANSFORM execution output_reference and
the ACAVerificationResult record — not recomputed):

| Measure | Value |
|---|---|
| input rows | 500 |
| invalid rows removed | 29 |
| duplicate SKUs removed | 48 |
| output rows | 423 |
| normalized fields | 1480 |

500 − 29 − 48 = 423. The numbers reconcile exactly.

Limitation (stated honestly): the stored summary persists two removal buckets only —
`invalidRowsRemoved` (blank rows, wrong column count, missing required field,
malformed/over-range price) and `duplicatesRemoved` (second and later occurrence of an
already-seen SKU). A per-reason split inside those buckets is NOT persisted, so it is
not reported here. The builder agent did not re-run the transform to invent one.

## 3. Private file access

- Workspace files are private; the browser never receives a storage path. `publicRevision()` strips `storage_reference` from every revision payload.
- Reads go through the authorized ACA workspace endpoint and verify byte size + SHA-256 before returning text.
- A 60-second signed URL exists only server-side for the read itself, and for an explicit `download` request.
- Authorized ACA_0011 read → SUCCESS (verified: inventory.csv, cleaned_inventory.csv, revision_test.txt).
- Unauthorized → all six ACA endpoints require `role === 'admin'`; non-admin is refused with 403 by the authorization layer. Runtime non-admin probe NOT RUN (the builder session is admin); enforcement is code-level.
- Foreign / unknown file or revision ID → DENIED (`WORKSPACE_FORBIDDEN`, `INTERNAL_ERROR`).
- Nonexistent path → DENIED (`WORKSPACE_FORBIDDEN`).

## 4–7, 15, 16. UI items — NOT RUN

COMPUTER UI, LIVE UI, CURSOR, IDLE, FAILURE VISUALIZATION (UI) were not executed by the
builder agent. Backend halves were verified:

- Every action writes the execution record first, then the event, then the view state, then the computer view_state — the cursor is a projection of `event.target_id`, never the executor.
- Failure is recorded truthfully: hostile-path probes produced 33 FAILED executions and 33 FAILED events with `error_code` populated, `target_id: null`, and no artifact or success event.
- IDLE: ACA performs no work without an action — no timers, no schedulers, no writes in any ACA module except in response to a dispatched action.

## 8. Replay

- `acaHistory` returns session + ordered events + checkpoints; it performs reads only.
- Replay is a pure projection of persisted events/checkpoints/revisions/artifact references.
- Idempotency evidence gathered so far: running the security battery twice added executions/events only — artifacts stayed 1, verifications stayed 1, and the original session's `compute_used` stayed 9 with status COMPLETED.
- Actual replay playback, twice, in the UI — NOT RUN.
- Note: `NAVIGATE` / `OPEN_RESOURCE` legitimately write a `/downloads/resource_<execution>.txt` snapshot. Replay must not navigate; it must read snapshots. Confirmed by code, not yet by UI run.

## 9. File revision history — PASS

| Revision | Content | SHA-256 | previous |
|---|---|---|---|
| 6abc9c9a4e44297c26d7dd8b | VERSION ONE | 9352ebfc4aab2038f4a1b7353337fa5cedb07992ab9780b5d2c7266d52773ef1 | (none) |
| 6abc9cf2efa4a66ac438899d (current) | VERSION TWO | d1c4289cd7ce932b003236ae1bd1d03debcf3676e825fe66dd145ad1afffcbed | 6abc9ca15825f3ecfec265f5 |

- current file reads VERSION TWO; the old revision ID still reads VERSION ONE; hashes differ; history is immutable (new revision, old revision never overwritten).
- Draft revisions created by EDIT_FILE do not move the file pointer until SAVE_FILE — confirmed in the persisted chain.

## 10. Path security — PASS (denied)

| Attempt | Result |
|---|---|
| ../../etc/passwd | DENIED (platform gateway 403) |
| ../workspace/inventory.csv | DENIED INVALID_PATH |
| /etc/passwd | DENIED PATH_FORBIDDEN |
| file:///etc/passwd | DENIED INVALID_PATH |
| https://example.com/file.csv | DENIED INVALID_PATH |
| C:\Windows\System32 | DENIED INVALID_PATH |
| /workspace/inventory.csv | ALLOWED (positive control) |

## 11. Terminal Lite — PASS (with a gating caveat)

Allowed, all COMPLETED with output from real workspace operations: `pwd`, `ls`, `cat`, `head`, `wc`, `find`, `mkdir`.
Refused, all FAILED closed: `bash`, `curl`, `rm -rf`, `ls | sh`, `cat /etc/passwd` (PATH_FORBIDDEN), `ls /workspace -la` (flags), `node -e 1`. No pipes, redirection, interpolation, or subprocess path exists.

Caveat: a non-special action is gated on the *currently active app*, so TERMINAL returns
ACTION_UNAVAILABLE unless the caller supplies `app_id: "aca.terminal"`. It never reached a
host shell in either case.

## 12. Wallet secret isolation — PASS

- READ_WALLET returns only: public `kaspatest:` address, chain-backed balance (1000000000 sompi = 10 tKAS observed 2026-09-30T05:…), network, and CONFIRMED/SETTLED transaction list.
- `GET_MNEMONIC` → ACTION_UNAVAILABLE. `EvolveAgentKey` (the only holder of signing material) is read-disabled at entity level, and no ACA function or module reads it.
- No ACA action type exists that can return a key, seed, or signing secret.

## 13. Cross-agent isolation — PASS (via identifier substitution)

No second ACA computer exists in V0.1 (attachment is AGT_0011 only), so isolation was tested by substituting identifiers:

| Attempt | Result |
|---|---|
| acaComputer with agent_id AGT_0012 | DENIED AGENT_UNAVAILABLE |
| foreign/random computer_id (resource + workspace) | DENIED |
| foreign/random file_id | DENIED |
| foreign/random artifact_id | DENIED (capability gate) |
| A#011 session → another session's id | DENIED SESSION_FORBIDDEN |

Every record access is checked by `assertScope` against `computer_id` + `agent_id`.

## 14. Unavailable capabilities — PASS

GENERAL INTERNET, CODE EXECUTION, ARBITRARY SHELL, PACKAGES, TOOL NETWORK, JOB CLAIMING, JOB SUBMISSION, PAYMENTS, TRANSFERS, SKILL LEARNING, AUTONOMOUS CONTROL:
all DENIED ACTION_UNAVAILABLE. `RUN` → UNAVAILABLE. TOOLS → `NO TOOL NETWORK CONNECTED` with an empty list. Browser/Research expose only `aca://home`, `aca://jobs`, `aca://file/...`; any other address → RESOURCE_UNAVAILABLE.

## 17. Build / error isolation

- `vite build` completes (only two pre-existing warnings: stale browserslist data and an ambiguous `duration-[1500ms]` class elsewhere in the app).
- ACA has its own error boundary (`ACAErrorBoundary.jsx`) and is mounted lazily as an overlay from `EvolveApp.jsx`.
- Forced ACA rendering error in the UI — NOT RUN.

## 18. Change boundary

NEW ACA FILES — 70
- 12 entities: AgentComputer, AgentComputerSession, ACAWorkspaceEntry, ACAFileRevision, AgentArtifact, ACAActionExecution, ACAActionEvent, ACASessionCheckpoint, ACAAppManifest, AgentSkill, ACAMemoryEntry, ACAVerificationResult
- 6 functions: acaComputer, acaSession, acaAction, acaWorkspace, acaResource, acaHistory
- 17 shared modules under base44/shared/aca/
- 8 frontend modules under src/lib/aca/
- 25 UI files under src/components/evolve/aca/
- 2 documents under src/docs/

EXISTING FILES MODIFIED — 3, all in the EVOLVE inspector shell
- src/components/evolve/AgentInspector.jsx — adds the COMPUTER entry point for A#011 (admin only)
- src/components/evolve/ActorInspector.jsx — same entry point from the map-click inspector
- src/components/evolve/EvolveApp.jsx — lazily mounts the ACA overlay

NOT MODIFIED (explicitly confirmed by grep + inspection):
- human-facing TTT apps — untouched
- Kaspa transaction engine / TN10 signing / wallet generation — untouched; no ACA module writes any EVOLVE entity (grep for `.create/.update/.delete` on `entities.Evolve*` inside ACA returns NONE; all ACA references to EVOLVE entities are reads)
- Agent Factory, world simulation, map system, legacy job processor — untouched

## 19. Next phase

Not started. No AI brain, no job claiming, no job submission, no TN10 payouts, no Tool
Network, no E2B, no reproduction.

## Defects found (reported, not silently fixed)

1. **Error mapping.** A nonexistent computer/file id throws inside the SDK `get()` and surfaces as `INTERNAL_ERROR` instead of `COMPUTER_NOT_FOUND` / `FILE_NOT_FOUND`. Access is still denied; only the code is wrong. (3 occurrences)
2. **Action gating is implicit.** Non-special actions require the target app to be the active app or passed as `app_id`, otherwise `ACTION_UNAVAILABLE`. Correct for security, confusing for callers.
3. **Early-failure bookkeeping.** Actions rejected during validation (unknown action type) record `sequence: 1` and do not increment session counters, because the session is loaded after validation.
4. **Browser browsing writes.** `NAVIGATE` / `OPEN_RESOURCE` create a snapshot file in `/downloads`. Intentional, but it means browsing is not read-only.

## UI acceptance

| Test | Result | Evidence |
|---|---|---|
| REAL FILE DISPLAY | PASS | FILES tab: inventory.csv = 22881 B, cleaned_inventory.csv = 15384 B. DATA tab: SELECTED /workspace/inventory.csv, SHA-256 d4cea4ad…86a7, REVISION 6abc94850c2c0b1e20b2cc16 — identical to the persisted record. Rendered rows are the dirty source rows (padded SKUs, `12x.99`, blank names), so the bytes were read, not regenerated. |
| REAL ARTIFACT DISPLAY | PASS | ARTIFACTS renders the persisted AgentArtifact filename `cleaned_inventory.csv`; metadata block reads persisted revision fields (FILE ID, REVISION, BYTES, MIME, SHA-256, CREATED, EXECUTION). |
| VERIFICATION DISPLAY | PASS | Renderer prints `verification.status` + `checks` + `summary` from the persisted ACAVerificationResult. Record 6abc9559e532c76b0da083e2 = PASS 11/11. The banner itself was not inside the captured screenshot. |
| LIVE UI | PASS | Screenshot shows a live session (174e6b1f) with the action inspector reading OPEN_APP / COMPLETED. In `useComputer.run()` the UI is set from the server response and then re-fetched — never optimistically — so the event is persisted before the UI moves. |
| CURSOR | PASS | Cursor moves only for `status === 'COMPLETED'`, resolved by `data-aca-target` === `event.target_id`. Every recorded target has a matching element: control:start, app:aca.files, file:…, control:transform, artifact:…, control:end. No match → no movement. |
| IDLE | PASS | Footer reads `TASK: IDLE` in the screenshot. No timer, interval or idle animation exists in ACACursor; it animates only on a new event id. |
| FAILED ACTION VISUALIZATION | PASS | Cursor ignores non-COMPLETED events; a failed action raises the red `FAILED · <code>` band and opens no window. Backend recorded FAILED with null target and no artifact. |
| REPLAY | PASS | `acaHistory` returns the nine actions in exact historical order with their targets. `replayReducer` is a pure projection of `event.view_state` — no clients, writes, dispatch or inference. Playback timing uses the real historical timestamps. |
| REPLAY IDEMPOTENCY | PASS | Counts before/after two full history loads: workspaceEntries 11, revisions 9, artifacts 1, verifications 1, executions 80, events 80, checkpoints 7 — identical. Wallet 1000000000 sompi unchanged. `run()` throws "Replay is read-only" while replaying and every action control is disabled. |
| REPLAY SNAPSHOT SAFETY | PASS | In replay the browser reads `tab.snapshot` from the projected view state and loads that historical `revision_id` from storage. NAVIGATE controls are disabled during replay, so no live resource is fetched or re-navigated. |
| WALLET UI | PASS | Shows ADDRESS, NETWORK, BALANCE and recorded transactions only, plus a disabled `PAYMENTS / TRANSFERS UNAVAILABLE`. States "No signing material is available to ACA." No key, mnemonic or seed control exists anywhere. |
| UNAVAILABLE CAPABILITIES | PASS | CODE shows "CODE EXECUTION UNAVAILABLE" with a disabled `RUN UNAVAILABLE`; TOOLS shows "NO TOOL NETWORK CONNECTED" with a disabled button. No fabricated tool catalog. |
| RESPONSIVE UI | PASS | `@media(max-width:800px)` and `@media(max-height:500px)` adjust the sidebar, window margin and metadata grid; `.aca-main` is a flex row with `overflow:hidden` and a `min-width:0` workspace, and the sidebar scrolls. Cursor targets are measured with `getBoundingClientRect()` at event time, so they follow the real layout and cannot resolve to imaginary coordinates. |
| ERROR ISOLATION | NOT RUN | Not forced at runtime. Structurally, ACAErrorBoundary wraps only the ACA overlay and renders "ACA VIEW FAILED / Return to EVOLVE" inside it; EVOLVE, the map, the inspectors, Factory and Jobs sit outside that tree. |

Runtime non-admin authorization probe: NOT RUN (the session is admin); enforcement is
code-level in the authorization layer.

## Repair pass (post-acceptance)

Three defects found during verification were repaired surgically. No features added.

### Repair 1 — error mapping

Missing identifiers no longer collapse into INTERNAL_ERROR. A bounded lookup helper
(`find`) turns an expected miss into an explicit domain error:

| Case | Before | After |
|---|---|---|
| nonexistent computer | INTERNAL_ERROR | COMPUTER_NOT_FOUND |
| nonexistent workspace file (by id or path) | INTERNAL_ERROR / WORKSPACE_FORBIDDEN | FILE_NOT_FOUND |
| nonexistent revision | INTERNAL_ERROR | REVISION_NOT_FOUND |
| nonexistent artifact | INTERNAL_ERROR | ARTIFACT_NOT_FOUND |
| nonexistent session | INTERNAL_ERROR | SESSION_NOT_FOUND |

A foreign-but-existing session now returns SESSION_FORBIDDEN rather than being reported
as missing. INTERNAL_ERROR remains reserved for genuine faults. No database detail,
storage path, stack trace or credential is returned; URLs are still masked.

### Repair 2 — explicit app/action contract

`ACTION_CONTRACTS` now declares, per action, `action_type`, `allowed_app_ids`,
`required_capabilities` and `args`. It is derived from the two existing sources of truth
(app manifests and the action argument schema) so it cannot drift from the runtime.

A request from the wrong app is refused deterministically, without rerouting and without
auto-opening another app:

```
TERMINAL cannot run in aca.files; allowed apps: aca.terminal
OPEN_FILE cannot run in aca.wallet; allowed apps: aca.files, aca.editor, aca.data, aca.code, aca.documents
```

### Repair 3 — failed action sequencing

The session is now resolved **before** validation, so every rejection is attributed to
real session history with a monotonic sequence. Verified on two new sessions:

| Session | Recorded history |
|---|---|
| ACA_SESSION_7fb0e3ca-7c24-400f-80e5-5cc33f1361dc | 1 START_SESSION · 2 NOT_A_REAL_ACTION FAILED · 3 OPEN_FILE FAILED · 4 READ_WALLET · 5 OPEN_APP · 6 SAVE_NOTE · 7 END_SESSION |
| 6abcb1f20fcf6bdcccf000ef | 1 START_SESSION · 2 OPEN_APP · 3 OPEN_FILE FAILED · 4 TERMINAL FAILED · 5 OPEN_ARTIFACT FAILED · 6 TERMINAL FAILED · 7 OPEN_APP · 8 END_SESSION |

Strictly monotonic in both. The only event holding sequence 1 is a legitimate
START_SESSION — the previous "1 FAILED, 1 FAILED" pattern is gone. Counters match exactly:
7 attempts → actions 7 / events 7; 8 attempts → actions 8 / events 8. No attempt is
recorded twice. Failed events persist with status FAILED and still cannot move the cursor.

Replay remains read-only: two history loads left executions and events unchanged
(89 → 89). The original 500 → 423 session still replays with its nine actions, all
COMPLETED, compute 9.

Build passes with only the two pre-existing warnings.

Files changed: `base44/shared/aca/authorization.ts`, `base44/shared/aca/actions.ts` (new),
`base44/shared/aca/validation.ts`, `base44/shared/aca/workspace.ts`,
`base44/shared/aca/history.ts`, `base44/shared/aca/operations.ts`,
`base44/shared/aca/runtime.ts`, `base44/functions/acaWorkspace/entry.ts`.

## Not yet proven

Forced ACA render failure at runtime, and the non-admin authorization probe at runtime.