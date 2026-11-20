import { clinic } from '../data/clinic';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export interface SchemaOptions {
  siteUrl: string;
  pageUrl?: string;
  extra?: Record<string, unknown>[];
}

/** Nodo LocalBusiness/Dentist con NAP, horarios y valoración agregada. */
export function dentistSchema(siteUrl: string): Record<string, unknown> {
  const { address, geo } = clinic;

  return {
    '@type': 'Dentist',
    '@id': `${siteUrl}/#clinica`,
    name: clinic.name,
    description:
      'Clínica dental en el barrio de Hortaleza (Madrid): implantes, ortodoncia, endodoncias, prótesis, estética dental y diagnóstico digital con escáner intraoral y radiografía panorámica.',
    url: siteUrl,
    telephone: clinic.phoneE164,
    image: `${siteUrl}/assets/img/clinica-recepcion.webp`,
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      postalCode: address.postalCode,
      addressLocality: address.city,
      addressRegion: address.region,
      addressCountry: address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    areaServed: [
      { '@type': 'Place', name: 'Hortaleza, Madrid' },
      { '@type': 'PostalCode', name: '28033' },
    ],
    openingHoursSpecification: clinic.openingHours.flatMap((day) =>
      day.ranges.map(([opens, closes]) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: day.days.map((value) => DAY_NAMES[value]).filter(Boolean),
        opens,
        closes,
      })),
    ),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: clinic.rating.value.toFixed(1),
      reviewCount: clinic.rating.count,
      bestRating: '5',
      worstRating: '1',
    },
  };
}

export function websiteSchema(siteUrl: string): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#web`,
    url: siteUrl,
    name: clinic.name,
    inLanguage: 'es-ES',
    publisher: { '@id': `${siteUrl}/#clinica` },
  };
}

export function buildGraph(options: SchemaOptions): Record<string, unknown> {
  const { siteUrl, extra = [] } = options;

  return {
    '@context': 'https://schema.org',
    '@graph': [dentistSchema(siteUrl), websiteSchema(siteUrl), ...extra],
  };
}

export function breadcrumbSchema(
  siteUrl: string,
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, siteUrl).href,
    })),
  };
}

export function serviceSchema(options: {
  siteUrl: string;
  name: string;
  description: string;
  path: string;
}): Record<string, unknown> {
  return {
    '@type': 'MedicalProcedure',
    name: options.name,
    description: options.description,
    url: new URL(options.path, options.siteUrl).href,
    provider: { '@id': `${options.siteUrl}/#clinica` },
  };
}

export function faqSchema(
  faqs: { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}
