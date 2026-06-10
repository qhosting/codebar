"use client";

import { useZxing } from "react-zxing";
import { useState } from "react";

interface BarcodeScannerProps {
  onDetect: (code: string) => void;
  active: boolean;
}

export function BarcodeScanner({ onDetect, active }: BarcodeScannerProps) {
  const [lastCode, setLastCode] = useState("");

  const { ref } = useZxing({
    paused: !active,
    onDecodeResult(result) {
      const code = result.getText();
      if (code !== lastCode) {
        setLastCode(code);
        onDetect(code);
        // Reset after 2s to allow re-scan same code
        setTimeout(() => setLastCode(""), 2000);
      }
    },
    constraints: {
      video: {
        facingMode: "environment", // Use rear camera on mobile
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
  });

  if (!active) {
    return (
      <div className="scanner-wrapper">
        <div className="scanner-idle">
          <div className="scanner-idle-icon">📷</div>
          <p>Activa la cámara para escanear el código de barras</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-wrapper">
      <video ref={ref} className="scanner-video" playsInline muted autoPlay />
      <div className="scanner-overlay">
        <div className="scanner-frame">
          <div className="scanner-frame-tr" />
          <div className="scanner-frame-bl" />
          <div className="scanner-line" />
        </div>
      </div>
    </div>
  );
}
