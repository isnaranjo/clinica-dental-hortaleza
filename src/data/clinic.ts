import clinicData from './clinic.json';

export interface OpeningRange {
  open: string;
  close: string;
}

export interface OpeningDay {
  /** 0 = domingo … 6 = sábado (igual que Date#getDay). */
  days: number[];
  ranges: [string, string][];
}

export interface TreatmentDefinition {
  slug: string;
  name: string;
  short: string;
  /** Duración del bloque reservado, en minutos. */
  duration: number;
}

export interface ClinicData {
  name: string;
  slogan: string;
  phoneDisplay: string;
  phoneE164: string;
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  address: {
    street: string;
    postalCode: string;
    city: string;
    district: string;
    region: string;
    country: string;
  };
  geo: { latitude: number; longitude: number };
  rating: { value: number; count: number; source: string };
  hoursNote: string;
  openingHours: OpeningDay[];
  booking: {
    timezone: string;
    slotStepMinutes: number;
    leadTimeHours: number;
    horizonDays: number;
    treatments: TreatmentDefinition[];
  };
}

// El JSON tipa `ranges` como string[][]; lo normalizamos a tuplas (string, string).
export const clinic = clinicData as unknown as ClinicData;

/** Dominio canónico del sitio (debe coincidir con `site` en astro.config.mjs). */
export const siteUrl = 'https://clinicadentalhortaleza.com';

/** Dirección en una sola línea, idéntica en cabecera, pie, contacto y Schema.org. */
export const addressLine = `${clinic.address.street}, ${clinic.address.postalCode} ${clinic.address.city}`;

export const telHref = `tel:${clinic.phoneE164}`;

export const whatsappHref = clinic.whatsapp
  ? `https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, '')}`
  : null;

export const instagramHref = clinic.instagram
  ? `https://instagram.com/${clinic.instagram}`
  : null;

export const ratingLabel = `${String(clinic.rating.value).replace('.', ',')} ★ · ${clinic.rating.count} reseñas`;

export function getTreatment(slug: string): TreatmentDefinition | undefined {
  return clinic.booking.treatments.find((treatment) => treatment.slug === slug);
}

export function getDuration(slug: string): number {
  return getTreatment(slug)?.duration ?? 30;
}
