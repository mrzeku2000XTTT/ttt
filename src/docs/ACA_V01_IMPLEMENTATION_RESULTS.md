# ACA Prototype V0.1 — actual implementation results

## Completed backend demonstration

- Computer: ACA_0011 (record 6abc93b991075097eb902681)
- Agent: AGT_0011 / A#011; existing record 6abc7fd1dfd19dc3f96bdb02
- Session: ACA_SESSION_cc8e4681-a118-47c8-93c1-5783edbd04a6
- Session record: 6abc940361aac6bd62300bc6
- Session status: COMPLETED
- Real actions: 9; persisted action events: 9
- SIM COMPUTE used: 9; tKAS tool/payment cost: 0 (no transaction)

### Input

- /workspace/inventory.csv
- File ID: 6abc94859fa5b8e89a8f03e7
- Revision ID: 6abc94850c2c0b1e20b2cc16
- UTF-8 bytes: 22881
- Actual CSV data rows: 500
- SHA-256: d4cea4ad5c706d891aefcdfd4055ac5a352492e1588af0606ee01d9fd83886a7

### Output

- /workspace/cleaned_inventory.csv
- File ID: 6abc9558df5617657ba6cfed
- Revision ID: 6abc95588231b4289e3223c0
- UTF-8 bytes: 15384
- Actual rows: 423
- Duplicates removed: 48
- Invalid rows removed: 29
- Normalized fields: 1480
- SHA-256: 85970a08153cf6da7c618a17a19d2aaa5fe7b5dd84c2578943c5f5beb7cab05a
- Artifact ID: 6abc959b040ae772148643e6
- Verification ID: 6abc9559e532c76b0da083e2
- Verification: PASS, from independently rereading the actual private output bytes.
- Checks passed: CSV parsing, required columns, preserved columns, nonempty output, unique SKU, valid prices, required values, row constraints, expected valid row preservation, first-valid duplicate policy, UTF-8 decoding.
- Measured transform execution duration: 3748 ms (includes storage operations).

### Read-only wallet observation

The ACA read adapter returned the existing public TN10 address with 1000000000 sompi (10 tKAS) at 2026-09-30T04:55:07.543Z. This was a read, not a payment or balance write. No recorded confirmed EVOLVE transactions were returned.

## Test status — no invented passes

Backend initialization, private file creation/retrieval/hash checks, actual CSV processing, deterministic verification, artifact export/opening, session lifecycle, history retrieval and the public wallet read were exercised through deployed functions. The frontend compiled successfully.

The user-facing UI flow, LIVE cursor presentation, replay playback twice, editor save/reload, and negative security/reality suite have NOT been run by the Testing Agent. They are NOT marked passed. See ACA_V01_ACCEPTANCE.md for its run goal.

Reality tests 1 (bytes), 4 (CSV transform), 5 (artifact metadata) have backend proof; frontend checks remain pending. Tests 2,3,6–17 remain NOT RUN. Read-only replay is implemented as a pure historical projection with no mutation calls, but actual playback/no-growth acceptance is still NOT RUN.

## Disabled capabilities

Code execution, general internet, arbitrary shell, packages, claiming/submission, payments/transfers, remote tools, skill learning and autonomous control are unavailable. E2B was not connected. Tools explicitly says NO TOOL NETWORK CONNECTED. Supported files are bounded UTF-8 text/CSV/JSON/source files; binary imports and PDF/DOCX/video/audio/archive handling are not provided.

## Existing files minimally changed

- src/components/evolve/AgentInspector.jsx — COMPUTER entry for A#011, admin only.
- src/components/evolve/ActorInspector.jsx — same map-click entry.
- src/components/evolve/EvolveApp.jsx — lazy ACA overlay mounting.

No EvolveAgent data, map, Factory, legacy job code, TN10 signing/payments, human TTT applications, or application routes were modified.

## New files

Entities under base44/entities/:
AgentComputer.jsonc, AgentComputerSession.jsonc, ACAWorkspaceEntry.jsonc, ACAFileRevision.jsonc, AgentArtifact.jsonc, ACAActionExecution.jsonc, ACAActionEvent.jsonc, ACASessionCheckpoint.jsonc, ACAAppManifest.jsonc, AgentSkill.jsonc, ACAMemoryEntry.jsonc, ACAVerificationResult.jsonc.

Shared modules under base44/shared/aca/:
authorization.ts, browser.ts, contracts.ts, csv.ts, dataTransforms.ts, demoFixture.ts, evolveReadAdapter.ts, history.ts, manifests.ts, operations.ts, resources.ts, runtime.ts, terminal.ts, toolNetworkAdapter.ts, validation.ts, verification.ts, workspace.ts.

Function entry.ts files under base44/functions/:
acaComputer, acaSession, acaAction, acaWorkspace, acaResource, acaHistory.

Frontend modules under src/lib/aca/:
client.js, cursorTargets.js, demoPlan.js, replayReducer.js, table.js, useActivity.js, useComputer.js, useWorkspace.js.

UI under src/components/evolve/aca/:
ACAActionInspector.jsx, ACAActivity.jsx, ACAAppDock.jsx, ACAArtifactViewer.jsx, ACABrowser.jsx, ACACode.jsx, ACAComputer.jsx, ACAComputerLaunch.jsx, ACACursor.jsx, ACAData.jsx, ACADevControl.jsx, ACADocuments.jsx, ACAEditor.jsx, ACAErrorBoundary.jsx, ACAFiles.jsx, ACAJobs.jsx, ACAMemory.jsx, ACAReplayControls.jsx, ACAResearch.jsx, ACATerminal.jsx, ACATools.jsx, ACATopBar.jsx, ACAWallet.jsx, ACAWindowHost.jsx, aca.css.

Documents under src/docs/:
ACA_V01_ACCEPTANCE.md, ACA_V01_IMPLEMENTATION_RESULTS.md.

Total new files: 70. The extra browser/validation/operations helpers and launch boundary keep the implementation focused and the existing EVOLVE shell isolated.