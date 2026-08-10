/**
 * Keeps a running TTT Agent 1 build alive when the user leaves the page.
 *
 * - Writes the finished build straight to localStorage (not only React state),
 *   so a build that finishes while the builder is unmounted is never lost.
 * - Warns before a refresh / tab close while a build is in flight, so the only
 *   thing that can kill a build is the user deliberately closing the app.
 */

export function persistBuild({ files, messages, phase = "studio" }) {
  try {
    if (Array.isArray(files)) localStorage.setItem("ttt_builder_files", JSON.stringify(files));
    if (Array.isArray(messages)) localStorage.setItem("ttt_builder_messages", JSON.stringify(messages));
    localStorage.setItem("ttt_builder_phase", phase);
  } catch {}
}

let guardCount = 0;

const handler = (e) => {
  e.preventDefault();
  e.returnValue = "";
  return "";
};

/** Block accidental refresh/close while a build runs. Returns a release fn. */
export function guardUnload() {
  if (guardCount === 0) window.addEventListener("beforeunload", handler);
  guardCount++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    guardCount = Math.max(0, guardCount - 1);
    if (guardCount === 0) window.removeEventListener("beforeunload", handler);
  };
}