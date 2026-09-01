// Best-effort "is this X (Twitter) profile still live?" check.
//
// Why this exists: X has no public API we can use, and users rename their
// accounts. A handle that was valid when we indexed it (e.g.
// https://x.com/someone235) can stop resolving after a rename, leaving dead
// links in the hot-topics feed. X blocks scraping, so this inspects the
// server-rendered HTML for live vs suspended/renamed/not-found signals.
//
// It is NOT 100% reliable — X may serve a login/challenge wall that looks the
// same for live and dead handles. To avoid nuking real content on a false
// negative, an inconclusive result is treated as "live" (kept). Only clear
// dead/suspended/not-found signals cause a link to be dropped.

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

const NON_HANDLE = new Set([
  'home', 'search', 'explore', 'notifications', 'messages', 'settings',
  'i', 'status', 'tos', 'privacy', 'login', 'signup', 'help', 'about',
  'download', 'share', 'intent', 'compose', 'hashtag', 'search-home',
  'account', 'oauth', 'sessions', 'logout',
]);

export function extractXHandle(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/^(www\.)?(x|twitter)\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const h = parts[0].replace(/^@/, '');
    if (NON_HANDLE.has(h.toLowerCase())) return null;
    return /^[A-Za-z0-9_]{2,15}$/.test(h) ? h : null;
  } catch {
    return null;
  }
}

export function isXLink(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === 'x.com' || h === 'twitter.com' || h === 'www.x.com' || h === 'www.twitter.com';
  } catch {
    return false;
  }
}

export interface XVerifyResult {
  live: boolean;
  reason: string;
  handle: string | null;
  finalUrl?: string;
  status?: number;
}

export async function verifyXProfile(handleOrUrl: string): Promise<XVerifyResult> {
  const fromUrl = extractXHandle(handleOrUrl);
  const handle =
    fromUrl ??
    (/^[A-Za-z0-9_]{2,15}$/.test(handleOrUrl.replace(/^@/, '')) ? handleOrUrl.replace(/^@/, '') : null);
  if (!handle) return { live: false, reason: 'not an X handle', handle: null };

  const url = `https://x.com/${handle}`;
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const finalUrl = res.url || url;

    const pick = (re: RegExp): string | null => {
      const m = html.match(re);
      return m ? m[1].trim() : null;
    };
    const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || '';
    const title = pick(/<title[^>]*>([^<]+)<\/title>/i) || '';
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // Redirects to X's own suspended/not-found pages = dead.
    if (/\/account\/(suspended|not_found|notfound)/i.test(finalUrl)) {
      return { live: false, reason: 'redirected to suspended/not_found', handle, finalUrl, status: res.status };
    }

    // Clear dead / suspended / renamed signals in the rendered text.
    const deadSignals = [
      'account suspended',
      "this account doesn't exist",
      'this account doesn\u2019t exist',
      'this account has been suspended',
      'user suspended',
      'account has been suspended',
      'sorry, that page doesn',
      'this account is suspended',
    ];
    if (deadSignals.some((s) => text.includes(s))) {
      return { live: false, reason: 'dead/suspended signal in page', handle, finalUrl, status: res.status };
    }
    if (/account suspended/i.test(title) || /account suspended/i.test(ogTitle)) {
      return { live: false, reason: 'suspended in title', handle, finalUrl, status: res.status };
    }

    // Live signals: og:title references the handle, or a profile og:image exists.
    const h = handle.toLowerCase();
    const handleInTitle =
      ogTitle.toLowerCase().includes(`@${h}`) || title.toLowerCase().includes(`@${h}`);
    const hasAvatar = /<meta[^>]+property=["']og:image["']/i.test(html);
    if (handleInTitle) return { live: true, reason: 'og:title matches handle', handle, finalUrl, status: res.status };
    if (ogTitle && hasAvatar) return { live: true, reason: 'profile og:title + avatar', handle, finalUrl, status: res.status };

    // Inconclusive (login wall / challenge). Keep to avoid false negatives.
    return { live: true, reason: 'inconclusive — kept', handle, finalUrl, status: res.status };
  } catch (e) {
    return { live: false, reason: `fetch error: ${(e as Error).message}`, handle };
  }
}