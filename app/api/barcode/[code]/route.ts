import { NextRequest, NextResponse } from "next/server";
import { lookupBarcode } from "@/lib/services/barcodeService";
import { z } from "zod";

const barcodeSchema = z
  .string()
  .min(8, "El código de barras debe tener al menos 8 dígitos")
  .max(50, "Código de barras demasiado largo")
  .regex(/^[0-9A-Za-z\-]+$/, "Código de barras inválido");

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;

  const validation = barcodeSchema.safeParse(code);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const result = await lookupBarcode(validation.data);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    });
  } catch (error) {
    console.error("[GET /api/barcode/:code]", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
