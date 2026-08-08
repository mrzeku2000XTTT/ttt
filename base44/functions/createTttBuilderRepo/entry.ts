import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Syncs the TTT Builder platform code from the app's source repo into a
// canonical, STANDALONE, open-source GitHub repo that anyone can clone and run
// locally with their own model keys (no Base44 platform, no hosted credits).
//
// It copies the builder engine + UI primitives + build setup, AUTHORS a stub
// SDK + minimal app shell + full package.json + step-by-step README, and pushes
// everything as a SINGLE commit (Git Data API) to the existing target repo
// (update-in-place). Admin-only.

const COPY_PREFIXES = [
  "src/components/tttbuilder/",
  "src/components/ui/",
  "src/utils/",
];
const COPY_EXACT = [
  "src/pages/TTTBuilder.jsx",
  "src/lib/utils.js",
  "src/index.css",
  "src/globals.css",
  "tailwind.config.js",
  "postcss.config.js",
  "public/TTT_BUILDER_WALLET.md",
  "public/TTT_BUILDER_ARTHUUN.md",
  "public/ARHTUUN.md",
];

function b64(s) { return btoa(unescape(encodeURIComponent(s))); }

const STUB_CLIENT = `// Standalone stub for the Base44 SDK.
// Lets TTT Builder run with NO Base44 platform. The core build loop uses YOUR
// OWN model keys (Open Models tab / localLlm.js) and never touches this file.
// These stubs cover optional platform features (live sandbox, image gen,
// github push, auth) and degrade gracefully when unavailable.

const LOCAL_ADMIN = { id: "local", email: "local@ttt-builder", role: "admin", username: "local" };

function unavailable(name, hint) {
  return async () => {
    throw new Error(name + " is not available in this self-hosted build. " + (hint || "See README."));
  };
}

export const base44 = {
  auth: {
    me: async () => LOCAL_ADMIN,
    isAuthenticated: async () => true,
    logout: async () => {},
    updateMe: async (d) => ({ ...LOCAL_ADMIN, ...d }),
    redirectToLogin: () => {},
  },
  functions: {
    invoke: async (name) => {
      throw new Error('Backend function "' + name + '" is not available without the Base44 platform. See README.');
    },
  },
  integrations: {
    Core: {
      GenerateImage: unavailable("GenerateImage", "Plug your own image API into src/components/tttbuilder/imageGen.js, or TTT_IMAGE markers are cleared."),
      UploadFile: unavailable("UploadFile"),
      InvokeLLM: unavailable("InvokeLLM", "Add an open model in the Open Models tab — hosted models need the Base44 platform."),
      GenerateSpeech: unavailable("GenerateSpeech"),
      GenerateVideo: unavailable("GenerateVideo"),
      TranscribeAudio: unavailable("TranscribeAudio"),
      ExtractDataFromUploadedFile: unavailable("ExtractDataFromUploadedFile"),
      CreateFileSignedUrl: unavailable("CreateFileSignedUrl"),
      UploadPrivateFile: unavailable("UploadPrivateFile"),
    },
  },
  entities: new Proxy({}, {
    get: () => ({
      list: async () => [],
      filter: async () => [],
      get: async () => null,
      create: async (d) => d,
      update: async () => ({}),
      delete: async () => ({}),
      bulkCreate: async (a) => a,
      bulkUpdate: async (a) => a,
      updateMany: async () => ({}),
      deleteMany: async () => ({}),
      subscribe: () => () => {},
      schema: () => ({}),
    }),
  }),
  analytics: { track: () => {} },
  users: { inviteUser: unavailable("inviteUser") },
  asServiceRole: { connectors: { getConnection: unavailable("getConnection") } },
};
`;

const APP_JSX = `import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TTTBuilderPage from "@/pages/TTTBuilder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TTTBuilderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
`;

const MAIN_JSX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TTT Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

const VITE_CONFIG = `import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
`;

const JSCONFIG = `{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "esnext",
    "checkJs": false,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
`;

const PKG = {
  name: "ttt-builder",
  version: "1.0.0",
  private: true,
  type: "module",
  description: "TTT Builder — open-source AI app builder for Kaspa. Bring your own keys.",
  scripts: {
    dev: "vite --host 0.0.0.0 --port 3000",
    build: "vite build",
    preview: "vite preview",
  },
  dependencies: {
    "@hello-pangea/dnd": "^17.0.0",
    "@hookform/resolvers": "^4.1.2",
    "@noble/curves": "^1.9.7",
    "@noble/hashes": "^1.8.0",
    "@okxweb3/coin-kaspa": "^1.1.0",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-aspect-ratio": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.3",
    "@radix-ui/react-context-menu": "^2.2.6",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-hover-card": "^1.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-navigation-menu": "^1.2.5",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-toggle": "^1.1.2",
    "@radix-ui/react-toggle-group": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@tanstack/react-query": "^5.84.1",
    "canvas-confetti": "^1.9.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.5.2",
    "framer-motion": "^11.16.4",
    "lucide-react": "^0.475.0",
    "next-themes": "^0.4.4",
    "react": "^18.2.0",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.54.2",
    "react-router-dom": "^6.26.0",
    "recharts": "^2.15.4",
    "sonner": "^2.0.1",
    "tailwind-merge": "^3.0.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2",
    "zod": "^3.24.2",
  },
  devDependencies: {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "vite": "^5.2.0",
  },
};
const PACKAGE_JSON = JSON.stringify(PKG, null, 2) + "\n";

const GITIGNORE = `node_modules
dist
.env
.env.local
.DS_Store
*.log
`;

const README = `# TTT Builder

Open-source AI app builder for Kaspa. Describe what you want and TTT Builder generates a complete, production-quality multi-file app with the Kaspa wallet protocol built in. **Bring your own model keys — no integration credits, no hosted backend required.**

## Quick start (local browser)

\`\`\`bash
git clone https://github.com/<owner>/ttt-builder.git
cd ttt-builder
npm install
npm run dev
\`\`\`

Open http://localhost:3000 — the builder loads in your browser.

## Add your model (open-source / bring-your-own keys)

The builder runs on YOUR models — open-source or any OpenAI-compatible endpoint. Keys live only in your browser (localStorage) and go straight to the provider. They never touch a server.

1. Open the builder → model selector (top-right of the chat) → **+ Add open model**.
2. Pick a provider:
   - **OpenRouter** (recommended — free + paid models, browser-friendly CORS): key from openrouter.ai/keys, model e.g. \`deepseek/deepseek-chat-v3.1:free\`
   - **DeepSeek**: key from platform.deepseek.com, model \`deepseek-chat\`
   - **Ollama** (local, no key): run \`ollama serve\`, model e.g. \`llama3.1\`
   - **Custom**: any OpenAI-compatible endpoint (LM Studio, vLLM, llama.cpp server)
3. Start building — describe your app and hit Build.

> The core build loop calls your provider directly from the browser. Hosted models (prefixed \`ttt_agent_1\`, \`claude_*\`, \`gpt_*\`, \`gemini_*\`) are NOT available in this self-hosted build — use the Open Models tab.

## Run on any platform

This is a standard Vite + React app — deploy it anywhere:

- **Vercel**: \`vercel\` (auto-detects Vite)
- **Netlify**: build \`npm run build\`, publish \`dist/\`
- **Cloudflare Pages**: build \`npm run build\`, output \`dist\`
- **Your own server**: \`npm run build && npm run preview\`, or serve \`dist/\` with any static host
- **Docker**: \`npm run build\` then serve \`dist/\` with nginx/caddy

## Desktop CLI

\`\`\`bash
git clone https://github.com/<owner>/ttt-builder.git
cd ttt-builder
npm install
npm run dev   # http://localhost:3000
\`\`\`

Pin it as a desktop app with any SSB wrapper (e.g. \`nativefier http://localhost:3000\` or PWA install from your browser).

## What's in this repo

- \`src/pages/TTTBuilder.jsx\` — the builder studio (chat + live preview + dashboard)
- \`src/components/tttbuilder/\` — orchestrator, local LLM layer, model selector, wallet kit, project files, and all builder UI
- \`src/components/ui/\` — shadcn/ui primitives used by the builder
- \`src/api/base44Client.js\` — standalone stub (no Base44 platform needed)
- \`public/TTT_BUILDER_WALLET.md\`, \`public/TTT_BUILDER_ARTHUUN.md\`, \`public/ARHTUUN.md\` — architecture & protocol docs

## Optional platform features (graceful degradation)

A few features in the hosted TTT relied on the Base44 platform. In this self-hosted build they degrade gracefully — the build loop still works:

- **Live preview sandbox** (\`E2BLivePanel\`): real npm-project sandboxing needs an E2B API key. Without it, static HTML/CSS/JS apps still preview live in-browser; React/npm projects show their code but won't auto-run a cloud sandbox. To enable: wire \`E2BLivePanel\` to your own E2B call.
- **Image generation** (\`imageGen.js\`): \`TTT_IMAGE[...]\` markers are cleared if no image API is configured. To enable: plug your own image endpoint into \`src/components/tttbuilder/imageGen.js\`.
- **GitHub push** (\`publishToGitHub\` / \`pushAppToUserGitHubOAuth\`): use a personal access token, or push generated files manually.
- **URL clone & file analysis** (\`uiClonerScrape\`, \`analyzeUploadedFile\`): optional attachment features.
- **Auth / admin gate**: \`src/api/base44Client.js\` returns a local admin user so the builder opens with no login. Edit it to add real auth if you want.

## Build your own vibe-coding platform

This repo IS a vibe-coding platform. Clone it, brand it, ship it:

1. Fork/clone this repo.
2. \`npm install && npm run dev\` — confirm it builds.
3. Edit \`src/pages/TTTBuilder.jsx\` (the studio) and \`src/components/tttbuilder/\` (the engine) to match your brand and defaults.
4. Point users at the Open Models tab to bring their own keys (open-source models only — never your hosted credits).
5. Deploy (see "Run on any platform").

## License

MIT — see LICENSE.
`;

const LICENSE = `MIT License

Copyright (c) 2026 TTT-Build

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

async function gh(token, url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "TTT-Builder-Sync",
      ...(opts.headers || {}),
    },
  });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only — this syncs the canonical TTT Builder platform repo." }, { status: 403 });

    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getConnection("github"));
    } catch (e) {
      return Response.json({ error: "GitHub connector not connected. Connect it first. " + (e?.message || "") }, { status: 401 });
    }
    const token = accessToken;

    let body = {};
    try { body = await req.json(); } catch {}
    let sourceRepo = (body.sourceRepo || "").trim();
    const targetRepo = (body.targetRepo || "ttt-builder").trim();
    if (!/^[a-zA-Z0-9._-]+$/.test(targetRepo)) {
      return Response.json({ error: "Invalid target repo name" }, { status: 400 });
    }

    const H = { "Content-Type": "application/json" };

    const meRes = await gh(token, `https://api.github.com/user`);
    if (!meRes.ok) return Response.json({ error: "Could not resolve GitHub user (token invalid)." }, { status: 401 });
    const me = await meRes.json();
    const targetOwner = me.login;
    const fullTarget = `${targetOwner}/${targetRepo}`;

    // Auto-detect the source repo if not provided
    if (!sourceRepo || !sourceRepo.includes("/") || sourceRepo.split("/").length !== 2) {
      const reposRes = await gh(token, `https://api.github.com/user/repos?sort=updated&per_page=100`);
      if (!reposRes.ok) return Response.json({ error: "Could not list your repos to auto-detect source." }, { status: 502 });
      const repos = await reposRes.json();
      let found = null;
      for (const r of repos) {
        if (r.archived) continue;
        if (r.full_name === fullTarget) continue; // never sync from the target repo itself
        const checkRes = await gh(token, `https://api.github.com/repos/${r.full_name}/contents/src/pages/TTTBuilder.jsx`);
        if (!checkRes.ok) continue;
        // require the full app (has the ui primitives dir), not a partial clone
        const uiCheck = await gh(token, `https://api.github.com/repos/${r.full_name}/contents/src/components/ui`);
        if (uiCheck.ok) { found = r.full_name; break; }
      }
      if (!found) return Response.json({ error: "Could not auto-detect your app's repo (no repo with src/pages/TTTBuilder.jsx AND src/components/ui/). Enter it manually as owner/repo." }, { status: 404 });
      sourceRepo = found;
    }

    // Source tree
    const srcInfoRes = await gh(token, `https://api.github.com/repos/${sourceRepo}`);
    if (!srcInfoRes.ok) {
      const t = await srcInfoRes.text().catch(() => "");
      return Response.json({ error: `Source repo not found: ${sourceRepo} (${srcInfoRes.status}). ${t.slice(0, 200)}` }, { status: 404 });
    }
    const srcInfo = await srcInfoRes.json();
    const srcBranch = srcInfo.default_branch;
    const treeRes = await gh(token, `https://api.github.com/repos/${sourceRepo}/git/trees/${srcBranch}?recursive=1`);
    if (!treeRes.ok) return Response.json({ error: `Could not read source tree (${treeRes.status}).` }, { status: 502 });
    const tree = await treeRes.json();
    const sourcePaths = tree.tree
      .filter((t) => t.type === "blob" && (COPY_PREFIXES.some((p) => t.path.startsWith(p)) || COPY_EXACT.includes(t.path)))
      .map((t) => t.path);

    if (!sourcePaths.length) return Response.json({ error: "No TTT Builder files found in the source repo." }, { status: 404 });

    // Parallel raw reads of all source files
    const readResults = await Promise.all(sourcePaths.map(async (p) => {
      try {
        const r = await gh(token, `https://raw.githubusercontent.com/${sourceRepo}/${srcBranch}/${p}`);
        if (!r.ok) return null;
        const content = await r.text();
        return { path: p, content };
      } catch { return null; }
    }));
    const copied = readResults.filter(Boolean);

    // Authored shell files
    const authored = [
      { path: "src/api/base44Client.js", content: STUB_CLIENT },
      { path: "src/App.jsx", content: APP_JSX },
      { path: "src/main.jsx", content: MAIN_JSX },
      { path: "index.html", content: INDEX_HTML },
      { path: "vite.config.js", content: VITE_CONFIG },
      { path: "jsconfig.json", content: JSCONFIG },
      { path: "package.json", content: PACKAGE_JSON },
      { path: "README.md", content: README },
      { path: "LICENSE", content: LICENSE },
      { path: ".gitignore", content: GITIGNORE },
    ];

    const allFiles = [...copied, ...authored];

    // Ensure the target repo exists (422 = already exists, fine)
    await gh(token, `https://api.github.com/user/repos`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        name: targetRepo,
        private: false,
        description: "TTT Builder — open-source AI app builder for Kaspa. Bring your own keys.",
      }),
    });

    // Resolve target default branch + latest commit + tree (if non-empty)
    let targetBranch = "main";
    const tInfoRes = await gh(token, `https://api.github.com/repos/${fullTarget}`);
    if (tInfoRes.ok) { const tInfo = await tInfoRes.json(); if (tInfo.default_branch) targetBranch = tInfo.default_branch; }

    let parentSha = null, baseTreeSha = null;
    const refRes = await gh(token, `https://api.github.com/repos/${fullTarget}/git/refs/heads/${targetBranch}`);
    if (refRes.ok) {
      const ref = await refRes.json();
      parentSha = ref.object?.sha || null;
      if (parentSha) {
        const cRes = await gh(token, `https://api.github.com/repos/${fullTarget}/git/commits/${parentSha}`);
        if (cRes.ok) { const c = await cRes.json(); baseTreeSha = c.tree?.sha || null; }
      }
    }

    // Create a single tree with all files inline (one commit for everything)
    const treeEntries = allFiles.map((f) => ({
      path: f.path,
      mode: "100644",
      type: "blob",
      content: f.content,
    }));
    const newTreeRes = await gh(token, `https://api.github.com/repos/${fullTarget}/git/trees`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        ...(baseTreeSha ? { base_tree: baseTreeSha } : {}),
        tree: treeEntries,
      }),
    });
    if (!newTreeRes.ok) {
      const t = await newTreeRes.text().catch(() => "");
      return Response.json({ error: `Could not create tree (${newTreeRes.status}). ${t.slice(0, 300)}` }, { status: 502 });
    }
    const newTree = await newTreeRes.json();

    // Create commit
    const commitRes = await gh(token, `https://api.github.com/repos/${fullTarget}/git/commits`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        message: "Sync TTT Builder (open-source standalone)",
        tree: newTree.sha,
        parents: parentSha ? [parentSha] : [],
      }),
    });
    if (!commitRes.ok) {
      const t = await commitRes.text().catch(() => "");
      return Response.json({ error: `Could not create commit (${commitRes.status}). ${t.slice(0, 300)}` }, { status: 502 });
    }
    const newCommit = await commitRes.json();

    // Update / create the branch ref
    if (parentSha) {
      await gh(token, `https://api.github.com/repos/${fullTarget}/git/refs/heads/${targetBranch}`, {
        method: "PATCH", headers: H,
        body: JSON.stringify({ sha: newCommit.sha, force: true }),
      });
    } else {
      await gh(token, `https://api.github.com/repos/${fullTarget}/git/refs`, {
        method: "POST", headers: H,
        body: JSON.stringify({ ref: `refs/heads/${targetBranch}`, sha: newCommit.sha }),
      });
    }

    return Response.json({
      success: true,
      repo: fullTarget,
      url: `https://github.com/${fullTarget}`,
      cloneUrl: `https://github.com/${fullTarget}.git`,
      copiedFiles: copied.length,
      authoredFiles: authored.length,
      totalFiles: allFiles.length,
    });
  } catch (e) {
    return Response.json({ error: e?.message || String(e) || "server error" }, { status: 500 });
  }
}