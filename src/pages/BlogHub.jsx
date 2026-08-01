import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Sparkles, PenLine, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BlogCard from "@/components/blog/BlogCard";
import BlogComposer from "@/components/blog/BlogComposer";

export default function BlogHub() {
  const [tab, setTab] = useState("explore");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All");

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.BlogPost.list("-created_date", 100);
      setPosts(list);
    } catch (e) {
      console.error("Blog load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const allTags = ["All", ...Array.from(new Set(posts.flatMap((p) => p.tags || [])))];
  const filtered = posts.filter((p) => {
    if (activeTag !== "All" && !(p.tags || []).includes(activeTag)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.subtitle || "").toLowerCase().includes(q) ||
        (p.author_name || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900">
      <nav className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-5 bg-[#F5F5F7]/80 backdrop-blur-2xl border-b border-zinc-200/60">
        <div className="flex items-center gap-2 h-14 min-w-0">
          <a href="/AppStoreV2" className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 px-3 -ml-3 rounded-lg flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Store</span>
          </a>
          <span className="text-[15px] font-[800] tracking-tight ml-1">Blog</span>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-200/60 flex-shrink-0">
          <button
            onClick={() => setTab("explore")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition ${tab === "explore" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Explore</span>
          </button>
          <button
            onClick={() => setTab("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition ${tab === "write" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Write</span>
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {tab === "explore" ? (
          <>
            <div className="mb-5">
              <h1 className="text-2xl sm:text-3xl font-[900] tracking-tight">Explore posts</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Community blogs, written with a little help from AI.</p>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, or tag…"
                className="w-full h-12 pl-10 pr-4 rounded-full bg-white ring-1 ring-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
              />
            </div>

            {allTags.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTag(t)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition ${activeTag === t ? "bg-zinc-900 text-white" : "bg-white ring-1 ring-zinc-200 text-zinc-500"}`}
                  >
                    {t === "All" ? "All" : `#${t}`}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-2xl bg-white ring-1 ring-zinc-200 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="w-8 h-8 mx-auto text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">No posts match your search.</p>
                <button onClick={() => setTab("write")} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-700">
                  Be the first to write →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((p) => (
                  <BlogCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-5">
              <h1 className="text-2xl sm:text-3xl font-[900] tracking-tight">Write a post</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Draft with AI, edit, and publish to the explore feed.</p>
            </div>
            <div className="max-w-2xl">
              <BlogComposer onPublished={() => { setTab("explore"); load(); }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}