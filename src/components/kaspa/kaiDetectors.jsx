// KAI Detectors — all matching/detection utility functions

import {
  IMAGE_KEYWORDS, KASPA_NEWS_KEYWORDS, SEARCH_KEYWORDS,
  FEED_KEYWORDS, USER_POST_KEYWORDS, TRAIN_KEYWORDS,
  BUILD_KEYWORDS, VIBE_CODE_KEYWORDS, BRAIN_KEYWORDS, BROWSE_KEYWORDS, VIDEO_KEYWORDS,
  WATCH_THAT_KEYWORDS, FEED_ROUTE_MAP, APP_DIRECTORY
} from './kaiConstants';

const matchesAny = (msg, keywords) => keywords.some(kw => msg.toLowerCase().includes(kw));

export const isImageRequest = (msg) => matchesAny(msg, IMAGE_KEYWORDS);
export const isKaspaNewsRequest = (msg) => matchesAny(msg, KASPA_NEWS_KEYWORDS);
export const isSearchRequest = (msg) => matchesAny(msg, SEARCH_KEYWORDS);
export const isFeedRequest = (msg) => matchesAny(msg, FEED_KEYWORDS);
export const isUserPostRequest = (msg) => matchesAny(msg, USER_POST_KEYWORDS);
export const isTrainRequest = (msg) => matchesAny(msg, TRAIN_KEYWORDS);
export const isBuildRequest = (msg) => matchesAny(msg, BUILD_KEYWORDS);
export const isVibeCodeRequest = (msg) => matchesAny(msg, VIBE_CODE_KEYWORDS);
export const isBrainRequest = (msg) => matchesAny(msg, BRAIN_KEYWORDS);
export const isWatchThatRequest = (msg) => matchesAny(msg, WATCH_THAT_KEYWORDS);
export const isVideoRequest = (msg) => {
  // Don't match "watch that/it/the first" as a video request
  if (isWatchThatRequest(msg)) return false;
  return matchesAny(msg, VIDEO_KEYWORDS);
};

// Detect which feed to route to based on user message
export const detectFeedRoute = (msg) => {
  const lower = msg.toLowerCase();
  for (const [key, config] of Object.entries(FEED_ROUTE_MAP)) {
    if (config.keywords.some(kw => lower.includes(kw))) return config.feed;
  }
  return null;
};

// Extract video index from "watch the first/second/third" or "watch #1"
export const extractVideoIndex = (msg) => {
  const lower = msg.toLowerCase();
  if (/\b(first|1st|#1|number 1)\b/.test(lower)) return 0;
  if (/\b(second|2nd|#2|number 2)\b/.test(lower)) return 1;
  if (/\b(third|3rd|#3|number 3)\b/.test(lower)) return 2;
  if (/\b(fourth|4th|#4|number 4)\b/.test(lower)) return 3;
  if (/\b(fifth|5th|#5|number 5)\b/.test(lower)) return 4;
  // Default to first (0) for "watch that", "watch it", etc.
  return 0;
};

export const isUrlInput = (text) => /^(https?:\/\/|www\.)/i.test(text.trim());

export const isBrowseRequest = (msg) => {
  if (isUrlInput(msg)) return true;
  const lower = msg.toLowerCase().trim();
  return BROWSE_KEYWORDS.some(kw => lower.startsWith(kw) || lower.includes(kw));
};

export const getBrowseUrl = (msg) => {
  const trimmed = msg.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) return urlMatch[1];
  const wwwMatch = trimmed.match(/(www\.[^\s]+)/i);
  if (wwwMatch) return `https://${wwwMatch[1]}`;
  const query = trimmed
    .replace(/^(browse|search for|look up|lookup|go to site|open link|open site|open website|navigate to site|visit|load site|google|find me|check out site|show me site)\s*/i, '')
    .trim();
  if (!query) return "https://kaspa-app-9cc9fe40.base44.app";
  return `https://www.google.com/search?igu=1&q=${encodeURIComponent(query)}`;
};

export const isExplorerRequest = (msg) => {
  const trimmed = msg.trim();
  if (/^[a-f0-9]{64}$/i.test(trimmed)) return true;
  if (trimmed.startsWith('kaspa:')) return true;
  if (/\b[a-f0-9]{64}\b/i.test(trimmed)) return true;
  if (/(kaspa:[a-z0-9]{10,})/i.test(trimmed)) return true;
  const lower = msg.toLowerCase();
  const explicitExplorerPhrases = ['check this transaction', 'check transaction', 'check this tx', 'check tx', 'look up transaction', 'look up tx', 'find transaction', 'find tx', 'check this address', 'check address'];
  if (explicitExplorerPhrases.some(kw => lower.includes(kw))) return true;
  const explicitNetworkPhrases = ['network stats', 'kaspa stats', 'show hashrate', 'show coin supply', 'kaspa network info'];
  return explicitNetworkPhrases.some(kw => lower.includes(kw));
};

export const detectExplorerAction = (msg) => {
  const trimmed = msg.trim();
  if (/^[a-f0-9]{64}$/i.test(trimmed)) return { action: 'transaction', query: trimmed };
  if (trimmed.startsWith('kaspa:')) return { action: 'address', query: trimmed };
  const addrMatch = trimmed.match(/(kaspa:[a-z0-9]{10,})/i);
  if (addrMatch) return { action: 'address', query: addrMatch[1] };
  const txMatch = trimmed.match(/\b([a-f0-9]{64})\b/i);
  if (txMatch) return { action: 'transaction', query: txMatch[1] };
  const lower = msg.toLowerCase();
  if (['network stats', 'kaspa stats', 'show hashrate', 'show coin supply', 'kaspa network info'].some(kw => lower.includes(kw))) {
    return { action: 'network', query: '' };
  }
  return null;
};

export const detectOpenApp = (msg) => {
  const lower = msg.toLowerCase().trim();
  const openPatterns = [/^open\s+(.+)$/i, /^go\s+to\s+(.+)$/i, /^take\s+me\s+to\s+(.+)$/i, /^launch\s+(.+)$/i, /^navigate\s+to\s+(.+)$/i, /^start\s+(.+)$/i];
  for (const pattern of openPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const appName = match[1].trim().replace(/[?.!]/g, '');
      for (const app of APP_DIRECTORY) {
        if (app.names.some(n => appName === n || appName.includes(n))) {
          return app;
        }
      }
    }
  }
  return null;
};

export const isTTTQuestion = (msg) => {
  const lower = msg.toLowerCase();
  const tttKeywords = ['suggest', 'recommend', 'app', 'ttt', 'feature', 'what can', 'how do i', 'where', 'which app', 'open', 'use', 'wallet', 'bridge', 'feed', 'agent', 'hikaru', 'xunhua', 'terra', 'zeku', 'stakedag', 'arcade', 'shop', 'marketplace', 'courses', 'nft', 'mint', 'profile', 'subscription', 'dagknight'];
  return tttKeywords.some(kw => lower.includes(kw));
};

export const fetchKaspaContext = async (userMessage) => {
  try {
    const encoded = encodeURIComponent(userMessage);
    const res = await fetch(`https://kaspa-b3ad561a.base44.app/functions/kaspaContext?format=prompt&limit=30&q=${encoded}`);
    if (res.ok) {
      const text = await res.text();
      return text.trim();
    }
  } catch {}
  return '';
};