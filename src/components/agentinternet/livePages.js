// Unified index of all live, guest-browseable pages.
// Extends the App Store catalog with top-level entry pages that aren't listed
// as "apps" (Idea Lab, App Store, TTT Home) so guest search on the Agent
// Internet landing can route to them — e.g. "idea" → Idea Lab.
import { APPS } from "@/components/appstore2/appCatalog";

export const EXTRA_PAGES = [
  { name: "Idea Lab", path: "Explore", cat: "Discovery", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1994014c6_generated_image.png", desc: "Generate & research Kaspa app ideas with live web search" },
  { name: "App Store", path: "AppStoreV2", cat: "Discovery", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fdf274d16_generated_image.png", desc: "Browse all live Kaspa-native apps & builder projects" },
  { name: "TTT Home", path: "TTTHome", cat: "Discovery", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1eb999ca9_generated_image.png", desc: "The main TTT app hub & superagent launcher" },
];

export const LIVE_PAGES = [...EXTRA_PAGES, ...APPS];

// Pages that must NEVER be visible to guests / non-admin users.
export const ADMIN_ONLY_PATHS = [
  "LaunchReel", "HunterBeat", "TwoTip", "AppStore", "AgentInternet",
  "SuperZK", "KGigZ", "OuTKasTT", "AWASigner", "KasSigner",
  "KASDollar", "ArgentStudio", "SectorVI", "IgraAgent",
];

export function visibleLivePages(isAdmin) {
  if (isAdmin) return LIVE_PAGES;
  return LIVE_PAGES.filter((p) => !ADMIN_ONLY_PATHS.includes(p.path));
}