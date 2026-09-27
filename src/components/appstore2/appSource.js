// Where each app's source lives. TTT is open source and the whole thing — every
// app in this store included — is one public repo, so a docs page can point
// straight at the code behind it and anyone can build on top.
//
// The paths below were checked against the repo, so a link only ever points at a
// folder or file that is really there.
export const SOURCE_REPO = "https://github.com/mrzeku2000XTTT/ttt";
export const SOURCE_BRANCH = "main";

// Every src/components folder that an app in the catalog maps onto.
const COMPONENT_FOLDERS = [
  "act", "apex", "arhtuun", "beatcut", "biblia", "bridge", "cam", "camerastudio", "canvas", "cinekas",
  "clutchkas", "dd", "dez", "doom", "doubleo", "eta", "eve", "feed", "flagsense", "framemimic",
  "framez", "frameflow", "glyph", "hikaru", "hiro", "hunterbeat", "hybrid", "hyper", "isolate", "kanvas", "kascompute",
  "kaspacollab", "katagami", "kcc20", "kccnft", "kiln", "kine", "kinezma", "kivr", "klipz", "klock",
  "kutt", "kydonia", "launchreel", "metamimic", "morph", "motion", "motionfly", "narrate", "niche", "oc",
  "orbt", "prism", "productstudio", "prompto", "rion", "rmx", "searchkaspa", "shillz", "silverscript", "simple",
  "sky", "slobz", "stakedag", "superzk", "tele", "terra", "thumbnailcreator", "tree", "tttbuilder", "ugc",
  "ui", "ultramock", "voxa",
];

// A few apps live under a page file that is not named after their route.
const PAGE_OVERRIDES = {
  Cinekas: "src/pages/Cinemata.jsx",
  GhostFrame: "src/pages/GhostFrameLanding.jsx",
};

/**
 * The source behind one app: its own repository when it is a standalone project,
 * otherwise the folder it lives in inside TTT, otherwise its page file.
 */
export function appSource(app) {
  if (!app) return null;
  if (app.repoUrl) return { url: app.repoUrl, path: null, own: true };
  if (!app.path) return null;

  const folder = COMPONENT_FOLDERS.includes(app.path.toLowerCase())
    ? `src/components/${app.path.toLowerCase()}`
    : null;
  const target = PAGE_OVERRIDES[app.path] || folder || `src/pages/${app.path}.jsx`;
  const kind = target === folder ? "tree" : "blob";

  return {
    url: `${SOURCE_REPO}/${kind}/${SOURCE_BRANCH}/${target}`,
    path: target,
    own: false,
  };
}