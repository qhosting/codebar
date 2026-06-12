"use client";

import { useState, useRef, useEffect } from "react";
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

interface ExtendedTrackCapabilities {
  focusMode?: string[];
  zoom?: { min: number; max: number };
  torch?: boolean;
}

export function BarcodeScanner({ onDetect, active }: BarcodeScannerProps) {
  const [lastCode, setLastCode] = useState("");
  const [mode, setMode] = useState<"video" | "photo">("video");
  const [photoStatus, setPhotoStatus] = useState<"idle" | "processing" | "ai_processing" | "ok" | "fail">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del stream de cámara personalizada
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capabilities, setCapabilities] = useState<ExtendedTrackCapabilities | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [torch, setTorch] = useState<boolean>(false);
  
  const [nativeSupported, setNativeSupported] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<"auto" | "mlkit" | "zxing">("auto");
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Inicializar lector ZXing reutilizable
  useEffect(() => {
    const isSupported = typeof window !== "undefined" && "BarcodeDetector" in window;
    setTimeout(() => {
      setNativeSupported(isSupported);
    }, 0);
    readerRef.current = new BrowserMultiFormatReader();
    return () => {
      readerRef.current = null;
    };
  }, []);

  // Función de diagnóstico real (Benchmark)
  const runDiagnosticTest = async () => {
    setDiagnosticLoading(true);
    setDiagnosticResult(null);
    try {
      const reports: string[] = [];

      // Test Google ML Kit
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const t0 = performance.now();
          // @ts-expect-error - BarcodeDetector no está tipado en TS estándar
          const detector = new BarcodeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code", "code_39"],
          });
          const testCanvas = document.createElement("canvas");
          testCanvas.width = 100;
          testCanvas.height = 100;
          await detector.detect(testCanvas);
          const t1 = performance.now();
          reports.push(`✅ Google ML Kit: Inicializado correctamente. Latencia de API: ${(t1 - t0).toFixed(2)} ms.`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          reports.push(`❌ Google ML Kit: Error al inicializar detector: ${errMsg}`);
        }
      } else {
        reports.push("ℹ️ Google ML Kit: No disponible en este navegador/dispositivo.");
      }

      // Test ZXing
      if (readerRef.current) {
        try {
          const t0 = performance.now();
          const testCanvas = document.createElement("canvas");
          testCanvas.width = 100;
          testCanvas.height = 100;
          try {
            readerRef.current.decode(testCanvas as unknown as HTMLVideoElement);
          } catch {
            // Se espera que falle al no haber código, medimos latencia del ciclo de fallo
          }
          const t1 = performance.now();
          reports.push(`✅ ZXing Library: Lista y cargada. Tiempo de ciclo de análisis: ${(t1 - t0).toFixed(2)} ms.`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          reports.push(`❌ ZXing Library: Error en ciclo: ${errMsg}`);
        }
      } else {
        reports.push("❌ ZXing Library: Lector no cargado.");
      }

      // Test Red/Servicio de IA
      try {
        const t0 = performance.now();
        const res = await fetch("/api/health");
        const t1 = performance.now();
        if (res.ok) {
          reports.push(`✅ Servicio de IA / API Health: En línea. Latencia de red: ${(t1 - t0).toFixed(0)} ms.`);
        } else {
          reports.push(`⚠️ Servicio de IA / API Health: Respondió con estado ${res.status}.`);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        reports.push(`❌ Servicio de IA / API Health: Sin conexión (${errMsg}).`);
      }

      setDiagnosticResult(reports.join("\n"));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setDiagnosticResult(`Error general ejecutando diagnóstico: ${errMsg}`);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  // ─── Gestión del Ciclo de Vida del Stream de Cámara ────────────────────────
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      if (!active || mode !== "video") return;

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Iniciar reproducción
          videoRef.current.play().catch((err) => console.error("Error playing video:", err));
        }
      } catch (err) {
        console.error("Error starting camera:", err);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
      setCapabilities(null);
      setTorch(false);
      setZoom(1);
    };
  }, [active, mode]);

  // ─── Aplicación de Restricciones Avanzadas (Focus, Zoom, Torch) ─────────────
  useEffect(() => {
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const timer = setTimeout(() => {
      try {
        if (typeof track.getCapabilities === "function") {
          const caps = track.getCapabilities() as unknown as ExtendedTrackCapabilities;
          setCapabilities(caps);

          const advancedConstraints: Record<string, unknown> = {};

          // Enfoque continuo siempre encendido si se soporta
          if (caps.focusMode?.includes("continuous")) {
            advancedConstraints.focusMode = "continuous";
          }

          // Ajustar Zoom
          if (caps.zoom) {
            const targetZoom = Math.max(caps.zoom.min, Math.min(zoom, caps.zoom.max));
            advancedConstraints.zoom = targetZoom;
          }

          // Ajustar Torch (Linterna)
          if (caps.torch) {
            advancedConstraints.torch = torch;
          }

          if (Object.keys(advancedConstraints).length > 0) {
            track.applyConstraints({ advanced: [advancedConstraints] as unknown as MediaTrackConstraints[] }).catch((err) => {
              console.warn("Could not apply constraints:", err);
            });
          }
        } else {
          // Fallback mínimo sin capabilities
          track.applyConstraints({
            // @ts-expect-error - focusMode no está tipado en TS estándar
            advanced: [{ focusMode: "continuous" }]
          }).catch(() => {});
        }
      } catch (e) {
        console.warn("Failed to configure track settings:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [stream, zoom, torch]);

  // ─── Bucle de Escaneo con Recorte del Área Activa (Evita Texto Alrededor) ────
  useEffect(() => {
    if (!stream || mode !== "video" || !active) return;

    const video = videoRef.current;
    if (!video) return;

    let isScanning = false;

    const intervalId = setInterval(async () => {
      if (isScanning) return;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      isScanning = true;

      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          isScanning = false;
          return;
        }

        const vW = video.videoWidth;
        const vH = video.videoHeight;

        // Recortar la parte central para enfocarse únicamente en el recuadro del escáner
        // Esto elimina el ruido del texto circundante y agiliza la lectura
        const cropW = Math.floor(vW * 0.70);
        const cropH = Math.floor(vH * 0.35);
        const cropX = Math.floor((vW - cropW) / 2);
        const cropY = Math.floor((vH - cropH) / 2);

        canvas.width = cropW;
        canvas.height = cropH;

        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        let code: string | null = null;

        // 1. Intentar con BarcodeDetector nativo (Ultra rápido y eficaz)
        const canUseNative = typeof window !== "undefined" && "BarcodeDetector" in window;
        const useNative = selectedEngine === "mlkit" || (selectedEngine === "auto" && canUseNative);

        if (useNative && canUseNative) {
          try {
            // @ts-expect-error - BarcodeDetector no está tipado en TS estándar
            const detector = new BarcodeDetector({
              formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code", "code_39"],
            });
            const codes = await detector.detect(canvas);
            if (codes && codes.length > 0) {
              code = codes[0].rawValue;
            }
          } catch {
            // Fallback silencioso
          }
        }

        // 2. Intentar con ZXing (Lector universal)
        const useZxing = selectedEngine === "zxing" || (selectedEngine === "auto" && !code);
        if (!code && useZxing && readerRef.current) {
          try {
            const result = readerRef.current.decode(canvas as unknown as HTMLVideoElement);
            code = result.getText();
          } catch {
            // Sin código encontrado en este cuadro
          }
        }

        if (code && code !== lastCode) {
          setLastCode(code);
          onDetect(code);
          setTimeout(() => setLastCode(""), 3000);
        }
      } catch (err) {
        console.error("Error during scan frame processing:", err);
      } finally {
        isScanning = false;
      }
    }, 200);

    return () => {
      clearInterval(intervalId);
    };
  }, [stream, mode, active, lastCode, onDetect, selectedEngine]);

  // ─── Modo foto: captura imagen → decode estático ──────────────────────────
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoStatus("processing");
    const objectUrl = URL.createObjectURL(file);

    try {
      let code: string | null = null;
      const canUseNative = typeof window !== "undefined" && "BarcodeDetector" in window;
      const useNative = selectedEngine === "mlkit" || (selectedEngine === "auto" && canUseNative);

      // Estrategia 1: API nativa del browser (más rápida y precisa)
      if (useNative) {
        code = await tryNativeDetector(file);
      }

      // Estrategia 2: ZXing desde imagen (fallback universal)
      const useZxing = selectedEngine === "zxing" || (selectedEngine === "auto" && !code);
      if (!code && useZxing) {
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getDynamicBadgeText = () => {
    if (selectedEngine === "auto") {
      return nativeSupported ? "🤖 Auto: ML Kit (Nativo)" : "🤖 Auto: ZXing (Web)";
    }
    return selectedEngine === "mlkit" ? "⚡ Google ML Kit (Nativo)" : "⚙️ Motor ZXing (Web)";
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
      {/* Selector de Modo */}
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

      {/* Selector de Motor de Escaneo */}
      <div className="engine-selector-container">
        <span className="engine-selector-label">Motor:</span>
        <div className="engine-selector-buttons">
          <button
            type="button"
            className={`engine-btn ${selectedEngine === "auto" ? "active" : ""}`}
            onClick={() => setSelectedEngine("auto")}
          >
            🤖 Auto
          </button>
          <button
            type="button"
            className={`engine-btn ${selectedEngine === "mlkit" ? "active" : ""} ${!nativeSupported ? "unsupported-hint" : ""}`}
            onClick={() => setSelectedEngine("mlkit")}
          >
            ⚡ ML Kit {!nativeSupported && "⚠️"}
          </button>
          <button
            type="button"
            className={`engine-btn ${selectedEngine === "zxing" ? "active" : ""}`}
            onClick={() => setSelectedEngine("zxing")}
          >
            ⚙️ ZXing (Web)
          </button>
        </div>
      </div>

      {/* Banner de Advertencia si el motor seleccionado es nativo pero no está soportado */}
      {selectedEngine === "mlkit" && !nativeSupported && (
        <div className="engine-warning-banner">
          <strong>⚠️ Google ML Kit no soportado</strong>
          <p>Este navegador no posee la API nativa de escaneo. El flujo usará un fallback inactivo. Consulta la sección de diagnósticos abajo para activarlo.</p>
        </div>
      )}

      {/* Modo VIDEO */}
      {mode === "video" && (
        <div className="scanner-wrapper">
          <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
          <div className="scanner-overlay">
            <div className="scanner-frame">
              <div className="scanner-frame-tr" />
              <div className="scanner-frame-bl" />
              <div className="scanner-line" />
            </div>
          </div>

          <div className="scanner-engine-badge">
            {getDynamicBadgeText()}
          </div>

          {/* Controles de cámara flotantes (Zoom y Linterna) */}
          {(capabilities?.zoom || capabilities?.torch) && (
            <div className="scanner-controls">
              {capabilities?.torch && (
                <button
                  type="button"
                  className={`scanner-control-btn ${torch ? "active" : ""}`}
                  onClick={() => setTorch(!torch)}
                  aria-label="Encender linterna"
                >
                  {torch ? "🔦" : "💡"}
                </button>
              )}
              {capabilities?.zoom && (
                <button
                  type="button"
                  className="scanner-control-btn zoom-btn"
                  onClick={() => {
                    if (!capabilities?.zoom) return;
                    const maxZ = capabilities.zoom.max || 3;
                    const minZ = capabilities.zoom.min || 1;
                    if (zoom === 1) {
                      setZoom(Math.min(1.5, maxZ));
                    } else if (zoom === 1.5) {
                      setZoom(Math.min(2, maxZ));
                    } else {
                      setZoom(minZ);
                    }
                  }}
                  aria-label="Ajustar zoom"
                >
                  <span style={{ fontSize: "0.72rem", fontWeight: "bold" }}>{zoom}x</span>
                </button>
              )}
            </div>
          )}

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
        <div className="scanner-wrapper photo-mode" onClick={() => photoStatus === "idle" && fileInputRef.current?.click()}>
          <div className="scanner-idle">
            {photoStatus === "idle" && (
              <>
                <div className="scanner-idle-icon">📸</div>
                <p>Toma una foto del código de barras o QR</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                  Presiona aquí para capturar o subir imagen
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
          style={{ marginTop: 12, marginBottom: 20 }}
          onClick={() => fileInputRef.current?.click()}
          id="btn-take-photo"
        >
          📷 Tomar foto
        </button>
      )}

      {/* Sección de Compatibilidad y Diagnósticos de ML Kit */}
      <div className="diagnostics-card">
        <details className="diagnostics-details">
          <summary className="diagnostics-summary">
            <span>⚡ Diagnóstico y Estado de Motores</span>
            <span className="details-arrow">▼</span>
          </summary>
          <div className="diagnostics-content">
            <div className="diagnostic-row">
              <span className="diagnostic-name">Google ML Kit (Nativo):</span>
              <span className={`diagnostic-status ${nativeSupported ? "status-ok" : "status-error"}`}>
                {nativeSupported ? "🟢 Disponible" : "🔴 No soportado"}
              </span>
            </div>
            <div className="diagnostic-row">
              <span className="diagnostic-name">ZXing Library (JS/Web):</span>
              <span className="diagnostic-status status-ok">🟢 Disponible</span>
            </div>
            <div className="diagnostic-row">
              <span className="diagnostic-name">Agente de IA (API):</span>
              <span className="diagnostic-status status-ok">🟢 Disponible</span>
            </div>

            <div className="diagnostic-info">
              <p><strong>¿Qué es Google ML Kit (BarcodeDetector)?</strong></p>
              <p>Es un motor de alto rendimiento que realiza procesamiento de imágenes en hardware nativo. Ofrece lecturas inmediatas y consume menos batería.</p>
              
              {!nativeSupported && (
                <div className="setup-instructions">
                  <p><strong>Cómo activar en Google Chrome de escritorio:</strong></p>
                    <ol>
                      <li>Navega a <code>chrome://flags</code> en una pestaña nueva.</li>
                      <li>Busca la bandera <strong>&quot;Experimental Web Platform features&quot;</strong>.</li>
                      <li>Cámbiala a <strong>&quot;Enabled&quot;</strong> y reinicia tu navegador.</li>
                    </ol>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={runDiagnosticTest}
              disabled={diagnosticLoading}
              style={{ marginTop: 12, width: "100%" }}
            >
              {diagnosticLoading ? "Analizando latencias de motores..." : "🧪 Ejecutar Benchmark de Rendimiento"}
            </button>

            {diagnosticResult && (
              <pre className="diagnostic-result-box">
                {diagnosticResult}
              </pre>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
