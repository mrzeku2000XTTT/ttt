import { base44 } from "@/api/base44Client";

/**
 * NODA Inspector — a second AI agent that CHECKS the work of a finished workflow run.
 * It compares the user's original request against every step's actual output and
 * returns per-step verdicts plus which steps should be retried.
 */
export async function inspectWorkflowRun({ intent, nodes, context }) {
  const stepReport = nodes.map((n, i) => {
    const out = context[n.id];
    let outStr = "";
    if (out === undefined || out === null) outStr = "(no output)";
    else if (typeof out === "string") outStr = out.slice(0, 800);
    else { try { outStr = JSON.stringify(out).slice(0, 800); } catch { outStr = String(out); } }
    return `STEP ${i + 1} · type=${n.type} · label="${n.label}"\nconfig=${JSON.stringify(n.config || {}).slice(0, 300)}\noutput=${outStr}`;
  }).join("\n\n");

  return await base44.integrations.Core.InvokeLLM({
    prompt: `You are the NODA Inspector — a strict QA agent that verifies whether an automated workflow ACTUALLY did what the user asked.

USER'S ORIGINAL REQUEST:
"""${intent}"""

WORKFLOW EXECUTION REPORT:
${stepReport}

Check each step:
- Did it produce real, non-empty output that matches its purpose?
- deep_research must contain actual facts about the requested topic (not a different topic, not filler).
- post_to_ttt must show posted=true with a post_id — otherwise the post is NOT on the feed.
- send_email must show sent=true.
- ai_image must be a real https URL.
- Then check the OVERALL request: did the workflow, as a whole, accomplish everything the user asked for? List anything missing.

For each step give pass=true/false with a one-line reason. List indices (1-based) of failed steps that should be retried. Be strict but fair — a step with correct output passes.`,
    response_json_schema: {
      type: "object",
      properties: {
        overall_pass: { type: "boolean" },
        summary: { type: "string", description: "One-line overall verdict" },
        checks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step: { type: "number" },
              pass: { type: "boolean" },
              reason: { type: "string" },
            },
            required: ["step", "pass", "reason"],
          },
        },
        retry_steps: { type: "array", items: { type: "number" }, description: "1-based indices of steps to re-run" },
        missing: { type: "array", items: { type: "string" }, description: "Anything the user asked for that no step accomplished" },
      },
      required: ["overall_pass", "summary", "checks", "retry_steps"],
    },
  });
}