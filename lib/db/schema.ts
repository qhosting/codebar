import { pgTable, serial, varchar, text, decimal, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  barcode: varchar("barcode", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category"),
  description: text("description"),
  imageUrl: text("image_url"),
  priceMx: decimal("price_mx", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  country: varchar("country", { length: 10 }).default("MX"),
  source: varchar("source", { length: 20 }).default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type ProductRecord = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
