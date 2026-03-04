import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!mounted || !scannerRef.current) return;

      const scanner = new Html5Qrcode("qr-scanner-container");
      instanceRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Kaspa QR format: kaspa:address?amount=X
            let address = decodedText;
            let amount = "";

            try {
              // Handle kaspa:address?amount=X format
              if (decodedText.includes("?")) {
                const [base, query] = decodedText.split("?");
                address = base;
                const params = new URLSearchParams(query);
                amount = params.get("amount") || "";
              }
            } catch {}

            onScan({ address, amount });
            stopScanner();
          },
          () => {} // ignore per-frame errors
        );
      } catch (err) {
        console.error("QR scanner start failed:", err);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (instanceRef.current) {
      try {
        await instanceRef.current.stop();
        instanceRef.current.clear();
      } catch {}
      instanceRef.current = null;
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Scan Kaspa QR</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500">Point camera at a Kaspa address or payment QR code</p>
        <div
          id="qr-scanner-container"
          ref={scannerRef}
          className="rounded-xl overflow-hidden"
          style={{ minHeight: 280 }}
        />
      </div>
    </motion.div>
  );
}