import React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VibeSetupPage() {
  const [copied, setCopied] = React.useState(false);

  const setupGuide = `# Base44 Setup Guide for AI Code Builders (Vibe, Cursor, etc.)

## Platform Overview
This is a Base44 application with built-in backend-as-a-service. Base44 provides authentication, database (entities), integrations, and serverless functions out of the box.

## Tech Stack
- Frontend: React + Tailwind CSS + TypeScript
- Backend: Deno Deploy serverless functions
- Database: Entity-based NoSQL (JSON schemas)
- State Management: @tanstack/react-query
- Routing: react-router-dom

## Critical Rules
1. NEVER delete existing working pages or code
2. Use find_replace for editing existing files (not write_file)
3. Create small, focused components - break complexity into multiple files
4. No external libraries beyond the approved list

## File Structure
entities/           # JSON schema definitions (use write_file)
pages/              # React pages (MUST BE FLAT, no subfolders)
components/         # React components (CAN have subfolders)
functions/          # Deno serverless functions
Layout.js          # Optional app layout wrapper

## Available Packages (DO NOT USE OTHERS)
React, react-router-dom, tailwind, @tanstack/react-query, shadcn/ui, lucide-react, moment, date-fns, recharts, react-quill, react-hook-form, lodash, react-markdown, three.js, react-leaflet, @hello-pangea/dnd, framer-motion, @/api/base44Client, @/utils

## Base44 SDK Usage

### Import
import { base44 } from '@/api/base44Client';

### Authentication
const user = await base44.auth.me();
await base44.auth.logout();
base44.auth.redirectToLogin(nextUrl);
const isAuth = await base44.auth.isAuthenticated();
await base44.auth.updateMe({ custom_field: 'value' });

### Entities (Database)
const items = await base44.entities.EntityName.list();
const items = await base44.entities.EntityName.list('-created_date', 20);
const items = await base44.entities.EntityName.filter({ status: 'active' }, '-updated_date', 10);
const newItem = await base44.entities.EntityName.create({ title: "Example" });
await base44.entities.EntityName.bulkCreate([{ title: "Item 1" }]);
await base44.entities.EntityName.update(id, { status: "completed" });
await base44.entities.EntityName.delete(id);

### Integrations
const res = await base44.integrations.Core.InvokeLLM({
  prompt: "Your detailed prompt",
  add_context_from_internet: true,
  response_json_schema: { type: "object", properties: { answer: { type: "string" } } }
});

const { file_url } = await base44.integrations.Core.UploadFile({ file: fileObject });
const { url } = await base44.integrations.Core.GenerateImage({ prompt: "Description" });

### Backend Functions
const response = await base44.functions.invoke('functionName', { param: "value" });
const result = response.data;

## Creating Entities (entities/Task.json)
{
  "name": "Task",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "status": { "type": "string", "enum": ["todo", "done"], "default": "todo" }
  },
  "required": ["title"],
  "rls": {
    "create": true,
    "read": true,
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}

Built-in fields (auto-added): id, created_date, updated_date, created_by

## Creating Pages (pages/MyPage.js)
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function MyPage() {
  const { data: items, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list()
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black p-6">
      <h1 className="text-white text-3xl font-bold">My Page</h1>
    </div>
  );
}

## Navigation
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

<Link to={createPageUrl("PageName")}>Go to Page</Link>
<Link to={createPageUrl("PageName?id=123")}>With params</Link>

## Backend Functions (functions/myFunction.js)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { param1 } = await req.json();
    const items = await base44.entities.Item.list();
    const apiKey = Deno.env.get('MY_API_KEY');

    return Response.json({ success: true, data: items });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

Rules:
- MUST use Deno.serve(async (req) => { ... })
- MUST return Response objects
- Use npm:package@version for imports
- Base44 SDK: npm:@base44/sdk@0.8.4

## Existing Secrets (Deno.env.get())
CIVIC_CLIENT_SECRET, CIVIC_CLIENT_ID, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, X_API_KEY, RAPIDAPI_KEY, FORBOLE_KASPA_API_KEY, KASPA_API_KEY, YOUTUBE_API_KEY, BRIDGE_WALLET_ADDRESS

## Layout System (Layout.js)
export default function Layout({ children, currentPageName }) {
  return (
    <div>
      <nav>Navigation here</nav>
      <main>{children}</main>
    </div>
  );
}

NEVER import/use Layout inside pages - it's auto-applied.

## Data Fetching Pattern
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const { data, isLoading } = useQuery({
  queryKey: ['items'],
  queryFn: () => base44.entities.Item.list()
});

const queryClient = useQueryClient();
const createMutation = useMutation({
  mutationFn: (data) => base44.entities.Item.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] })
});

## Best Practices
1. Small components - break large files into focused components
2. Use find_replace for editing existing code
3. Parallel tool calls - make multiple changes at once
4. Keep it simple - no unnecessary fallbacks
5. Mobile responsive - always use responsive design
6. Don't catch errors unless specifically needed
7. Check context first - read files before editing

## Complete Todo Example

Entity (entities/Todo.json):
{
  "name": "Todo",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "completed": { "type": "boolean", "default": false }
  },
  "required": ["title"]
}

Page (pages/Todos.js):
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TodosPage() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => base44.entities.Todo.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Todo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setTitle("");
    }
  });

  return (
    <div className="min-h-screen bg-black p-6">
      <h1 className="text-white text-3xl font-bold mb-6">Todos</h1>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) createMutation.mutate({ title });
      }}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      <div className="space-y-2">
        {todos.map(todo => (
          <div key={todo.id}>{todo.title}</div>
        ))}
      </div>
    </div>
  );
}

Remember: Keep code simple, focused, and maintainable!`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(setupGuide);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950/30 via-black to-blue-900/25 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Vibe Code AI Setup</h1>
            <p className="text-white/60">Complete integration guide for AI code builders</p>
          </div>
          <Button
            onClick={copyToClipboard}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Guide
              </>
            )}
          </Button>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 md:p-8">
          <pre className="text-white/80 text-sm whitespace-pre-wrap font-mono overflow-x-auto">
            {setupGuide}
          </pre>
        </div>

        <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <p className="text-purple-300 text-sm">
            <strong>Tip:</strong> Copy this guide and paste it into your AI code builder (Vibe, Cursor, Windsurf, etc.) 
            to give it full context about your Base44 setup, available APIs, and coding patterns.
          </p>
        </div>
      </div>
    </div>
  );
}