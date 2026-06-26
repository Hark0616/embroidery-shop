# Auditoria UX, UI y Marketing - TEXERE.ART

Fecha: 2026-06-26

## Diagnostico principal

La tienda esta construida alrededor de personalizacion: mood, diseno, prenda, color, talla y ubicacion. Ese flujo es potente para clientes que ya confian en la marca, pero es demasiado abierto para trafico frio de anuncios.

Para ads, el producto debe venderse como una pieza ya armada:

> Hoodie negro con bordado estilo shonen en pecho izquierdo, listo para pedir.

El cliente no deberia empezar armando desde cero. Deberia entrar a una pagina donde ya ve el resultado final, elige talla/color disponible y compra por WhatsApp.

## Problema actual por pantalla

### Home

La home comunica "expresate" y "personaliza tu prenda". Es aspiracional, pero no muestra una oferta concreta en el primer impacto.

Riesgo:
- El visitante de ads no sabe que puede comprar hoy.
- Se le pide pensar antes de ver un producto deseable.
- El CTA principal manda a explorar o al Studio, no a comprar una prenda especifica.

Correccion:
- Convertir la home en una tienda de drops o colecciones.
- Mostrar arriba productos armados: imagen de prenda final, precio, lead time y CTA.
- Mantener Studio como opcion secundaria: "Crea el tuyo".

### Disenos

La pagina de disenos muestra artes aislados. Esto sirve como biblioteca, pero no como landing para anuncios.

Riesgo:
- Si el anuncio muestra un hoodie terminado, la landing muestra solo el diseno.
- El cliente tiene que imaginar el resultado.
- El boton "Personalizar" aumenta friccion.

Correccion:
- Usar disenos como insumo interno.
- Para venta publica, crear productos armados que combinen diseno + prenda + ubicacion + mockup.

### Catalogo

El catalogo actual muestra prendas base.

Riesgo:
- "Hoodie desde $120000" no es una oferta final.
- El cliente no compra un lienzo, compra una prenda con identidad.

Correccion:
- Cambiar Catalogo a "Tienda" o "Colecciones".
- Mostrar productos armados, no bases.
- Las bases deben vivir en Admin/Studio, no como la tienda principal.

### Studio

El Studio es util como herramienta de personalizacion, pero no es necesario para vender productos prearmados.

Riesgo:
- Demasiadas decisiones para trafico frio.
- Si falta una calibracion, el flujo se siente roto.
- El cliente no sabe que combinacion queda bien.

Correccion:
- Studio debe ser secundario: para clientes que quieren crear algo propio.
- Los productos recomendados no deben depender del Studio publico.
- La compra de ads debe ir a producto armado.

## Estrategia recomendada

Crear dos modos publicos:

1. Recomendados / Colecciones
   - Para vender rapido.
   - Productos ya armados.
   - Ideal para ads, reels, catalogos y retargeting.

2. Studio
   - Para personalizacion avanzada.
   - Ideal para clientes recurrentes o pedidos especiales.
   - No debe ser el primer paso del trafico frio.
   - No es obligatorio para vender recomendados.

## Zona de recomendados

La forma mas natural de introducir prendas prearmadas es una zona de "Recomendados".

Esta zona puede aparecer en:
- Home, justo despues del hero.
- Pagina de disenos, cuando alguien llega desde un mood.
- Pagina de catalogo, reemplazando o antecediendo las prendas base.
- Paginas de producto, como productos relacionados.

Funcion:
- Mostrar combinaciones ya resueltas: prenda + diseno/arte + color + fotos finales.
- Reducir decision del cliente.
- Validar rapidamente que combinaciones venden mejor antes de construir un catalogo grande.

Ejemplo:
- Recomendado: Hoodie Goku Silhouette en negro.
- Recomendado: Gorra minimal con bordado lateral.
- Recomendado: Hoodie flores crema en centro pecho.

Regla UX:
- La tarjeta de recomendado debe abrir una pagina de producto armado.
- No debe mandar directo al Studio como primer paso.
- Puede tener un enlace secundario: "Personalizar algo parecido".
- Debe usar fotos finales del producto, no el calibrador como interfaz publica.

## Drops y categorias

Conviene administrar las prendas prearmadas por drops o categorias comerciales.

Ejemplos:
- Drop: Anime oscuro
- Drop: Shonen energy
- Drop: Minimal negro
- Drop: Flores crema
- Categoria interna: Hoodies
- Categoria interna: Gorras

Un drop debe funcionar como una coleccion vendible:
- Nombre
- Slug
- Descripcion corta
- Imagen/banner
- Estado: borrador, publicado, oculto
- Orden
- Productos asociados

La idea de "Dragon Ball" o "X anime" funciona bien como organizacion mental, pero para anuncios pagados y URLs publicas hay que cuidar propiedad intelectual. Si no hay licencia, es mas seguro usar nombres de estilo:
- "Shonen energy"
- "Guerrero anime"
- "Anime clasico"
- "Pelea final"

Puedes seguir usando nombres internos mas directos en Admin si te ayudan a organizar, pero la cara publica deberia evitar prometer productos oficiales o usar marcas/personajes protegidos.

## Modelo de producto correcto

Crear una entidad nueva: Producto Armado.

Campos recomendados:
- nombre
- slug
- estado: borrador, publicado, agotado
- drop/categoria
- prenda base opcional
- diseno/arte opcional
- ubicacion opcional
- color principal
- colores habilitados
- tallas habilitadas
- precio final
- precio promocional opcional
- imagen hero
- galeria de fotos finales
- texto corto de venta
- tags para ads
- prioridad/orden
- sku o codigo interno

Ejemplos:
- Hoodie Guerrero Anime Negro
- Gorra Minimal Line Negra
- Hoodie Flores Crema
- Camiseta Shonen Blanco

Nota: para productos prearmados, las fotos finales mandan. El mockup calibrado puede servir internamente para crear la visual, pero el producto publico debe mostrar imagenes finales cargadas en su galeria.

## Flujo ideal para ads

Anuncio:
> Hoodie bordado estilo anime. Hecho bajo pedido. 8 dias habiles.

Landing:
1. Hero con foto final de la prenda.
2. Nombre claro del producto.
3. Precio final.
4. Selector simple: talla y color.
5. CTA: Comprar por WhatsApp.
6. Detalles: bordado, materiales, tiempo de produccion.
7. Confianza: hecho bajo pedido, pagos, envios, cambios.
8. Otros productos relacionados.

El cliente nunca deberia tener que elegir diseno ni ubicacion en esta landing.

## Reglas de publicacion

Un producto armado solo puede publicarse si:
- Pertenece a un drop/categoria publicada u oculta valida.
- Tiene al menos una foto final.
- Hay al menos una talla habilitada.
- Tiene color o variante definida.
- Tiene precio final.
- Tiene CTA activo.

Si esta conectado a una prenda base o diseno interno, esos registros deben existir, pero no son obligatorios para vender una foto final ya producida.

## Ads y colecciones

No conviene anunciar "personaliza cualquier cosa". Conviene anunciar drops concretos.

Primeras colecciones sugeridas:

1. Anime / Geek
   - 3 hoodies
   - 2 gorras
   - 1 camiseta

2. Minimal
   - 2 gorras
   - 2 camisetas
   - 1 hoodie

3. Flores / Delicado
   - 2 hoodies crema/blanco
   - 2 camisetas
   - 1 tote o gorra si aplica

Cada coleccion debe tener pocas opciones. Menos opciones aumenta claridad operativa y evita saturar la maquina.

## Riesgo legal y de ads

Hay que tener cuidado con personajes de anime, logos, nombres de series y marcas registradas.

Para ads pagados, es mas seguro:
- Usar arte original inspirado en estilos, no personajes exactos.
- Evitar nombres protegidos en titulos, URLs y textos de anuncio.
- No prometer producto oficial.
- Separar "fan art original" de cualquier uso comercial de marcas registradas.

## Prioridad de implementacion

### Hito 1 - Producto armado

Crear tabla, tipos y acciones para drops y productos armados.

Resultado:
- Admin puede crear un drop/categoria y una oferta vendible con fotos finales.

### Hito 2 - Recomendados publicos

Crear una zona de recomendados en home y una pagina de producto armado.

Resultado:
- Los anuncios pueden enviar a paginas de producto final y la home empieza a vender combinaciones listas.

### Hito 3 - Home orientada a venta

Cambiar el primer viewport para mostrar productos armados destacados.

Resultado:
- La home deja de vender solo "personalizacion" y empieza a vender prendas concretas.

### Hito 4 - Admin para colecciones

Administrar drops/categorias y ordenar productos armados.

Resultado:
- Puedes lanzar colecciones de 6 a 12 productos sin saturarte.

### Hito 5 - Medicion

Preparar eventos y UTMs:
- view_item
- select_variant
- begin_whatsapp_checkout
- whatsapp_click

Resultado:
- Ads pueden optimizar hacia acciones reales.

## Veredicto

La mejor ruta no es abandonar la personalizacion. Es cambiar la jerarquia:

1. Primero vender prendas armadas.
2. Despues ofrecer personalizacion.

El Studio debe ser el taller. La tienda debe ser la vitrina.
