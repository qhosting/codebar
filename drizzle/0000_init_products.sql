CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"barcode" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"category" text,
	"description" text,
	"image_url" text,
	"price_mx" numeric(10, 2),
	"unit" varchar(50),
	"country" varchar(10) DEFAULT 'MX',
	"source" varchar(20) DEFAULT 'manual',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode")
);
