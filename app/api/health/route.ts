import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(products);
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      products_count: Number(result[0].count),
    });
  } catch {
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString(), database: "disconnected" },
      { status: 503 }
    );
  }
}
