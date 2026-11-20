import type { OpeningDay } from '../data/clinic';

/** Reserva tal y como se guarda en el almacén. */
export interface Booking {
  id: string;
  /** Fecha local de la clínica, formato YYYY-MM-DD. */
  date: string;
  /** Hora de inicio local, formato HH:MM. */
  start: string;
  /** Duración del bloque reservado, en minutos. */
  duration: number;
  treatment: string;
  createdAt?: string;
}

export interface SlotOptions {
  date: string;
  duration: number;
  bookings: Booking[];
  openingHours: OpeningDay[];
  stepMinutes: number;
  leadTimeHours: number;
  timezone?: string;
  now?: Date;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria de la clínica. */
export function dateInTimeZone(now: Date, timeZone: string): string {
  // El locale sueco produce directamente el formato ISO YYYY-MM-DD.
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Minutos transcurridos del día (hora local de la clínica). */
export function minutesInTimeZone(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

/** Día de la semana (0 = domingo) de una fecha YYYY-MM-DD. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  return !Number.isNaN(new Date(`${date}T00:00:00Z`).getTime());
}

export function isValidTime(time: string): boolean {
  return TIME_RE.test(time);
}

/**
 * Devuelve las horas de inicio en las que cabe el bloque completo sin
 * solaparse con reservas previas ni salir del horario de apertura.
 */
export function getAvailableSlots(options: SlotOptions): string[] {
  const {
    date,
    duration,
    bookings,
    openingHours,
    stepMinutes,
    leadTimeHours,
    timezone = 'Europe/Madrid',
    now = new Date(),
  } = options;

  if (!isValidDate(date) || duration <= 0 || stepMinutes <= 0) return [];

  const today = dateInTimeZone(now, timezone);
  if (date < today) return [];

  const weekday = weekdayOf(date);
  const ranges = openingHours
    .filter((day) => day.days.includes(weekday))
    .flatMap((day) => day.ranges);

  if (ranges.length === 0) return [];

  // En el día de hoy solo se ofertan horas con el margen mínimo de antelación.
  const earliest =
    date === today ? minutesInTimeZone(now, timezone) + leadTimeHours * 60 : -1;

  const busy = bookings.map((booking) => ({
    start: timeToMinutes(booking.start),
    end: timeToMinutes(booking.start) + booking.duration,
  }));

  const slots = new Set<string>();

  for (const [openTime, closeTime] of ranges) {
    const open = timeToMinutes(openTime);
    const close = timeToMinutes(closeTime);

    for (let start = open; start + duration <= close; start += stepMinutes) {
      if (start < earliest) continue;

      const end = start + duration;
      const overlaps = busy.some((block) => start < block.end && end > block.start);
      if (overlaps) continue;

      slots.add(minutesToTime(start));
    }
  }

  return [...slots].sort();
}

export interface BookingInput {
  date: string;
  time: string;
  treatment: string;
  duration: number;
}

export type BookingValidation =
  | { ok: true }
  | { ok: false; error: string };

/** Comprueba que la reserva solicitada sigue siendo válida en el servidor. */
export function validateBookingSlot(
  input: BookingInput,
  options: Omit<SlotOptions, 'date' | 'duration'>,
): BookingValidation {
  if (!isValidDate(input.date)) return { ok: false, error: 'La fecha no es válida.' };
  if (!isValidTime(input.time)) return { ok: false, error: 'La hora no es válida.' };
  if (!Number.isFinite(input.duration) || input.duration < 15 || input.duration > 240) {
    return { ok: false, error: 'La duración del tratamiento no es válida.' };
  }

  const slots = getAvailableSlots({
    ...options,
    date: input.date,
    duration: input.duration,
  });

  if (!slots.includes(input.time)) {
    return { ok: false, error: 'Esa hora ya no está disponible. Elige otra, por favor.' };
  }

  return { ok: true };
}

/** Formatea YYYY-MM-DD como "viernes, 14 de noviembre de 2026". */
export function formatLongDate(date: string): string {
  if (!isValidDate(date)) return date;
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
