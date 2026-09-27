# KYDONIA — pasted-URL searchable database · PLAN

> **Name: KYDONIA** (`/Kydonia`), after the Cydonia region of Mars.
> Route, page, entity and component names all derive from it. Alternates if you want to swap:
> **THARSIS**, **PHOBOS**, **SOLIS**.
> Status: **plan only — nothing built yet.**
> Follows [`new-app-checklist.md`](./new-app-checklist.md) and [`app-landing-standard.md`](./app-landing-standard.md).

---

## 1. The idea

A catalogue you can query. Not a chatbot, not a summary machine — a real database built from
pages you paste, where every result is traceable to the exact passage it came from and to the
algorithm that ranked it.

Paste ten links, a hundred links, or a whole reading list. Each page is fetched, cleaned, split
into passages, and folded into an **inverted index built on your device**. Then you search it
with an actual ranking algorithm — **BM25**, the scoring model search engines used before neural
search — and KYDONIA shows you *why* each hit won: term frequency, inverse document frequency,
length normalisation, phrase bonus, field boosts.

The difference from "ask an AI about this link":

| | AI summary | KYDONIA |
|---|---|---|
| Output | prose, may drift from source | ranked passages, verbatim |
| Provenance | implicit | every hit links to its URL + position |
| Repeatable | varies per run | deterministic — same query, same ranking |
| Works offline | no | yes, the index lives in the browser |
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
   legal exposure lives (contract breach at minimum, computer-misuse statutes at worst). KYDONIA
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
sibling function (`kydoniaUrlFetch`) that keeps the same proven fetch logic but returns up to
~60k characters of cleaned text, plus a `robots.txt` decision and the content-type.

Nothing existing gets deleted or rewritten.

---

## 4. Martian identity

The app is named after a region of Mars, so its whole surface reads like a survey instrument:
monospace, telemetry, and imagery drawn in characters rather than photographs.

**Palette** (scoped under `.kydonia-page` — never leaks to other apps)

| Token | Value | Use |
|---|---|---|
| `--kyd-bg` | `#08090c` | page background, near-black |
| `--kyd-surface` | `#101216` | panels, cards |
| `--kyd-line` | `#23262d` | hairlines |
| `--kyd-rust` | `#d1471f` | primary accent, Mars oxide |
| `--kyd-ember` | `#ff7a45` | gradient end, active states |
| `--kyd-sand` | `#e8dcc8` | primary text |
| `--kyd-dim` | `#8c8a86` | secondary text (stays ≥70% lightness per the checklist) |

**Type**: monospace display (Space Mono) for headings, wordmark, telemetry and results;
system sans for body copy. Every number on screen is tabular so the readouts don't jitter.

**The ASCII image — unique to this app**

`src/components/kydonia/KydoniaAscii.jsx` draws a **Mars globe in ASCII**, procedurally — no
third-party image, no CORS, no asset to load, and nothing borrowed from any other app's renderer:

- A shaded sphere (Lambert lighting from an off-axis sun) sampled cell by cell; each cell's
  luminance maps onto a density ramp (`. :-=+*#%@`).
- Surface noise gives the planet continents, polar caps and the Cydonia region — the same
  latitude/longitude maths as a real globe, so it turns correctly.
- A slow **survey sweep**: a rust-coloured band travels across the disc and the characters it
  passes over re-render brighter, like a scanner reading terrain. Respects
  `prefers-reduced-motion` (holds a still frame).
- Under it, a live telemetry line — sources indexed, terms in the index, last query in ms —
  pulled from the user's real index, not invented numbers.
- The same component renders small (`KydoniaMark`) as the header logo, so the wordmark and the
  hero are the same machine at two scales.

A flat vector **store logo** is still generated for the app-store listing, per the checklist —
Mars disc with a rust glyph, no text, on near-black.

---

## 5. The landing page

Built to the layout standard, in KYDONIA's own theme.

| # | Section | What goes in it |
|---|---------|-----------------|
| 1 | **Header** | ASCII wordmark `KYDONIA` + one-line descriptor ("Paste a URL. Index it. Query it."). Short nav. `Store` button to the app store, `Account` button showing the connected wallet or the connect action. |
| 2 | **Hero** | Left: badge ("Mars-class text retrieval"), two-line headline (second line in the rust→ember gradient), one-sentence subhead, and the app's **real input** — a paste field that accepts a URL and starts indexing immediately. A privacy line under it: *fetched once, indexed on your device, never shared*. Right: the live ASCII Mars globe with its telemetry readout. |
| 3 | **Feature bar** | Five items: deterministic ranking · runs offline · robots-respecting fetcher · provenance on every hit · zero credits per query. |
| 4 | **Workflow** | Numbered 1–4: paste → fetch & clean → index → query. |
| 5 | **What it produces** | Cards with real sample values: ranked passages, the ranking explainer, host/tag filters, exports — last cell is the dark CTA box. |
| 6 | **CTA box** | Dark gradient panel: app name, one-line promise, the same action as the hero. |
| 7 | **Footer** | Wordmark, who it is built for, and one line on how it treats the user's data. |

Landing-first: the working studio is never the first thing a visitor sees, entry is remembered
for the session, and the landing has a way back to it. The KCC20 gate happens once at the door.

---

## 6. Architecture

### Entities

**`KydoniaSource`** — one record per pasted URL, private to its creator.
`url`, `host`, `title`, `description`, `headings[]`, `tags[]`, `collection`, `text` (cleaned,
capped), `char_count`, `token_count`, `content_hash`, `robots_allowed`, `status`
(`queued | fetching | ready | blocked | failed | truncated`), `error`, `fetched_at`.

**`KydoniaQuery`** — optional query log powering search history and "your most-queried terms".
`query`, `result_count`, `top_host`, `ran_at`.

Both carry RLS scoped to `created_by_id` for read/create/update/delete — the privacy rule from
section 2 is enforced at the data layer, not just in the UI.

### Backend function (one, new)

`kydoniaUrlFetch` — `{ url }` in; `{ status, title, description, headings, text, host,
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

The **ranking explainer** is what makes the machine worth trusting: select any result and see the
per-term contribution, the boost that applied, and the passage that earned it.

### Scaling thresholds (documented, not pre-built)

- ≤ ~300 sources / ~5 MB index → build in the browser, persist to IndexedDB. **This is the target.**
- Beyond that → move index construction into a backend function and store passages as their own
  records. Note the threshold in the code; do not build it until a real database hits it.

---

## 7. The app surface

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

## 8. Build phases

1. **Fetch + store** — `kydoniaUrlFetch`, `KydoniaSource`, paste box, source list, statuses, dedupe.
2. **The algorithm** — tokenizer, postings, BM25, search UI with snippets + highlighting.
3. **Explain + filter** — ranking explainer, host/tag/collection filters, query history.
4. **Optional AI answer** — retrieved-passage-only synthesis via `InvokeLLM`.
5. **Ship** — landing per section 5 with `KydoniaAscii`, store logo generated, `<Route>` in
   `App.jsx`, entry in `appCatalog.js`, paths added to `HIDDEN_PATHS` in `BackToStore.jsx`,
   app docs written.

Each phase is independently usable — phase 2 is already a working product.

---

## 9. Decisions needed before building

1. **Name** — KYDONIA (chosen). Say the word to swap to THARSIS, PHOBOS or SOLIS.
2. **Scope** — private per-user database (recommended, legal-safe) or a shared corpus (needs a
   rights/moderation story first)?
3. **Search only, or AI answers too?** (AI is a layer on top; the algorithm works without it.)
4. **Gate** — KCC20 wallet gate per the checklist, or open like BIBLIA?
5. **Full text** — approve the new `kydoniaUrlFetch` (recommended) or accept the 5k cap on the
   existing fetcher for phase 1?