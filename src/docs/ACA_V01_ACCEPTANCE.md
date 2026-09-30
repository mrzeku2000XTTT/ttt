# ACA V0.1 acceptance

Use the Testing Agent to execute these checks in the published/preview UI as an authenticated admin. They have NOT been marked passed by implementation alone.

1. Select A#011 in EVOLVE and open COMPUTER. Verify ACA_0011 and AGT_0011.
2. Start session; create a TXT file. Reopen and inspect actual stored size/hash.
3. Edit and save; close ACA and reopen. Confirm persisted content and a different immutable revision/hash.
4. Open inventory.csv; confirm 500 stored rows. Run local clean to a new destination. Inspect actual output, independent verification and exact hash binding.
5. Export an artifact; confirm its bytes/hash match its revision.
6. End session; replay twice. Compare artifact/revision counts and compute credits before/after: unchanged.
7. Replay cursor/windows should follow only recorded successful events. Failures do not animate successful clicks.
8. Open Files/Data/Editor/Terminal/Research/Documents/Artifacts/Jobs/Wallet/Memory/Activity/Browser/Code/Tools. Supported controls operate; disabled features are clearly unavailable.
9. Exercise file rename (move), copy, folders, delete, and authorized download. Replay a historical revision after deletion.
10. Try ../../something, /etc/passwd, a URL path, unsupported terminal command, and wallet secret retrieval. All must fail; no sensitive fields returned.
11. Try a foreign agent file ID/revision against ACA_0011. Must fail authorization.
12. As a non-admin, direct ACA calls must fail and private entities must not be readable.
13. Leave idle. No random cursor activity, invented events or compute deductions.
14. Verify browser back/forward/reload/tabs navigate internal resources only. Research citations refer to actual workspace revisions.
15. Verify no EvolveAgent, wallet, world, Factory, legacy job, payment or human TTT app was changed by ACA operations.

Run goal: "Test ACA_0011 files, CSV cleaning, event-driven cursor and two read-only replays; verify persistence and rejected workspace/security operations."