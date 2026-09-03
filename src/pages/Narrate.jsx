import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, X, ScanLine, BookOpen, Loader2, Library, Headphones } from "lucide-react";
import BookReader from "@/components/narrate/BookReader";
import BookCard from "@/components/narrate/BookCard";

function NarrateLogo({ size = 22 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center bg-white" style={{ width: size, height: size, borderRadius: 6 }}>
        <Headphones className="w-[60%] h-[60%] text-black" />
      </div>
      <span className="text-white font-bold tracking-tight" style={{ fontSize: size * 0.82, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Nar<span style={{ fontWeight: 800 }}>rate</span>
      </span>
    </div>
  );
}

export default function Narrate() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [library, setLibrary] = useState([]);
  const [loadingLib, setLoadingLib] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [reader, setReader] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);
  useEffect(() => {
    if (user?.email) loadLibrary();
  }, [user]);

  const loadLibrary = async () => {
    if (!user?.email) return;
    setLoadingLib(true);
    try {
      const recs = await base44.entities.NarrateBook.filter({ user_email: user.email }, "-created_date", 60);
      setLibrary(recs || []);
    } catch {
      setLibrary([]);
    } finally {
      setLoadingLib(false);
    }
  };

  const runSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    setSearched(true);
    try {
      const r = await base44.functions.invoke("bookSearch", { query: q, limit: 30 });
      const d = r?.data ?? r;
      if (d?.error) throw new Error(d.error);
      setBooks(d.books || []);
    } catch (err) {
      setError(err?.message || "Search failed");
      setBooks([]);
    } finally {
      setSearching(false);
    }
  };

  const saveBook = async (b) => {
    if (!user?.email) return;
    try {
      if (library.some((x) => x.title === b.title && x.author === b.author)) return;
      await base44.entities.NarrateBook.create({
        user_email: user.email,
        title: b.title,
        author: b.author || "Unknown",
        cover: b.cover || "",
        source: b.source || "search",
        ia_id: b.ia_id || "",
        text: b.source === "scan" ? b.text || "" : "",
        words_count: b.text ? b.text.split(/\s+/).filter(Boolean).length : 0,
      });
      loadLibrary();
    } catch {}
  };

  const openBook = async (book) => {
    setFetching(true);
    setError(null);
    try {
      let text = book.text || "";
      if (!text && book.ia_id) {
        let off = 0;
        let full = "";
        let guard = 0;
        while (guard < 6) {
          const r = await base44.functions.invoke("bookText", { ia_id: book.ia_id, offset: off });
          const d = r?.data ?? r;
          if (d?.error) {
            setError(d.error);
            break;
          }
          full += d.text || "";
          if (!d.hasMore) break;
          off += (d.text || "").length;
          guard++;
        }
        text = full;
      }
      if (text && text.trim().length > 20) {
        saveBook({ ...book, text });
        setReader({ text, title: book.title, author: book.author, cover: book.cover });
        window.scrollTo({ top: 0 });
      } else if (!error) {
        setError("Full text isn't available for this title. Try scanning your own copy with the Scan button.");
      }
    } catch (err) {
      setError(err?.message || "Couldn't load book.");
    } finally {
      setFetching(false);
    }
  };

  const onPickFile = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setScanning(true);
    setError(null);
    let combined = "";
    try {
      for (const f of files) {
        const up = await base44.integrations.Core.UploadFile({ file: f });
        const ud = up?.data ?? up;
        const url = ud?.file_url;
        if (!url) continue;
        const ex = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: url,
          json_schema: { type: "object", properties: { text: { type: "string" } } },
        });
        const ed = ex?.data ?? ex;
        let t = ed?.output?.text || "";
        // Fallback: vision OCR via LLM if extraction returned nothing useful
        if (!t || t.trim().length < 10) {
          try {
            const llm = await base44.integrations.Core.InvokeLLM({
              prompt:
                "Transcribe all visible text from this book page photo exactly as written, preserving paragraphs and line breaks. Output only the transcribed text, no commentary.",
              file_urls: [url],
            });
            const ld = llm?.data ?? llm;
            t = typeof ld === "string" ? ld : ld?.response || ld?.text || "";
          } catch {}
        }
        if (t) combined += (combined ? "\n\n" : "") + t;
      }
    } catch {}
    setScanning(false);
    if (combined.trim().length > 20) {
      const b = {
        title: `Scanned ${files.length > 1 ? `${files.length} pages` : "page"}`,
        author: "My scan",
        source: "scan",
        text: combined,
      };
      saveBook(b);
      setReader({ text: combined, title: b.title, author: b.author });
      window.scrollTo({ top: 0 });
    } else {
      setError("Couldn't read text from those images. Try clearer, well-lit photos of an open page.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-black/85 backdrop-blur-xl border-b border-white/10"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <Link to="/" className="active:opacity-60">
          <NarrateLogo size={22} />
        </Link>
        <div className="flex-1 mx-3 max-w-md">
          <form onSubmit={runSearch} className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any book or author…"
              className="w-full h-9 pl-9 pr-9 rounded-full bg-white/10 border border-white/15 text-[13px] text-white placeholder-white/40 outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setBooks([]);
                  setSearched(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="h-9 px-3 rounded-full bg-white text-black text-[12px] font-semibold flex items-center gap-1.5 hover:bg-white/90 transition-colors flex-shrink-0"
        >
          <ScanLine className="w-4 h-4" />
          <span className="hidden sm:inline">Scan</span>
        </button>
        <Link
          to="/AppStoreV2"
          className="ml-2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
          title="Exit to Store"
        >
          <X className="w-4 h-4" />
        </Link>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={onPickFile}
        className="hidden"
      />

      <div className="max-w-[1100px] mx-auto px-3 sm:px-5 pt-20 pb-24">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5 mt-2">
          <button
            onClick={() => setTab("search")}
            className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors ${
              tab === "search" ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setTab("library")}
            className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
              tab === "library" ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            Library
          </button>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-[12.5px] text-amber-200/90">
            {error}
          </div>
        )}
        {(scanning || fetching) && (
          <div className="mb-4 flex items-center gap-2 text-[12.5px] text-white/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            {scanning ? "Scanning & reading text…" : "Loading book text…"}
          </div>
        )}

        {/* SEARCH TAB */}
        {tab === "search" && (
          <>
            {!searched && !searching && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-white/40" />
                </div>
                <div className="text-[16px] text-white/80 font-semibold mb-1">Read any book out loud</div>
                <div className="text-[13px] text-white/45 max-w-sm mx-auto">
                  Search millions of titles, hit play, and listen with live captions. Or tap <span className="text-white">Scan</span> to photograph any page and hear it instantly.
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  {["Pride and Prejudice", "Alice in Wonderland", "Sherlock Holmes", "Moby Dick", "Dracula"].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s);
                        runSearch({ preventDefault: () => {} });
                      }}
                      className="h-8 px-3 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/70 hover:bg-white/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searching && (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse mb-2" />
                    <div className="h-3 bg-white/10 rounded animate-pulse w-11/12 mb-1.5" />
                    <div className="h-2.5 bg-white/10 rounded animate-pulse w-2/5" />
                  </div>
                ))}
              </div>
            )}

            {!searching && searched && books.length === 0 && !error && (
              <div className="text-center py-16 text-[13px] text-white/50">No books found. Try another title or author.</div>
            )}

            {!searching && books.length > 0 && (
              <>
                <div className="text-[11px] tracking-[0.18em] text-white/45 mb-3">{books.length} results</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {books.map((b, i) => (
                    <BookCard key={(b.ia_id || b.olid || b.title) + i} book={b} onOpen={() => openBook(b)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* LIBRARY TAB */}
        {tab === "library" && (
          <>
            {!user?.email ? (
              <div className="text-center py-16">
                <div className="text-[14px] text-white/70 mb-1">Sign in to save books</div>
                <div className="text-[12.5px] text-white/45 mb-5">Your library keeps every book you open so you can pick up where you left off.</div>
                <Link
                  to="/login"
                  className="inline-flex items-center h-10 px-5 rounded-full bg-white text-black text-[13px] font-semibold"
                >
                  Log in
                </Link>
              </div>
            ) : loadingLib ? (
              <div className="flex items-center gap-2 text-[12.5px] text-white/60 py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading your library…
              </div>
            ) : library.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Library className="w-7 h-7 text-white/40" />
                </div>
                <div className="text-[14px] text-white/70 mb-1">Your library is empty</div>
                <div className="text-[12.5px] text-white/45">Books you open or scan will appear here.</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {library.map((b) => (
                  <BookCard key={b.id} book={b} onOpen={() => openBook(b)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {reader && (
        <BookReader
          text={reader.text}
          title={reader.title}
          author={reader.author}
          onClose={() => setReader(null)}
        />
      )}
    </div>
  );
}