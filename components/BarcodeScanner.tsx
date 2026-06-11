"use client";

import { useZxing } from "react-zxing";
import { useState, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

interface BarcodeScannerProps {
  onDetect: (code: string) => void;
  active: boolean;
}

// ─── Estrategia 1: Native BarcodeDetector API (Chrome Android, Samsung) ──────
async function tryNativeDetector(imageBlob: Blob): Promise<string | null> {
  if (!("BarcodeDetector" in window)) return null;
  try {
    // @ts-expect-error — BarcodeDetector no está en los tipos de TS aún
    const detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code", "code_39"],
    });
    const imageBitmap = await createImageBitmap(imageBlob);
    const codes = await detector.detect(imageBitmap);
    return codes[0]?.rawValue ?? null;
  } catch {
    return null;
  }
}

// ─── Estrategia 2: ZXing desde imagen estática (fallback universal) ───────────
async function tryZxingFromImage(imageUrl: string): Promise<string | null> {
  try {
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(imageUrl);
    return result.getText();
  } catch {
    return null;
  }
}

// Helper para convertir archivo a base64
function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// ─── Estrategia 3: Agente de IA para decodificar imágenes complejas ───────────
async function tryAiDetector(file: Blob): Promise<string | null> {
  try {
    const base64 = await fileToBase64(file);
    const response = await fetch("/api/barcode/ai-scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64,
        mimeType: file.type,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.code : null;
  } catch {
    return null;
  }
}

export function BarcodeScanner({ onDetect, active }: BarcodeScannerProps) {
  const [lastCode, setLastCode] = useState("");
  const [mode, setMode] = useState<"video" | "photo">("video");
  const [photoStatus, setPhotoStatus] = useState<"idle" | "processing" | "ai_processing" | "ok" | "fail">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Modo video: react-zxing en tiempo real ───────────────────────────────
  const { ref } = useZxing({
    paused: !active || mode === "photo",
    onDecodeResult(result) {
      const code = result.rawValue;
      if (code !== lastCode) {
        setLastCode(code);
        onDetect(code);
        setTimeout(() => setLastCode(""), 2000);
      }
    },
    onError() {
      // Si ZXing no puede iniciar la cámara, sugerimos modo foto
    },
    constraints: {
      video: {
        facingMode: "environment",
        // Sin forzar resolución — el browser elige la mejor disponible
      },
    },
  });

  // ─── Modo foto: captura imagen → decode estático ──────────────────────────
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoStatus("processing");
    const objectUrl = URL.createObjectURL(file);

    try {
      // Estrategia 1: API nativa del browser (más rápida y precisa)
      let code = await tryNativeDetector(file);

      // Estrategia 2: ZXing desde imagen (fallback universal)
      if (!code) {
        code = await tryZxingFromImage(objectUrl);
      }

      // Estrategia 3: Agente de IA (último recurso)
      if (!code) {
        setPhotoStatus("ai_processing");
        code = await tryAiDetector(file);
      }

      if (code) {
        setPhotoStatus("ok");
        onDetect(code);
        setTimeout(() => setPhotoStatus("idle"), 1500);
      } else {
        setPhotoStatus("fail");
        setTimeout(() => setPhotoStatus("idle"), 2500);
      }
    } finally {
      URL.revokeObjectURL(objectUrl);
      // Reset input para permitir capturar la misma imagen de nuevo
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!active) {
    return (
      <div className="scanner-wrapper">
        <div className="scanner-idle">
          <div className="scanner-idle-icon">📷</div>
          <p>Activa la cámara para escanear</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toggle de modo */}
      <div className="scanner-mode-toggle">
        <button
          className={`scanner-mode-btn ${mode === "video" ? "active" : ""}`}
          onClick={() => setMode("video")}
          id="btn-mode-video"
        >
          🎥 En vivo
        </button>
        <button
          className={`scanner-mode-btn ${mode === "photo" ? "active" : ""}`}
          onClick={() => setMode("photo")}
          id="btn-mode-photo"
        >
          📸 Foto
        </button>
      </div>

      {/* Modo VIDEO */}
      {mode === "video" && (
        <div className="scanner-wrapper">
          <video ref={ref} className="scanner-video" playsInline muted autoPlay />
          <div className="scanner-overlay">
            <div className="scanner-frame">
              <div className="scanner-frame-tr" />
              <div className="scanner-frame-bl" />
              <div className="scanner-line" />
            </div>
          </div>
          <button
            className="scanner-fallback-hint"
            onClick={() => setMode("photo")}
          >
            ¿No lee el código? → Usa modo Foto
          </button>
        </div>
      )}

      {/* Modo FOTO */}
      {mode === "photo" && (
        <div className="scanner-wrapper photo-mode">
          <div className="scanner-idle">
            {photoStatus === "idle" && (
              <>
                <div className="scanner-idle-icon">📸</div>
                <p>Toma una foto del código de barras o QR</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                  Funciona con imagen borrosa o en mal ángulo
                </p>
              </>
            )}
            {photoStatus === "processing" && (
              <>
                <div className="scanner-idle-icon" style={{ animation: "pulse 0.8s infinite" }}>🔍</div>
                <p>Analizando imagen...</p>
              </>
            )}
            {photoStatus === "ai_processing" && (
              <>
                <div className="scanner-idle-icon" style={{ animation: "pulse 0.8s infinite" }}>🤖</div>
                <p>Agente IA analizando...</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                  Descifrando código con inteligencia artificial
                </p>
              </>
            )}
            {photoStatus === "ok" && (
              <>
                <div className="scanner-idle-icon">✅</div>
                <p style={{ color: "var(--accent-success)" }}>¡Código detectado!</p>
              </>
            )}
            {photoStatus === "fail" && (
              <>
                <div className="scanner-idle-icon">❌</div>
                <p style={{ color: "var(--accent-error)" }}>No se detectó ningún código</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                  Intenta con mejor iluminación o más cerca
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Input de archivo oculto — abre cámara nativa en móvil */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        style={{ display: "none" }}
        id="photo-capture-input"
      />

      {mode === "photo" && (photoStatus === "idle" || photoStatus === "fail") && (
        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: 12 }}
          onClick={() => fileInputRef.current?.click()}
          id="btn-take-photo"
        >
          📷 Tomar foto
        </button>
      )}
    </div>
  );
}
