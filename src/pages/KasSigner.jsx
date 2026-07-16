import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function KasSigner() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("sign");
  const [cameraActive, setCameraActive] = useState(false);
  const [camError, setCamError] = useState("");
  const [scannedData, setScannedData] = useState(null);
  const [pasteHex, setPasteHex] = useState("");
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
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
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
    setScannedData({ raw: hex, amount: "2.00", to: "kaspa:qpkn4a...dlkq2cm8e58e", fee: "0.001" });
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
    viewfinder: { width: "100%", aspectRatio: "1", background: "#000", borderRadius: 12, overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
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
            <div style={s.card}>
              <div style={s.label}>Scan Payment Request</div>
              <div style={s.viewfinder}>
                <div id="kspt-scanner" style={{ width: "100%", height: "100%", display: cameraActive ? "block" : "none" }} />
                {!cameraActive && <span style={{ position: "absolute", color: "#71717a", fontSize: 14 }}>Tap button below to start</span>}
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
                <div>Amount: <b>{scannedData.amount} KAS</b></div>
                <div>To: <span style={s.mono}>{scannedData.to}</span></div>
                <div>Fee: {scannedData.fee} KAS</div>
                <button style={s.btn("#22c55e")}>Sign & Generate QR</button>
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