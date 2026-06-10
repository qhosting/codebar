# CodeBar API

> API de consulta de productos por código de barras para el mercado mexicano.  
> Escanea con cámara (video en vivo o foto) o consulta vía REST.

**Autor:** AurumCapitalHolding  
**Stack:** Next.js 14 · TypeScript · PostgreSQL · Drizzle ORM · Docker · Easypanel

---

## Funcionalidades

- 📷 **Scanner en tiempo real** — video streaming con `react-zxing` (EAN-13, UPC, QR, Code128)
- 📸 **Scanner por foto** — captura imagen, detecta con `BarcodeDetector` API nativa o ZXing estático
- 🗄️ **Base de datos local** — 50 productos mexicanos pre-cargados (Bimbo, FEMSA, Lala, Grupo Modelo, etc.)
- 🌍 **Open Food Facts** — consulta automática si no está en BD local (sin límite, gratis)
- 🔍 **UPC Item DB** — fallback secundario (100 req/día gratis)
- 💾 **Auto-caché** — productos externos se guardan en BD local automáticamente
- 🐳 **Docker ready** — Dockerfile multi-stage + docker-compose para desarrollo local

---

## API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/barcode/:codigo` | Consultar producto por código |
| `POST` | `/api/barcode` | Registrar producto manualmente |
| `GET` | `/api/barcode/search?q=texto` | Buscar por nombre o marca |
| `GET` | `/api/health` | Estado del servicio y BD |

### Ejemplo de respuesta

```bash
GET /api/barcode/7501055300595
```

```json
{
  "success": true,
  "source": "local",
  "product": {
    "barcode": "7501055300595",
    "name": "Coca-Cola 600ml",
    "brand": "Coca-Cola FEMSA",
    "category": "Bebidas",
    "unit": "600ml",
    "country": "MX",
    "source": "manual"
  }
}
```

### Guía de Integración (Cómo implementar)

Puedes consumir esta API desde cualquier frontend o servicio backend utilizando `fetch` u otras librerías HTTP.

#### 1. Consultar un Producto (GET)
Realiza una petición `GET` enviando el código de barras en la URL. Si el producto no existe en la base de datos local, el servicio lo buscará automáticamente en Open Food Facts y UPC Item DB, registrándolo en la base de datos para futuras consultas.

```javascript
async function buscarProducto(codigoBarras) {
  try {
    const respuesta = await fetch(`https://tu-dominio.com/api/barcode/${codigoBarras}`);
    const data = await respuesta.json();
    
    if (data.success) {
      console.log("Producto encontrado:", data.product);
      // Aquí puedes renderizar el producto en tu interfaz
    } else {
      console.log("Producto no encontrado:", data.message);
    }
  } catch (error) {
    console.error("Error al consultar la API:", error);
  }
}
```

#### 2. Registrar un Producto (POST)
Si deseas registrar un nuevo producto manualmente en la base de datos local, envía una solicitud `POST` con la información del producto estructurada en formato JSON:

```javascript
async function registrarProducto(datosProducto) {
  try {
    const respuesta = await fetch('https://tu-dominio.com/api/barcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        barcode: datosProducto.barcode, // Mínimo 8 dígitos (Requerido)
        name: datosProducto.name,       // Nombre del producto (Requerido)
        brand: datosProducto.brand,     // Marca (Opcional)
        category: datosProducto.category, // Categoría (Opcional)
        priceMx: datosProducto.priceMx, // Precio en pesos MXN (Opcional)
        unit: datosProducto.unit        // Unidad, ej: "600ml", "1kg" (Opcional)
      })
    });
    
    const data = await respuesta.json();
    if (data.success) {
      console.log("Producto guardado exitosamente:", data.product);
    } else {
      console.error("Errores de validación:", data.errors || data.message);
    }
  } catch (error) {
    console.error("Error al registrar producto:", error);
  }
}
```

---

## Instalación y desarrollo

```bash
# 1. Clonar
git clone <url-del-repositorio>
cd codebar

# 2. Variables de entorno
cp .env.example .env.local
# Editar DATABASE_URL con tu PostgreSQL

# 3. Instalar dependencias
npm install

# 4. Correr migraciones + seed
npm run db:migrate

# 5. Servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Deploy con Docker / Easypanel

### Desarrollo local (Docker Compose)

```bash
docker compose up --build
```

Levanta la app en `http://localhost:3000` junto con PostgreSQL 16.

### Producción (Easypanel)

1. Conecta tu repositorio de GitHub en Easypanel como **App**
2. Agrega las variables de entorno:

```env
DATABASE_URL=postgres://user:pass@servicio-postgres:5432/codebar-db
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

3. Las migraciones y el seed corren **automáticamente** al iniciar el contenedor.

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run db:generate  # Generar nueva migración
npm run db:migrate   # Aplicar migraciones + seed
```

---

## Fuentes de datos

| Fuente | Tipo | Límite |
|---|---|---|
| BD local PostgreSQL | Primaria | Sin límite |
| [Open Food Facts](https://world.openfoodfacts.org/) | Externa gratuita | Sin límite |
| [UPC Item DB](https://www.upcitemdb.com/) | Fallback gratuito | 100 req/día |

---

## Formatos de código soportados

`EAN-13` · `EAN-8` · `UPC-A` · `UPC-E` · `Code128` · `Code39` · `QR Code`

---

© 2026 AurumCapitalHolding
