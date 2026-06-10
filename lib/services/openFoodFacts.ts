import axios from "axios";
import type { Product } from "@/lib/types/product";

interface OFFProduct {
  product?: {
    product_name?: string;
    brands?: string;
    categories_tags?: string[];
    image_url?: string;
    quantity?: string;
    generic_name?: string;
  };
  status: number;
}

export async function queryOpenFoodFacts(barcode: string): Promise<Product | null> {
  try {
    const { data } = await axios.get<OFFProduct>(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { timeout: 5000, headers: { "User-Agent": "CodebarAPI/1.0 - Mexico" } }
    );

    if (data.status !== 1 || !data.product?.product_name) return null;

    const p = data.product;
    const category = p.categories_tags?.[0]
      ?.replace("en:", "")
      ?.replace("es:", "")
      ?.split(",")[0] ?? null;

    return {
      barcode,
      name: p.product_name || "Producto sin nombre",
      brand: p.brands?.split(",")[0]?.trim() || null,
      category: category || null,
      description: p.generic_name || null,
      imageUrl: p.image_url || null,
      unit: p.quantity || null,
      country: "MX",
      source: "off",
    };
  } catch {
    return null;
  }
}
