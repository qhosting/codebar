"use client";

import { useState, useCallback, useEffect } from "react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProductCard } from "@/components/ProductCard";
import { ManualInput } from "@/components/ManualInput";
import { SearchHistory, type HistoryEntry } from "@/components/SearchHistory";
import type { BarcodeQueryResult } from "@/lib/types/product";

type Mode = "camera" | "manual";
type QueryState = "idle" | "loading" | "found" | "not_found" | "error";

const MAX_HISTORY = 10;
const HISTORY_KEY = "codebar_history";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("manual");
  const [cameraActive, setCameraActive] = useState(false);
  const [queryState, setQueryState] = useState<QueryState>("idle");
  const [result, setResult] = useState<BarcodeQueryResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const saveHistory = (entries: HistoryEntry[]) => {
    setHistory(entries);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const lookup = useCallback(async (barcode: string) => {
    const clean = barcode.trim();
    if (!clean || clean.length < 8) {
      showToast("Código de barras inválido (mínimo 8 dígitos)", "error");
      return;
    }

    setQueryState("loading");
    setResult(null);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(clean)}`);
      const data: BarcodeQueryResult = await res.json();

      setResult(data);

      if (data.success && data.product) {
        setQueryState("found");
        showToast(`✅ Producto encontrado (${data.source})`, "success");

        // Save to history
        const entry: HistoryEntry = {
          barcode: clean,
          name: data.product.name,
          timestamp: Date.now(),
        };
        const updated = [entry, ...history.filter((h) => h.barcode !== clean)].slice(0, MAX_HISTORY);
        saveHistory(updated);
      } else if (res.status === 404) {
        setQueryState("not_found");
      } else {
        setQueryState("error");
      }
    } catch {
      setQueryState("error");
      setResult({ success: false, message: "Error de conexión. Verifica que el servidor esté activo." });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === "camera") {
      setCameraActive(true);
    } else {
      setCameraActive(false);
    }
    setQueryState("idle");
    setResult(null);
  };

  const handleDetect = useCallback(
    (code: string) => {
      setCameraActive(false);
      lookup(code);
    },
    [lookup]
  );

  const clearHistory = () => {
    saveHistory([]);
    showToast("Historial eliminado", "success");
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="logo-icon">▦</div>
        </div>
        <h1 className="app-title">CodeBar API</h1>
        <p className="app-subtitle">
          Consulta productos mexicanos por código de barras · EAN-13 · UPC · Code128 · QR
        </p>
      </header>

      {/* Mode Tabs */}
      <div className="mode-tabs" role="tablist" aria-label="Modo de búsqueda">
        <button
          id="tab-camera"
          role="tab"
          aria-selected={mode === "camera"}
          className={`mode-tab ${mode === "camera" ? "active" : ""}`}
          onClick={() => handleModeSwitch("camera")}
        >
          📷 Cámara
        </button>
        <button
          id="tab-manual"
          role="tab"
          aria-selected={mode === "manual"}
          className={`mode-tab ${mode === "manual" ? "active" : ""}`}
          onClick={() => handleModeSwitch("manual")}
        >
          ⌨️ Manual
        </button>
      </div>

      {/* Camera Mode */}
      {mode === "camera" && (
        <>
          <BarcodeScanner onDetect={handleDetect} active={cameraActive} />
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button
              id="btn-activate-camera"
              className={`btn btn-full ${cameraActive ? "btn-danger" : "btn-primary"}`}
              onClick={() => setCameraActive((v) => !v)}
            >
              {cameraActive ? "⏹ Detener Cámara" : "▶ Activar Cámara"}
            </button>
          </div>
        </>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <ManualInput onSearch={lookup} loading={queryState === "loading"} />
      )}

      <div className="divider">resultado</div>

      {/* States */}
      {queryState === "idle" && (
        <div className="state-card">
          <div className="state-icon">▦</div>
          <p className="state-title">Listo para escanear</p>
          <p className="state-desc">
            {mode === "camera"
              ? "Activa la cámara y apunta al código de barras del producto"
              : "Ingresa el código de barras del producto (EAN-13, UPC-A, etc.)"}
          </p>
        </div>
      )}

      {queryState === "loading" && (
        <div className="state-card state-loading">
          <div className="state-icon">🔍</div>
          <p className="state-title">Consultando...</p>
          <p className="state-desc">Buscando en base de datos local y fuentes externas</p>
        </div>
      )}

      {queryState === "found" && result?.product && (
        <ProductCard product={result.product} source={result.source} />
      )}

      {queryState === "not_found" && (
        <div className="state-card state-not-found">
          <div className="state-icon">🤷</div>
          <p className="state-title">Producto no encontrado</p>
          <p className="state-desc">
            El código <strong style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>
              {result?.barcode}
            </strong> no existe en nuestra base de datos ni en las fuentes externas.
          </p>
        </div>
      )}

      {queryState === "error" && (
        <div className="state-card state-error">
          <div className="state-icon">⚠️</div>
          <p className="state-title">Error de consulta</p>
          <p className="state-desc">{result?.message ?? "Ocurrió un error inesperado"}</p>
        </div>
      )}

      {/* Try again button */}
      {(queryState === "found" || queryState === "not_found" || queryState === "error") && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <button
            id="btn-scan-again"
            className="btn btn-secondary"
            onClick={() => {
              setQueryState("idle");
              setResult(null);
              if (mode === "camera") setCameraActive(true);
            }}
          >
            {mode === "camera" ? "📷 Escanear otro" : "🔄 Buscar otro"}
          </button>
        </div>
      )}

      {/* History */}
      <SearchHistory
        entries={history}
        onSelect={(barcode) => {
          setMode("manual");
          lookup(barcode);
        }}
        onClear={clearHistory}
      />

      {/* API Info Footer */}
      <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid var(--border-subtle)" }}>
        <p className="section-title" style={{ marginBottom: 12 }}>🔌 Endpoints de la API</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { method: "GET", path: "/api/barcode/{codigo}", desc: "Consultar producto" },
            { method: "POST", path: "/api/barcode", desc: "Registrar producto" },
            { method: "GET", path: "/api/barcode/search?q={texto}", desc: "Buscar por nombre" },
            { method: "GET", path: "/api/health", desc: "Estado del servicio" },
          ].map((ep) => (
            <div
              key={ep.path}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "10px 14px",
                background: "var(--bg-glass)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: ep.method === "GET" ? "var(--accent-success)" : "var(--accent-warning)",
                minWidth: 36,
              }}>
                {ep.method}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-primary)", flex: 1 }}>
                {ep.path}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: 32,
        paddingTop: 16,
        borderTop: "1px solid var(--border-subtle)",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.75rem",
      }}>
        © 2026 <strong style={{ color: "var(--text-secondary)" }}>AurumCapitalHolding</strong>
      </footer>
    </div>
  );
}
