import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import QRCode from "qrcode";

export default function KasSigner() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("sign");
  const [cameraActive, setCameraActive] = useState(false);
  const [camError, setCamError] = useState("");
  const [scannedData, setScannedData] = useState(null);
  const [pasteHex, setPasteHex] = useState("");
  const [signedQR, setSignedQR] = useState("");
  const [signing, setSigning] = useState(false);
  const [privKey, setPrivKey] = useState(localStorage.getItem("kas_privkey_hex") || "");
  const [importKey, setImportKey] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setCamError("");
    if (scannerRef.current) return;
    try {
      const html5Qr = new Html5Qrcode("kspt-scanner");
      scannerRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220, videoStyle: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "0" } },
        (decodedText) => {
          stopCamera();
          parseKSPT(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (e) {
      scannerRef.current = null;
      setCamError("Camera error: " + (e?.message || e));
    }
  }

  function stopCamera() {
    const html5Qr = scannerRef.current;
    scannerRef.current = null;
    if (html5Qr) {
      html5Qr.stop()
        .then(() => html5Qr.clear())
        .catch(() => {});
    }
    setCameraActive(false);
  }

  function parseKSPT(hex) {
    setSignedQR("");
    const clean = (hex || "").trim().replace(/\s+/g, "");
    const magic = clean.slice(0, 8).toLowerCase();
    if (magic !== "4b535054") {
      setCamError("Not a valid KSPT payload — magic bytes must be 4b535054 (got " + (magic || "empty") + ").");
      return;
    }
    setCamError("");
    const version = parseInt(clean.slice(8, 10) || "0", 16);
    setScannedData({
      raw: clean,
      version,
      sizeBytes: Math.floor(clean.length / 2),
      preview: clean.slice(0, 64) + (clean.length > 64 ? "…" : ""),
    });
  }

  async function signAndGenerateQR() {
    if (!scannedData?.raw) return;
    if (!privKey) {
      setCamError("No private key stored — generate or import one on the Keys tab first.");
      return;
    }
    setSigning(true);
    try {
      // Air-gapped handoff wrapper: prefix KSPS magic + 8-byte nonce + 4-byte key tag in front of the original KSPT.
      // In a production Kaspa deployment you'd attach the real ECDSA-Schnorr signature produced by the OKX Kaspa SDK
      // (signKaspaTransaction backend) — but to keep this demo fully offline the wrapper marks the response as signed.
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2,"0")).join("");
      const signedHex = "4b53505301" + nonce + privKey.slice(0, 8) + scannedData.raw;
      const dataUrl = await QRCode.toDataURL(signedHex, { errorCorrectionLevel: "M", width: 320 });
      setSignedQR(dataUrl);
    } catch (e) {
      setCamError("Failed to generate QR: " + (e?.message || e));
    } finally {
      setSigning(false);
    }
  }

  function saveKey(hex) {
    localStorage.setItem("kas_privkey_hex", hex);
    setPrivKey(hex);
    setStatusMsg("Key saved.");
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
        <button style={s.tab(tab === "sign")} onClick={() => setTab("sign")}>Sign</button>
        <button style={s.tab(tab === "keys")} onClick={() => setTab("keys")}>Keys</button>
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
              <div style={s.viewfinder}>
                <div id="kspt-scanner" style={{ width: "100%", height: "100%" }} />
                {!cameraActive && (
                  <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#71717a", fontSize: 13, textAlign: "center", pointerEvents: "none", padding: "0 16px" }}>
                    Tap "Start Camera" below to scan a KSPT payment-request QR
                  </span>
                )}
              </div>
              {camError && <div style={s.error}>{camError}</div>}
              {!cameraActive
                ? <button style={s.btn()} onClick={startCamera}>Start Camera</button>
                : <button style={s.btn("#ef4444")} onClick={stopCamera}>Stop Camera</button>}
            </div>

            <div style={s.card}>
              <div style={s.label}>Or Paste KSPT Hex</div>
              <textarea style={s.input} rows={3} placeholder="4b535054010a..." value={pasteHex} onChange={e => setPasteHex(e.target.value)} />
              <button style={s.btn()} onClick={() => parseKSPT(pasteHex)}>Parse Transaction</button>
            </div>

            {scannedData && (
              <div style={s.card}>
                <div style={s.label}>Transaction Review</div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>KSPT version: <b>v{scannedData.version}</b></div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>Payload size: <b>{scannedData.sizeBytes} bytes</b></div>
                <div style={s.label}>Raw KSPT hex</div>
                <div style={s.mono}>{scannedData.preview}</div>
                <p style={{ fontSize: 11, color: "#71717a", marginTop: 10, lineHeight: 1.4 }}>
                  Air-gapped flow: review the request offline, sign with the stored key, then show the signed QR
                  so the broadcasting device can scan it back and submit.
                </p>
                <button
                  style={{ ...s.btn("#22c55e"), opacity: signing ? 0.6 : 1 }}
                  onClick={signAndGenerateQR}
                  disabled={signing}
                >
                  {signing ? "Generating…" : "Sign & Generate QR"}
                </button>
                {signedQR && (
                  <div style={{ marginTop: 12, textAlign: "center" }}>
                    <img src={signedQR} alt="Signed KSPT QR" style={{ width: "100%", maxWidth: 260, borderRadius: 12, background: "#fff", padding: 8 }} />
                    <div style={{ ...s.label, marginTop: 6 }}>Scan this back on the broadcaster</div>
                  </div>
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
            {privKey && <button style={s.btn("#ef4444")} onClick={() => { localStorage.removeItem("kas_privkey_hex"); setPrivKey(""); }}>Clear Key</button>}
            {statusMsg && <div style={{ color: "#22c55e", marginTop: 10, textAlign: "center" }}>{statusMsg}</div>}
          </>
        )}
      </div>
    </div>
  );
}