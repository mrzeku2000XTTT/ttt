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
  const fileList = project.files.map(f => `- ${f.path}`).join('\n');
  const fileContents = project.files.map(f =>
    `═══ FILE: ${f.path} ═══\n${f.content}\n`
  ).join('\n');

  return `You are an expert React + Tailwind engineer editing a user's project in a live web IDE called OneShot Studio.

PROJECT: ${project.name}
SOURCE: ${project.source_url || 'N/A'}
ENTRY FILE: ${project.entry_file || '/Home.jsx'}

CURRENT FILES (${project.files.length}):
${fileList}

═══════════ CURRENT FILE CONTENTS ═══════════
${fileContents}
═════════════════════════════════════════════

STRICT RULES:
1. You MUST respond with a JSON object matching the provided schema.
2. For files_to_update, return the COMPLETE new file contents — never partial/diffs.
3. Use ONLY Tailwind utility classes for styling. Use arbitrary values like bg-[#xxxxxx] when needed.
4. Files may import each other using relative paths: import Hero from './Hero.jsx'
5. All components must be default-exported: export default function ComponentName() { ... }
6. lucide-react icons are globally available (no import needed) — just use them as <Zap /> <Heart /> etc.
7. React hooks (useState, useEffect, useRef, useMemo, useCallback) are globally available.
8. Keep changes FOCUSED on what the user asked for. Don't rewrite files unnecessarily.
9. If the user asks to add a new page/component, create a new file and wire it up via imports.
10. In "explanation", be brief and conversational — 1-3 sentences max.`;
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

    const explanation = result?.explanation || 'Done.';
    const updates = Array.isArray(result?.files_to_update) ? result.files_to_update : [];
    const creates = Array.isArray(result?.files_to_create) ? result.files_to_create : [];
    const deletes = Array.isArray(result?.files_to_delete) ? result.files_to_delete : [];

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