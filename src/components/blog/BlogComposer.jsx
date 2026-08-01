import React, { useState } from "react";
import { Sparkles, Loader2, Send, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildDraftPrompt } from "@/lib/blogAi";

const EMOJIS = ["✍️", "💡", "🚀", "🧠", "⚙️", "🛡️", "💸", "🎨", "🔥", "🌌"];

function llmText(res) {
  if (typeof res === "string") return res;
  return res?.response || res?.text || res?.data || (res ? JSON.stringify(res) : "");
}

export default function BlogComposer({ onPublished }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("conversational");
  const [content, setContent] = useState("");
  const [emoji, setEmoji] = useState("✍️");
  const [drafting, setDrafting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);

  const draft = async () => {
    setDrafting(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: buildDraftPrompt({
          title,
          topic,
          tone,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      setContent(llmText(res));
    } catch (e) {
      alert("Draft failed: " + e.message);
    } finally {
      setDrafting(false);
    }
  };

  const publish = async () => {
    if (!title.trim() || !content.trim() || !author.trim()) {
      alert("Title, your name, and content are required.");
      return;
    }
    setPublishing(true);
    try {
      const words = content.trim().split(/\s+/).length;
      const read_minutes = Math.max(1, Math.round(words / 200));
      await base44.entities.BlogPost.create({
        title: title.trim(),
        subtitle: subtitle.trim(),
        content,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        author_name: author.trim(),
        cover_emoji: emoji,
        read_minutes,
        status: "published",
      });
      setDone(true);
      onPublished?.();
    } catch (e) {
      alert("Publish failed: " + e.message);
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setDone(false);
    setTitle(""); setSubtitle(""); setContent(""); setTags(""); setTopic(""); setEmoji("✍️");
  };

  if (done) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <Check className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">Published!</h3>
        <p className="text-sm text-zinc-500 mt-1">Your post is now live in the explore feed.</p>
        <Button onClick={reset} variant="outline" className="mt-4">Write another</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white" />
        <Input placeholder="Subtitle (optional)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="bg-white" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Your name" value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-white" />
        <Input placeholder="Tags, comma-separated" value={tags} onChange={(e) => setTags(e.target.value)} className="bg-white" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500">Cover:</span>
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${emoji === e ? "bg-zinc-900 ring-2 ring-zinc-900 scale-105" : "bg-white ring-1 ring-zinc-200 hover:ring-zinc-400"}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Textarea placeholder="Topic / notes for the AI (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} rows={2} className="bg-white sm:col-span-2" />
        <select value={tone} onChange={(e) => setTone(e.target.value)} className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm self-end">
          <option value="conversational">Conversational</option>
          <option value="technical">Technical</option>
          <option value="inspirational">Inspirational</option>
          <option value="funny">Funny</option>
          <option value="educational">Educational</option>
        </select>
      </div>
      <Button onClick={draft} disabled={drafting} className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white">
        {drafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {drafting ? "Drafting…" : "Draft with AI"}
      </Button>
      <Textarea
        placeholder={'Your post content in Markdown. Hit "Draft with AI" to generate a starter, then edit — or write from scratch.'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={14}
        className="bg-white font-mono text-[13px] leading-relaxed"
      />
      <div className="flex justify-end">
        <Button onClick={publish} disabled={publishing} className="bg-zinc-900 text-white">
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Publish
        </Button>
      </div>
    </div>
  );
}