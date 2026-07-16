import { useState, useEffect, useRef } from "react";

export default function Signer() {
  const [tab, setTab] = useState("sign");
  const [cameraActive, setCameraActive] = useState(false);
  const [camError, setCamError] = useState("");
  const [scannedData, setScannedData] = useState(null);
  const [pasteHex, setPasteHex] = useState("");
  const [privKey, setPrivKey] = useState(localStorage.getItem("kas_privkey_hex") || "");
  const [importKey, setImportKey] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const jsQRRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/jsqr@1.4.0/dist/jsQR.js";
    script.onload = () => { jsQRRef.current = window.jsQR; };
    document.head.appendChild(script);
    return () => { stopCamera(); };
  }, []);

  async function startCamera() {
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
      scanLoop();
    } catch (e) {
      setCamError("Camera error: " + e.message);
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  }

  function scanLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !jsQRRef.current || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQRRef.current(imageData.data, imageData.width, imageData.height);
    if (code && code.data) {
      stopCamera();
      parseKSPT(code.data);
    } else {
      rafRef.current = requestAnimationFrame(scanLoop);
    }
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
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
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
                <video ref={videoRef} autoPlay playsInline muted style={{ ...s.video, display: cameraActive ? "block" : "none" }} />
                {!cameraActive && <span style={{ color: "#71717a", fontSize: 14 }}>Tap button below to start</span>}
              </div>
              <canvas ref={canvasRef} style={{ display: "none" }} />
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
              {privKey ? <div style={s.mono}>{privKey.slice(0, 8)}...{privKey.slice(-8)}</div> : <div style={{ color: "#71717a" }}>No key stored</div>}
            </div>
            <div style={s.card}>
              <div style={s.label}>Import Private Key (hex)</div>
              <input style={{ ...s.input, resize: "none" }} placeholder="64 hex chars..." value={importKey} onChange={e => setImportKey(e.target.value)} />
              <button style={s.btn()} onClick={() => { saveKey(importKey); setImportKey(""); }}>Save Key</button>
            </div>
            <button style={s.btn("#f59e0b")} onClick={generateKey}>Generate New Key</button>
            {privKey && <button style={s.btn("#ef4444")} onClick={() => { localStorage.removeItem("kas_privkey_hex"); setPrivKey(""); setStatusMsg(""); }}>Clear Key</button>}
            {statusMsg && <div style={{ color: "#22c55e", marginTop: 10, textAlign: "center" }}>{statusMsg}</div>}
          </>
        )}
      </div>
    </div>
  );
}