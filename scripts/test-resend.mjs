// Script de prueba para verificar el envío de correos con Resend.
// No envía correo real a menos que se proporcionen RESEND_API_KEY y TEST_TO_EMAIL.
//
// Ejecución (PowerShell):
//   $env:RESEND_API_KEY="re_xxx"; $env:TEST_TO_EMAIL="destino@example.com"; node scripts/test-resend.mjs
//
// Ejecución (bash de Hermes):
//   RESEND_API_KEY=re_xxx TEST_TO_EMAIL=destino@example.com node scripts/test-resend.mjs
//
// Resultado: imprime éxito o fallo con la razón y termina con código de salida 0 o 1.

import { Resend } from 'resend';

const API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.TEST_TO_EMAIL;
const FROM_EMAIL = process.env.TEST_FROM_EMAIL || 'Clínica Dental Hortaleza <onboarding@resend.dev>';

async function main() {
  console.log('[test-resend] Iniciando prueba de envío con Resend...');

  if (!API_KEY) {
    console.log('[test-resend] FALLO: RESEND_API_KEY no definida.');
    console.log('[test-resend] Resultado: fallado | razón: not-configured (falta RESEND_API_KEY)');
    process.exit(1);
  }

  if (!TO_EMAIL) {
    console.log('[test-resend] FALLO: TEST_TO_EMAIL no definida.');
    console.log('[test-resend] Resultado: fallado | razón: no-recipient (falta TEST_TO_EMAIL)');
    process.exit(1);
  }

  const resend = new Resend(API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: 'Prueba de envío · Clínica Dental Hortaleza',
      html:
        '<p>Este es un correo de prueba del módulo de notificaciones de la clínica.</p>' +
        '<p>Si lo has recibido, la integración con Resend funciona correctamente.</p>',
      text: 'Este es un correo de prueba del módulo de notificaciones de la clínica.',
    });

    if (error) {
      console.log('[test-resend] FALLO: la API de Resend devolvió un error.');
      console.log(
        `[test-resend] Resultado: fallado | razón: ${error.message ?? 'send-error'}`,
      );
      process.exit(1);
    }

    console.log('[test-resend] ÉXITO: correo enviado.');
    console.log(
      `[test-resend] Resultado: enviado | razón: ok | id: ${data?.id ?? 'n/d'}`,
    );
    process.exit(0);
  } catch (err) {
    console.log('[test-resend] FALLO: excepción al llamar a la API de Resend.');
    console.log(`[test-resend] Resultado: fallado | razón: ${err?.message ?? String(err)}`);
    process.exit(1);
  }
}

main();
