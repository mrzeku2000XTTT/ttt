import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, User, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import BlogChat from "@/components/blog/BlogChat";

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.entities.BlogPost
      .get(id)
      .then(setBlog)
      .catch((e) => setError(e.message || "Not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center text-center px-6">
        <p className="text-zinc-500 text-sm">{error || "Post not found."}</p>
        <Link to="/Blog" className="mt-3 text-sm font-semibold text-cyan-700">← Back to blog</Link>
      </div>
    );
  }

  const date = blog.created_date
    ? new Date(blog.created_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900">
      <nav className="sticky top-0 z-40 flex items-center px-3 sm:px-5 bg-[#F5F5F7]/80 backdrop-blur-2xl border-b border-zinc-200/60 h-14">
        <Link to="/Blog" className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 px-3 -ml-3 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Blog</span>
        </Link>
      </nav>

      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{blog.cover_emoji || "✍️"}</div>
          <h1 className="text-3xl sm:text-4xl font-[900] tracking-tight leading-tight">{blog.title}</h1>
          {blog.subtitle && <p className="text-zinc-500 mt-2">{blog.subtitle}</p>}
          <div className="flex items-center justify-center gap-4 text-[12px] text-zinc-500 mt-4 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {blog.author_name || "Anon"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {blog.read_minutes || 2} min read
            </span>
            <span>{date}</span>
          </div>
          {(blog.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {blog.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white ring-1 ring-zinc-200 text-zinc-600">
                  <Tag className="w-3 h-3" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-[15px] leading-relaxed text-zinc-800 space-y-4
          [&_h1]:text-2xl [&_h1]:font-[900] [&_h1]:mt-6 [&_h1]:mb-2
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-1
          [&_p]:my-3
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3
          [&_a]:text-cyan-700 [&_a]:underline
          [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-600
          [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono
          [&_pre]:bg-zinc-900 [&_pre]:text-zinc-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-4
          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit
          [&_img]:rounded-xl [&_img]:my-4 [&_img]:w-full
          [&_hr]:my-6 [&_hr]:border-zinc-200">
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </div>
      </article>

      <BlogChat blog={blog} />
    </div>
  );
}