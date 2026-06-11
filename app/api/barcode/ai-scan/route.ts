import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: "Imagen requerida" },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "El servicio de IA no está configurado (falta la clave de API)" },
        { status: 501 }
      );
    }

    // Limpiar el prefijo data:image/xxx;base64, si existe
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Usar la API del servicio de inteligencia artificial para lectura visual
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Analyze this image and find any barcode (such as EAN-13, EAN-8, UPC-A, UPC-E, Code 128) or QR code. Extract only the raw number or text of the code. Do not include any explanations, words, labels, or formatting. If you cannot find any barcode or QR code, respond with exactly 'NOT_FOUND'.",
              },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 20,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI-SCAN ERROR]", errorText);
      return NextResponse.json(
        { success: false, message: "Error al comunicarse con el servicio de IA" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "NOT_FOUND";

    if (textResult === "NOT_FOUND" || textResult.includes("NOT_FOUND")) {
      return NextResponse.json({
        success: false,
        message: "El agente de IA no pudo identificar ningún código de barras en la imagen.",
      });
    }

    // Devolver el código limpio de cualquier espacio o salto de línea adicional
    const cleanCode = textResult.replace(/\s+/g, "");

    return NextResponse.json({
      success: true,
      code: cleanCode,
    });
  } catch (error) {
    console.error("[POST /api/barcode/ai-scan]", error);
    return NextResponse.json(
      { success: false, message: "Error interno al procesar el escaneo con IA" },
      { status: 500 }
    );
  }
}
