// Frontend helpers for the productivity tool protocol.
// Parses ```productivity-tool``` fenced JSON blocks from agent replies
// and persists interactive tool state to localStorage.

export function parseProductivityTools(text) {
  const tools = [];
  const re = /```productivity-tool\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text || "")) !== null) {
    try {
      const obj = JSON.parse(m[1].trim());
      if (obj && obj.kind) tools.push(obj);
    } catch {
      /* ignore malformed */
    }
  }
  return tools;
}

export function stripToolBlocks(text) {
  return (text || "").replace(/```productivity-tool\s*\n[\s\S]*?```/g, "").trim();
}

const PREFIX = "bi_tool_";

export function loadToolState(id) {
  try {
    const raw = localStorage.getItem(PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveToolState(id, state) {
  try {
    localStorage.setItem(PREFIX + id, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}