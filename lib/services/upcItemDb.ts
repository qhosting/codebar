import axios from "axios";
import type { Product } from "@/lib/types/product";

interface UPCItem {
  items?: Array<{
    title?: string;
    brand?: string;
    category?: string;
    description?: string;
    images?: string[];
  }>;
  code?: string;
}

export async function queryUpcItemDb(barcode: string): Promise<Product | null> {
  try {
    const { data } = await axios.get<UPCItem>(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      { timeout: 5000, headers: { "User-Agent": "CodebarAPI/1.0" } }
    );

    if (!data.items?.length) return null;

    const item = data.items[0];
    if (!item.title) return null;

    return {
      barcode,
      name: item.title,
      brand: item.brand || null,
      category: item.category || null,
      description: item.description || null,
      imageUrl: item.images?.[0] || null,
      unit: null,
      country: "MX",
      source: "upcdb",
    };
  } catch {
    return null;
  }
}
