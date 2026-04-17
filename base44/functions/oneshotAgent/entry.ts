import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MODEL = 'claude_sonnet_4_6';
const MAX_ITERATIONS = 25;

// JSON schema for a single agent action per turn.
const ACTION_SCHEMA = {
  type: 'object',
  properties: {
    thought: { type: 'string', description: 'Brief reasoning about what to do next (1-2 sentences).' },
    action: {
      type: 'string',
      enum: ['list_files', 'read_file', 'write_file', 'find_replace', 'delete_file', 'finish'],
      description: 'The single tool to invoke this turn.'
    },
    path: { type: 'string', description: 'File path for read_file / write_file / find_replace / delete_file.' },
    content: { type: 'string', description: 'Full file contents for write_file.' },
    file_type: { type: 'string', enum: ['jsx', 'js', 'css', 'md', 'json'], description: 'File type for write_file (optional).' },
    find: { type: 'string', description: 'Exact text to find for find_replace (must match once).' },
    replace: { type: 'string', description: 'Replacement text for find_replace.' },
    summary: { type: 'string', description: 'Final summary when action = finish.' }
  },
  required: ['thought', 'action']
};

const SYSTEM_PROMPT = `You are an autonomous React + Tailwind coding agent inside "OneShot Studio", a live web IDE.

You operate in a strict loop: each turn you output ONE action as JSON, the system executes it, and you receive the result on the next turn. Keep going until the task is done, then output action="finish" with a summary.

AVAILABLE ACTIONS:
- list_files — List project files (no params).
- read_file — {path}
- write_file — {path, content, file_type?}  Create or overwrite a file fully.
- find_replace — {path, find, replace}  Targeted edit; "find" must match exactly once.
- delete_file — {path}
- finish — {summary}  Call when the task is fully complete.

WORKFLOW:
1. First call list_files to see the project.
2. Read any files relevant to the user's request.
3. Edit with find_replace (small changes) or write_file (new files / full rewrites).
4. Call finish with a brief summary when done.

ENVIRONMENT:
- React + Tailwind only. No npm packages beyond React + Tailwind + lucide.
- lucide-react icons are GLOBAL: use <Zap />, <Heart />, etc. directly. Do NOT import from 'lucide-react'.
- React hooks (useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, Fragment) are GLOBAL. Do NOT import React or hooks.
- framer-motion is NOT available — use Tailwind transitions/animations.
- Components import each other via relative paths with .jsx: import Hero from './Hero.jsx'
- Every component file must default-export one component.

RULES:
- Always read a file before editing it (unless you just wrote it).
- For find_replace, include enough surrounding context so "find" is unique.
- Preserve existing functionality the user didn't ask to change.
- Never re-read a file you already have. Never re-call list_files if you already called it.
- Output ONE action per turn. No markdown, no commentary outside the JSON.`;

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

  const projects = await base44.entities.OneShotProject.filter({ id: projectId });
  const project = projects[0];
  if (!project) return json({ error: 'Project not found' }, 404);
  if (project.created_by !== user.email) return json({ error: 'Forbidden' }, 403);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        let files = project.files.map(f => ({ ...f }));
        const changedPaths = new Set();

        // Running transcript passed to the model each turn.
        const transcript = [];
        transcript.push(`USER REQUEST:\n${userMessage}`);
        transcript.push(`PROJECT: ${project.name}\nENTRY FILE: ${project.entry_file || '/Home.jsx'}\nTOTAL FILES: ${files.length}`);

        let iterations = 0;
        let finalSummary = null;

        while (iterations < MAX_ITERATIONS) {
          iterations++;
          send({ type: 'iteration', n: iterations });

          const prompt = `${SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSCRIPT SO FAR:
${transcript.join('\n\n---\n\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now output your next single action as JSON matching the schema.`;

          let action;
          try {
            const response = await base44.integrations.Core.InvokeLLM({
              prompt,
              response_json_schema: ACTION_SCHEMA,
              model: MODEL
            });
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            // Base44 sometimes wraps JSON schema results in a `response` key.
            action = (parsed && parsed.action) ? parsed : (parsed && parsed.response) ? parsed.response : parsed;
            if (!action || !action.action) {
              send({ type: 'error', message: `LLM returned invalid response: ${JSON.stringify(parsed).slice(0, 300)}` });
              break;
            }
          } catch (e) {
            send({ type: 'error', message: `LLM call failed: ${e.message || String(e)}` });
            break;
          }

          if (action.thought) {
            send({ type: 'thought', text: action.thought });
          }

          const toolName = action.action;
          send({ type: 'tool_call', name: toolName, input: summarizeInput(toolName, action) });

          let result;
          let shouldFinish = false;

          try {
            switch (toolName) {
              case 'list_files': {
                result = files.map(f => `${f.path} (${f.content.length} chars)`).join('\n') || '(empty project)';
                break;
              }
              case 'read_file': {
                const f = files.find(x => x.path === action.path);
                result = f ? `CONTENT OF ${action.path}:\n${f.content}` : `ERROR: File not found: ${action.path}`;
                break;
              }
              case 'write_file': {
                const path = action.path;
                const content = action.content || '';
                const type = action.file_type || inferType(path);
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
                const path = action.path;
                const find = action.find;
                const replace = action.replace ?? '';
                const idx = files.findIndex(x => x.path === path);
                if (idx === -1) { result = `ERROR: File not found: ${path}`; break; }
                if (!find) { result = `ERROR: "find" is empty.`; break; }
                const current = files[idx].content;
                const occurrences = current.split(find).length - 1;
                if (occurrences === 0) { result = `ERROR: "find" not found in ${path}. Read the file again and use exact matching text.`; break; }
                if (occurrences > 1) { result = `ERROR: "find" matches ${occurrences} times in ${path}. Add more surrounding context.`; break; }
                files[idx] = { ...files[idx], content: current.replace(find, replace) };
                changedPaths.add(path);
                result = `Edited ${path} — 1 replacement.`;
                send({ type: 'file_change', action: 'update', path });
                break;
              }
              case 'delete_file': {
                const before = files.length;
                files = files.filter(x => x.path !== action.path);
                if (files.length === before) { result = `ERROR: File not found: ${action.path}`; break; }
                changedPaths.add(action.path);
                result = `Deleted ${action.path}`;
                send({ type: 'file_change', action: 'delete', path: action.path });
                break;
              }
              case 'finish': {
                finalSummary = action.summary || 'Done.';
                result = 'Task marked complete.';
                shouldFinish = true;
                break;
              }
              default:
                result = `ERROR: Unknown action: ${toolName}`;
            }
          } catch (e) {
            result = `ERROR executing ${toolName}: ${e.message}`;
          }

          send({ type: 'tool_result', name: toolName, summary: summarizeResult(result) });

          // Append turn to transcript
          transcript.push(`TURN ${iterations}:\nthought: ${action.thought || ''}\naction: ${toolName}${action.path ? ` (${action.path})` : ''}\nresult: ${truncate(result, 4000)}`);

          if (shouldFinish) break;
        }

        if (!finalSummary) finalSummary = `Stopped after ${iterations} iterations without explicit finish.`;

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

function inferType(path) {
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.md')) return 'md';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.js')) return 'js';
  return 'jsx';
}
function summarizeInput(name, a) {
  if (name === 'write_file') return { path: a.path, size: (a.content || '').length };
  if (name === 'find_replace') return { path: a.path, find_preview: String(a.find || '').slice(0, 60) };
  if (name === 'read_file' || name === 'delete_file') return { path: a.path };
  if (name === 'finish') return { summary: a.summary };
  return {};
}
function summarizeResult(result) {
  const s = String(result);
  return s.length <= 140 ? s : s.slice(0, 140) + '…';
}
function truncate(s, n) {
  const str = String(s);
  return str.length <= n ? str : str.slice(0, n) + `\n…(truncated, ${str.length} total chars)`;
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