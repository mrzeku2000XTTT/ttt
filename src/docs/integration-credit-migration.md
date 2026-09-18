# Integration credit migration — incomplete

## Audit, 2026-09-18

Read-only recursive inventory covered JS/JSX/TS/TSX under src/ and base44/, including integration aliases. Initial audit found restricted user-scoped references in 260 files. UploadFile (legacy upload alias), UploadPublicFile, and UploadPrivateFile were excluded from restricted-call counts. src/api/integrations.js re-exports include unused restricted references; no imports of that module were found.

After this batch: 447 restricted references remain in 239 frontend files (including 5 legacy exports). No direct user-scoped restricted Core references remain under base44/. This is NOT a completed app-wide security migration. Already-service-role public endpoints also need their authorization and abuse controls reviewed; moving calls alone does not impose a spending budget.

## Completed batch

New authenticated, bounded, app-specific operations, with server-owned prompts/schemas:
- generateProductConcept: fixed four product photography directions, one image per call, up to three references; Product Studio caller updated, client uploads preserved.
- flagSenseAssistant: coach / rewrite only; both FlagSense callers updated.
- writeMessageVersions: MsgCraft's three message variants.
- suggestFridgeRecipes: PlatePal's photo-to-recipes operation; client upload remains.
- draftBlogPost: blog draft generation.
- askBlogPost: loads the selected post by ID using user-scoped access rather than trusting caller-supplied content; rejects another user's unpublished post.
- searchStoreApps: semantic catalog matching; validates input and returned app names; guest app-store search remains local and does not call AI.
- answerTTTQuestion: structured question/task routing and grounded short answers; live-price path unchanged.

Existing backend conversions to asServiceRole.integrations.Core:
agentAutoPost, agentCreatePost, analyzeImageWithAgentYing, analyzeNews, analyzeUploadedFile, chatWithAgentYing, fetchThreatIntel, getSmartFeed, saveConversation, submitKaspaSite, submitXProfile, verifyProofOfWork.

Admin posting remains admin-only. Added authentication to previously unauthenticated threat-intelligence/site-submission/profile-submission functions. Site and X-profile submission callers now provide a login path. Existing user-scoped entity operations were not elevated. Upload handling and existing pages were preserved.

Helpers:
- base44/shared/creditOperation.ts: method/auth/body bounds and reusable input validation; not an HTTP proxy.
- base44/shared/creditAccessCheck.ts: `_checkIntegrationAccess: true` returns only after normal auth/role checks; permits no-spend diagnostics without posting, storing proofs, or running generations.
- src/components/integrations/invokeProtectedOperation.js: SDK invocation, response unwrapping, login redirect, readable errors.

## Checks and deployment caveat

All eight new operations rejected empty/invalid inputs with HTTP 400 in the backend testing tool. MsgCraft's successful test returned three message variants. All twelve converted backend functions passed authenticated no-spend access probes. Initial static parse of 34 changed files passed.

Unauthenticated calls to the eight new operation URLs returned HTTP 401. Production requests to existing function URLs still hit older published implementations: notably fetchThreatIntel returned 200; submitKaspaSite / submitXProfile returned input errors without the new authentication requirement. Do NOT treat that as verification of the edited draft. Do not re-run unprotected production functions just to test them, because they can spend credits and mutate records.

Official documentation confirms edits to existing backend functions need publishing/redeployment before production uses them. Publish from main / App Settings only when ready. End-to-end UI flows should be handed to the Testing Agent, and published authorization should be rechecked after deployment using no-spend requests.

## Remaining work

Next priorities: client SendEmail flows (Contact, BullMoon, MIRAGE, NODA, RMX, UltraMock), private-file signed URL operations with record-ownership checks, remaining media generators and transcription, Niche/ETA/video pipelines, app-specific agents, builder tools, and remaining lifestyle/pages.

Do not replace remaining calls with a generic InvokeLLM/GenerateImage/SendEmail proxy. Each flow needs a narrow server operation, fixed server-owned options, authenticated authorization, bounded app inputs, matching caller updates, and validation. Preserve UploadPublicFile/UploadPrivateFile in browser code. For email, derive authorized recipients and attachments on the server instead of accepting arbitrary recipient/body payloads.