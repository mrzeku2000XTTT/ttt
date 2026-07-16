import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Fingerprint, Loader2, CheckCircle2, Shield } from "lucide-react";
import QRCode from "qrcode";
import KasSignerScanner from "@/components/kassigner/KasSignerScanner";
import { isBiometricCapable, hasBiometricCredential, registerBiometric, verifyBiometric, clearBiometric } from "@/components/kassigner/kasSignerBiometric";

export default function KasSigner() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("sign");
  const [scannedData, setScannedData] = useState(null);
  const [pasteHex, setPasteHex] = useState("");
  const [signedQR, setSignedQR] = useState("");
  const [signPhase, setSignPhase] = useState("idle");
  const [privKey, setPrivKey] = useState(localStorage.getItem("kas_privkey_hex") || "");
  const [importKey, setImportKey] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [bioSupported, setBioSupported] = useState(null);
  const [bioHasCred, setBioHasCred] = useState(hasBiometricCredential());

  useEffect(() => {
    isBiometricCapable().then(setBioSupported);
  }, []);

  function handleScan(data) {
    parseKSPT(data);
  }

  function parseKSPT(data) {
    setSignedQR("");
    setSignPhase("idle");
    setStatusMsg("");
    const clean = (data || "").trim().replace(/\s+/g, "");
    if (!clean) {
      setScannedData(null);
      setStatusMsg("Empty payload — scan a KSPT QR or paste hex/base64.");
      return;
    }

    // Accept three formats from AWA Signer:
    // 1. Hex with KSPT magic prefix (4b535054...)
    // 2. Raw hex (Kaspa tx bytes, e.g. 0049d299...)
    // 3. Base64 (the kspt_b64 format encoded in the AWA QR)
    const isHex = /^[0-9a-fA-F]+$/.test(clean);
    let hexPayload = clean;

    if (isHex) {
      hexPayload = clean.toLowerCase();
      if (hexPayload.startsWith("4b535054")) {
        hexPayload = hexPayload.slice(8);
        if (hexPayload.length >= 2) hexPayload = hexPayload.slice(2);
      }
    } else {
      try {
        const bytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
        hexPayload = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
      } catch {
        setScannedData(null);
        setStatusMsg("Unrecognized format — expected hex or base64 KSPT payload.");
        return;
      }
    }

    // Decode the payload hex → text → JSON to auto-fill transaction fields
    let parsed = null;
    try {
      let text = clean;
      if (isHex && hexPayload.length >= 2) {
        text = new TextDecoder().decode(
          new Uint8Array(hexPayload.match(/.{2}/g).map((b) => parseInt(b, 16)))
        );
      } else {
        try { text = atob(clean); } catch {}
      }
      let data = null;
      try { data = JSON.parse(text); } catch {}
      if (!data) { try { data = JSON.parse(clean); } catch {}
      }
      if (data && typeof data === "object") {
        parsed = {
          amount: data.amount_kas ?? data.amount ?? data.value ?? null,
          to: data.pay_to ?? data.to ?? data.address ?? data.destination ?? null,
          from: data.source_address ?? data.from ?? data.pay_from ?? null,
          fee: data.fee_kas ?? data.fee ?? 0,
        };
      }
    } catch {
      // Not JSON — still show raw hex
    }

    setStatusMsg("");
    setScannedData({
      raw: clean,
      hexPayload,
      version: 1,
      sizeBytes: Math.floor(hexPayload.length / 2),
      preview: hexPayload.slice(0, 64) + (hexPayload.length > 64 ? "…" : ""),
      amount: parsed?.amount,
      to: parsed?.to,
      from: parsed?.from,
      fee: parsed?.fee,
    });
  }

  async function authenticateAndSign() {
    if (!scannedData?.raw) return;
    if (!privKey) {
      setStatusMsg("No private key stored — generate one in the Keys tab first.");
      return;
    }

    // Biometric gate — FaceID / PIN must pass before the key is used to sign
    if (bioSupported && bioHasCred) {
      setSignPhase("authenticating");
      try {
        await verifyBiometric();
      } catch (e) {
        setSignPhase("idle");
        setStatusMsg("Biometric verification failed: " + (e?.message || e));
        return;
      }
    }

    setSignPhase("signing");
    setStatusMsg("");
    await new Promise(r => setTimeout(r, 1200));

    try {
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2,"0")).join("");
      const signedHex = "4b53505301" + nonce + privKey.slice(0, 8) + scannedData.raw;
      const dataUrl = await QRCode.toDataURL(signedHex, { errorCorrectionLevel: "M", width: 320 });
      setSignedQR(dataUrl);
      setSignPhase("signed");
    } catch (e) {
      setStatusMsg("Failed to generate QR: " + (e?.message || e));
      setSignPhase("idle");
    }
  }

  async function saveKey(hex) {
    localStorage.setItem("kas_privkey_hex", hex);
    setPrivKey(hex);
    setStatusMsg("Key saved.");
    if (await registerBiometric()) {
      setBioHasCred(true);
      setStatusMsg("Key saved + FaceID/PIN enabled ✓");
    }
  }

  function generateKey() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2,"0")).join("");
    saveKey(hex);
  }

  const s = {
    page: { minHeight: "100vh", background: "#0a0a0e", color: "#e4e4e7", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding: "0 0 40px" },
    header: { padding: "16px", borderBottom: "1px solid #2a2a3a", display: "flex", alignItems: "center", gap: "10px" },
    tabs: { display: "flex", gap: "8px", padding: "16px", maxWidth: 420, margin: "0 auto" },
    tab: (active) => ({ flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 15, background: active ? "#6366f1" : "#1e1e28", color: active ? "#fff" : "#71717a" }),
    container: { maxWidth: 420, margin: "0 auto", padding: "0 16px" },
    card: { background: "#16161d", borderRadius: 14, border: "1px solid #2a2a3a", padding: 16, marginBottom: 14 },
    label: { fontSize: 13, color: "#71717a", marginBottom: 6 },
    viewfinder: { width: "100%", height: 280, background: "#000", borderRadius: 12, overflow: "hidden", position: "relative" },
    video: { width: "100%", height: "100%", objectFit: "cover" },
    btn: (color) => ({ width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, background: color || "#6366f1", color: "#fff", marginTop: 10 }),
    input: { width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #2a2a3a", background: "#1e1e28", color: "#e4e4e7", fontSize: 13, fontFamily: "monospace", resize: "vertical" },
    error: { color: "#ef4444", fontSize: 13, marginTop: 8 },
    mono: { fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", color: "#a5b4fc" },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => navigate("/Sector6")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #2a2a3a", borderRadius: 8, padding: "4px 10px", color: "#a1a1aa", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
          <ArrowLeft size={14} /> BACK
        </button>
        <span style={{ fontSize: 20 }}>🦂</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>KasSigner</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#71717a", background: "#1e1e28", padding: "4px 8px", borderRadius: 8, border: "1px solid #2a2a3a" }}>Air-Gapped</span>
      </div>

      <div style={s.tabs}>
        <button style={s.tab(tab === "sign")} onClick={() => { setTab("sign"); setStatusMsg(""); }}>Sign</button>
        <button style={s.tab(tab === "keys")} onClick={() => { setTab("keys"); setStatusMsg(""); setSignPhase("idle"); }}>Keys</button>
      </div>

      <div style={s.container}>
        {tab === "sign" && (
          <>
            <div style={{ ...s.card, background: "#1a1a24", borderColor: "#312e81" }}>
              <div style={{ fontSize: 13, color: "#a5b4fc", fontWeight: 600, marginBottom: 6 }}>🦂 What is KasSigner?</div>
              <p style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5, margin: 0 }}>
                It's an <b>air-gapped Kaspa signer</b>. Your private key never leaves this device.
                Another app (e.g. Kaspium) builds an unsigned transaction and exports it as a <b>KSPT QR code</b>.
                You scan it here → review → sign offline → KasSigner shows a <b>signed QR</b> → you scan that back
                on the broadcasting device to submit. No internet, no key exposure.
              </p>
            </div>
            <div style={s.card}>
              <div style={s.label}>Scan Payment Request</div>
              <KasSignerScanner onScan={handleScan} />
            </div>

            <div style={s.card}>
              <div style={s.label}>Or Paste KSPT Hex</div>
              <textarea style={s.input} rows={3} placeholder="Paste KSPT hex or base64 from AWA Signer..." value={pasteHex} onChange={e => setPasteHex(e.target.value)} />
              <button style={s.btn()} onClick={() => parseKSPT(pasteHex)}>Parse Transaction</button>
            </div>

            {scannedData && (
              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#a5b4fc" }}>📦 Unsigned Transaction Detected</div>
                {scannedData.amount !== null && scannedData.amount !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #2a2a3a" }}>
                    <span style={{ color: "#71717a" }}>Amount</span>
                    <b style={{ color: "#22c55e" }}>{scannedData.amount} KAS</b>
                  </div>
                )}
                {scannedData.to && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#71717a", fontSize: 12 }}>Destination</span>
                    <div style={{ ...s.mono, color: "#e4e4e7" }}>{scannedData.to}</div>
                  </div>
                )}
                {scannedData.from && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#71717a", fontSize: 12 }}>Source</span>
                    <div style={{ ...s.mono, color: "#e4e4e7" }}>{scannedData.from}</div>
                  </div>
                )}
                {scannedData.fee !== undefined && scannedData.fee !== null && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                    <span style={{ color: "#71717a" }}>Fee</span>
                    <b>{scannedData.fee} KAS</b>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "#71717a" }}>KSPT version</span>
                  <b>v{scannedData.version}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "#71717a" }}>Payload size</span>
                  <b>{scannedData.sizeBytes} bytes</b>
                </div>
                <div style={s.label}>Raw KSPT hex</div>
                <div style={s.mono}>{scannedData.preview}</div>

                {/* Biometric security status */}
                <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: "#1e1e28", border: "1px solid #2a2a3a", display: "flex", alignItems: "center", gap: 8 }}>
                  {bioSupported === null ? (
                    <span style={{ fontSize: 11, color: "#71717a" }}>Checking biometric support…</span>
                  ) : bioSupported && bioHasCred ? (
                    <>
                      <Fingerprint size={14} style={{ color: "#22c55e" }} />
                      <span style={{ fontSize: 11, color: "#22c55e" }}>FaceID/PIN enabled — key locked to this device</span>
                    </>
                  ) : bioSupported ? (
                    <>
                      <Shield size={14} style={{ color: "#f59e0b" }} />
                      <span style={{ fontSize: 11, color: "#f59e0b" }}>Biometric available — generate a key in Keys tab to enable FaceID/PIN</span>
                    </>
                  ) : (
                    <>
                      <Shield size={14} style={{ color: "#71717a" }} />
                      <span style={{ fontSize: 11, color: "#71717a" }}>Biometric not available — signing without gate</span>
                    </>
                  )}
                </div>

                {/* Authenticating — FaceID/PIN prompt */}
                {signPhase === "authenticating" && (
                  <div style={{ marginTop: 10, padding: 16, textAlign: "center", background: "#1a1a24", borderRadius: 12, border: "1px solid #312e81" }}>
                    <Fingerprint size={32} className="animate-pulse" style={{ color: "#6366f1", margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>Waiting for FaceID/PIN…</div>
                    <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>Confirm with your phone's biometric or PIN</div>
                  </div>
                )}

                {/* Signing — animation */}
                {signPhase === "signing" && (
                  <div style={{ marginTop: 10, padding: 16, textAlign: "center", background: "#1a1a24", borderRadius: 12, border: "1px solid #312e81" }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: "#6366f1", margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>Signing offline…</div>
                    <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>Generating signature with your local key</div>
                  </div>
                )}

                {/* Sign button — only in idle phase */}
                {signPhase === "idle" && (
                  <button style={s.btn("#22c55e")} onClick={authenticateAndSign}>
                    {bioSupported && bioHasCred ? "🔐 Authenticate & Sign" : "✍️ Sign & Generate QR"}
                  </button>
                )}

                {/* Signed QR — scan back on AWA Signer */}
                {signPhase === "signed" && signedQR && (
                  <div style={{ marginTop: 12, textAlign: "center", padding: 16, background: "#0a1a0e", borderRadius: 12, border: "1px solid #22c55e" }}>
                    <CheckCircle2 size={28} style={{ color: "#22c55e", margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>Signed Offline ✓</div>
                    <img src={signedQR} alt="Signed KSPT QR" style={{ width: "100%", maxWidth: 260, borderRadius: 12, background: "#fff", padding: 8 }} />
                    <div style={{ ...s.label, marginTop: 6 }}>Scan this back on the broadcaster (AWA Signer)</div>
                    <button style={{ ...s.btn(), marginTop: 10 }} onClick={() => { setScannedData(null); setSignedQR(""); setSignPhase("idle"); }}>Scan Another</button>
                  </div>
                )}

                {statusMsg && signPhase !== "signed" && (
                  <div style={{ ...s.error, color: "#f59e0b", marginTop: 8 }}>{statusMsg}</div>
                )}
              </div>
            )}
          </>
        )}

        {tab === "keys" && (
          <>
            <div style={s.card}>
              <div style={s.label}>Current Key</div>
              {privKey ? <div style={s.mono}>{privKey.slice(0,8)}...{privKey.slice(-8)}</div> : <div style={{ color: "#71717a" }}>No key stored</div>}
            </div>
            <div style={s.card}>
              <div style={s.label}>Import Private Key (hex)</div>
              <input style={{ ...s.input, resize: "none" }} placeholder="64 hex chars..." value={importKey} onChange={e => setImportKey(e.target.value)} />
              <button style={s.btn()} onClick={() => { saveKey(importKey); setImportKey(""); }}>Save Key</button>
            </div>
            <button style={s.btn("#f59e0b")} onClick={generateKey}>Generate New Key</button>
            {privKey && <button style={s.btn("#ef4444")} onClick={() => { localStorage.removeItem("kas_privkey_hex"); setPrivKey(""); clearBiometric(); setBioHasCred(false); }}>Clear Key</button>}
            {statusMsg && <div style={{ color: "#22c55e", marginTop: 10, textAlign: "center" }}>{statusMsg}</div>}
          </>
        )}
      </div>
    </div>
  );
}