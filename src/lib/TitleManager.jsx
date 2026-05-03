import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Forces the browser tab title on every route change.
 * Overrides Base44's auto-injected per-page titles (e.g. "AIAnalytics | TTT").
 *
 * Also sets up a MutationObserver to revert any external script that tries
 * to change <title> after navigation (Base44's SEO injector runs async).
 */
const DEFAULT_TITLE = "TTT 2.0 — The Kaspa Super App";

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

    // Watch <title> for external mutations and revert instantly.
    // Base44's SEO injector replaces the <title> element with a per-page string
    // (e.g. "AIAnalytics | TTT") — we revert it before the browser paints it.
    const titleEl = document.querySelector("title");
    let observer;
    if (titleEl) {
      observer = new MutationObserver(() => {
        if (document.title !== target) document.title = target;
      });
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    // Aggressive re-assertion ladder — covers async injectors that fire at
    // various delays. Microtask + rAF + multiple timeouts keeps the title
    // pinned through the entire SEO injection window.
    Promise.resolve().then(() => { if (document.title !== target) document.title = target; });
    requestAnimationFrame(() => { if (document.title !== target) document.title = target; });
    const timers = [10, 50, 100, 250, 500, 1000, 2000, 4000].map((ms) =>
      setTimeout(() => { if (document.title !== target) document.title = target; }, ms)
    );

    return () => {
      timers.forEach(clearTimeout);
      observer?.disconnect();
    };
  }, [location.pathname]);

  return null;
}