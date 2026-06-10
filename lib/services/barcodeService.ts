import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { queryOpenFoodFacts } from "./openFoodFacts";
import { queryUpcItemDb } from "./upcItemDb";
import type { BarcodeQueryResult, CreateProductInput, SearchResult, Product } from "@/lib/types/product";

function mapRecord(r: typeof products.$inferSelect): Product {
  return {
    id: r.id,
    barcode: r.barcode,
    name: r.name,
    brand: r.brand,
    category: r.category,
    description: r.description,
    imageUrl: r.imageUrl,
    priceMx: r.priceMx ? parseFloat(r.priceMx) : null,
    unit: r.unit,
    country: r.country ?? "MX",
    source: (r.source as Product["source"]) ?? "manual",
    createdAt: r.createdAt ?? undefined,
    updatedAt: r.updatedAt ?? undefined,
  };
}

// ─── Main lookup strategy: Local DB → Open Food Facts → UPC Item DB ──────────
export async function lookupBarcode(barcode: string): Promise<BarcodeQueryResult> {
  // 1. Check local database first
  const local = await db
    .select()
    .from(products)
    .where(eq(products.barcode, barcode))
    .limit(1);

  if (local.length > 0) {
    return { success: true, source: "local", product: mapRecord(local[0]) };
  }

  // 2. Try Open Food Facts (free, no limit)
  const offProduct = await queryOpenFoodFacts(barcode);
  if (offProduct) {
    const saved = await saveProduct({ ...offProduct, barcode });
    return { success: true, source: "open_food_facts", product: saved };
  }

  // 3. Fallback: UPC Item DB (100 req/day free)
  const upcProduct = await queryUpcItemDb(barcode);
  if (upcProduct) {
    const saved = await saveProduct({ ...upcProduct, barcode });
    return { success: true, source: "upcdb", product: saved };
  }

  // 4. Not found
  return { success: false, message: "Producto no encontrado", barcode };
}

// ─── Save product to local DB (upsert on conflict) ────────────────────────────
export async function saveProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  const [saved] = await db
    .insert(products)
    .values({
      barcode: input.barcode,
      name: input.name,
      brand: input.brand ?? null,
      category: input.category ?? null,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      priceMx: input.priceMx?.toString() ?? null,
      unit: input.unit ?? null,
      country: input.country ?? "MX",
      source: input.source ?? "manual",
    })
    .onConflictDoUpdate({
      target: products.barcode,
      set: {
        name: input.name,
        brand: input.brand ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return mapRecord(saved);
}

// ─── Create product manually ──────────────────────────────────────────────────
export async function createProduct(input: CreateProductInput): Promise<Product> {
  return saveProduct({ ...input, source: "manual" });
}

// ─── Search products by name or brand ────────────────────────────────────────
export async function searchProducts(query: string): Promise<SearchResult> {
  const results = await db
    .select()
    .from(products)
    .where(
      or(
        ilike(products.name, `%${query}%`),
        ilike(products.brand, `%${query}%`),
        ilike(products.barcode, `%${query}%`)
      )
    )
    .limit(20);

  return {
    success: true,
    products: results.map(mapRecord),
    total: results.length,
    query,
  };
}

// ─── List all products ────────────────────────────────────────────────────────
export async function listProducts(limit = 50, offset = 0): Promise<Product[]> {
  const results = await db.select().from(products).limit(limit).offset(offset);
  return results.map(mapRecord);
}
