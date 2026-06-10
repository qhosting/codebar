export interface Product {
  id?: number;
  barcode: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  priceMx?: number | null;
  unit?: string | null;
  country?: string;
  source?: "manual" | "off" | "upcdb";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BarcodeQueryResult {
  success: boolean;
  source?: "local" | "open_food_facts" | "upcdb";
  product?: Product;
  message?: string;
  barcode?: string;
}

export interface SearchResult {
  success: boolean;
  products: Product[];
  total: number;
  query: string;
}

export interface CreateProductInput {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  priceMx?: number;
  unit?: string;
}
