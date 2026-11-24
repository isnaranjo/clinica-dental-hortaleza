import type { APIRoute } from 'astro';
import { clinic, getTreatment } from '../../data/clinic';
import {
  dateInTimeZone,
  formatLongDate,
  getAvailableSlots,
  isValidDate,
  isValidTime,
  validateBookingSlot,
  weekdayOf,
} from '../../lib/booking-engine';
import { createBookingId, getBookingStore } from '../../lib/booking-store';
import { sendBookingEmails } from '../../lib/email';

export const prerender = false;

type Env = Record<string, string | undefined>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function readEnv(localsParam?: unknown): Env {
  const base = import.meta.env as unknown as Env;
  if (localsParam) {
    const env = (localsParam as { runtime?: { env?: Env } }).runtime?.env;
    if (env) {
      return { ...base, ...env };
    }
  }
  return base;
}

function asString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const GET: APIRoute = async ({ url, locals }) => {
  const date = url.searchParams.get('date') ?? '';
  const treatmentSlug = url.searchParams.get('treatment') ?? '';

  if (!isValidDate(date)) {
    return json({ error: 'La fecha indicada no es válida.' }, 400);
  }

  const treatment = getTreatment(treatmentSlug);
  if (!treatment) {
    return json({ error: 'El tratamiento indicado no es válido.' }, 400);
  }

  const env = readEnv(locals);
  const store = getBookingStore(env);
  const bookings = await store.list(date);

  const slots = getAvailableSlots({
    date,
    duration: treatment.duration,
    bookings,
    openingHours: clinic.openingHours,
    stepMinutes: clinic.booking.slotStepMinutes,
    leadTimeHours: clinic.booking.leadTimeHours,
    timezone: clinic.booking.timezone,
  });

  const closed = !clinic.openingHours.some((day) => day.days.includes(weekdayOf(date)));

  return json({
    date,
    duration: treatment.duration,
    treatment: { slug: treatment.slug, name: treatment.name },
    closed,
    slots,
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'No se han recibido datos válidos.' }, 400);
  }

  // Honeypot: si un bot rellena el campo oculto, no se crea la cita.
  if (asString(payload.website, 100).length > 0) {
    return json({ error: 'No se pudo procesar la solicitud.' }, 400);
  }

  const name = asString(payload.name, 80);
  const phone = asString(payload.phone, 20);
  const email = asString(payload.email, 120);
  const notes = asString(payload.notes, 500);
  const treatmentSlug = asString(payload.treatment, 40);
  const date = asString(payload.date, 10);
  const time = asString(payload.time, 5);
  const consent = payload.consent === 'si' || payload.consent === true;

  if (name.length < 2) {
    return json({ error: 'Indica tu nombre completo.' }, 400);
  }
  if (phone.replace(/[^0-9]/g, '').length < 6) {
    return json({ error: 'Indica un teléfono de contacto válido.' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Indica un correo electrónico válido.' }, 400);
  }
  if (!consent) {
    return json({ error: 'Necesitamos tu consentimiento para gestionar la cita.' }, 400);
  }
  if (!isValidDate(date) || !isValidTime(time)) {
    return json({ error: 'La fecha o la hora no son válidas.' }, 400);
  }

  const treatment = getTreatment(treatmentSlug);
  if (!treatment) {
    return json({ error: 'Elige un tratamiento de la lista.' }, 400);
  }

  const today = dateInTimeZone(new Date(), clinic.booking.timezone);
  const horizon = new Date(`${today}T12:00:00Z`);
  horizon.setUTCDate(horizon.getUTCDate() + clinic.booking.horizonDays);
  if (date > horizon.toISOString().slice(0, 10)) {
    return json({ error: 'La fecha está fuera del plazo de reserva.' }, 400);
  }

  const env = readEnv(locals);
  const store = getBookingStore(env);
  const bookings = await store.list(date);

  const validation = validateBookingSlot(
    { date, time, treatment: treatment.slug, duration: treatment.duration },
    {
      bookings,
      openingHours: clinic.openingHours,
      stepMinutes: clinic.booking.slotStepMinutes,
      leadTimeHours: clinic.booking.leadTimeHours,
      timezone: clinic.booking.timezone,
    },
  );

  if (!validation.ok) {
    return json({ error: validation.error }, 409);
  }

  await store.add({
    id: createBookingId(),
    date,
    start: time,
    duration: treatment.duration,
    treatment: treatment.name,
    createdAt: new Date().toISOString(),
  });

  const emailResult = await sendBookingEmails(
    {
      name,
      email,
      phone,
      treatmentName: treatment.name,
      date,
      time,
      duration: treatment.duration,
      notes: notes || undefined,
    },
    env,
  );

  return json(
    {
      ok: true,
      notified: emailResult.sent,
      summary: `Hemos recibido tu solicitud para ${treatment.name.toLowerCase()} el ${formatLongDate(
        date,
      )} a las ${time} h. Recepción te confirmará la cita por teléfono o correo.`,
    },
    201,
  );
};
