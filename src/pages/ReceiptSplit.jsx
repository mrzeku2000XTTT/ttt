import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Receipt, Users } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c2ce1aceb_generated_image.png";

export default function ReceiptSplit() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [people, setPeople] = useState("2");
  const [tip, setTip] = useState("18");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Read this receipt photo. Extract every line item with its price. Respond as JSON: { "items": [{ "name": string, "price": number }], "subtotal": number, "tax": number, "currency": string }. If a value is unclear, estimate. Numbers only, no currency symbols in the number fields.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "number" } } } },
            subtotal: { type: "number" },
            tax: { type: "number" },
            currency: { type: "string" }
          }
        }
      });
      setResult(res);
    } catch (e) {
      setResult({ error: e.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const n = Math.max(1, parseInt(people) || 1);
  const tipPct = (parseFloat(tip) || 0) / 100;
  const items = result?.items || [];
  const subtotal = result?.subtotal ?? items.reduce((a, b) => a + (b.price || 0), 0);
  const tax = result?.tax ?? 0;
  const tipAmt = subtotal * tipPct;
  const total = subtotal + tax + tipAmt;
  const perPerson = total / n;
  const cur = result?.currency || "$";

  return (
    <LifestyleShell
      logo={LOGO}
      name="ReceiptSplit"
      tagline="Snap a receipt. Get a clean itemized read and a fair per-person total with tip — no more math at the table."
      features={["Itemized", "Tip calc", "Even split"]}
      steps={["Upload a clear photo of the receipt", "Set how many people and a tip %", "Copy the per-person total and go"]}
    >
      <label className="block aspect-[4/3] w-full rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mb-4">
        {preview ? (
          <img src={preview} alt="receipt" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/40">
            <Upload className="w-8 h-8" />
            <span className="text-xs">Upload receipt</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onPick} />
      </label>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 flex items-center gap-1 mb-1.5">
            <Users className="w-3 h-3" /> People
          </label>
          <input
            type="number"
            min="1"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5 block">Tip %</label>
          <input
            type="number"
            min="0"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30"
          />
        </div>
      </div>

      <button
        onClick={run}
        disabled={!file || loading}
        className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Reading receipt…" : "Split the bill"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.items && (
        <div className="mt-8 space-y-5">
          <div className="border border-white/10 rounded-2xl divide-y divide-white/5">
            {items.map((it, i) => (
              <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-white/80">{it.name}</span>
                <span className="text-white/60">{cur}{Number(it.price || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border border-white/10 rounded-2xl p-4 space-y-2 text-sm">
            <Line label="Subtotal" value={`${cur}${subtotal.toFixed(2)}`} />
            <Line label="Tax" value={`${cur}${tax.toFixed(2)}`} />
            <Line label={`Tip (${tip}%)`} value={`${cur}${tipAmt.toFixed(2)}`} />
            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{cur}{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white text-black p-5 text-center">
            <p className="text-[11px] uppercase tracking-wider text-black/50 mb-1">Each person pays</p>
            <p className="text-3xl font-bold">{cur}{perPerson.toFixed(2)}</p>
            <p className="text-xs text-black/50 mt-1">split {n} way{n > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </LifestyleShell>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex justify-between text-white/60">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}