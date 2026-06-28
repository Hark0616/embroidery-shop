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

### Admin local sin sesion Supabase

Para trabajar en el admin local sin tener una cuenta configurada en Supabase Auth, agrega esto en `.env.local` y reinicia `npm run dev`:

```bash
LOCAL_ADMIN_BYPASS=true
LOCAL_ADMIN_EMAIL=local-admin@texere.dev
```

Con eso `/admin` usa un usuario local con rol `admin`, y el formulario de `/login` tambien te deja entrar. Este bypass solo funciona fuera de `NODE_ENV=production`; para leer o guardar drops, disenos y mockups sigues necesitando las variables de Supabase apuntando a tu base de datos.

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

Tambien existe un flujo sin servidor GPU: exportar `Paquete Colab` desde el calibrador, ejecutar `notebooks/texere_deformation_colab.py` en Google Colab y volver a importar el `result.json` en el admin.
