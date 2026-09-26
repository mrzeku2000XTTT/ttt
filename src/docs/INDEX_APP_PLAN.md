# KINDEX — pasted-URL searchable database · PLAN

> Working name: **KINDEX** (`/Kindex`). Alternates: **KATALOG** (`/Katalog`), **SHELDON**.
> Status: **plan only — nothing built yet.**
> Follows [`new-app-checklist.md`](./new-app-checklist.md) and [`app-landing-standard.md`](./app-landing-standard.md).

---

## 1. The idea

On *Young Sheldon*, Sheldon and Dr. Sturgis build a **searchable database** — not a chatbot,
not a summary machine: a catalogue you can query, where every result is traceable to the exact
passage it came from and to the algorithm that ranked it.

KINDEX is that, but the input is **any URL you paste**. Paste ten links, a hundred links, or a
whole reading list. Each page is fetched, cleaned, split into passages, and folded into a real
**inverted index** built on your device. Then you search it with an actual ranking algorithm —
BM25, the same family of scoring that powered pre-neural search engines — and KINDEX shows you
*why* each hit won: term frequency, inverse document frequency, length normalisation, phrase
bonus, field boosts.

The point is the difference from "ask an AI about this link":

| | AI summary | KINDEX |
|---|---|---|
| Output | prose, may drift from source | ranked passages, verbatim |
| Provenance | implicit | every hit links to its URL + position |
| Repeatable | varies per run | deterministic — same query, same ranking |
| Works offline | no | yes, index lives in the browser |
| Cost | LLM credits per query | zero |

AI is optional on top, never the engine.

---

## 2. Is it legal?

Short answer: **yes for publicly reachable pages, indexed for your own private use — with
conditions.** It is the same thing search engines do. The risks are not in "indexing", they are
in *how you fetch* and *what you do with the copies*. Not legal advice; if this ever becomes a
public or commercial product, have counsel review it.

**Safe by default**
- Fetching pages that are publicly reachable without logging in.
- Building a private, per-user index — each user only ever sees what they pasted.
- Storing **excerpts + a link + attribution**, rather than a full mirror of the web.

**Rules the app must enforce**
1. **Honour `robots.txt`.** Check it before fetching; if the path is disallowed, refuse and say so.
2. **Never bypass a paywall, login, CAPTCHA or other access control.** That is where the real
   legal exposure lives (contract breach at minimum, computer-misuse statutes at worst). KINDEX
   stops at the wall and reports "not publicly reachable".
3. **Be a polite client.** One request per URL, low concurrency, a descriptive user agent,
   cache and skip re-fetching unchanged pages (hash the response).
4. **No republishing.** The index is private. No public corpus, no shared full-text feed, no
   bulk export of other people's content for redistribution. Export is for the user's own data.
5. **Keep it single-user by default.** Once a database is shared between users, other people's
   copyrighted text and personal data are being processed for a third party — that is where
   GDPR/CCPA and copyright exposure actually begin. Enforced with row-level security on every
   source record (`created_by_id`).
6. **Show the source.** Every result carries its host, title, URL and position in the page.

**What we deliberately do not do**
- No crawling beyond the pasted URLs (no link-following spider).
- No indexing of private/authenticated content.
- No re-hosting of the fetched pages as a downloadable library.

---

## 3. Can it work for *any* pasted URL?

Yes, with honest limits. A fetch-and-extract pipeline handles most of the web; four categories
need special handling, and two should simply be refused.

| Input | Handled how |
|---|---|
| Static / server-rendered HTML (news, blogs, docs, Wikipedia, most sites) | Direct fetch + clean. Works today. |
| X / Twitter posts | `fetchUrlContent` already resolves these via public mirrors — reuse as-is. |
| PDFs | Flag the content-type, extract text server-side, then index the same way. |
| JS-only SPAs that render nothing into the HTML | Fallback to a renderer (existing proxy function, or the sandbox function for a real headless render). Slower, so it is opt-in per source. |
| YouTube | Pull the transcript through the existing YouTube search functions and index that as the source text. |
| Paywalled / login-walled | **Refused** — reported as not publicly reachable, with the reason. |
| Huge pages (100k+ chars) | Capped and chunked; the tail is dropped and the source is flagged as truncated. |

The existing `fetchUrlContent` function already does the fetch strategies, entity decoding,
title/description/heading extraction and X-post handling. Its one limitation for this app is a
**5,000-character text cap** — enough for a summary tool, not for an index. So the plan is a new
sibling function (`indexUrlFetch`) that keeps the same proven fetch logic but returns up to
~60k characters of cleaned text, plus a `robots.txt` decision and the content-type.

Nothing existing gets deleted or rewritten.

---

## 4. Architecture

### Entities

**`IndexSource`** — one record per pasted URL, private to its creator.
`url`, `host`, `title`, `description`, `headings[]`, `tags[]`, `collection`, `text` (cleaned,
capped), `char_count`, `token_count`, `content_hash`, `robots_allowed`, `status`
(`queued | fetching | ready | blocked | failed | truncated`), `error`, `fetched_at`.

**`IndexQuery`** — optional query log powering search history and "your most-queried terms".
`query`, `result_count`, `top_host`, `ran_at`.

Both carry RLS scoped to `created_by_id` for read/create/update/delete — the privacy rule from
section 2 is enforced at the data layer, not just in the UI.

### Backend function (one, new)

`indexUrlFetch` — `{ url }` in; `{ status, title, description, headings, text, host,
contentType, robotsAllowed, truncated }` out. Reuses the fetch strategies from `fetchUrlContent`,
adds the robots check, the content-type branch, and a much larger text budget. Rate-limited by
the client, not by the function.

Reused as-is, not rewritten: `publicWebProxy` / `webProxy` (SPA fallback), `e2bSandbox`
(headless render, opt-in), `ExtractDataFromUploadedFile` (PDF text), `youtubeSearch` (video
transcripts), `InvokeLLM` (the optional answer layer only).

### The algorithm (runs entirely in the browser)

```
src/lib/index/
  tokenize.js     lowercase → unicode word split → stopwords → light suffix stemming
  phrases.js      position lists → bigram/trigram phrase matching
  buildIndex.js   postings { term → [{ docId, tf, positions[] }] }, doc lengths, avgdl
  bm25.js         ranking, field boosts, phrase bonus, recency tiebreak
  snippets.js     best passage around a hit, with match offsets for highlighting
  simhash.js      near-duplicate detection ("you already indexed this page")
  persist.js      IndexedDB for the index, localStorage for small prefs
```

Scoring, in words:

```
score(doc, query) = Σ over query terms of
    IDF(term) × ( tf × (k1 + 1) ) / ( tf + k1 × (1 − b + b × len/avgdl) )
  × field weight  (title ×3, headings ×2, body ×1)
  + phrase bonus for adjacent matched positions
```

`k1 = 1.2`, `b = 0.75` — the standard defaults. Deterministic, explainable, and fast: a few
hundred pages index and search in milliseconds, with no network and no credits.

The **ranking explainer** is the feature that makes this feel like Sheldon's machine: select any
result and see the per-term contribution, the boost that applied, and the passage that earned it.

### Scaling thresholds (documented, not pre-built)

- ≤ ~300 sources / ~5 MB index → build in the browser, persist to IndexedDB. **This is the target.**
- Beyond that → move index construction into a backend function and store passages as their own
  records. Note the threshold in the code; do not build it until a real database hits it.

---

## 5. The app surface

**Landing** (to the standard — header, hero with a real paste field, live preview of real search
output, feature bar, workflow, "what it extracts" cards, CTA, footer; landing-first, entry
remembered for the session; KCC20 gate at the door via `useKcc20Wallet`).

**Studio** — three zones:
- **Sources**: paste one URL or a whole list, drag a `.txt`/`.csv` of links, per-source progress
  and status, host/tag filters, dedupe warnings, delete, re-fetch.
- **Search**: query bar, live results as ranked passages with highlighted terms, host/collection/
  date filters, result count, and the ranking explainer for the selected hit.
- **Answer** (optional): an AI answer synthesised *only* from the retrieved passages, with the
  sources listed under it. Off by default, never required.

Exports: the index as JSON/CSV, and a Markdown digest of a search (query, ranked sources,
passages) — the user's own data, not a redistribution of the corpus.

---

## 6. Build phases

1. **Fetch + store** — `indexUrlFetch`, `IndexSource`, paste box, source list, statuses, dedupe.
2. **The algorithm** — tokenizer, postings, BM25, search UI with snippets + highlighting.
3. **Explain + filter** — ranking explainer, host/tag/collection filters, query history.
4. **Optional AI answer** — retrieved-passage-only synthesis via `InvokeLLM`.
5. **Ship** — landing per the standard, logo + hero generated, `<Route>` in `App.jsx`, entry in
   `appCatalog.js`, paths added to `HIDDEN_PATHS` in `BackToStore.jsx`, app docs written.

Each phase is independently usable — phase 2 is already a working product.

---

## 7. Decisions needed before building

1. **Name** — KINDEX, KATALOG, or SHELDON?
2. **Scope** — private per-user database (recommended, legal-safe) or a shared corpus (needs a
   rights/moderation story first)?
3. **Search only, or AI answers too?** (AI is a layer on top; the algorithm works without it.)
4. **Gate** — KCC20 wallet gate per the checklist, or open like BIBLIA?
5. **Full text** — approve the new `indexUrlFetch` (recommended) or accept the 5k cap on the
   existing fetcher for phase 1?