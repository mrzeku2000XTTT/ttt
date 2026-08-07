import { useState, useEffect, useCallback, useRef } from "react";

const KEY = (userEmail) => `hunterbeat_chats_${userEmail || "guest"}`;
const GUEST_KEY = "hunterbeat_chats_guest";

function loadChats(email) {
  try {
    const raw = localStorage.getItem(KEY(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(email, chats) {
  try {
    localStorage.setItem(KEY(email), JSON.stringify(chats));
  } catch {}
}

/**
 * Per-user chat session store for HunterBeat.
 * Persists chats to localStorage, keyed by user email.
 * Migrates guest chats to user key on login.
 */
export function useHunterBeatChats(user) {
  const email = user?.email;
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const emailRef = useRef(email);

  // Load + migrate on email change
  useEffect(() => {
    try {
      if (email && emailRef.current !== email) {
        const guestRaw = localStorage.getItem(GUEST_KEY);
        if (guestRaw) {
          const guestChats = JSON.parse(guestRaw);
          if (guestChats?.length) {
            const userChats = loadChats(email);
            const merged = [...userChats, ...guestChats];
            saveChats(email, merged);
            localStorage.removeItem(GUEST_KEY);
          }
        }
        emailRef.current = email;
      }
      const loaded = loadChats(email);
      setChats(loaded);
      if (loaded.length > 0 && !activeChatId) {
        setActiveChatId(loaded[0].id);
      }
    } catch {
      setChats([]);
    }
  }, [email]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === KEY(email)) {
        try {
          const loaded = e.newValue ? JSON.parse(e.newValue) : [];
          setChats(loaded);
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [email]);

  const persist = useCallback(
    (next) => {
      saveChats(email, next);
    },
    [email]
  );

  const createChat = useCallback(() => {
    const id = Date.now();
    const chat = {
      id,
      title: "New chat",
      messages: [],
      created_at: id,
      updated_at: id,
      duration: 6,
    };
    setChats((prev) => {
      const next = [chat, ...prev];
      persist(next);
      return next;
    });
    setActiveChatId(id);
    return id;
  }, [persist]);

  const deleteChat = useCallback(
    (id) => {
      setChats((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persist(next);
        if (activeChatId === id) {
          setActiveChatId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
    },
    [persist, activeChatId]
  );

  const updateChat = useCallback(
    (id, patch) => {
      setChats((prev) => {
        const next = prev.map((c) =>
          c.id === id ? { ...c, ...patch, updated_at: Date.now() } : c
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const getActiveChat = useCallback(() => {
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  return {
    chats,
    activeChatId,
    setActiveChatId,
    createChat,
    deleteChat,
    updateChat,
    getActiveChat,
  };
}