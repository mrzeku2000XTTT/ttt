import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Send, Inbox, Coins, Undo2, CalendarDays, ExternalLink } from "lucide-react";
import { shortAddr, friendlyAmount, friendlyFee, friendlyTime } from "@/components/slobz/txPlainEnglish";

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#EBE6F8] last:border-0">
      <div className="w-9 h-9 rounded-full bg-[#EBE6F8] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#7C5CFC]" />
      </div>
      <div>
        <div className="text-[10px] tracking-[0.2em] text-[#7C5CFC] font-bold uppercase">{label}</div>
        <div className="text-sm text-[#1F1B2E] mt-0.5 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default function TxStoryCard({ story }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-6 md:p-8"
    >
      {/* Headline — the whole story in one sentence */}
      <p className="font-heading text-lg md:text-xl font-semibold text-[#1F1B2E] leading-relaxed">
        {story.headline}
      </p>

      {/* Status */}
      <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-xs font-display font-extrabold ${
        story.confirmed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}>
        {story.confirmed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        {story.confirmed ? "COMPLETE — the money arrived safely" : "STILL PROCESSING — give it a few seconds"}
      </div>

      <div className="mt-5">
        {!story.isCoinbase && (
          <Row icon={Send} label="Who sent it">
            {story.senders.length === 0
              ? "An unknown wallet"
              : story.senders.length === 1
              ? <>The {shortAddr(story.senders[0])}</>
              : <>{story.senders.length} wallets owned by the same person (that's normal — think of it as paying with several bills from the same purse)</>}
          </Row>
        )}

        {story.recipientList.length > 0 && (
          <Row icon={Inbox} label="Who got the money">
            {story.recipientList.map((r, i) => (
              <div key={i}>
                The {shortAddr(r.address)} received <b>{friendlyAmount(r.amount)}</b>
              </div>
            ))}
          </Row>
        )}

        {story.isSelfSend && (
          <Row icon={Undo2} label="What happened">
            All the money went right back to the sender's own wallet. People do this to tidy up their wallet or test things.
          </Row>
        )}

        {story.changeAmount > 0 && !story.isSelfSend && (
          <Row icon={Undo2} label="Change returned">
            {friendlyAmount(story.changeAmount)} went back to the sender — just like getting change back when you pay cash at a store.
          </Row>
        )}

        <Row icon={Coins} label="Cost to send">
          The network fee was {friendlyFee(story.fee)}. That's what it costs to use Kaspa — no bank needed.
        </Row>

        <Row icon={CalendarDays} label="When it happened">
          {friendlyTime(story.timeMs)}
        </Row>
      </div>

      <a
        href={`https://explorer.kaspa.org/txs/${story.txId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-5 text-xs text-[#7C5CFC] font-bold hover:underline"
      >
        See the technical version on the official explorer <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </motion.div>
  );
}