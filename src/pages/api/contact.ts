import type { APIRoute } from 'astro';
import { sendContactEmail } from '../../lib/email';

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

export const POST: APIRoute = async ({ request, locals }) => {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'No se han recibido datos válidos.' }, 400);
  }

  if (asString(payload.website, 100).length > 0) {
    return json({ error: 'No se pudo procesar la solicitud.' }, 400);
  }

  const name = asString(payload.name, 80);
  const phone = asString(payload.phone, 20);
  const email = asString(payload.email, 120);
  const message = asString(payload.message, 1500);
  const consent = payload.consent === 'si' || payload.consent === true;

  if (name.length < 2) {
    return json({ error: 'Indica tu nombre.' }, 400);
  }
  if (phone.replace(/[^0-9]/g, '').length < 6) {
    return json({ error: 'Indica un teléfono de contacto válido.' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Indica un correo electrónico válido.' }, 400);
  }
  if (message.length < 10) {
    return json({ error: 'Cuéntanos un poco más en el mensaje.' }, 400);
  }
  if (!consent) {
    return json({ error: 'Necesitamos tu consentimiento para responderte.' }, 400);
  }

  const result = await sendContactEmail({ name, email, phone, message }, readEnv(locals));

  if (!result.sent) {
    return json(
      {
        error:
          'El formulario no está disponible en este momento. Llámanos al 913 82 08 64 y te atendemos.',
      },
      503,
    );
  }

  return json({ ok: true }, 200);
};
