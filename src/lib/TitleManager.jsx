import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Forces the browser tab title on every route change.
 * Overrides Base44's auto-injected per-page titles (e.g. "AIAnalytics | TTT").
 *
 * Also sets up a MutationObserver to revert any external script that tries
 * to change <title> after navigation (Base44's SEO injector runs async).
 */
const DEFAULT_TITLE = "TTT — The Kaspa Super App";

// Per-route overrides if you ever want a custom title for a specific page.
// Anything not listed falls back to DEFAULT_TITLE.
const ROUTE_TITLES = {
  // "/AgentZK": "Agent ZK — TTT",
};

export default function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const target = ROUTE_TITLES[location.pathname] || DEFAULT_TITLE;

    // Set immediately
    document.title = target;

    // Re-assert after async injectors run (Base44's SEO inject is delayed)
    const t1 = setTimeout(() => { if (document.title !== target) document.title = target; }, 100);
    const t2 = setTimeout(() => { if (document.title !== target) document.title = target; }, 500);
    const t3 = setTimeout(() => { if (document.title !== target) document.title = target; }, 1500);

    // Watch <title> for external mutations and revert
    const titleEl = document.querySelector("title");
    let observer;
    if (titleEl) {
      observer = new MutationObserver(() => {
        if (document.title !== target) document.title = target;
      });
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer?.disconnect();
    };
  }, [location.pathname]);

  return null;
}