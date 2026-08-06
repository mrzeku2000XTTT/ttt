import { useState, useEffect, useCallback, useRef } from "react";

const KEY = (userEmail) => `hunterbeat_memory_${userEmail || "guest"}`;
const GUEST_KEY = "hunterbeat_memory_guest";

/**
 * Local, per-user memory store for HunterBeat.
 * Persists to localStorage, keyed by user email.
 * Migrates guest data → user key on login.
 */
export function useHunterBeatMemory(user) {
  const email = user?.email;
  const [skills, setSkills] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const emailRef = useRef(email);

  // Load from localStorage when email changes
  useEffect(() => {
    try {
      // Migrate guest data to user key on login
      if (email && emailRef.current !== email) {
        const guestRaw = localStorage.getItem(GUEST_KEY);
        if (guestRaw) {
          const guestData = JSON.parse(guestRaw);
          const userRaw = localStorage.getItem(KEY(email));
          const userData = userRaw ? JSON.parse(userRaw) : { skills: [], notes: [] };
          // Merge guest skills into user (avoid duplicates by source_url)
          const existingUrls = new Set((userData.skills || []).map((s) => s.source_url).filter(Boolean));
          const mergedSkills = [...(userData.skills || []), ...(guestData.skills || []).filter((s) => !existingUrls.has(s.source_url))];
          const mergedNotes = [...(userData.notes || []), ...(guestData.notes || [])];
          const merged = { skills: mergedSkills, notes: mergedNotes };
          localStorage.setItem(KEY(email), JSON.stringify(merged));
          localStorage.removeItem(GUEST_KEY);
        }
        emailRef.current = email;
      }

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

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === KEY(email)) {
        try {
          const raw = e.newValue;
          const data = raw ? JSON.parse(raw) : { skills: [], notes: [] };
          setSkills(data.skills || []);
          setNotes(data.notes || []);
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
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