import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, Save, Download, Sparkles, Layers, ExternalLink } from "lucide-react";
import FileTree from "@/components/oneshot/studio/FileTree";
import CodeEditor from "@/components/oneshot/studio/CodeEditor";
import StudioPreview from "@/components/oneshot/studio/StudioPreview";
import ChatPanel from "@/components/oneshot/studio/ChatPanel";

export default function OneShotStudio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [editedContent, setEditedContent] = useState({}); // { path: content } — local unsaved edits
  const [saving, setSaving] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [agentEvents, setAgentEvents] = useState([]); // live stream of agent activity
  const [error, setError] = useState(null);

  // Load project by ?id= or ?bootstrap= (JSON payload from cloner)
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const bootstrap = params.get("bootstrap");

      try {
        if (id) {
          const found = await base44.entities.OneShotProject.filter({ id });
          if (!found[0]) {
            setError("Project not found");
            setLoading(false);
            return;
          }
          setProject(found[0]);
          setActivePath(found[0].entry_file || found[0].files[0]?.path);
        } else if (bootstrap) {
          // Bootstrap from cloner: sessionStorage key
          const raw = sessionStorage.getItem(bootstrap);
          if (!raw) {
            setError("Bootstrap data not found");
            setLoading(false);
            return;
          }
          const data = JSON.parse(raw);
          const files = data.pages.map((p, i) => ({
            path: p.path === "/" ? "/Home.jsx" : p.path.replace(/\/$/, "") + ".jsx",
            content: p.code || "",
            type: "jsx",
          }));
          // Ensure unique paths
          const seen = new Set();
          const uniqueFiles = [];
          for (const f of files) {
            let path = f.path;
            let n = 1;
            while (seen.has(path)) {
              path = f.path.replace(/\.jsx$/, "") + n + ".jsx";
              n++;
            }
            seen.add(path);
            uniqueFiles.push({ ...f, path });
          }
          const entry = uniqueFiles[0]?.path || "/Home.jsx";
          const created = await base44.entities.OneShotProject.create({
            name: data.name || new URL(data.url).hostname,
            source_url: data.url,
            screenshot_url: data.screenshot_url || null,
            design_spec: data.design_spec || {},
            files: uniqueFiles,
            entry_file: entry,
            chat_history: [],
          });
          sessionStorage.removeItem(bootstrap);
          // Replace URL with ?id=...
          window.history.replaceState({}, "", `/OneShotStudio?id=${created.id}`);
          setProject(created);
          setActivePath(entry);
        } else {
          setError("No project specified. Go to OneShot to clone a site first.");
        }
      } catch (e) {
        setError(e.message || "Failed to load project");
      }
      setLoading(false);
    })();
  }, []);

  const activeFile = project?.files.find((f) => f.path === activePath);
  const activeContent = editedContent[activePath] !== undefined ? editedContent[activePath] : activeFile?.content || "";
  const dirty = editedContent[activePath] !== undefined && editedContent[activePath] !== activeFile?.content;

  const handleEditChange = (newContent) => {
    setEditedContent((prev) => ({ ...prev, [activePath]: newContent }));
  };

  const saveActiveFile = useCallback(async () => {
    if (!project || !activePath || !dirty) return;
    setSaving(true);
    try {
      const newFiles = project.files.map((f) =>
        f.path === activePath ? { ...f, content: editedContent[activePath] } : f
      );
      const updated = await base44.entities.OneShotProject.update(project.id, { files: newFiles });
      setProject(updated);
      setEditedContent((prev) => {
        const copy = { ...prev };
        delete copy[activePath];
        return copy;
      });
    } catch (e) {
      alert("Save failed: " + e.message);
    }
    setSaving(false);
  }, [project, activePath, editedContent, dirty]);

  const createFile = async (path) => {
    if (!project) return;
    if (project.files.find((f) => f.path === path)) {
      alert("File already exists");
      return;
    }
    const type = path.endsWith(".css") ? "css" : path.endsWith(".md") ? "md" : path.endsWith(".json") ? "json" : path.endsWith(".js") ? "js" : "jsx";
    const newFiles = [...project.files, { path, content: "", type }];
    const updated = await base44.entities.OneShotProject.update(project.id, { files: newFiles });
    setProject(updated);
    setActivePath(path);
  };

  const deleteFile = async (path) => {
    if (!project || project.files.length <= 1) return;
    const newFiles = project.files.filter((f) => f.path !== path);
    let newEntry = project.entry_file;
    if (project.entry_file === path) newEntry = newFiles[0].path;
    const updated = await base44.entities.OneShotProject.update(project.id, { files: newFiles, entry_file: newEntry });
    setProject(updated);
    if (activePath === path) setActivePath(newEntry);
    setEditedContent((prev) => {
      const copy = { ...prev };
      delete copy[path];
      return copy;
    });
  };

  const renameFile = async (oldPath, newPath) => {
    if (!project) return;
    if (project.files.find((f) => f.path === newPath)) {
      alert("A file with that name already exists");
      return;
    }
    const newFiles = project.files.map((f) => (f.path === oldPath ? { ...f, path: newPath } : f));
    let newEntry = project.entry_file;
    if (project.entry_file === oldPath) newEntry = newPath;
    const updated = await base44.entities.OneShotProject.update(project.id, { files: newFiles, entry_file: newEntry });
    setProject(updated);
    if (activePath === oldPath) setActivePath(newPath);
  };

  const sendChat = async (message) => {
    if (!project || chatSending) return;
    setChatSending(true);
    setAgentEvents([]);

    // Optimistically append user message
    const optimisticHistory = [
      ...(project.chat_history || []),
      { role: "user", content: message, timestamp: new Date().toISOString() },
    ];
    setProject((prev) => ({ ...prev, chat_history: optimisticHistory }));

    try {
      // Stream the agent function via base44.functions.fetch (auth handled automatically)
      const resp = await base44.functions.fetch("oneshotAgent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: project.id, userMessage: message }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        throw new Error(errText || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalProject = null;
      let finalFilesChanged = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          let ev;
          try { ev = JSON.parse(line.slice(6)); } catch { continue; }

          setAgentEvents((prev) => [...prev, ev]);

          if (ev.type === "done") {
            finalProject = ev.project;
            finalFilesChanged = ev.files_changed || [];
          } else if (ev.type === "error") {
            throw new Error(ev.message || "Agent error");
          }
        }
      }

      if (finalProject) {
        setProject(finalProject);
        if (finalFilesChanged.length) {
          setEditedContent((prev) => {
            const copy = { ...prev };
            for (const p of finalFilesChanged) delete copy[p];
            return copy;
          });
        }
      }
    } catch (e) {
      setAgentEvents((prev) => [...prev, { type: "error", message: e.message }]);
      // Revert optimistic user message
      setProject((prev) => ({ ...prev, chat_history: project.chat_history }));
    }
    setChatSending(false);
  };

  const exportJSON = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project.files, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}-files.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030305] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-white/[0.03] border border-white/[0.08] rounded-2xl p-10">
          <h1 className="text-xl font-black mb-2">Studio</h1>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <Link to="/UICloner">
            <button className="text-[13px] text-white border border-white/10 hover:border-white/20 rounded-xl px-5 py-2.5 transition-all">
              ← Back to OneShot
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#030305] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] bg-black/60 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/UICloner")} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/50 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <span className="font-black text-sm">OneShot Studio</span>
          </div>
          <span className="text-white/20">/</span>
          <span className="text-[13px] text-white/70 font-medium">{project.name}</span>
          {project.source_url && (
            <a href={project.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/30 hover:text-cyan-400 flex items-center gap-1 font-mono">
              {new URL(project.source_url).hostname}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveActiveFile}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-2.5 py-1.5 transition-all"
          >
            <Save className="w-3 h-3" />
            {saving ? "Saving…" : dirty ? "Save file" : "Saved"}
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-2.5 py-1.5 transition-all"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </header>

      {/* Main IDE layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree */}
        <div className="w-52 border-r border-white/[0.05] flex-shrink-0">
          <FileTree
            files={project.files}
            activePath={activePath}
            onSelect={(p) => setActivePath(p)}
            onCreate={createFile}
            onDelete={deleteFile}
            onRename={renameFile}
          />
        </div>

        {/* Editor + Preview column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0">
            {/* Editor */}
            <div className="flex-1 border-r border-white/[0.05] min-w-0">
              <CodeEditor
                file={activeFile ? { ...activeFile, content: activeContent } : null}
                onChange={handleEditChange}
                onSave={saveActiveFile}
                saving={saving}
                dirty={dirty}
              />
            </div>

            {/* Preview */}
            <div className="flex-1 min-w-0">
              <StudioPreview files={project.files} entryPath={project.entry_file || project.files[0]?.path} />
            </div>
          </div>

          {/* Chat */}
          <div className="h-80 flex-shrink-0 min-h-0 flex flex-col">
            <ChatPanel
              history={project.chat_history || []}
              onSend={sendChat}
              sending={chatSending}
              agentEvents={agentEvents}
            />
          </div>
        </div>
      </div>
    </div>
  );
}