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
  __standalone: true,
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

// .env.example — shipped (committed) so cloners know which keys the builder reads.
// The real .env is gitignored above. Edit .env and restart \`npm run dev\` to apply.
const ENV_EXAMPLE = `# TTT Builder — environment variables (safer than localStorage)
# Copy this file to ".env" and fill in your keys, then restart: npm run dev
# .env is gitignored — your keys never get committed.

# Option A: Google Gemini (free tier, recommended) — get one at https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=

# Option B: any OpenAI-compatible provider (Groq, OpenRouter, Together, Mistral, etc.)
# VITE_LLM_API_KEY=
# VITE_LLM_MODEL=llama-3.3-70b-versatile
# VITE_LLM_BASE_URL=https://api.groq.com/openai/v1
# VITE_LLM_PROVIDER=groq
# VITE_LLM_LABEL=Groq (free)

# Optional: E2B sandbox for live React/npm previews
# VITE_E2B_API_KEY=
`;

const README = `<div align="center">

# ⚡ TTT Builder

### The first Kaspa-native vibe-coding platform.

Describe it. Ship it. Every app comes with a real Kaspa wallet wired in — keys generated locally, transactions signed in the browser, zero custody, zero servers.

**Bring your own model keys. No integration credits. No hosted backend. No lock-in.**

<br />

\`\`\`bash
git clone https://github.com/mrzeku2000XTTT/ttt-builder.git
cd ttt-builder && npm install && npm run dev
\`\`\`

<br />

**Kaspa** · **Open-source** · **BYO-keys** · **Local-first** · **MIT**

</div>

---

> **TTT Builder** turns a single prompt into a complete, production-quality multi-file application — and every app it ships has the Kaspa wallet protocol baked in at the framework level. It is the open-source, self-hostable core of the TTT super-app: a vibe-coding studio for the Kaspa ecosystem that anyone can clone, brand, and run on their own machine with their own model keys.

## ✨ Why TTT Builder

| | |
|---|---|
| 🟣 **Kaspa-first, not Kaspa-bolted-on** | The wallet protocol is injected at build time — every generated app gets a real, local-only Kaspa wallet (BIP39 seed → WIF → signed transactions) with a strict, enforced UI pattern. No extensions, no custody, no floating panels. |
| 🧠 **Bring your own brain** | The build loop calls **your** model directly from the browser — OpenRouter, DeepSeek, Ollama, or any OpenAI-compatible endpoint. Keys live in your localStorage and go straight to the provider. They never touch a server. |
| 🪶 **Local-first by design** | Projects, wallet keys, and memory persist in the browser. No account, no cloud sync, no telemetry. Your workspace is yours. |
| 🎬 **Multi-agent orchestration** | A planner breaks your request into scoped file-editing subagents; a repair agent fixes missing imports; a reviewer reverts unrelated changes. Surgical, not wholesale. |
| 🖼️ **Live preview** | Generated apps render live in an isolated sandbox. Static HTML/CSS/JS previews in-browser; wire your own E2B key for full npm-project sandboxing. |
| 🚀 **Ship anywhere** | Standard Vite + React output. Deploy to Vercel, Netlify, Cloudflare Pages, your own server, or Docker — one \`npm run build\` away. |

## 🚀 Quick start

\`\`\`bash
git clone https://github.com/mrzeku2000XTTT/ttt-builder.git
cd ttt-builder
npm install
npm run dev
\`\`\`

Open **http://localhost:3000** — the studio loads in your browser. No login, no config.

### First run: onboarding wizard

On first launch, a **step-by-step onboarding wizard** appears automatically (standalone build only). It walks you through:

1. **Add your model** — defaults to **Gemini 2.0 Flash** (free tier). Just paste your Google AI Studio key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Or change the model string to use any other provider (Groq, OpenRouter, etc.) — provider is auto-detected.
2. **Add E2B key** *(optional)* — for live React/npm sandbox previews. Skip if you only build static HTML apps.
3. **Ready** — start building. Every app ships with a Kaspa wallet built in.

> Everything you enter is stored **locally in your browser only** (localStorage). Keys never touch any server. Re-open the wizard anytime with the **"Setup model & keys"** button on the home screen.

### Add your model

Prefer to skip the wizard? Open the builder → model selector (top-right of the chat) → **+ Add open model**. Pick a provider:

| Provider | Where to get a key | Example model | Notes |
|---|---|---|---|
| **Google Gemini** *(default)* | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | \`gemini-2.0-flash\` | Free tier, browser-friendly CORS, no credit card |
| **Groq** | [console.groq.com/keys](https://console.groq.com/keys) | \`llama-3.3-70b-versatile\` | Fast + free, browser-friendly CORS |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | \`deepseek/deepseek-chat-v3.1:free\` | Free + paid models, browser-friendly CORS |
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com) | \`deepseek-chat\` | Best price/perf for code |
| **Ollama** *(local, no key)* | run \`ollama serve\` | \`llama3.1\` | 100% local, zero cost, zero network |
| **Custom** | — | — | Any OpenAI-compatible endpoint (LM Studio, vLLM, llama.cpp) |

> The core build loop calls your provider directly from the browser. Hosted models (\`claude_*\`, \`gpt_*\`, \`gemini_*\`) are **not** available in this self-hosted build — that's the point: you bring the keys, you own the cost.

## 🏗️ Architecture

\`\`\`
┌──────────────────────────────────────────────┐
│  TTT Builder Studio  (src/pages/TTTBuilder)  │
│  chat · live preview · dashboard · memory    │
└───────────────┬──────────────────────────────┘
                │ prompt
        ┌───────▼───────┐
        │  Orchestrator │  planner → subagents → repair → review
        └───────┬───────┘
                │ file ops
        ┌───────▼───────┐  ┌──────────────┐
        │  Project FS   │← │  Wallet Kit   │  injects Kaspa protocol into every app
        └───────┬───────┘  └──────────────┘
                │ render
        ┌───────▼───────┐
        │  Live Preview │  in-browser / E2B sandbox
        └───────────────┘
\`\`\`

### What's in this repo

| Path | What it is |
|---|---|
| \`src/pages/TTTBuilder.jsx\` | The studio — chat, live preview, and dashboard in one |
| \`src/components/tttbuilder/\` | The engine: orchestrator, local LLM layer, model selector, wallet kit, project FS, file/image/GitHub sync, all builder UI |
| \`src/components/ui/\` | shadcn/ui primitives the studio is built on |
| \`src/api/base44Client.js\` | Standalone SDK stub — no Base44 platform required |
| \`public/TTT_BUILDER_WALLET.md\` | The Kaspa wallet UI protocol contract (the enforced pattern) |
| \`public/TTT_BUILDER_ARTHUUN.md\` · \`public/ARHTUUN.md\` | Architecture & protocol deep-dives |

## 🔌 Optional features (graceful degradation)

A few features in the hosted TTT relied on the Base44 platform. In this self-hosted build they degrade gracefully — the build loop always works:

- **Live preview sandbox** — static apps preview in-browser; for full npm-project sandboxing, wire \`E2BLivePanel\` to your own E2B API key.
- **Image generation** — \`TTT_IMAGE[...]\` markers are cleared unless you plug an image endpoint into \`src/components/tttbuilder/imageGen.js\`.
- **GitHub push** — use a personal access token, or push generated files manually.
- **URL clone & file analysis** — optional attachment features (\`uiClonerScrape\`, \`analyzeUploadedFile\`).
- **Auth** — \`base44Client.js\` returns a local admin user so the builder opens with no login. Edit it to add real auth if you want.

## 🌍 Deploy anywhere

This is a standard Vite + React app — one build, any host:

\`\`\`bash
npm run build   # → dist/
\`\`\`

- **Vercel** — \`vercel\` (auto-detects Vite)
- **Netlify** — publish \`dist/\`
- **Cloudflare Pages** — output \`dist\`
- **Docker** — serve \`dist/\` with nginx/caddy
- **Desktop** — pin with \`nativefier\` or install as a PWA

## 🧩 Build your own vibe-coding platform

This repo **is** a vibe-coding platform. Clone it, brand it, ship it:

1. **Fork** this repo.
2. \`npm install && npm run dev\` — confirm it builds.
3. Edit \`src/pages/TTTBuilder.jsx\` (the studio) and \`src/components/tttbuilder/\` (the engine) to match your brand and defaults.
4. Point your users at the Open Models tab — they bring their own keys, you never pay for their inference.
5. Deploy (see above).

> **The Kaspa wallet protocol is the differentiator.** Every app your platform generates ships with a real, local-only Kaspa wallet. That's not a feature — it's the foundation.

## 🛡️ Security model

- **Keys never leave the browser.** Model keys, wallet seeds, and WIFs live in localStorage and go directly to the provider / signer. No server ever sees them.
- **Wallet is local-only.** BIP39 seed → WIF → signed transactions, all in-browser. Explicit export controls. No custody, no relay, no extension dependency.
- **No telemetry.** No analytics, no tracking, no phone-home. What you build stays on your machine.

## 📄 License

**MIT** — see [LICENSE](./LICENSE). Fork it, brand it, ship it, sell it. Just keep the copyright notice.

---

<div align="center">

**Built for the Kaspa ecosystem.**

⭐ Star this repo if it helped you ship.

</div>
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
      { path: ".env.example", content: ENV_EXAMPLE },
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