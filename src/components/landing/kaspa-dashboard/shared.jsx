export const IOS_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
export const KASPA_LOGO = "https://cryptologos.cc/logos/kaspa-kas-logo.png";
export const PREFS_KEY = "kaspa_preferences";

export const KRC_LABELS = {
  krc20: "KRC-20 Token",
  krc721: "KRC-721 NFT",
  kcc: "KCC Canonical",
  dapp: "DApp / Builder",
  explorer: "Just Exploring",
};

export const KRC_OPTIONS = [
  { value: "krc20", label: "KRC-20 Token", desc: "Fungible tokens on Kaspa" },
  { value: "krc721", label: "KRC-721 NFT", desc: "Non-fungible tokens" },
  { value: "kcc", label: "KCC Canonical", desc: "Canonical contracts" },
  { value: "dapp", label: "DApp / Builder", desc: "Decentralized app builder" },
  { value: "explorer", label: "Just Exploring", desc: "New to the ecosystem" },
];

export function truncateAddress(addr) {
  if (!addr) return "";
  const clean = addr.startsWith("kaspa:") ? addr : `kaspa:${addr}`;
  return `${clean.slice(0, 10)}…${clean.slice(-6)}`;
}

export function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function isDesktop() {
  return window.innerWidth > 1024;
}

export function normalizeAddress(addr) {
  if (!addr) return "";
  return addr.startsWith("kaspa:") ? addr : `kaspa:${addr}`;
}