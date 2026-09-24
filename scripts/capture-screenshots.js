const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.resolve(__dirname, '../docs/screenshots');
const PUBLIC_DIR = path.resolve(__dirname, '../apps/web/public/screenshots');

[DOCS_DIR, PUBLIC_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function saveScreenshot(page, filename) {
  const docsPath = path.join(DOCS_DIR, filename);
  const publicPath = path.join(PUBLIC_DIR, filename);

  await page.screenshot({ path: docsPath, fullPage: false });
  fs.copyFileSync(docsPath, publicPath);
  console.log(`[OK] Generado: ${filename} -> (${docsPath})`);
}

async function run() {
  console.log('Iniciando navegador Chrome en resolución 1920x1080...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });

  const page = await context.newPage();
  const baseUrl = 'http://localhost:3000';

  console.log(`Navegando a ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // -------------------------------------------------------------
  // HU-01: Registro & Login
  // -------------------------------------------------------------
  console.log('Capturando HU-01: Registro & Login...');
  await page.click('#tab-btn-register');
  await page.waitForTimeout(600);
  // Ir al Paso 2 para ver Rol, Zona Horaria y Habilidades interactivas con nivel
  const step2Btn = page.locator('#stepper-step-2-btn');
  if (await step2Btn.isVisible()) {
    await step2Btn.click();
    await page.waitForTimeout(600);
  }
  // Centrar el formulario en el viewport para máxima visibilidad de los campos y skills
  await page.evaluate(() => window.scrollTo({ top: 320, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await saveScreenshot(page, 'hu01-registro-login.png');

  // Reset scroll
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);

  // -------------------------------------------------------------
  // HU-02: Publicar Solicitud
  // -------------------------------------------------------------
  console.log('Capturando HU-02: Publicar Solicitud...');
  await page.click('#tab-btn-new-request');
  await page.waitForTimeout(600);
  // Centrar el formulario de publicación
  await page.evaluate(() => window.scrollTo({ top: 280, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await saveScreenshot(page, 'hu02-publicar-solicitud.png');

  // Reset scroll
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);

  // -------------------------------------------------------------
  // HU-03: Feed Global
  // -------------------------------------------------------------
  console.log('Capturando HU-03: Feed Global & Filtros...');
  await page.click('#tab-btn-feed');
  await page.waitForTimeout(1200);
  await saveScreenshot(page, 'hu03-feed-global.png');

  // -------------------------------------------------------------
  // HU-04: Sala Sesión Jitsi
  // -------------------------------------------------------------
  console.log('Capturando HU-04: Sala Sesión Jitsi...');
  await page.click('#btn-demo-jitsi');
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'hu04-sala-sesion-jitsi.png');

  // Cerrar modal de Jitsi pulsando Escape o tecla
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // -------------------------------------------------------------
  // HU-05: Calificación y Feedback
  // -------------------------------------------------------------
  console.log('Capturando HU-05: Calificación y Feedback...');
  await page.click('#btn-demo-feedback');
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'hu05-calificacion-feedback.png');

  await browser.close();
  console.log('\n¡Todas las capturas de pantalla fueron generadas exitosamente!');
}

run().catch((err) => {
  console.error('Error al capturar pantallas:', err);
  process.exit(1);
});
