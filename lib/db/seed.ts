import { db } from "./index";
import { products } from "./schema";

const SEED_PRODUCTS = [
  // ── Bebidas ──────────────────────────────────────────────────────────
  { barcode: "7501055300595", name: "Coca-Cola 600ml", brand: "Coca-Cola FEMSA", category: "Bebidas", unit: "600ml", imageUrl: "https://images.openfoodfacts.org/images/products/750/105/530/0595/front_es.3.400.jpg" },
  { barcode: "7501055326748", name: "Pepsi 600ml", brand: "PepsiCo México", category: "Bebidas", unit: "600ml" },
  { barcode: "7501055300625", name: "Sprite 600ml", brand: "Coca-Cola FEMSA", category: "Bebidas", unit: "600ml" },
  { barcode: "7501055300700", name: "Fanta Naranja 600ml", brand: "Coca-Cola FEMSA", category: "Bebidas", unit: "600ml" },
  { barcode: "7500435119078", name: "Agua Ciel 600ml", brand: "Coca-Cola FEMSA", category: "Agua", unit: "600ml" },
  { barcode: "7500265000029", name: "Agua Bonafont 1L", brand: "Danone", category: "Agua", unit: "1L" },
  { barcode: "7503003057701", name: "Leche Lala Entera 1L", brand: "Grupo Lala", category: "Lácteos", unit: "1L" },
  { barcode: "7501555900043", name: "Leche Alpura Entera 1L", brand: "Alpura", category: "Lácteos", unit: "1L" },
  { barcode: "7501067053403", name: "Modelo Especial 355ml", brand: "Grupo Modelo", category: "Cervezas", unit: "355ml" },
  { barcode: "7501019007022", name: "Corona Extra 355ml", brand: "Grupo Modelo", category: "Cervezas", unit: "355ml" },
  { barcode: "7501067006403", name: "Pacífico Clara 355ml", brand: "Grupo Modelo", category: "Cervezas", unit: "355ml" },
  { barcode: "7501030483951", name: "Jumex Naranja 335ml", brand: "Grupo Jumex", category: "Jugos", unit: "335ml" },
  { barcode: "7501003143029", name: "Del Valle Mango 500ml", brand: "Coca-Cola FEMSA", category: "Jugos", unit: "500ml" },
  { barcode: "7500854820015", name: "Lipton Té Limón 500ml", brand: "PepsiCo/Lipton", category: "Bebidas", unit: "500ml" },
  // ── Panadería y Cereales ──────────────────────────────────────────────
  { barcode: "7502210900068", name: "Pan Blanco Bimbo 680g", brand: "Grupo Bimbo", category: "Panadería", unit: "680g" },
  { barcode: "7501031311324", name: "Galletas Marías Gamesa 200g", brand: "Gamesa", category: "Galletas", unit: "200g" },
  { barcode: "7501030481155", name: "Sabritas Clásicas 45g", brand: "PepsiCo", category: "Botanas", unit: "45g" },
  { barcode: "7501030455100", name: "Ruffles Queso 45g", brand: "PepsiCo", category: "Botanas", unit: "45g" },
  { barcode: "7501030456510", name: "Cheetos Flamin Hot 55g", brand: "PepsiCo", category: "Botanas", unit: "55g" },
  { barcode: "7500435041003", name: "Barcel Takis Fuego 62g", brand: "Barcel", category: "Botanas", unit: "62g" },
  { barcode: "7500435041027", name: "Barcel Chips Chile 45g", brand: "Barcel", category: "Botanas", unit: "45g" },
  { barcode: "7501031344261", name: "Obleas con Cajeta Coronado", brand: "Coronado", category: "Dulces", unit: "28g" },
  { barcode: "7501016314086", name: "Kellogg's Zucaritas 370g", brand: "Kellogg's", category: "Cereales", unit: "370g" },
  { barcode: "7501003115361", name: "Kellogg's Corn Flakes 500g", brand: "Kellogg's", category: "Cereales", unit: "500g" },
  // ── Lácteos y Derivados ───────────────────────────────────────────────
  { barcode: "7501555900159", name: "Yogurt Alpura Natural 1kg", brand: "Alpura", category: "Lácteos", unit: "1kg" },
  { barcode: "7503003057503", name: "Crema Lala Ácida 900ml", brand: "Grupo Lala", category: "Lácteos", unit: "900ml" },
  { barcode: "7501555900074", name: "Queso Oaxaca Alpura 400g", brand: "Alpura", category: "Lácteos", unit: "400g" },
  { barcode: "7500627017096", name: "Mantequilla San Marcos 90g", brand: "San Marcos", category: "Lácteos", unit: "90g" },
  // ── Limpieza y Cuidado Personal ───────────────────────────────────────
  { barcode: "7501080170034", name: "Detergente Ariel 1kg", brand: "Procter & Gamble", category: "Limpieza", unit: "1kg" },
  { barcode: "7501080181177", name: "Suavitel Primavera 800ml", brand: "Colgate-Palmolive", category: "Limpieza", unit: "800ml" },
  { barcode: "7501006551002", name: "Pinol Multiusos 500ml", brand: "SC Johnson", category: "Limpieza", unit: "500ml" },
  { barcode: "7501006550005", name: "Fabuloso Lavanda 1L", brand: "Colgate-Palmolive", category: "Limpieza", unit: "1L" },
  { barcode: "7501080103636", name: "Jabón Dove Blanco 90g", brand: "Unilever", category: "Higiene", unit: "90g" },
  { barcode: "7501032900031", name: "Shampoo Pantene 400ml", brand: "Procter & Gamble", category: "Higiene", unit: "400ml" },
  { barcode: "7501007431046", name: "Pasta Colgate Triple Acción 100ml", brand: "Colgate", category: "Higiene", unit: "100ml" },
  // ── Alimentos ─────────────────────────────────────────────────────────
  { barcode: "7501025600025", name: "Arroz SOS 900g", brand: "SOS", category: "Abarrotes", unit: "900g" },
  { barcode: "7503016045087", name: "Frijoles La Sierra Negros 560g", brand: "La Sierra", category: "Abarrotes", unit: "560g" },
  { barcode: "7501032905142", name: "Atún Dolores en Agua 140g", brand: "Dolores", category: "Abarrotes", unit: "140g" },
  { barcode: "7501025442162", name: "Aceite Nutrioli 946ml", brand: "Nutrioli", category: "Abarrotes", unit: "946ml" },
  { barcode: "7500435120074", name: "Sal La Fina 1kg", brand: "La Fina", category: "Abarrotes", unit: "1kg" },
  { barcode: "7500615000185", name: "Azúcar Estándar ZUCARMEX 1kg", brand: "ZUCARMEX", category: "Abarrotes", unit: "1kg" },
  { barcode: "7501058600015", name: "Sopa Maruchan Pollo 64g", brand: "Maruchan", category: "Sopas", unit: "64g" },
  { barcode: "7500040400040", name: "Sopa La Moderna Letras 200g", brand: "La Moderna", category: "Sopas", unit: "200g" },
  { barcode: "7500428000121", name: "Chile Chipotles La Costeña 215g", brand: "La Costeña", category: "Enlatados", unit: "215g" },
  { barcode: "7500428000077", name: "Jalapeños La Costeña 215g", brand: "La Costeña", category: "Enlatados", unit: "215g" },
  { barcode: "7501055357031", name: "Chocolate Carlos V 18g", brand: "Nestlé", category: "Dulces", unit: "18g" },
  { barcode: "7613034246899", name: "KitKat 4 Fingers 45g", brand: "Nestlé", category: "Chocolates", unit: "45g" },
  { barcode: "7501000140043", name: "Chicles Canel's Canela", brand: "Canel's", category: "Dulces", unit: "15g" },
  { barcode: "7501034803117", name: "Paletas Payaso Ricolino", brand: "Ricolino", category: "Dulces", unit: "30g" },
  // ── Farmacia básica ───────────────────────────────────────────────────
  { barcode: "7501009140056", name: "Aspirina 500mg 20 tabs", brand: "Bayer México", category: "Farmacia", unit: "20 tabletas" },
  { barcode: "7501165811118", name: "Sal de Uvas Picot Limón 12g", brand: "Picot", category: "Farmacia", unit: "12g" },
];

export async function seed() {
  console.log("🌱 Seeding products database...");

  let inserted = 0;
  let skipped = 0;

  for (const product of SEED_PRODUCTS) {
    try {
      await db
        .insert(products)
        .values({
          barcode: product.barcode,
          name: product.name,
          brand: product.brand ?? null,
          category: product.category ?? null,
          imageUrl: product.imageUrl ?? null,
          unit: product.unit ?? null,
          country: "MX",
          source: "manual",
        })
        .onConflictDoNothing();
      inserted++;
    } catch {
      skipped++;
    }
  }

  console.log(`✅ Seed complete: ${inserted} inserted, ${skipped} skipped`);
}
