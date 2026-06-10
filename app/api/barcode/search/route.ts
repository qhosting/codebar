import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/services/barcodeService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json(
      { success: false, message: "El parámetro 'q' debe tener al menos 2 caracteres" },
      { status: 400 }
    );
  }

  try {
    const result = await searchProducts(q);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/barcode/search]", error);
    return NextResponse.json(
      { success: false, message: "Error en la búsqueda" },
      { status: 500 }
    );
  }
}
