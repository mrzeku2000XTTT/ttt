import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ARGENT_SPEC = `Argent is a brand-new actor-based language by Michael Sutton that compiles to Kaspa covenant scripts.
An Argent app is a set of named actions. Each action body has three sections in this order:
- consumes:  input UTXOs (with type/state) the action requires.
- emits:     new output UTXOs the action produces.
- become:    the new state each consumed UTXO transitions to (or "spent").
Uniqueness is often enforced with a compressed sparse Merkle tree (worst case 256 levels).
Two registration paths: a bounded fast path (compressed proofs) + a general fallback, to keep script size and fees low.
KCC-02 / KCC-03 standards are still being debated, so exact ownership/auth opcodes are NOT final.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["ok", "errors", "warnings"] },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          line: { type: ["integer", "null"] },
          message: { type: "string" },
          fix: { type: "string" },
        },
        required: ["message", "fix"],
      },
    },
    warnings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          line: { type: ["integer", "null"] },
          message: { type: "string" },
        },
        required: ["message"],
      },
    },
    summary: { type: "string" },
    suggestedFixes: { type: "array", items: { type: "string" } },
  },
  required: ["status", "errors", "warnings", "summary", "suggestedFixes"],
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const code = (body?.code || '').toString();
    if (!code.trim()) return Response.json({ error: 'No code provided' }, { status: 400 });

    const prompt = `You are the Argent language static compiler/linter for Kaspa covenants. Analyze the Argent .ag code below and return a STRICT compile report as JSON. Static analysis only; do not execute anything. ${ARGENT_SPEC}

Rules:
- status "ok" only if there are zero errors AND zero warnings.
- status "errors" if any errors. status "warnings" if only warnings, no errors.
- Every action must have consumes, emits, and become sections. Flag missing sections.
- Flag undeclared references in consumes/emits/become.
- Flag any opcode that depends on a not-yet-final KCC standard as a WARNING, not an error.
- Flag any "consumes" item never referenced in "become" (each consumed UTXO must become spent or a new state).
- summary: one plain-English sentence describing what the covenant does.
- suggestedFixes: short concrete next-step fixes (empty array if none).

Argent .ag code to analyze:
---
${code}
---`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt,
      response_json_schema: RESPONSE_SCHEMA,
    });

    // InvokeLLM with a json_schema returns a parsed object; guard both shapes.
    const report = (result && typeof result === 'object' && result.status)
      ? result
      : (result && typeof result === 'object' && result.response && typeof result.response === 'object' && result.response.status)
        ? result.response
        : { status: 'unparseable', raw: typeof result === 'string' ? result : JSON.stringify(result), errors: [], warnings: [], summary: 'Compile API returned an unexpected shape.', suggestedFixes: [] };

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}