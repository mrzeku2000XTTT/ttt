import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_ITERATIONS = 25;

// ─── Tool definitions (Anthropic tool-use format) ─────────────────────────────
const TOOLS = [
  {
    name: 'list_files',
    description: 'List all files in the project with their paths and sizes. Use this first to understand the project structure.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'read_file',
    description: 'Read the full contents of a file. Use this before editing to understand the current code.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'File path, e.g. /Home.jsx' } },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Create a new file OR fully overwrite an existing file. Use for new files or when rewriting a whole file. For small targeted edits, prefer find_replace.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string', description: 'Full file contents.' },
        type: { type: 'string', enum: ['jsx', 'js', 'css', 'md', 'json'], description: 'File type (inferred from extension if omitted).' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'find_replace',
    description: 'Make a precise, targeted edit to an existing file. The "find" string must match EXACTLY once in the file. Include enough context to make it unique. Preferred for small edits.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        find: { type: 'string', description: 'Exact text to find (must match exactly once).' },
        replace: { type: 'string', description: 'Replacement text.' }
      },
      required: ['path', 'find', 'replace']
    }
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the project.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path']
    }
  },
  {
    name: 'finish',
    description: 'Call this when the task is fully complete. Provide a brief summary (1-3 sentences) of what you changed.',
    input_schema: {
      type: 'object',
      properties: { summary: { type: 'string' } },
      required: ['summary']
    }
  }
];

const SYSTEM_PROMPT = `You are an autonomous React + Tailwind coding agent working inside "OneShot Studio", a live web IDE. You behave like Claude Code: you investigate, plan, edit real files, and verify your work — all via tool calls.

WORKFLOW:
1. Start by calling list_files to see the project structure.
2. Call read_file on any files relevant to the user's request.
3. Make edits with find_replace (preferred for small changes) or write_file (for new/rewrites).
4. Keep going until the task is fully done, then call finish with a summary.

ENVIRONMENT:
- React + Tailwind only. No external npm packages beyond React + Tailwind + lucide icons.
- lucide-react icons are GLOBAL — use <Zap />, <Heart />, etc. directly. Do NOT import from 'lucide-react'.
- React hooks (useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, Fragment) are GLOBAL. Do NOT import React or hooks.
- framer-motion is NOT available. Use Tailwind transitions/animations.
- Components import each other via relative paths with .jsx extension: import Hero from './Hero.jsx'
- Every component file must default-export one component.
- The entry file is what renders in the live preview.

EDITING RULES:
- ALWAYS read a file before editing it (unless you just wrote it).
- Use find_replace for targeted edits — include enough surrounding context for a unique match.
- Use write_file for creating new files or when rewriting more than ~60% of a file.
- Preserve existing functionality the user didn't ask to change.
- Break large components into smaller focused files.

AUTONOMY:
- Run autonomously until the task is complete. Do not ask the user clarifying questions mid-task — make reasonable decisions.
- When done, call finish. If you hit an unrecoverable problem, call finish with a clear explanation.
- Be efficient: don't re-read files you already read, don't make redundant list_files calls.`;

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  const base44 = createClientFromRequest(req);
  let user;
  try {
    user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
  } catch {
    return json({ error: 'Unauthorized' }, 401);
  }

  let payload;
  try { payload = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { projectId, userMessage } = payload || {};
  if (!projectId || !userMessage) return json({ error: 'Missing projectId or userMessage' }, 400);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);

  // Load project
  const projects = await base44.entities.OneShotProject.filter({ id: projectId });
  let project = projects[0];
  if (!project) return json({ error: 'Project not found' }, 404);
  if (project.created_by !== user.email) return json({ error: 'Forbidden' }, 403);

  // Stream via SSE so the UI can show live tool calls
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // Working file state (in-memory, committed at the end)
        let files = project.files.map(f => ({ ...f }));
        const changedPaths = new Set();

        // Build initial message context
        const messages = [
          {
            role: 'user',
            content: `PROJECT: ${project.name}
ENTRY FILE: ${project.entry_file || '/Home.jsx'}
FILES: ${files.length}

USER REQUEST:
${userMessage}`
          }
        ];

        let iterations = 0;
        let finalSummary = null;

        while (iterations < MAX_ITERATIONS) {
          iterations++;
          send({ type: 'iteration', n: iterations });

          // Call Claude
          const resp = await fetch(ANTHROPIC_URL, {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 8192,
              system: SYSTEM_PROMPT,
              tools: TOOLS,
              messages
            })
          });

          if (!resp.ok) {
            const errText = await resp.text();
            send({ type: 'error', message: `Anthropic API error: ${resp.status} ${errText.slice(0, 300)}` });
            break;
          }

          const data = await resp.json();
          const stopReason = data.stop_reason;
          const contentBlocks = data.content || [];

          // Emit any text (Claude's "thinking" out loud)
          for (const block of contentBlocks) {
            if (block.type === 'text' && block.text?.trim()) {
              send({ type: 'thought', text: block.text });
            }
          }

          // Push assistant turn verbatim to messages
          messages.push({ role: 'assistant', content: contentBlocks });

          // If not tool_use, we're done (or model gave up)
          if (stopReason !== 'tool_use') {
            const textOnly = contentBlocks.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
            finalSummary = textOnly || 'Done.';
            break;
          }

          // Execute each tool call and gather results
          const toolResults = [];
          let shouldFinish = false;

          for (const block of contentBlocks) {
            if (block.type !== 'tool_use') continue;

            const { id: toolUseId, name, input } = block;
            send({ type: 'tool_call', name, input: summarizeInput(name, input) });

            let result;
            try {
              switch (name) {
                case 'list_files': {
                  result = files.map(f => `${f.path} (${f.content.length} chars)`).join('\n') || '(empty project)';
                  break;
                }
                case 'read_file': {
                  const f = files.find(x => x.path === input.path);
                  if (!f) result = `ERROR: File not found: ${input.path}`;
                  else result = f.content;
                  break;
                }
                case 'write_file': {
                  const path = input.path;
                  const content = input.content || '';
                  const type = input.type || inferType(path);
                  const idx = files.findIndex(x => x.path === path);
                  if (idx === -1) {
                    files.push({ path, content, type });
                    result = `Created ${path} (${content.length} chars)`;
                  } else {
                    files[idx] = { ...files[idx], content, type };
                    result = `Overwrote ${path} (${content.length} chars)`;
                  }
                  changedPaths.add(path);
                  send({ type: 'file_change', action: idx === -1 ? 'create' : 'update', path });
                  break;
                }
                case 'find_replace': {
                  const path = input.path;
                  const find = input.find;
                  const replace = input.replace ?? '';
                  const idx = files.findIndex(x => x.path === path);
                  if (idx === -1) { result = `ERROR: File not found: ${path}`; break; }
                  const current = files[idx].content;
                  const occurrences = current.split(find).length - 1;
                  if (occurrences === 0) { result = `ERROR: "find" string not found in ${path}. Read the file again and use exact matching text.`; break; }
                  if (occurrences > 1) { result = `ERROR: "find" string matches ${occurrences} times in ${path}. Add more surrounding context to make it unique.`; break; }
                  files[idx] = { ...files[idx], content: current.replace(find, replace) };
                  changedPaths.add(path);
                  result = `Edited ${path} — replaced 1 match.`;
                  send({ type: 'file_change', action: 'update', path });
                  break;
                }
                case 'delete_file': {
                  const before = files.length;
                  files = files.filter(x => x.path !== input.path);
                  if (files.length === before) { result = `ERROR: File not found: ${input.path}`; break; }
                  changedPaths.add(input.path);
                  result = `Deleted ${input.path}`;
                  send({ type: 'file_change', action: 'delete', path: input.path });
                  break;
                }
                case 'finish': {
                  finalSummary = input.summary || 'Done.';
                  result = 'Task marked complete.';
                  shouldFinish = true;
                  break;
                }
                default:
                  result = `ERROR: Unknown tool: ${name}`;
              }
            } catch (e) {
              result = `ERROR executing ${name}: ${e.message}`;
            }

            send({ type: 'tool_result', name, summary: summarizeResult(name, result) });
            toolResults.push({ type: 'tool_result', tool_use_id: toolUseId, content: String(result) });
          }

          // Feed tool results back as the next user turn
          messages.push({ role: 'user', content: toolResults });

          if (shouldFinish) break;
        }

        if (!finalSummary) finalSummary = `Stopped after ${iterations} iterations without explicitly finishing.`;

        // Commit file changes + chat history to the project
        const changedArray = Array.from(changedPaths);
        const newChatHistory = [
          ...(project.chat_history || []),
          { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
          { role: 'assistant', content: finalSummary, files_changed: changedArray, timestamp: new Date().toISOString() },
        ];

        const updated = await base44.entities.OneShotProject.update(projectId, {
          files,
          chat_history: newChatHistory,
        });

        send({ type: 'done', project: updated, summary: finalSummary, files_changed: changedArray, iterations });
      } catch (err) {
        console.error('oneshotAgent error:', err);
        send({ type: 'error', message: err.message || String(err) });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(),
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
    }
  });
});

// ─── helpers ──────────────────────────────────────────────────────────────────
function inferType(path) {
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.md')) return 'md';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.js')) return 'js';
  return 'jsx';
}
function summarizeInput(name, input) {
  if (name === 'write_file') return { path: input.path, size: (input.content || '').length };
  if (name === 'find_replace') return { path: input.path, find_preview: String(input.find || '').slice(0, 60) };
  if (name === 'read_file' || name === 'delete_file') return { path: input.path };
  if (name === 'finish') return { summary: input.summary };
  return input;
}
function summarizeResult(name, result) {
  const s = String(result);
  if (s.length <= 140) return s;
  return s.slice(0, 140) + '…';
}
function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
  };
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'content-type': 'application/json' }
  });
}