import type { Product } from "@/lib/types/product";

const SOURCE_LABELS: Record<string, { label: string; cls: string; icon: string }> = {
  local:           { label: "BD Local",         cls: "badge-local",  icon: "🗄️" },
  open_food_facts: { label: "Open Food Facts",  cls: "badge-off",    icon: "🌍" },
  upcdb:           { label: "UPC Item DB",       cls: "badge-upcdb",  icon: "🔍" },
  manual:          { label: "Manual",            cls: "badge-manual", icon: "✏️" },
};

const CATEGORY_EMOJI: Record<string, string> = {
  bebidas: "🥤", agua: "💧", lácteos: "🥛", cervezas: "🍺",
  jugos: "🧃", panadería: "🍞", galletas: "🍪", botanas: "🍟",
  dulces: "🍬", chocolates: "🍫", cereales: "🥣", abarrotes: "🛒",
  limpieza: "🧹", higiene: "🧴", farmacia: "💊", sopas: "🍜",
  enlatados: "🥫",
};

function getCategoryEmoji(category?: string | null): string {
  if (!category) return "📦";
  const key = category.toLowerCase();
  for (const [k, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (key.includes(k)) return emoji;
  }
  return "📦";
}

interface ProductCardProps {
  product: Product;
  source?: string;
}

export function ProductCard({ product, source = "local" }: ProductCardProps) {
  const src = SOURCE_LABELS[source] ?? SOURCE_LABELS.local;
  const categoryEmoji = getCategoryEmoji(product.category);

  return (
    <div className="product-card">
      <div className="product-header">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="product-image-placeholder">{categoryEmoji}</div>
        )}

        <div className="product-info">
          <h2 className="product-name">{product.name}</h2>
          {product.brand && <p className="product-brand">{product.brand}</p>}
          <div className="product-badges">
            {product.category && (
              <span className="badge badge-category">
                {categoryEmoji} {product.category}
              </span>
            )}
            <span className={`badge ${src.cls}`}>
              {src.icon} {src.label}
            </span>
          </div>
        </div>
      </div>

      <div className="product-details">
        <div className="detail-item">
          <span className="detail-label">Código</span>
          <span className="detail-value">{product.barcode}</span>
        </div>
        {product.unit && (
          <div className="detail-item">
            <span className="detail-label">Presentación</span>
            <span className="detail-value">{product.unit}</span>
          </div>
        )}
        {product.priceMx && (
          <div className="detail-item">
            <span className="detail-label">Precio ref.</span>
            <span className="detail-value">${product.priceMx.toFixed(2)} MXN</span>
          </div>
        )}
        {product.country && (
          <div className="detail-item">
            <span className="detail-label">País</span>
            <span className="detail-value">{product.country === "MX" ? "🇲🇽 México" : product.country}</span>
          </div>
        )}
      </div>

      {product.description && (
        <p style={{ marginTop: 14, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
          {product.description}
        </p>
      )}
    </div>
  );
}
