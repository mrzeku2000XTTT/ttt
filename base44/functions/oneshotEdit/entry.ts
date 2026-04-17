import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EDIT_SCHEMA = {
  type: "object",
  properties: {
    explanation: {
      type: "string",
      description: "Brief, conversational explanation of what you did (1-3 sentences)"
    },
    files_to_update: {
      type: "array",
      description: "Files to overwrite with new content",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string", description: "Complete new file contents — full file, not a diff" }
        },
        required: ["path", "content"]
      }
    },
    files_to_create: {
      type: "array",
      description: "New files to add",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
          type: { type: "string", enum: ["jsx", "js", "css", "md", "json"], default: "jsx" }
        },
        required: ["path", "content"]
      }
    },
    files_to_delete: {
      type: "array",
      description: "Paths of files to delete",
      items: { type: "string" }
    }
  },
  required: ["explanation"]
};

function buildSystemPrompt(project) {
  const fileList = project.files.map(f => `- ${f.path} (${f.content.length} chars)`).join('\n');
  const fileContents = project.files.map(f =>
    `═══ FILE: ${f.path} ═══\n${f.content}\n`
  ).join('\n');

  return `You are a senior React + Tailwind engineer working autonomously in a live web IDE called OneShot Studio. You behave like Claude Code: you read files carefully, plan, and SHIP COMPLETE, WORKING CODE. You NEVER hand-wave or leave stubs.

PROJECT: ${project.name}
SOURCE: ${project.source_url || 'N/A'}
ENTRY FILE: ${project.entry_file || '/Home.jsx'} (this is what renders in the live preview)

CURRENT FILES (${project.files.length}):
${fileList}

═══════════ CURRENT FILE CONTENTS ═══════════
${fileContents}
═════════════════════════════════════════════

CORE BEHAVIOR (READ CAREFULLY):
- You MUST actually edit the real files to fulfill the user's request. Do NOT just describe what you'd do.
- Every user message MUST result in at least one file in files_to_update or files_to_create (unless the user is literally just asking a question).
- When the user asks for a visual/UI change, identify the EXACT files that render that UI and edit them. Don't create random new files when the change belongs in an existing file.
- When the user asks for a NEW feature/page/section, create new focused files AND wire them up by editing the parent file's imports + JSX.
- ALWAYS return COMPLETE file contents in "content" — the full updated file, top to bottom. Never partial, never diffs, never "...rest unchanged...". The system literally overwrites the file with what you return.
- Preserve existing functionality that the user didn't ask to change. Read the current file, make the targeted edit, return the full file.
- Break large components into smaller focused files when it improves clarity. Keep individual files under ~300 lines when reasonable.

TECHNICAL RULES:
1. Respond ONLY with the JSON object matching the provided schema. No prose outside JSON.
2. Use ONLY Tailwind utility classes. Use arbitrary values like bg-[#0A0F1E] when needed. No separate CSS files unless the user explicitly asks.
3. Files may import each other via relative paths: import Hero from './Hero.jsx' (include the .jsx extension).
4. Every component file MUST default-export one component: export default function ComponentName() { ... }
5. lucide-react icons are globally available — use them directly: <Zap className="w-4 h-4" />, <Heart />, etc. Do NOT import from 'lucide-react'.
6. React hooks (useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, Fragment) are globally available — do NOT import React or hooks.
7. framer-motion is NOT available in the sandbox. Use Tailwind transitions/animations or CSS keyframes via className.
8. No external npm packages beyond what's in the sandbox (React + Tailwind + lucide icons).
9. For the entry file, the component should be the default export of ${project.entry_file || '/Home.jsx'}.
10. Always test mentally: "if I drop this file into the preview, would it render without errors?" — make sure imports resolve, brackets balance, and all referenced components exist.

EXPLANATION:
- Keep "explanation" conversational and specific about what you ACTUALLY changed (which files, what edits). 2-4 sentences.
- Example: "Updated Hero.jsx to increase vertical padding and added a new CTA button. Also tweaked the gradient colors to match your request."

REMEMBER: You are shipping code that runs immediately. Do the work properly.`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  let user;
  try {
    user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload;
  try { payload = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { projectId, userMessage } = payload || {};
  if (!projectId || !userMessage) {
    return Response.json({ error: 'Missing projectId or userMessage' }, { status: 400 });
  }

  try {
    // Fetch the project
    const projects = await base44.entities.OneShotProject.filter({ id: projectId });
    const project = projects[0];
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
    if (project.created_by !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Call Claude with full project context
    const systemPrompt = buildSystemPrompt(project);
    const fullPrompt = `${systemPrompt}\n\n═══════════ USER REQUEST ═══════════\n${userMessage}\n\nRespond with the JSON edit plan now.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt: fullPrompt,
      response_json_schema: EDIT_SCHEMA,
    });

    let explanation = result?.explanation || 'Done.';
    const updates = Array.isArray(result?.files_to_update) ? result.files_to_update : [];
    const creates = Array.isArray(result?.files_to_create) ? result.files_to_create : [];
    const deletes = Array.isArray(result?.files_to_delete) ? result.files_to_delete : [];

    // Warn if no actual edits were made
    if (updates.length === 0 && creates.length === 0 && deletes.length === 0) {
      explanation = `⚠️ I didn't make any file changes this time. ${explanation}\n\nTry rephrasing with more specifics — e.g. "in Hero.jsx, make the heading bigger and change the background to dark navy".`;
    }

    // Apply edits to project file list
    let newFiles = [...project.files];

    // Deletes
    if (deletes.length > 0) {
      newFiles = newFiles.filter(f => !deletes.includes(f.path));
    }

    // Updates
    for (const upd of updates) {
      const idx = newFiles.findIndex(f => f.path === upd.path);
      if (idx !== -1) {
        newFiles[idx] = { ...newFiles[idx], content: upd.content };
      } else {
        // If not found, treat as create
        const type = upd.path.endsWith('.css') ? 'css'
          : upd.path.endsWith('.md') ? 'md'
          : upd.path.endsWith('.json') ? 'json'
          : upd.path.endsWith('.js') ? 'js' : 'jsx';
        newFiles.push({ path: upd.path, content: upd.content, type });
      }
    }

    // Creates
    for (const cr of creates) {
      const exists = newFiles.find(f => f.path === cr.path);
      if (!exists) {
        newFiles.push({ path: cr.path, content: cr.content, type: cr.type || 'jsx' });
      }
    }

    // Build files_changed list
    const filesChanged = [
      ...updates.map(u => u.path),
      ...creates.map(c => c.path),
      ...deletes,
    ];

    // Append to chat history
    const newChatHistory = [
      ...(project.chat_history || []),
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: explanation, files_changed: filesChanged, timestamp: new Date().toISOString() },
    ];

    // Save
    const updated = await base44.entities.OneShotProject.update(projectId, {
      files: newFiles,
      chat_history: newChatHistory,
    });

    return Response.json({
      project: updated,
      explanation,
      files_changed: filesChanged,
    });
  } catch (err) {
    console.error('oneshotEdit error:', err);
    return Response.json({ error: err.message || 'Edit failed' }, { status: 500 });
  }
});