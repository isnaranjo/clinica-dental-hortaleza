import type { Booking } from './booking-engine';

/**
 * Interfaz mínima compatible con Cloudflare KV, para no acoplar el proyecto
 * a los tipos de @cloudflare/workers-types.
 */
export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface BookingStore {
  list(date: string): Promise<Booking[]>;
  add(booking: Booking): Promise<void>;
}

const keyFor = (date: string) => `bookings:${date}`;
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Persistencia en Cloudflare KV (una clave JSON por día). */
class KVBookingStore implements BookingStore {
  constructor(private readonly kv: KVNamespaceLike) {}

  async list(date: string): Promise<Booking[]> {
    const raw = await this.kv.get(keyFor(date));
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Booking[]) : [];
    } catch {
      return [];
    }
  }

  async add(booking: Booking): Promise<void> {
    const bookings = await this.list(booking.date);
    bookings.push(booking);
    await this.kv.put(keyFor(booking.date), JSON.stringify(bookings), {
      expirationTtl: ONE_YEAR,
    });
  }
}

/**
 * Almacén en memoria: válido para desarrollo y para el modo demo.
 * En producción se debe enlazar un namespace KV (variable BOOKINGS).
 */
class MemoryBookingStore implements BookingStore {
  private static days = new Map<string, Booking[]>();

  async list(date: string): Promise<Booking[]> {
    return [...(MemoryBookingStore.days.get(keyFor(date)) ?? [])];
  }

  async add(booking: Booking): Promise<void> {
    const current = MemoryBookingStore.days.get(keyFor(booking.date)) ?? [];
    MemoryBookingStore.days.set(keyFor(booking.date), [...current, booking]);
  }
}

export interface StoreEnv {
  BOOKINGS?: KVNamespaceLike;
}

let warned = false;

export function getBookingStore(env?: StoreEnv): BookingStore {
  if (env?.BOOKINGS && typeof env.BOOKINGS.get === 'function') {
    return new KVBookingStore(env.BOOKINGS);
  }

  if (!warned && import.meta.env.PROD) {
    warned = true;
    console.warn(
      '[booking] Sin namespace KV enlazado: las reservas viven en memoria y se pierden al reiniciar la instancia. Enlaza el binding BOOKINGS en Cloudflare Pages.',
    );
  }

  return new MemoryBookingStore();
}

export function createBookingId(): string {
  return `cita_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
