import { Resend } from 'resend';
import { clinic, addressLine } from '../data/clinic';
import { formatLongDate } from './booking-engine';

export type Env = Record<string, string | undefined>;

export interface BookingEmailData {
  name: string;
  email: string;
  phone: string;
  treatmentName: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
}

export interface ContactEmailData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

const PROD_FROM = 'Clínica Dental Hortaleza <citas@clinicadentalhortaleza.com>';
const DEV_FROM = 'Clínica Dental Hortaleza <onboarding@resend.dev>';

function escapeHtml(value: string): string {
  let output = '';
  for (const char of value) {
    switch (char) {
      case '&':
        output += '&amp;';
        break;
      case '<':
        output += '&lt;';
        break;
      case '>':
        output += '&gt;';
        break;
      case '"':
        output += '&quot;';
        break;
      case "'":
        output += '&#39;';
        break;
      default:
        output += char;
    }
  }
  return output;
}

function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function layout(title: string, rows: string, footerNote: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f8f3ea;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#10262b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;">
      <tr><td>
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#0f6268;">${escapeHtml(clinic.name)}</p>
        <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;">${escapeHtml(title)}</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5;">${rows}</table>
        <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#566b70;">${escapeHtml(footerNote)}</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#566b70;width:38%;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-weight:600;">${escapeHtml(value)}</td>
  </tr>`;
}

function getConfig(env: Env) {
  const apiKey = env.RESEND_API_KEY;
  const to = env.BOOKING_TO_EMAIL ?? clinic.email ?? undefined;
  const from =
    env.BOOKING_FROM_EMAIL ??
    (env.RESEND_ENV === 'dev' ? DEV_FROM : PROD_FROM);
  return { apiKey, to, from };
}

export async function sendBookingEmails(
  data: BookingEmailData,
  env: Env,
): Promise<SendResult> {
  const { apiKey, to, from } = getConfig(env);

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY no configurada: no se envía el correo de la cita.');
    return { sent: false, reason: 'not-configured' };
  }
  if (!to) {
    console.warn('[email] BOOKING_TO_EMAIL no configurada: no hay buzón de recepción.');
    return { sent: false, reason: 'no-recipient' };
  }

  const resend = new Resend(apiKey);
  const prettyDate = formatLongDate(data.date);
  const detailRows = [
    row('Tratamiento', data.treatmentName),
    row('Fecha', prettyDate),
    row('Hora', `${data.time} h`),
    row('Duración estimada', `${data.duration} minutos`),
    row('Dirección', addressLine),
    row('Teléfono de la clínica', clinic.phoneDisplay),
  ].join('');

  const patientHtml = layout(
    'Tu cita está solicitada',
    `${row('Nombre', data.name)}${detailRows}`,
    'Te esperamos en la clínica. Si necesitas cambiar o anular la cita, llámanos al ' +
      clinic.phoneDisplay +
      '. Esta solicitud queda pendiente de confirmación por recepción.',
  );

  const receptionHtml = layout(
    'Nueva solicitud de cita',
    `${row('Paciente', data.name)}${row('Teléfono', data.phone)}${row('Email', data.email)}${detailRows}${
      data.notes ? row('Notas', data.notes) : ''
    }`,
    'Responder a este correo contacta directamente con el paciente.',
  );

  try {
    const patientRes = await resend.emails.send({
      from,
      to: [data.email],
      replyTo: to,
      subject: singleLine(`Cita solicitada · ${data.treatmentName} · ${prettyDate} ${data.time}`),
      html: patientHtml,
    });
    if (patientRes.error) {
      console.error('[email] Error al enviar la confirmación al paciente', patientRes.error);
      return { sent: false, reason: 'send-error' };
    }

    const receptionRes = await resend.emails.send({
      from,
      to: [to],
      replyTo: data.email,
      subject: singleLine(
        `Nueva cita web · ${data.name} · ${data.date} ${data.time} · ${data.treatmentName}`,
      ),
      html: receptionHtml,
    });
    if (receptionRes.error) {
      console.error('[email] Error al enviar el aviso de cita a recepción', receptionRes.error);
      return { sent: false, reason: 'send-error' };
    }

    return { sent: true };
  } catch (error) {
    console.error('[email] Error al enviar la confirmación de cita', error);
    return { sent: false, reason: 'send-error' };
  }
}

export async function sendContactEmail(
  data: ContactEmailData,
  env: Env,
): Promise<SendResult> {
  const { apiKey, to, from } = getConfig(env);

  if (!apiKey || !to) {
    console.warn('[email] Falta configuración de Resend: no se envía el mensaje de contacto.');
    return { sent: false, reason: 'not-configured' };
  }

  const resend = new Resend(apiKey);
  const html = layout(
    'Nuevo mensaje desde la web',
    `${row('Nombre', data.name)}${row('Email', data.email)}${row('Teléfono', data.phone)}${
      data.message ? row('Mensaje', data.message) : ''
    }`,
    'Responde a este correo para contestar al paciente.',
  );

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: data.email,
      subject: singleLine(`Consulta web · ${data.name}`),
      html,
    });
    if (error) {
      console.error('[email] Error al enviar el mensaje de contacto', error);
      return { sent: false, reason: 'send-error' };
    }
    return { sent: true };
  } catch (error) {
    console.error('[email] Error al enviar el mensaje de contacto', error);
    return { sent: false, reason: 'send-error' };
  }
}
