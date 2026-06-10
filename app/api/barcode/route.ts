import { NextRequest, NextResponse } from "next/server";
import { createProduct } from "@/lib/services/barcodeService";
import { z } from "zod";

const createProductSchema = z.object({
  barcode: z.string().min(8).max(50).regex(/^[0-9A-Za-z\-]+$/),
  name: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  priceMx: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const product = await createProduct(validation.data);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/barcode]", error);
    return NextResponse.json(
      { success: false, message: "Error al guardar el producto" },
      { status: 500 }
    );
  }
}
