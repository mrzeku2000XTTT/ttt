import React, { useState, useCallback } from "react";
import { ArrowLeft, Sparkles, Code2, PanelLeftClose, PanelLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { KAI_DEV_KNOWLEDGE } from "@/components/kaspa/kaiDevKnowledge";
import IDEChatPanel from "@/components/ide/IDEChatPanel";
import IDEFileExplorer from "@/components/ide/IDEFileExplorer";
import IDECodeEditor from "@/components/ide/IDECodeEditor";
import IDEPreviewPanel from "@/components/ide/IDEPreviewPanel";

const SUGGESTIONS = [
  "Kaspa wallet tracker with balance alerts",
  "KAS tipping app for creators",
  "KRC-20 token portfolio viewer",
  "P2P KAS marketplace with escrow",
];

function buildFilesFromIdeData(ideData) {
  if (!ideData) return [];
  const files = [];
  (ideData.entities || []).forEach((e, i) => {
    files.push({ id: `entity-${i}`, name: `${e.name}.json`, type: "entity", ext: "json", code: JSON.stringify(e.schema, null, 2) });
  });
  (ideData.pages || []).forEach((p, i) => {
    files.push({ id: `page-${i}`, name: `${p.name}.jsx`, type: "page", ext: "jsx", code: p.code });
  });
  (ideData.functions || []).forEach((f, i) => {
    files.push({ id: `func-${i}`, name: `${f.name}.js`, type: "function", ext: "js", code: f.code });
  });
  return files;
}

export default function KaiIDEPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey — I'm **KAI**, your Kaspa-native dev agent. Describe the app you want and I'll generate entities, pages, and functions.\n\nI work like a real coding agent — generating real files you can deploy to Base44." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [ideData, setIdeData] = useState(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const [rightPanel, setRightPanel] = useState("code"); // "code" | "preview"

  const addMessage = (role, content) => setMessages(prev => [...prev, { role, content }]);

  const handleCodeChange = useCallback((fileId, newCode) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, code: newCode } : f));
  }, []);

  const handleSend = async (userMsg) => {
    addMessage("user", userMsg);
    setIsLoading(true);

    try {
      addMessage("status", "🏗️ Calling KaiArchitect…");

      const archRes = await fetch("https://kaspa-b3ad561a.base44.app/functions/kaiArchitect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: userMsg }),
      });
      const archData = await archRes.json();
      const architectPrompt = archData?.architect_prompt || archData?.prompt || "";

      if (!architectPrompt) {
        setMessages(prev => prev.filter(m => m.role !== "status"));
        addMessage("assistant", "❌ Couldn't plan that app. Try being more specific about what you want.");
        setIsLoading(false);
        return;
      }

      setMessages(prev => prev.map(m => m.role === "status" ? { ...m, content: "📚 Plan ready — generating files…" } : m));

      const codeResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are KAI — a Kaspa-native AI developer agent.

${KAI_DEV_KNOWLEDGE}

## ARCHITECT CONTEXT:
${architectPrompt}

## OUTPUT FORMAT
Respond with ONLY a valid JSON object. No markdown. No code fences.

{
  "app_name": "string",
  "description": "string",
  "kaspa_apis": ["array of API URLs"],
  "entities": [{ "name": "EntityName", "schema": { "type": "object", "properties": {}, "required": [] } }],
  "pages": [{ "name": "PageName", "code": "full JSX" }],
  "functions": [{ "name": "functionName", "code": "full Deno code" }],
  "deploy_steps": ["step 1", "step 2"],
  "suggested_upgrades": ["upgrade 1", "upgrade 2"]
}

RULES:
- Max 3 entities, 3 pages, 2 functions
- ZERO placeholders. Complete working code only.
- Every app uses at least one live Kaspa API
- Dark UI: bg-gray-900, bg-gray-800 cards, teal-400 accent
- Mobile-first responsive

USER'S IDEA: "${userMsg}"

JSON only:`,
        model: "claude_sonnet_4_6",
      });

      let parsed;
      if (typeof codeResponse === "string") {
        const cleaned = codeResponse.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        parsed = JSON.parse(cleaned);
      } else {
        parsed = codeResponse;
      }

      setIdeData(parsed);
      const newFiles = buildFilesFromIdeData(parsed);
      setFiles(newFiles);
      if (newFiles.length > 0) setActiveFile(newFiles[0].id);

      // Remove status, add summary
      setMessages(prev => prev.filter(m => m.role !== "status"));

      const entityList = (parsed.entities || []).map(e => e.name).join(", ");
      const pageList = (parsed.pages || []).map(p => p.name).join(", ");
      const fnList = (parsed.functions || []).map(f => f.name).join(", ");

      let summary = `✅ **${parsed.app_name || "Your app"}** generated!\n\n`;
      if (parsed.entities?.length) summary += `🗄️ Entities: ${entityList}\n`;
      if (parsed.pages?.length) summary += `📄 Pages: ${pageList}\n`;
      if (parsed.functions?.length) summary += `⚙️ Functions: ${fnList}\n`;
      summary += `\nFiles are in the **Explorer** — click any file to view/edit code. Switch to **Preview** tab to see a preview.`;

      if (parsed.suggested_upgrades?.length) {
        summary += `\n\nWant me to add:\n${parsed.suggested_upgrades.map(u => `• ${u}`).join("\n")}`;
      }

      addMessage("assistant", summary);
      setRightPanel("code");
    } catch (err) {
      console.error("KAI IDE error:", err);
      setMessages(prev => prev.filter(m => m.role !== "status"));
      addMessage("assistant", "❌ Something went wrong generating the app. Try describing it differently.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentFile = files.find(f => f.id === activeFile) || null;

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ background: "rgba(12,12,20,0.98)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white/40 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500/70" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
              <div className="w-2 h-2 rounded-full bg-green-500/70" />
            </div>
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400">KAI IDE</span>
            {ideData?.app_name && (
              <span className="text-[11px] text-white/25 font-mono">— {ideData.app_name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setShowExplorer(!showExplorer)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="Toggle Explorer">
            {showExplorer ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          {/* Right panel toggle */}
          <div className="flex items-center rounded-lg overflow-hidden ml-2" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setRightPanel("code")}
              className="px-3 py-1 text-[11px] font-bold transition-all"
              style={{ background: rightPanel === "code" ? "rgba(6,182,212,0.2)" : "transparent", color: rightPanel === "code" ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.3)" }}>
              Code
            </button>
            <button onClick={() => setRightPanel("preview")}
              className="px-3 py-1 text-[11px] font-bold transition-all"
              style={{ background: rightPanel === "preview" ? "rgba(6,182,212,0.2)" : "transparent", color: rightPanel === "preview" ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.3)" }}>
              Preview
            </button>
          </div>

          {files.length > 0 && (
            <button onClick={() => { setFiles([]); setActiveFile(null); setIdeData(null); setMessages([messages[0]]); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all hover:bg-white/10 ml-2"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "rgba(6,182,212,0.9)" }}>
              <Sparkles className="w-3 h-3" />
              New
            </button>
          )}
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT — Chat Panel */}
        <div className="flex-shrink-0 flex flex-col" style={{ width: "340px", minWidth: "280px" }}>
          <IDEChatPanel
            messages={messages}
            onSend={handleSend}
            isLoading={isLoading}
            suggestions={SUGGESTIONS}
          />
        </div>

        {/* CENTER — File Explorer (toggleable) */}
        {showExplorer && (
          <div className="flex-shrink-0" style={{ width: "200px" }}>
            <IDEFileExplorer
              files={files}
              activeFile={activeFile}
              onSelectFile={setActiveFile}
            />
          </div>
        )}

        {/* RIGHT — Code Editor OR Preview */}
        <div className="flex-1 min-w-0">
          {rightPanel === "code" ? (
            <IDECodeEditor
              file={currentFile}
              onCodeChange={handleCodeChange}
            />
          ) : (
            <IDEPreviewPanel files={files} />
          )}
        </div>
      </div>
    </div>
  );
}