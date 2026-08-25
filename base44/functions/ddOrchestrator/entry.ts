import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// DD Orchestrator — a real agent loop.
// The LLM decides which tool to call, the system executes it, the result goes back,
// and the LLM decides the next step — until it produces a final answer.
// Every LLM call and tool execution is tracked as credits and converted to KAS.

const MAX_STEPS = 8;

// Credit costs per model (integration credits per LLM call)
const MODEL_CREDITS = {
  gemini_3_flash: 1,
  gpt_5_4: 3,
  claude_sonnet_4_6: 5,
  automatic: 1,
};
// Tool execution credit cost
const TOOL_CREDIT = 0.5;
// Conversion: 100 credits = 1 KAS (adjustable)
const CREDITS_PER_KAS = 100;
const SOMPI_PER_KAS = 100000000;
// KKDAG treasury — spent DD credits accrue here (users send KAS here to fund KKDAG)
const KKDAG_TREASURY = "kaspa:qq5yhvly6338dspa9mm24g8q6chvy6v0jww3k4dgqywh0lju5mmm5pj334ews";

// Tool definitions exposed to the LLM
const TOOLS = [
  {
    name: "list_emails",
    description: "List recent Gmail inbox messages (subject, from, snippet). Requires Gmail connected.",
    args: "{ count?: number (default 5) }",
  },
  {
    name: "read_email",
    description: "Read the full body of a specific Gmail message by ID.",
    args: "{ messageId: string }",
  },
  {
    name: "send_email",
    description: "Send an email via Gmail. Requires Gmail connected.",
    args: "{ to: string, subject: string, body: string }",
  },
  {
    name: "list_calendar_events",
    description: "List upcoming Google Calendar events for the next 7 days.",
    args: "{ count?: number (default 10) }",
  },
  {
    name: "create_calendar_event",
    description: "Create a new Google Calendar event. Requires Google Calendar connected.",
    args: "{ title: string, start: string (ISO datetime), end: string (ISO datetime), description?: string }",
  },
  {
    name: "list_drive_files",
    description: "List recent Google Drive files.",
    args: "{ count?: number (default 10) }",
  },
  {
    name: "list_docs",
    description: "List recent Google Docs.",
    args: "{ count?: number (default 10) }",
  },
  {
    name: "create_doc",
    description: "Create a new Google Doc with optional content. Requires Google Docs connected.",
    args: "{ title: string, content?: string }",
  },
  {
    name: "create_sheet",
    description: "Create a new Google Sheet. Requires Google Drive connected.",
    args: "{ title: string }",
  },
  {
    name: "research",
    description: "Research a topic on the web using ChatGPT + web search. Returns an answer with cited sources.",
    args: "{ query: string }",
  },
  {
    name: "create_task",
    description: "Create a task in the DD workspace for the user.",
    args: "{ title: string, priority?: string (low|medium|high) }",
  },
  {
    name: "list_tasks",
    description: "List the user's open DD tasks.",
    args: "{}",
  },
  {
    name: "final_answer",
    description: "Produce the final response to the user. Call this when the task is complete or no more tools are needed.",
    args: "{ answer: string }",
  },
];

function toolsPrompt() {
  return TOOLS.map((t) => `- ${t.name}: ${t.description}\n  args: ${t.args}`).join("\n");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { message, history, onboarding, model } = body;

    if (!message) return Response.json({ error: "No message provided" }, { status: 400 });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const email = user.email;
    const isAdmin = user.role === "admin";
    const useModel = model || "gemini_3_flash";
    const requestId = `dd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const steps = [];
    let totalCredits = 0;
    let llmCalls = 0;
    let toolCalls = 0;
    let kkdagBalanceAfter = null;

    // --- KKDAG credit wallet: admins get infinite credits, non-admins are charged ---
    // 1000 KKDAG ≈ one DD request of real Base44 integration compute. New users get a 1000 starter grant.
    const STARTER_GRANT = 1000;
    let kkdagWallet = null;
    if (!isAdmin) {
      try {
        const existing = await base44.entities.DDKKDAGWallet.filter({ user_email: email });
        kkdagWallet = existing && existing[0];
        if (!kkdagWallet) {
          kkdagWallet = await base44.entities.DDKKDAGWallet.create({
            user_email: email,
            balance: STARTER_GRANT,
            total_funded: STARTER_GRANT,
            total_spent: 0,
          });
        }
        if ((kkdagWallet.balance || 0) <= 0) {
          return Response.json({
            error: "out_of_credits",
            message: "You're out of KKDAG credits. Add more from the TTT wallet to keep using DD.",
            balance: 0,
            kkdag_treasury: KKDAG_TREASURY,
          }, { status: 402 });
        }
      } catch (e) {
        console.warn("KKDAG wallet pre-check failed:", e?.message);
      }
    }

    // Build conversation context from history
    const historyText = (history || []).slice(-6).map((m) => `${m.role === "user" ? "User" : "DD"}: ${m.text}`).join("\n");

    const o = onboarding || {};
    const systemPrompt = [
      `You are DD, a personal productivity agent with REAL tool access to the user's Google Workspace and DD tasks.`,
      `User: ${o.name || "there"}. ${o.role ? "Role: " + o.role + "." : ""} ${o.priorities ? "Priorities: " + o.priorities + "." : ""}`,
      `Style: ${o.style || "brief and direct"}.`,
      ``,
      `You have these tools available. To use one, respond with JSON: {"tool": "<name>", "args": {...}}.`,
      `When the task is complete, call "final_answer" with a helpful, specific response to the user.`,
      `Do NOT fabricate data — if a tool fails or isn't connected, tell the user to connect it in Settings.`,
      `If a tool returns empty results, say so honestly (e.g. "You have no upcoming events" or "No unread emails").`,
      `You can chain multiple tools across steps. Think step by step.`,
      `CRITICAL: When calling final_answer, the "answer" field MUST contain the FULL response to the user — never just "Done." or "Completed."`,
      `If a tool returned data, summarize it for the user. If a tool failed, explain what happened and what to do next.`,
      ``,
      `TOOLS:\n${toolsPrompt()}`,
    ].join("\n");

    // Tool executor — returns { step, data }
    async function executeTool(toolName, args) {
      toolCalls++;
      const step = { tool: toolName, args: JSON.stringify(args || {}).slice(0, 200), credits: TOOL_CREDIT, result_preview: "" };
      let data = {};
      try {
        switch (toolName) {
          case "list_emails": {
            const res = await base44.functions.invoke("ddGoogleAction", { action: "fetch", connectorType: "gmail" });
            if (res?.data?.connected === false) { step.result_preview = "Gmail not connected"; data = { error: "Gmail not connected. Tell the user to connect it in Settings." }; break; }
            const msgs = (res?.data?.messages || []).slice(0, args.count || 5);
            step.result_preview = msgs.length ? msgs.map((m) => `[${m.id}] ${m.subject} — from ${m.from}`).join("\n") : "No emails found";
            data = { messages: msgs };
            break;
          }
          case "read_email": {
            const res = await base44.functions.invoke("ddGoogleAction", { action: "read_email", connectorType: "gmail", messageId: args.messageId });
            step.result_preview = (res?.data?.body || "").slice(0, 300);
            data = res?.data || { error: "Could not read email" };
            break;
          }
          case "send_email": {
            const res = await base44.functions.invoke("ddGoogleAction", { action: "send_email", connectorType: "gmail", to: args.to, subject: args.subject, body: args.body });
            step.result_preview = res?.data?.sent ? `Sent to ${args.to}` : res?.data?.error || "Failed";
            data = res?.data || { error: "Failed" };
            break;
          }
          case "list_calendar_events": {
            const res = await base44.functions.invoke("ddGoogleAction", { action: "fetch", connectorType: "googlecalendar" });
            if (res?.data?.connected === false) { step.result_preview = "Google Calendar not connected"; data = { error: "Google Calendar not connected. Tell the user to connect it in Settings." }; break; }
            const events = (res?.data?.events || []).slice(0, args.count || 10);
            step.result_preview = events.length ? events.map((e) => `${e.summary} @ ${e.start?.dateTime || e.start?.date}`).join("\n") : "No upcoming events";
            data = { events };
            break;
          }
          case "create_calendar_event": {
            const res = await base44.functions.invoke("ddGoogleAction", { action: "create_event", connectorType: "googlecalendar", title: args.title, start: args.start, end: args.end, content: args.description });
            step.result_preview = res?.data?.id ? `Created: ${args.title}` : res?.data?.error || "Failed";
            data = res?.data || { error: "Failed" };
            break;
          }
          case "list_drive_files": {
            const res = await base44.functions.invoke("ddGoogleAction", { action: "fetch", connectorType: "googledrive" });
            if (res?.data?.connected === false) { step.result_preview = "Google Drive not connected"; data = { error: "Google Drive not connected. Tell the user to connect it in Settings." }; break; }
            const files = (res?.data?.files || []).slice(0, args.count || 10);
            step.result_preview = files.length ? files.map((f) => f.name).join(", ") : "No files found";
            data = { files };
            break;
          }
          case "list_docs": {
            const res = await base44.functions.invoke("ddGoogleAction", { action: "fetch", connectorType: "googledocs" });
            if (res?.data?.connected === false) { step.result_preview = "Google Docs not connected"; data = { error: "Google Docs not connected. Tell the user to connect it in Settings." }; break; }
            const docs = (res?.data?.docs || []).slice(0, args.count || 10);
            step.result_preview = docs.length ? docs.map((d) => d.name).join(", ") : "No docs found";
            data = { docs };
            break;
          }
          case "create_doc": {
            const res = await base44.functions.invoke("ddGoogleAction", { action: "create", connectorType: "googledocs", createType: "doc", title: args.title, content: args.content || "" });
            step.result_preview = res?.data?.url ? `Created doc: ${res.data.url}` : res?.data?.error || "Failed";
            data = res?.data || { error: "Failed" };
            break;
          }
          case "create_sheet": {
            const res = await base44.functions.invoke("ddGoogleAction", { action: "create", connectorType: "googlesheets", createType: "sheet", title: args.title });
            step.result_preview = res?.data?.url ? `Created sheet: ${res.data.url}` : res?.data?.error || "Failed";
            data = res?.data || { error: "Failed" };
            break;
          }
          case "research": {
            const res = await base44.functions.invoke("ddResearchAgent", { query: args.query });
            step.result_preview = (res?.data?.answer || "").slice(0, 300);
            data = res?.data || { error: "Research failed" };
            break;
          }
          case "create_task": {
            const rec = await base44.entities.DDTask.create({ user_email: email, title: args.title, priority: args.priority || "medium" });
            await base44.entities.DDActivity.create({ user_email: email, text: `Created task: ${args.title}`, icon: "✅" });
            step.result_preview = `Task created: ${args.title}`;
            data = { task: rec };
            break;
          }
          case "list_tasks": {
            const tasks = await base44.entities.DDTask.filter({ user_email: email, done: false }, "-created_date", 10);
            step.result_preview = tasks.map((t) => t.title).join(", ");
            data = { tasks };
            break;
          }
          default:
            step.result_preview = `Unknown tool: ${toolName}`;
            data = { error: `Unknown tool: ${toolName}` };
        }
      } catch (e) {
        step.result_preview = `Error: ${e.message}`;
        data = { error: e.message };
      }
      return { step, data };
    }

    // --- The loop ---
    let conversation = `${systemPrompt}\n\nConversation so far:\n${historyText}\n\nUser: ${message}`;
    let finalAnswer = null;

    for (let i = 0; i < MAX_STEPS; i++) {
      llmCalls++;
      const callCredits = MODEL_CREDITS[useModel] || 1;
      totalCredits += callCredits;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: conversation,
        model: useModel,
        response_json_schema: {
          type: "object",
          properties: {
            tool: { type: "string", description: "The tool to call, or 'final_answer'" },
            args: { type: "string", description: 'JSON string of arguments for the tool, e.g. "{\\"title\\":\\"Buy milk\\"}" or "{}" if no args needed' },
            reasoning: { type: "string", description: "Brief reasoning for this step" },
          },
          required: ["tool", "args", "reasoning"],
        },
      });

      const decision = typeof res === "object" ? res : null;
      if (!decision || !decision.tool) {
        finalAnswer = "I couldn't decide on a next step. Could you rephrase?";
        break;
      }

      const toolName = decision.tool;
      let args = {};
      try {
        args = typeof decision.args === "string" ? JSON.parse(decision.args) : (decision.args || {});
      } catch {
        args = {};
      }

      if (toolName === "final_answer") {
        let ans = args.answer || args.text || "";
        // If the answer is too terse or contains reasoning-style language, build a summary from the steps
        const isTerse = !ans || ans.length < 15 || /^(done|completed|finished|ok|okay)\.?$/i.test(ans.trim());
        const isReasoning = /I need to|i should|i must|tell the user|i'll|i will /i.test(ans);
        if (isTerse || isReasoning) {
          if (steps.length > 0) {
            const lastStep = steps[steps.length - 1];
            if (lastStep.result_preview?.includes("not connected")) {
              ans = `I tried to help but ${lastStep.result_preview}. You can connect your Google apps in Settings to enable this.`;
            } else if (lastStep.result_preview && !/^(no |no$)/i.test(lastStep.result_preview)) {
              ans = `Here's what I found: ${lastStep.result_preview}`;
            } else {
              ans = lastStep.result_preview || "I've completed the task.";
            }
          } else {
            ans = ans || "I've completed the task.";
          }
        }
        finalAnswer = ans;
        break;
      }

      // Execute the tool
      const { step, data } = await executeTool(toolName, args);
      totalCredits += TOOL_CREDIT;
      steps.push(step);

      // Feed the result back into the conversation
      const resultStr = typeof data === "string" ? data : JSON.stringify(data).slice(0, 1500);
      conversation += `\n\n[Step ${i + 1}] You called ${toolName} with ${JSON.stringify(args).slice(0, 150)}.\nResult: ${resultStr}\n\nNow decide your next step. Call "final_answer" when done.`;
    }

    if (!finalAnswer) {
      finalAnswer = "I've done what I can with the available tools. Let me know if you need more.";
    }

    // Convert credits to KAS
    const kaspaCost = totalCredits / CREDITS_PER_KAS;
    const kaspaCostSompi = Math.round(kaspaCost * SOMPI_PER_KAS);

    // Log credit usage
    try {
      await base44.entities.DDCreditUsage.create({
        user_email: email,
        request_id: requestId,
        credits_used: totalCredits,
        llm_calls: llmCalls,
        tool_calls: toolCalls,
        kaspa_cost_sompi: kaspaCostSompi,
        model: useModel,
        summary: message.slice(0, 200),
        steps,
      });
    } catch {}

    // Deduct KKDAG credits from the user's wallet (admins skipped — infinite credits).
    // The spent KKDAG accrues to the treasury address recorded above.
    if (!isAdmin && kkdagWallet) {
      try {
        const charge = Math.min(totalCredits, kkdagWallet.balance || 0);
        const newBalance = Math.max(0, (kkdagWallet.balance || 0) - charge);
        const newSpent = (kkdagWallet.total_spent || 0) + charge;
        await base44.entities.DDKKDAGWallet.update(kkdagWallet.id, {
          balance: newBalance,
          total_spent: newSpent,
        });
        kkdagBalanceAfter = newBalance;
      } catch (e) {
        console.warn("KKDAG wallet deduction failed:", e?.message);
      }
    }

    return Response.json({
      answer: finalAnswer,
      steps,
      credits: totalCredits,
      llm_calls: llmCalls,
      tool_calls: toolCalls,
      kaspa_cost: kaspaCost,
      kaspa_cost_sompi: kaspaCostSompi,
      request_id: requestId,
      model: useModel,
      kkdag_balance_after: kkdagBalanceAfter,
      kkdag_treasury: KKDAG_TREASURY,
      is_admin: isAdmin,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}