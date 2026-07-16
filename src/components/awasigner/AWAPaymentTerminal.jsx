import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Radio, Loader2, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { AWA_SERVICES, AWA_DESTINATION, AWA_BACKEND_URL } from "./awaServices";
import { base44 } from "@/api/base44Client";

export default function AWAPaymentTerminal({ onPayment }) {
  const [services, setServices] = useState(AWA_SERVICES);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceId, setServiceId] = useState(AWA_SERVICES[0].id);
  const [address, setAddress] = useState("");
  const [kasPrice, setKasPrice] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [buildResult, setBuildResult] = useState(null);
  const [buildContext, setBuildContext] = useState(null);
  const [signedResponse, setSignedResponse] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const service = services.find(s => s.id === serviceId) || services[0];

  // Live KAS price on load
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(AWA_BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "price" }),
        });
        const data = await res.json();
        if (data?.price_usd) setKasPrice(data.price_usd);
      } catch (e) {
        console.error("Price fetch failed:", e);
      }
    };
    fetchPrice();
  }, []);

  // Fetch dynamic service catalog from the AWA x402 backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await base44.functions.invoke('awaX402', { action: 'services' });
        const data = res.data || res;
        if (data?.services?.length) {
          const mapped = data.services.map(s => ({
            id: s.id,
            name: s.name,
            kas: s.price_kas,
            sompi: String(Math.round(s.price_kas * 1e8)),
            result_type: s.result_type,
          }));
          setServices(mapped);
          setServiceId(mapped[0].id);
        }
      } catch (e) {
        console.error('Service catalog fetch failed, using fallback:', e);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const usdLabel = (kas) => kasPrice ? ` ($${(kas * kasPrice).toFixed(5)})` : "";

  const handleGenerateQR = async () => {
    setError(null);
    setBroadcastResult(null);
    if (!address.startsWith("kaspa:")) {
      setError("Enter a valid Kaspa address (kaspa:q...)");
      return;
    }
    setIsBuilding(true);
    setQrDataUrl(null);
    setBuildResult(null);
    try {
      const res = await fetch(AWA_BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "build",
          sender_address: address.trim(),
          amount_sompi: service.sompi,
          destination_address: AWA_DESTINATION,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to build KSPT transaction");
      }
      const url = await QRCode.toDataURL(data.kspt_b64, { width: 280, margin: 1, color: { dark: "#ffffff", light: "#18181b" } });
      setQrDataUrl(url);
      setBuildResult(data);
      setBuildContext(data.build_context);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleBroadcast = async () => {
    setError(null);
    if (!signedResponse.trim()) {
      setError("Paste the signed KSPT response from your signer phone.");
      return;
    }
    if (!buildContext) {
      setError("Build a payment QR first — the broadcast needs the build context.");
      return;
    }
    setIsBroadcasting(true);
    try {
      const res = await fetch(AWA_BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast",
          signed_kspt_hex: signedResponse.trim(),
          build_context: buildContext,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Broadcast failed");
      }
      setBroadcastResult(data);
      onPayment?.({
        date: new Date().toISOString(),
        service: service.name,
        amount_kas: service.kas,
        tx_id: data.tx_id,
        status: "confirmed",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const copyHex = () => {
    navigator.clipboard.writeText(buildResult?.kspt_hex || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      {kasPrice && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 font-mono">
          Live KAS/USD: ${kasPrice.toFixed(4)}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — Service selector + address */}
        <div className="space-y-5">
          <div>
            <label className="text-xs text-zinc-400 font-semibold mb-2 block tracking-wide">SERVICE SELECTOR</label>
            <select
              value={serviceId}
              disabled={loadingServices}
              onChange={(e) => { setServiceId(e.target.value); setQrDataUrl(null); setBuildResult(null); setBuildContext(null); setBroadcastResult(null); }}
              className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500/50 disabled:opacity-50"
            >
              {loadingServices && <option value="">Loading services…</option>}
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.kas} KAS{usdLabel(s.kas)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-semibold mb-2 block tracking-wide">YOUR KASPA ADDRESS</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="kaspa:q..."
              className="bg-black/60 border-white/10 text-white rounded-2xl h-12 font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleGenerateQR}
            disabled={isBuilding}
            className="w-full h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
          >
            {isBuilding ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building KSPT transaction…</>
            ) : (
              <><QrCode className="w-4 h-4 mr-2" /> Request Payment QR</>
            )}
          </Button>

          <div className="pt-2 space-y-3">
            <label className="text-xs text-zinc-400 font-semibold block tracking-wide">SCAN RESPONSE QR</label>
            <Input
              value={signedResponse}
              onChange={(e) => setSignedResponse(e.target.value)}
              placeholder="Paste signed KSPT hex from signer phone…"
              className="bg-black/60 border-white/10 text-white rounded-2xl h-12 font-mono text-sm"
            />
            <Button
              onClick={handleBroadcast}
              disabled={isBroadcasting}
              className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold"
            >
              {isBroadcasting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Broadcasting to Kaspa…</>
              ) : (
                <><Radio className="w-4 h-4 mr-2" /> Broadcast & Execute</>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {broadcastResult && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-300 font-semibold">Payment confirmed! Running AI service…</p>
              </div>
              <div className="text-xs font-mono text-zinc-400 break-all">TX: {broadcastResult.tx_id}</div>
              {broadcastResult.explorer_url && (
                <a
                  href={broadcastResult.explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  View on Kaspa Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* KSPT hex fallback */}
          {buildResult?.kspt_hex && (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2">
              <p className="text-xs text-zinc-400">
                No signer phone yet? Copy the KSPT hex below and paste it into any KSPT-compatible wallet or use KasSigner hardware.
              </p>
              <textarea
                readOnly
                value={buildResult.kspt_hex}
                onClick={(e) => e.target.select()}
                className="w-full h-20 bg-black/60 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-zinc-300 outline-none resize-none"
              />
              <button
                onClick={copyHex}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy KSPT hex"}
              </button>
            </div>
          )}
        </div>

        {/* Right — QR display */}
        <div className="flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-3xl p-6 min-h-[320px]">
          {isBuilding ? (
            <div className="text-center text-zinc-500">
              <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-cyan-400" />
              <p className="text-sm">Building unsigned transaction…</p>
            </div>
          ) : qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="KSPT payment QR" className="rounded-2xl border border-white/10" />
              {buildResult?.qr_label && (
                <div className="mt-3 text-xs font-mono text-cyan-400/90 text-center">{buildResult.qr_label}</div>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px] font-mono text-zinc-500">
                <span>Amount: {buildResult?.amount_kas} KAS</span>
                <span>Fee: {buildResult?.fee_kas} KAS</span>
                <span>Change: {buildResult?.change_kas} KAS</span>
              </div>
              {Array.isArray(buildResult?.instructions) && buildResult.instructions.length > 0 && (
                <ol className="mt-4 space-y-1.5 text-xs text-zinc-400 max-w-xs list-decimal list-inside">
                  {buildResult.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <div className="text-center text-zinc-600">
              <QrCode className="w-16 h-16 mx-auto mb-3" />
              <p className="text-sm">Payment QR will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}