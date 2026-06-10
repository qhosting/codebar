import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeBar API — Consulta de Productos por Código de Barras",
  description:
    "API y app de demostración para consultar productos mexicanos por código de barras. Escanea con tu cámara o ingresa el código manualmente.",
  keywords: ["código de barras", "productos México", "EAN", "UPC", "barcode API"],
  authors: [{ name: "AurumBot" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
