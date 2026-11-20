import { defineConfig } from 'tinacms';

// La edición visual se apoya en los ficheros Markdown de src/content.
// `npm run dev:cms` levanta Astro + Tina en modo local (sin Tina Cloud).
const branch =
  process.env.TINA_BRANCH ?? process.env.GITHUB_BRANCH ?? process.env.HEAD ?? 'main';

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID ?? '',
  token: process.env.TINA_TOKEN ?? '',
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'assets/img',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      {
        name: 'tratamiento',
        label: 'Tratamientos',
        path: 'src/content/tratamientos',
        format: 'md',
        fields: [
          { type: 'string', name: 'title', label: 'Título', isTitle: true, required: true },
          { type: 'string', name: 'shortTitle', label: 'Título corto (menú y tarjetas)', required: true },
          {
            type: 'string',
            name: 'description',
            label: 'Descripción SEO (máx. 160 caracteres)',
            ui: { component: 'textarea' },
            required: true,
          },
          {
            type: 'string',
            name: 'summary',
            label: 'Resumen para la tarjeta',
            ui: { component: 'textarea' },
            required: true,
          },
          { type: 'number', name: 'order', label: 'Orden en el listado', required: true },
          {
            type: 'string',
            name: 'bookingSlug',
            label: 'Identificador de reserva',
            description: 'Debe coincidir con uno de los tratamientos de src/data/clinic.json',
            required: true,
          },
          { type: 'number', name: 'duration', label: 'Duración de la cita (minutos)', required: true },
          { type: 'image', name: 'image', label: 'Imagen principal', required: true },
          { type: 'string', name: 'imageAlt', label: 'Texto alternativo de la imagen', required: true },
          {
            type: 'object',
            name: 'gallery',
            label: 'Galería',
            list: true,
            ui: {
              itemProps: (item: Record<string, unknown>) => ({
                label:
                  typeof item?.caption === 'string'
                    ? item.caption
                    : typeof item?.alt === 'string'
                      ? item.alt
                      : 'Imagen',
              }),
            },
            fields: [
              { type: 'image', name: 'src', label: 'Imagen', required: true },
              { type: 'string', name: 'alt', label: 'Texto alternativo', required: true },
              { type: 'string', name: 'caption', label: 'Pie de foto' },
            ],
          },
          {
            type: 'object',
            name: 'faqs',
            label: 'Preguntas frecuentes',
            list: true,
            ui: {
              itemProps: (item: Record<string, unknown>) => ({
                label: typeof item?.question === 'string' ? item.question : 'Pregunta',
              }),
            },
            fields: [
              { type: 'string', name: 'question', label: 'Pregunta', required: true },
              { type: 'string', name: 'answer', label: 'Respuesta', ui: { component: 'textarea' }, required: true },
            ],
          },
          { type: 'rich-text', name: 'body', label: 'Contenido de la página', isBody: true },
        ],
      },
      {
        name: 'blog',
        label: 'Blog',
        path: 'src/content/blog',
        format: 'md',
        fields: [
          { type: 'string', name: 'title', label: 'Título', isTitle: true, required: true },
          {
            type: 'string',
            name: 'description',
            label: 'Descripción SEO (máx. 160 caracteres)',
            ui: { component: 'textarea' },
            required: true,
          },
          { type: 'datetime', name: 'pubDate', label: 'Fecha de publicación', required: true },
          { type: 'datetime', name: 'updatedDate', label: 'Última actualización' },
          { type: 'number', name: 'readingMinutes', label: 'Minutos de lectura', required: true },
          { type: 'image', name: 'image', label: 'Imagen de portada' },
          { type: 'string', name: 'imageAlt', label: 'Texto alternativo de la portada' },
          { type: 'rich-text', name: 'body', label: 'Artículo', isBody: true },
        ],
      },
      {
        name: 'clinica',
        label: 'Datos de la clínica',
        path: 'src/data',
        format: 'json',
        match: { include: 'clinic' },
        fields: [
          { type: 'string', name: 'name', label: 'Nombre comercial', required: true },
          { type: 'string', name: 'slogan', label: 'Lema' },
          { type: 'string', name: 'phoneDisplay', label: 'Teléfono (visible)', required: true },
          { type: 'string', name: 'phoneE164', label: 'Teléfono (formato internacional)', required: true },
          {
            type: 'string',
            name: 'whatsapp',
            label: 'WhatsApp (número móvil con prefijo)',
            description: 'Déjalo vacío si la clínica no tiene móvil de WhatsApp.',
          },
          { type: 'string', name: 'email', label: 'Correo público' },
          {
            type: 'object',
            name: 'address',
            label: 'Dirección (NAP)',
            fields: [
              { type: 'string', name: 'street', label: 'Calle y número', required: true },
              { type: 'string', name: 'postalCode', label: 'Código postal', required: true },
              { type: 'string', name: 'city', label: 'Ciudad', required: true },
              { type: 'string', name: 'district', label: 'Distrito', required: true },
              { type: 'string', name: 'region', label: 'Comunidad', required: true },
              { type: 'string', name: 'country', label: 'País (ISO-2)', required: true },
            ],
          },
          {
            type: 'object',
            name: 'geo',
            label: 'Coordenadas',
            fields: [
              { type: 'number', name: 'latitude', label: 'Latitud', required: true },
              { type: 'number', name: 'longitude', label: 'Longitud', required: true },
            ],
          },
          {
            type: 'object',
            name: 'rating',
            label: 'Valoración de Google',
            fields: [
              { type: 'number', name: 'value', label: 'Nota media', required: true },
              { type: 'number', name: 'count', label: 'Número de reseñas', required: true },
              { type: 'string', name: 'source', label: 'Fuente', required: true },
            ],
          },
          { type: 'string', name: 'hoursNote', label: 'Nota sobre el horario', ui: { component: 'textarea' } },
          {
            type: 'object',
            name: 'openingHours',
            label: 'Horario de apertura',
            list: true,
            fields: [
              { type: 'number', name: 'days', label: 'Días (0=domingo … 6=sábado)', list: true, required: true },
              {
                type: 'string',
                name: 'ranges',
                label: 'Franjas [apertura, cierre]',
                list: true,
                ui: { component: 'textarea' },
                description: 'Cada franja se escribe como: 09:30,14:00',
              },
            ],
          },
          {
            type: 'object',
            name: 'booking',
            label: 'Configuración de reservas',
            fields: [
              { type: 'string', name: 'timezone', label: 'Zona horaria', required: true },
              { type: 'number', name: 'slotStepMinutes', label: 'Granularidad de huecos (min)', required: true },
              { type: 'number', name: 'leadTimeHours', label: 'Antelación mínima (horas)', required: true },
              { type: 'number', name: 'horizonDays', label: 'Días de antelación máxima', required: true },
            ],
          },
        ],
      },
    ],
  },
});
