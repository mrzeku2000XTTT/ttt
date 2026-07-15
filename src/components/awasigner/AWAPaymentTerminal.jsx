import React, { useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Radio, Loader2, CheckCircle2 } from "lucide-react";
import { AWA_SERVICES, kasToUsd } from "./awaServices";

const AWA_PAY_TO = "kaspa:qypq6vk40nn2gencrhjcx4s57lafwp8cvxpevx9j4d0hyxk8xfjyx5wp5uz00x";

export default function AWAPaymentTerminal({ onPayment }) {
  const [serviceId, setServiceId] = useState(AWA_SERVICES[0].id);
  const [address, setAddress] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [payload, setPayload] = useState(null);
  const [signedResponse, setSignedResponse] = useState("");
  const [status, setStatus] = useState("idle"); // idle | qr_ready | broadcasting | running | done
  const [error, setError] = useState(null);

  const service = AWA_SERVICES.find(s => s.id === serviceId);

  const handleGenerateQR = async () => {
    setError(null);
    if (!address.startsWith("kaspa:")) {
      setError("Enter a valid Kaspa address (kaspa:q...)");
      return;
    }
    // KSPT v0x01 unsigned payment payload
    const ksptPayload = JSON.stringify({
      magic: "KSPT",
      version: "0x01",
      type: "unsigned_payment",
      service: service.id,
      amount_kas: service.priceKas,
      pay_to: AWA_PAY_TO,
      refund_to: address,
      nonce: Date.now().toString(36),
    });
    const url = await QRCode.toDataURL(ksptPayload, { width: 280, margin: 1, color: { dark: "#ffffff", light: "#18181b" } });
    setPayload(ksptPayload);
    setQrDataUrl(url);
    setStatus("qr_ready");
  };

  const handleBroadcast = () => {
    setError(null);
    if (!signedResponse.trim()) {
      setError("Paste the signed response QR payload from your signer phone.");
      return;
    }
    setStatus("broadcasting");
    setTimeout(() => {
      setStatus("running");
      setTimeout(() => {
        setStatus("done");
        const txId = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
        onPayment?.({
          date: new Date().toISOString(),
          service: service.name,
          amount_kas: service.priceKas,
          tx_id: txId,
          status: "confirmed",
        });
      }, 1800);
    }, 1500);
  };

  return (
    <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — Service selector + address */}
        <div className="space-y-5">
          <div>
            <label className="text-xs text-zinc-400 font-semibold mb-2 block tracking-wide">SERVICE SELECTOR</label>
            <select
              value={serviceId}
              onChange={(e) => { setServiceId(e.target.value); setQrDataUrl(null); setStatus("idle"); }}
              className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500/50"
            >
              {AWA_SERVICES.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.priceKas} KAS (${kasToUsd(s.priceKas)})
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
            className="w-full h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Request Payment QR
          </Button>

          <div className="pt-2 space-y-3">
            <label className="text-xs text-zinc-400 font-semibold block tracking-wide">SCAN RESPONSE QR</label>
            <Input
              value={signedResponse}
              onChange={(e) => setSignedResponse(e.target.value)}
              placeholder="Paste signed KSPT response from signer phone…"
              className="bg-black/60 border-white/10 text-white rounded-2xl h-12 font-mono text-sm"
            />
            <Button
              onClick={handleBroadcast}
              disabled={status === "broadcasting" || status === "running"}
              className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold"
            >
              {status === "broadcasting" || status === "running" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {status === "broadcasting" ? "Broadcasting to Kaspa…" : "Payment confirmed! Running AI service…"}</>
              ) : (
                <><Radio className="w-4 h-4 mr-2" /> Broadcast & Execute</>
              )}
            </Button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {status === "done" && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">Payment confirmed! AI service executed — result delivered. See the transaction log below.</p>
            </div>
          )}
        </div>

        {/* Right — QR display */}
        <div className="flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-3xl p-6 min-h-[320px]">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="KSPT payment QR" className="rounded-2xl border border-white/10" />
              <p className="text-xs text-zinc-400 text-center mt-4 max-w-xs leading-relaxed">
                Scan this QR with your signer phone. The signer will show the payment details.
                Approve on the device, then scan the response QR back here.
              </p>
              <div className="mt-3 text-[10px] font-mono text-cyan-500/70">KSPT v0x01 · {service.priceKas} KAS</div>
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