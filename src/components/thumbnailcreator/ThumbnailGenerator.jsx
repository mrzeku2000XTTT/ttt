import React, { useState } from "react";
import { Download, Loader2, Sparkles, Youtube } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AgentResearchLog from "./AgentResearchLog";
import ThumbnailSourceUploader from "./ThumbnailSourceUploader";

const STYLES = ["Viral YouTube", "Creator Face", "Gaming Energy", "Documentary", "Podcast Clip", "Tech Review"];

export default function ThumbnailGenerator({ onCreated }) {
  const [title, setTitle] = useState("How I Built This App");
  const [topic, setTopic] = useState("A polished YouTube thumbnail for a creator explaining a new app or product");
  const [characterDescription, setCharacterDescription] = useState("A surprised realistic creator face, expressive eyes, clean cutout, looking at the title");
  const [style, setStyle] = useState(STYLES[0]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [sourceImageUrls, setSourceImageUrls] = useState([]);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [researchNotes, setResearchNotes] = useState("");
  const [agentPlan, setAgentPlan] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editInstruction, setEditInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const prefillFromImages = async (urls = sourceImageUrls) => {
    if (!urls.length) return;
    setImageAnalyzing(true);
    setAgentLogs([
      { type: "research", status: "running", label: "Image ingestion agent", detail: "Reading the uploaded reference image and preparing the workspace prompts." },
    ]);

    const imageBrief = await base44.integrations.Core.InvokeLLM({
      file_urls: urls,
      prompt: `Analyze the uploaded reference image(s) and prefill this YouTube thumbnail workspace.

IMPORTANT: Replace the current generic defaults with specific field-ready text based on the visible image content.

Return:
- title: a short clickable thumbnail title, 2-5 words
- topic: a polished YouTube thumbnail prompt describing the visible subject/scene/product/style
- script_notes: hook, scene notes, and thumbnail direction based on the image
- character_description: visible person/face/avatar/object description, or if no person exists describe the main visual subject, mood, lighting, crop, and composition
- style: choose exactly one of: ${STYLES.join(", ")}

Do not leave any field generic. Do not mention uploaded image or AI.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          topic: { type: "string" },
          script_notes: { type: "string" },
          character_description: { type: "string" },
          style: { type: "string" }
        },
        required: ["title", "topic", "script_notes", "character_description", "style"]
      }
    });

    setTitle(imageBrief.title || "Image-Based Thumbnail");
    setTopic(imageBrief.topic || "Create a polished YouTube thumbnail based on the uploaded reference image.");
    setScriptText(imageBrief.script_notes || "Use the uploaded reference image as the core visual direction for the hook, scene, and thumbnail composition.");
    setCharacterDescription(imageBrief.character_description || "Use the main visible subject from the reference image as the focal point.");
    setStyle(STYLES.includes(imageBrief.style) ? imageBrief.style : "Viral YouTube");
    setAgentLogs([
      { type: "research", status: "done", label: "Image ingestion agent", detail: "Title, topic, notes, and character fields were prefilled from the reference image." },
    ]);
    setImageAnalyzing(false);
  };

  const handleSourceImagesChange = async (urls, uploaded = []) => {
    setSourceImageUrls(urls);
    if (uploaded.length) await prefillFromImages(urls);
  };

  const generateThumbnail = async () => {
    if (!title.trim() || !topic.trim()) return;
    setLoading(true);
    setImageUrl("");
    setResearchNotes("");
    setAgentPlan("");
    setAgentLogs([
      { type: "research", status: "running", label: "Research agent", detail: "Scanning the topic, source URL, script, and references." },
      { type: "factcheck", status: "pending", label: "Fact-check agent", detail: "Verifying claims and finding the strongest clickable angle." },
      { type: "plan", status: "pending", label: "Creative director", detail: "Planning composition, text, emotion, contrast, and visual hierarchy." },
    ]);

    const brief = await base44.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      prompt: `You are an agentic YouTube thumbnail studio with multiple internal specialists: URL scanner, script analyst, research agent, fact checker, copywriter, creative director, and image prompt engineer.

Inputs:
Title: ${title}
Topic: ${topic}
YouTube/source URL: ${youtubeUrl || "none"}
Script/transcript/notes: ${scriptText || "none"}
Reference images count: ${sourceImageUrls.length}
Style: ${style}
Character/face direction: ${characterDescription || "infer the best subject"}

If reference images are provided, visually inspect them and make the thumbnail plan match the ingested image content: subject, face/person likeness, product/app visuals, text placement, color palette, lighting, mood, composition, and thumbnail style. Treat uploaded images as primary creative direction, not loose inspiration.

Do real online research when a URL/topic is provided. If the URL is YouTube, infer public context from the URL/page/search results when available. Fact-check the core claim. Then create a concise generation plan for a highly clickable but truthful thumbnail that matches any ingested references.

Return JSON only.`,
      file_urls: sourceImageUrls.length ? sourceImageUrls : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          optimized_title: { type: "string" },
          research_notes: { type: "string" },
          fact_checks: { type: "array", items: { type: "string" } },
          agent_plan: { type: "string" },
          visual_prompt: { type: "string" },
          character_direction: { type: "string" }
        },
        required: ["optimized_title", "research_notes", "fact_checks", "agent_plan", "visual_prompt"]
      }
    });

    setResearchNotes(brief.research_notes || "Research complete.");
    setAgentPlan(brief.agent_plan || "Thumbnail plan created.");
    setAgentLogs([
      { type: "research", status: "done", label: "Research agent", detail: "Online context and source material reviewed." },
      { type: "factcheck", status: "done", label: "Fact-check agent", detail: (brief.fact_checks || []).slice(0, 2).join(" ") || "No risky claims found." },
      { type: "plan", status: "running", label: "Image agent", detail: "Generating the finished 16:9 thumbnail from the plan." },
    ]);

    const safeTitle = (brief.optimized_title || title).trim().split(/\s+/).slice(0, 5).join(" ");
    const prompt = `Create a finished professional 16:9 YouTube thumbnail. EXACT visible thumbnail text: "${safeTitle}".

Research-backed thumbnail strategy:
${brief.agent_plan}

Visual plan:
${brief.visual_prompt}

Topic/source context: ${topic}
${youtubeUrl ? `Source URL: ${youtubeUrl}` : ""}
Main character/avatar/face: ${brief.character_direction || characterDescription || "create a fitting expressive human face or avatar for the topic"}.
Style: ${style}.

${sourceImageUrls.length ? "REFERENCE IMAGE MATCHING RULES: Match the ingested reference image closely. Preserve the main subject/creator/product identity, overall composition logic, lighting direction, color palette, crop style, text hierarchy, and thumbnail mood while improving polish and clickability. Do not generate an unrelated thumbnail." : ""}

TEXT FIT RULES: The title must fit fully inside the canvas with generous safe margins. Use 2-5 large words maximum, bold readable block lettering, no cropping, no misspellings, no extra random words.

Use high CTR YouTube design: clear focal point, expressive emotion, visual contrast, truthful framing, depth, realistic lighting, polished editorial compositing. Use uploaded reference images as visual source material when provided. Avoid generic neon crypto backgrounds, logos, watermarks, and unreadable text unless explicitly requested.`;

    const result = await base44.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: sourceImageUrls.length ? sourceImageUrls : undefined,
    });
    const created = await base44.entities.ThumbnailProject.create({
      title,
      topic,
      character_description: characterDescription,
      style,
      platform: "YouTube / TTTV",
      image_url: result.url,
      prompt,
      youtube_url: youtubeUrl,
      source_image_urls: sourceImageUrls,
      script_text: scriptText,
      research_notes: brief.research_notes,
      agent_plan: brief.agent_plan,
      fact_checks: brief.fact_checks || [],
    });
    setImageUrl(result.url);
    setAgentLogs((logs) => logs.map((log) => log.label === "Image agent" ? { ...log, status: "done", detail: "Finished thumbnail generated and saved." } : log));
    onCreated?.(created);
    setLoading(false);
  };

  const reviseThumbnail = async () => {
    if (!imageUrl || !editInstruction.trim()) return;
    setEditLoading(true);
    setAgentLogs((logs) => [
      ...logs.filter((log) => log.label !== "Revision agent"),
      { type: "plan", status: "running", label: "Revision agent", detail: "Applying your image change request." },
    ]);

    const revisionPrompt = `Revise this existing YouTube thumbnail while preserving its core subject and professional thumbnail style.

Requested change from user:
${editInstruction}

Original thumbnail context:
Title: ${title}
Topic: ${topic}
Style: ${style}

Keep a clean 16:9 YouTube thumbnail layout, readable text, strong focal point, high contrast, and no random extra words. Make only the requested change unless it improves mobile/thumbnail readability.`;

    const result = await base44.integrations.Core.GenerateImage({
      prompt: revisionPrompt,
      existing_image_urls: [imageUrl, ...sourceImageUrls],
    });

    const created = await base44.entities.ThumbnailProject.create({
      title: `${title} revision`,
      topic,
      character_description: characterDescription,
      style,
      platform: "YouTube / TTTV",
      image_url: result.url,
      prompt: revisionPrompt,
      youtube_url: youtubeUrl,
      source_image_urls: [imageUrl, ...sourceImageUrls],
      script_text: scriptText,
      research_notes: researchNotes,
      agent_plan: `Revision request: ${editInstruction}`,
      fact_checks: [],
    });

    setImageUrl(result.url);
    setEditInstruction("");
    setAgentLogs((logs) => logs.map((log) => log.label === "Revision agent" ? { ...log, status: "done", detail: "Revision generated and saved." } : log));
    onCreated?.(created);
    setEditLoading(false);
  };

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Thumbnail title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="border-white/10 bg-black/50 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Video topic / idea</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-24 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-white/40" />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400"><Youtube className="h-4 w-4" /> YouTube / source link</label>
            <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="Paste a YouTube URL or research source" className="border-white/10 bg-black/50 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Script / transcript / notes</label>
            <textarea value={scriptText} onChange={(e) => setScriptText(e.target.value)} placeholder="Paste your script, hook, transcript, or bullet points for the agent to analyze" className="min-h-24 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/40" />
          </div>
          <div>
            <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
              <span>Reference images</span>
              {imageAnalyzing && <span className="flex items-center gap-1 text-cyan-300"><Loader2 className="h-3 w-3 animate-spin" /> Prefilling</span>}
            </label>
            <ThumbnailSourceUploader imageUrls={sourceImageUrls} onChange={handleSourceImagesChange} />
            {!!sourceImageUrls.length && (
              <Button type="button" onClick={() => prefillFromImages()} disabled={imageAnalyzing} className="mt-2 w-full bg-cyan-400 font-black text-black hover:bg-cyan-300">
                {imageAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Prefill fields from image
              </Button>
            )}
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Avatar / face character</label>
            <textarea value={characterDescription} onChange={(e) => setCharacterDescription(e.target.value)} placeholder="Describe any face, avatar, character, emotion, outfit, pose, or camera angle" className="min-h-24 w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/40" />
          </div>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((item) => (
              <button key={item} onClick={() => setStyle(item)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${style === item ? "bg-white text-black" : "bg-white/10 text-zinc-300 hover:bg-white/15"}`}>
                {item}
              </button>
            ))}
          </div>
          <Button onClick={generateThumbnail} disabled={loading || imageAnalyzing || !title.trim() || !topic.trim()} className="w-full bg-white font-black text-black hover:bg-zinc-200">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? "Generating thumbnail..." : "Generate Thumbnail"}
          </Button>
        </div>
        <div className="space-y-4">
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-black/60 p-3">
            {imageUrl ? (
              <div className="w-full space-y-3">
                <img src={imageUrl} alt={title} className="aspect-video w-full rounded-xl object-cover" />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <a href={imageUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-black hover:bg-zinc-200 sm:w-auto">
                    <Download className="h-4 w-4" /> Open
                  </a>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                    <Input
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && reviseThumbnail()}
                      placeholder="Ask AI to change the thumbnail..."
                      className="min-w-0 border-white/10 bg-black/50 text-white placeholder:text-zinc-600"
                    />
                    <Button onClick={reviseThumbnail} disabled={editLoading || !editInstruction.trim()} className="shrink-0 bg-cyan-400 font-black text-black hover:bg-cyan-300">
                      {editLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Revise
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-zinc-500">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-white" />
                <p className="text-sm font-semibold">Your generated thumbnail will appear here.</p>
              </div>
            )}
          </div>
          <AgentResearchLog logs={agentLogs} researchNotes={researchNotes} agentPlan={agentPlan} />
        </div>
      </div>
    </section>
  );
}