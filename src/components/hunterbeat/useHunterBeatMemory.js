import { useState, useEffect, useCallback } from "react";

const KEY = (userEmail) => `hunterbeat_memory_${userEmail || "guest"}`;

/**
 * Local, per-user memory store for HunterBeat.
 * Stores:
 *  - skills: [{ id, title, source_url, content, added_at }]
 *  - notes: [{ id, text, added_at }]
 * Persisted to localStorage, keyed by user email.
 */
export function useHunterBeatMemory(user) {
  const email = user?.email;
  const [skills, setSkills] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(email));
      const data = raw ? JSON.parse(raw) : { skills: [], notes: [] };
      setSkills(data.skills || []);
      setNotes(data.notes || []);
    } catch {
      setSkills([]);
      setNotes([]);
    }
    setLoaded(true);
  }, [email]);

  const persist = useCallback(
    (next) => {
      try {
        localStorage.setItem(KEY(email), JSON.stringify(next));
      } catch {}
    },
    [email]
  );

  const addSkill = useCallback(
    (skill) => {
      setSkills((prev) => {
        const next = { skills: [...prev, skill], notes };
        persist(next);
        return next.skills;
      });
    },
    [notes, persist]
  );

  const removeSkill = useCallback(
    (id) => {
      setSkills((prev) => {
        const next = { skills: prev.filter((s) => s.id !== id), notes };
        persist(next);
        return next.skills;
      });
    },
    [notes, persist]
  );

  const addNote = useCallback(
    (text) => {
      setNotes((prev) => {
        const next = { skills, notes: [...prev, { id: Date.now(), text, added_at: Date.now() }] };
        persist(next);
        return next.notes;
      });
    },
    [skills, persist]
  );

  const removeNote = useCallback(
    (id) => {
      setNotes((prev) => {
        const next = { skills, notes: prev.filter((n) => n.id !== id) };
        persist(next);
        return next.notes;
      });
    },
    [skills, persist]
  );

  return { skills, notes, addSkill, removeSkill, addNote, removeNote, loaded };
}

/**
 * Convert a github.com blob URL to its raw markdown URL.
 * Handles:
 *  - https://github.com/owner/repo/blob/branch/path/to/SKILL.md
 *  - https://github.com/owner/repo/tree/branch/path (dir → README.md)
 *  - already-raw URLs
 */
export function githubUrlToRaw(url) {
  if (!url) return null;
  url = url.trim();
  if (/raw\.githubusercontent\.com/.test(url)) return url;
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
  if (m) {
    const [, owner, repo, branch, path] = m;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }
  return null;
}

/**
 * Fetch a GitHub skill URL's raw markdown content.
 * Returns { title, content }.
 */
export async function fetchSkillContent(url) {
  const raw = githubUrlToRaw(url);
  if (!raw) throw new Error("Not a valid GitHub file URL");
  const res = await fetch(raw);
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  const content = await res.text();
  const title = extractTitle(content, url);
  return { title, content };
}

function extractTitle(md, url) {
  const h1 = md.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  const parts = url.split("/");
  return parts[parts.length - 1]?.replace(/\.md$/i, "") || "Skill";
}