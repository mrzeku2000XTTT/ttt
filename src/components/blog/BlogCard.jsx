import React from "react";
import { Link } from "react-router-dom";
import { Clock, User } from "lucide-react";

export default function BlogCard({ post }) {
  const date = post.created_date
    ? new Date(post.created_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  return (
    <Link to={`/Blog/${post.id}`} className="group block h-full">
      <div className="h-full rounded-2xl bg-white ring-1 ring-zinc-200/70 hover:ring-zinc-900/15 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col">
        <div className="h-28 sm:h-32 bg-gradient-to-br from-cyan-100 via-violet-100 to-amber-100 flex items-center justify-center text-5xl">
          {post.cover_emoji || "✍️"}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(post.tags || []).slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                #{t}
              </span>
            ))}
          </div>
          <h3 className="text-[15px] font-bold text-zinc-900 leading-snug group-hover:text-cyan-700 line-clamp-2">
            {post.title}
          </h3>
          {post.subtitle && (
            <p className="text-[12px] text-zinc-500 mt-1 line-clamp-2">{post.subtitle}</p>
          )}
          <div className="mt-auto pt-3 flex items-center gap-3 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1 min-w-0">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{post.author_name || "Anon"}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.read_minutes || 2}m
            </span>
            <span className="ml-auto">{date}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}