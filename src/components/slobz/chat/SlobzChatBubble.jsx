import React from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Check, AlertCircle, Clock } from "lucide-react";

const SLOB_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9f342179c_generated_image.png";

function GigCard({ gig }) {
  return (
    <div className="bg-white rounded-[16px] shadow-[0_4px_14px_rgba(90,70,160,0.12)] p-3 mt-2">
      <div className="text-[11px] font-display font-extrabold text-[#3D2E7C] leading-snug">{gig.title}</div>
      {gig.description && <div className="text-[10px] text-[#8B84A3] mt-1 line-clamp-3">{gig.description}</div>}
      <div className="flex items-center gap-3 mt-2">
        {(gig.payout_tkas || gig.payout_usd) && (
          <span className="text-[10px] font-bold text-[#7C5CFC]">{gig.payout_tkas || gig.payout_usd} TKAS</span>
        )}
        {gig.estimated_minutes && (
          <span className="flex items-center gap-0.5 text-[9px] text-[#8B84A3]"><Clock className="w-2.5 h-2.5" />{gig.estimated_minutes}m</span>
        )}
      </div>
    </div>
  );
}

function ToolCallChip({ toolCall }) {
  const status = toolCall.status;
  const failed = status === "failed" || status === "error" || /error|failed/i.test(String(toolCall.results || ""));
  const running = status === "pending" || status === "running" || status === "in_progress";

  let parsed = null;
  try {
    parsed = typeof toolCall.results === "string" ? JSON.parse(toolCall.results) : toolCall.results;
  } catch { /* raw */ }

  const gigs = parsed?.gig ? [parsed.gig] : Array.isArray(parsed?.gigs) ? parsed.gigs : Array.isArray(parsed) && parsed[0]?.title ? parsed : null;

  return (
    <div className="mt-1.5">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3F0FA] text-[9px] font-display font-extrabold text-[#7C5CFC] uppercase tracking-wide">
        {running ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : failed ? <AlertCircle className="w-2.5 h-2.5 text-[#F96B4C]" /> : <Check className="w-2.5 h-2.5 text-[#1E9E5A]" />}
        {(toolCall.name || "tool").replace(/_/g, " ")}
      </div>
      {gigs && gigs.slice(0, 4).map((g, i) => <GigCard key={i} gig={g} />)}
    </div>
  );
}

export default function SlobzChatBubble({ message }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-[#7C5CFC] text-white rounded-[18px] rounded-br-[6px] px-4 py-2.5 text-xs leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <img src={SLOB_LOGO} alt="Slobz" className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-[0_4px_10px_rgba(124,92,252,0.3)]" />
      <div className="max-w-[82%] bg-white rounded-[18px] rounded-tl-[6px] px-4 py-2.5 shadow-[0_4px_14px_rgba(90,70,160,0.1)]">
        {message.content && (
          <div className="prose prose-sm max-w-none text-xs text-[#3D2E7C] prose-p:my-1 prose-p:text-[#5A4B8A] prose-strong:text-[#3D2E7C] prose-li:text-[#5A4B8A] prose-a:text-[#7C5CFC]">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.gig_widget && <GigCard gig={message.gig_widget} />}
        {message.tool_calls?.map((tc, i) => <ToolCallChip key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}