// @ts-check
import { chromium } from 'playwright';

const BASE = 'https://ddf73f03.clinica-dental-hortaleza.pages.dev';
const out = [];
const log = (kind, msg) => { const l = `[${kind}] ${msg}`; console.log(l); out.push(l); };

async function shot(page, name) {
  await page.screenshot({ path: `.playwright-mcp/${name}.png`, fullPage: false });
}

async function testPage(name, path) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push(String(e)));
  try {
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    const status = resp.status();
    const title = await page.title();
    const html = await page.content();
    log('PAGE', `${name}: HTTP ${status} | title="${title.slice(0,55)}" | html=${html.length}B | jsErrs=${errs.length}`);
    if (errs.length) errs.slice(0,3).forEach(e => log('PAGE', `  ! ${e.slice(0,110)}`));
    await shot(page, name.replace(/\W+/g, '-'));
  } catch (e) {
    log('ERROR', `${name}: ${e.message.slice(0,180)}`);
  } finally {
    await browser.close();
  }
}

async function testBookingFlow() {
  log('FLOW', '=== Flujo de reserva completo ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  let apiPostStatus = null, apiPostBody = null;
  page.on('response', async r => {
    if (r.url().endsWith('/api/booking') && r.request().method() === 'POST') {
      apiPostStatus = r.status();
      apiPostBody = await r.text();
    }
  });

  await page.goto(`${BASE}/pedir-cita`, { waitUntil: 'networkidle' });
  log('FLOW', '1. /pedir-cita cargada');

  // Seleccionar tratamiento
  await page.locator('input[name="treatment"][value="primera-visita"]').check();
  log('FLOW', '2. Tratamiento "primera-visita" seleccionado');

  // Fecha: próximo martes (hoy es 2026-11-19)
  const now = new Date('2026-11-19T12:00:00Z');
  const target = new Date(now);
  target.setUTCDate(target.getUTCDate() + 5);
  while (target.getUTCDay() !== 2) target.setUTCDate(target.getUTCDate() + 1);
  const dateStr = target.toISOString().slice(0, 10);
  await page.locator('#date').fill(dateStr);
  log('FLOW', `3. Fecha fijada: ${dateStr} (martes)`);

  await page.waitForSelector('#slots button', { timeout: 10000 });
  const slots = await page.locator('#slots button').count();
  log('FLOW', `4. ${slots} slots disponibles cargados`);

  if (slots === 0) { log('ERROR', 'No hay slots disponibles'); await browser.close(); return false; }

  const slot = (await page.locator('#slots button').first().textContent()).trim();
  await page.locator('#slots button').first().click();
  log('FLOW', `5. Slot "${slot}" seleccionado`);

  await page.locator('#name').fill('Usuario Prueba E2E');
  await page.locator('#phone').fill('612345678');
  await page.locator('#email').fill('e2e-prueba@example.com');
  await page.locator('#notes').fill('Prueba automatizada de flujo completo');
  log('FLOW', '6. Datos personales rellenados');

  await page.locator('input[name="consent"]').check();
  log('FLOW', '7. Consentimiento marcado');

  await page.locator('#booking-submit').click();
  log('FLOW', '8. Formulario enviado');

  await page.waitForSelector('#booking-success:not([hidden])', { timeout: 15000 });
  const successText = await page.locator('#booking-success-text').textContent();
  log('FLOW', `9. ÉXITO: "${successText?.slice(0,120) || 'NINGUNO'}"`);
  if (apiPostStatus) log('FLOW', `   API POST /api/booking = HTTP ${apiPostStatus} | ${apiPostBody?.slice(0,180) || ''}`);

  const hidden = await page.locator('#booking-form').isHidden();
  log('FLOW', `10. Formulario oculto tras éxito: ${hidden}`);

  await shot(page, 'booking-success');
  await browser.close();
  log('FLOW', '=== Reserva completada ===');
  return true;
}

async function testContactFlow() {
  log('FLOW', '=== Flujo de contacto ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  let apiStatus = null, apiBody = null;
  page.on('response', async r => {
    if (r.url().includes('/api/contact') && r.request().method() === 'POST') {
      apiStatus = r.status();
      apiBody = await r.text();
    }
  });

  await page.goto(`${BASE}/contacto`, { waitUntil: 'networkidle' });
  log('FLOW', '1. /contacto cargada');

  await page.locator('input[name="name"], input#name, input[type="text"]').first().fill('Usuario Prueba E2E');
  await page.locator('input[name="email"], input#email, input[type="email"]').first().fill('e2e-contacto@example.com');
  await page.locator('input[name="phone"], input#phone, input[type="tel"]').first().fill('612345678');
  await page.locator('textarea[name="message"], textarea#message, textarea').first().fill('Hola, me gustaría recibir información sobre ortodoncia.');
  await page.locator('input[name="consent"], input[type="checkbox"]').first().check();
  log('FLOW', '2. Formulario rellenado');

  await page.locator('button[type="submit"]').first().click();
  log('FLOW', '3. Formulario enviado');

  await page.waitForTimeout(3000);

  if (apiStatus) log('FLOW', `4. API POST /api/contact = HTTP ${apiStatus} | ${apiBody?.slice(0,180) || ''}`);
  else log('FLOW', '4. No se interceptó respuesta del API');

  const body = await page.locator('body').innerText();
  const ok = /gracias|enviado|recibido|confirm|exito/i.test(body);
  log('FLOW', `5. Mensaje de éxito visible en página: ${ok ? 'SÍ' : 'NO'}`);
  if (ok) {
    const m = body.match(/.{0,90}(gracias|enviado|recibido|confirm|exito).{0,90}/i);
    if (m) log('FLOW', `   texto: ...${m[0]}...`);
  }

  await shot(page, 'contact-success');
  await browser.close();
  log('FLOW', '=== Contacto completado ===');
}

(async () => {
  log('INIT', `Base: ${BASE}`);
  log('INIT', `Fecha de prueba: ${new Date().toISOString().slice(0,10)}`);

  log('TEST', 'Navegación por páginas:');
  const pages = [
    ['home', '/'],
    ['pedir-cita', '/pedir-cita'],
    ['contacto', '/contacto'],
    ['clinica', '/clinica'],
    ['equipo', '/equipo'],
    ['tratamientos', '/tratamientos'],
    ['blog', '/blog'],
    ['legal-aviso', '/legal/aviso-legal'],
  ];
  for (const [n, p] of pages) {
    try { await testPage(n, p); } catch (e) { log('ERROR', `${n}: ${e.message.slice(0,160)}`); }
  }

  log('TEST', '=== Flujo reserva ===');
  try { await testBookingFlow(); } catch (e) { log('ERROR', `Booking: ${e.message.slice(0,260)}`); }

  log('TEST', '=== Flujo contacto ===');
  try { await testContactFlow(); } catch (e) { log('ERROR', `Contacto: ${e.message.slice(0,260)}`); }

  log('DONE', '=== Pruebas de navegador finalizadas ===');
  process.exit(0);
})();