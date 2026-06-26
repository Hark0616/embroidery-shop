# TEXERE.ART

Tienda de prendas bordadas con dos flujos publicos:

- `Comprar listo`: productos armados con foto final, talla, color y compra por WhatsApp.
- `Personalizar`: prendas base + catalogo de disenos + mockups calibrados en Studio.

## Modelo

- `ready_products`: ofertas finales para vender rapido.
- `product_drops`: drops o categorias comerciales para agrupar productos armados.
- `base_products`: prendas base disponibles para personalizacion.
- `embroidery_designs`: catalogo de bordados.
- `garment_mockups`: fotos y superficies calibradas para previsualizar bordados.
- `config_global`: settings visibles en tienda, como tiempo de produccion.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Verificacion

```bash
npm run build
```

## Calibracion asistida

El admin puede pedir propuestas de deformacion para una zona de mockup marcada con 4 esquinas. La web usa RunPod Serverless como worker GPU y requiere estas variables en Vercel:

```bash
RUNPOD_DEFORMATION_ENDPOINT_ID=
RUNPOD_API_KEY=
DEFORMATION_WORKER_VERSION=runpod-depth-normal-v1
```

El worker esta en `workers/deformation` y devuelve propuestas compatibles con `garment_mockups.surfaces`.
