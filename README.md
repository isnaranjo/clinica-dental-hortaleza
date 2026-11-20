# Clínica Dental Hortaleza — web y reserva de citas

Web corporativa y sistema de solicitud de citas para la Clínica Dental Hortaleza
(Calle Boyacá, 5, 1.º Dcha — 28033 Madrid).

- **Astro 5** en modo estático, con rutas API on-demand vía adapter de Cloudflare.
- **Tailwind CSS 4** (diseño mobile-first, WCAG AA).
- **TypeScript** estricto.
- **TinaCMS** para editar tratamientos, blog y datos de la clínica.
- **Resend** para los correos de cita y contacto.
- **Cloudflare Pages** como destino de despliegue.

## Puesta en marcha

```bash
npm install
npm run images     # genera public/assets/img a partir de las fotos originales
npm run dev        # http://localhost:4321
```

Comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Astro |
| `npm run dev:cms` | Astro + TinaCMS en local (edición visual) |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualiza el build |
| `npm run check` | Comprobación estricta de tipos y diagnósticos de Astro |
| `npm run images` | Convierte `fotos clinica/` y `tratamientos/` a WebP optimizado |
| `npm run build:cms` | Genera el panel de Tina y compila |

## Variables de entorno

Copia `.env.example` a `.env` y rellena:

- `RESEND_API_KEY`, `BOOKING_TO_EMAIL`, `BOOKING_FROM_EMAIL` — envío de correos.
- `TINA_CLIENT_ID`, `TINA_TOKEN` — solo si se usa Tina Cloud.

En Cloudflare Pages se configuran en *Settings → Environment variables*.

## Cómo funciona la reserva

1. `src/data/clinic.json` define horarios, zona horaria, granularidad y la **matriz de
   duración por tratamiento**.
2. `src/lib/booking-engine.ts` devuelve solo horas de inicio donde cabe el bloque
   completo dentro de una franja de apertura y sin solaparse con otra cita.
3. `GET /api/booking?date=…&treatment=…` calcula la disponibilidad.
4. `POST /api/booking` revalida el hueco en servidor, guarda la cita y envía dos
   correos (paciente y recepción) con Resend.

Duraciones configuradas: revisión 30 · diagnóstico digital 30 · ortodoncia 30 ·
prótesis 45 · estética 60 · endodoncia 90 · implantes 90.

### Persistencia de citas

`src/lib/booking-store.ts` usa **Cloudflare KV** cuando existe el binding `BOOKINGS`
y, si no, un almacén en memoria (se pierde al reiniciar la instancia).

Para producción, crea un namespace KV y enlázalo en Cloudflare Pages como `BOOKINGS`:

```bash
npx wrangler kv namespace create BOOKINGS
```

El almacén guarda un JSON por día (`bookings:YYYY-MM-DD`). Para un volumen alto de
reservas conviene mover a D1 o a una tabla con bloqueo, y añadir rate limiting.

## Contenido y CMS

- Tratamientos: `src/content/tratamientos/*.md` (una página por fichero).
- Blog: `src/content/blog/*.md`.
- Datos operativos (NAP, horarios, valoración, duraciones): `src/data/clinic.json`.

El esquema de Tina está en `tina/config.ts`. `npm run dev:cms` permite editar esos
ficheros desde `/admin` en local.

## Imágenes

`scripts/optimize-images.mjs` recorre el material bruto y genera WebP en
`public/assets/img`, con nombres en kebab-case sin acentos, y escribe el manifiesto
`src/data/images.json` (dimensiones para evitar CLS). El material original **no** se
sirve en producción.

## Despliegue en Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Node 20 o superior.
- Variables de entorno de Resend y, opcionalmente, binding KV `BOOKINGS`.

## Datos pendientes de confirmar con el cliente

Estos puntos están maquetados pero necesitan datos reales antes de publicar:

1. **Horario exacto.** `src/data/clinic.json` usa provisionalmente L-V 09:30–14:00 y
   16:00–20:00. La apertura a las 9:30 sí está confirmada.
2. **WhatsApp.** `whatsapp` está vacío porque solo hay teléfono fijo; el botón se
   oculta si no se rellena. Para activarlo hace falta un número móvil.
3. **Correo público** (`email`), buzón de recepción y dominio verificado en Resend.
4. **Datos legales**: NIF/CIF, razón social, correo de privacidad y números de
   colegiado en `src/pages/legal/*`.
5. **Coordenadas** en `clinic.json`: son aproximadas; conviene verificarlas en Google
   Maps antes de publicar (afectan al Schema.org `geo`).
6. **Equipo**: la página describe cómo trabaja la clínica; faltan nombres, formación y
   fotos reales si se quieren publicar.
7. **Reseñas**: solo se usa el agregado real (4,6 ★ / 57 reseñas). No hay testimonios
   inventados.

## Accesibilidad y privacidad

- Enlace «saltar al contenido», navegación con `aria-current`, menú móvil con
  `aria-expanded`, formularios con `label` y mensajes `aria-live`.
- Sin cookies propias ni analítica: no se muestra banner porque no hay nada que
  consentir. El mapa de OpenStreetMap se carga solo al pulsarlo.
- Formularios con honeypot y validación en servidor.
