/**
 * Anonymous (unauthenticated) smoke suite for the live PayFollows deployment.
 * Run: node tests/e2e/smoke.mjs [baseUrl]
 * Screenshots land in tests/e2e/artifacts (gitignored).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, attachDiagnostics } from './browser.mjs';
import { startSharedStub, stopSharedStub } from './mocks.mjs';

// Defaults to the local production build; pass a live URL to run against Vercel.
const BASE = process.argv[2] || 'http://127.0.0.1:3000';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'artifacts');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

await startSharedStub();
const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const diag = attachDiagnostics(page);
await page.route('**/va.vercel-scripts.com/**', (route) => route.abort());
await page.route('**/_vercel/insights/**', (route) => route.abort());

async function shot(name) {
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: true }).catch(() => {});
}

try {
  /* ------------------------------------------------------------ Landing */
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(1500);
  const title = await page.title();
  check('landing title', title.includes('PayFollows'), title);

  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  check('landing hero H1 present', Boolean(h1 && h1.trim().length > 5), h1?.trim().slice(0, 60));

  const navLinks = await page.locator('a').count();
  check('landing has navigation/links', navLinks >= 8, `${navLinks} links`);

  // Scroll through the whole page so scroll-reveal sections settle (mirrors a
  // real user and makes full-page screenshots complete). behavior:'instant'
  // is required because the app sets scroll-behavior:smooth, which would
  // otherwise animate each jump and never reach deep sections in time.
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 700) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 100));
    }
    // Settle at the bottom so the last sections' observers/state flush
    // before jumping back to the top.
    await new Promise((r) => setTimeout(r, 400));
  });

  // Deterministic backstop: anything still hidden gets scrolled into view
  // explicitly, with a hard deadline, so frame-sampling races can't flake.
  await page.evaluate(async () => {
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      const stuck = Array.from(document.querySelectorAll('[data-reveal]')).filter(
        (el) => !el.hasAttribute('data-reveal-visible')
      );
      if (stuck.length === 0) break;
      stuck[0].scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(600);

  // No section may be stuck invisible or empty — guards against reveal regressions.
  const blankSections = await page.evaluate(() =>
    Array.from(document.querySelectorAll('section'))
      // Radix toast/aria live regions are intentionally empty at rest.
      .filter((s) => !s.getAttribute('aria-live'))
      .filter((s) => {
        const cs = getComputedStyle(s);
        const r = s.getBoundingClientRect();
        return Number(cs.opacity) < 0.5 || r.height < 40 || s.innerText.trim().length < 20;
      })
      .map((s) => s.id || s.querySelector('h2,h3')?.textContent?.trim().slice(0, 40) || 'unnamed')
  );
  check('landing all sections visible and populated', blankSections.length === 0, blankSections.join(', '));

  // Every scroll-reveal element must actually have flipped visible after a
  // full scroll pass (innerText alone would hide opacity-0 failures).
  const stuckReveals = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-reveal]'))
      .filter((el) => !el.hasAttribute('data-reveal-visible'))
      .map((el) => el.textContent.trim().slice(0, 40))
  );
  check('landing no reveal elements stuck hidden', stuckReveals.length === 0, stuckReveals.join(' | '));

  const brokenImages = await page.evaluate(() =>
    Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src)
  );
  check('landing no broken images', brokenImages.length === 0, brokenImages.slice(0, 3).join(', '));

  await shot('01-landing-desktop.png');

  /* ------------------------------------------------------- Mobile layout */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const bodyOverflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('mobile no horizontal overflow', bodyOverflowX <= 2, `overflow=${bodyOverflowX}px`);
  await shot('02-landing-mobile.png');
  await page.setViewportSize({ width: 1440, height: 900 });

  /* ---------------------------------------------------------- Register */
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle', timeout: 60_000 });
  const fields = ['input#username', 'input#email', 'input#password', 'input#confirm'];
  const fieldCount = await page.locator(fields.join(',')).count();
  check('register 4 fields present', fieldCount === 4, `${fieldCount}/4`);
  await shot('03-register.png');

  // Referral attribution banner
  await page.goto(`${BASE}/register?ref=PFTESTREF`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const refBanner = await page.locator('body').innerText().catch(() => '');
  check('register ?ref banner shows code', refBanner.includes('PFTESTREF'));

  // Child panel attribution banner
  await page.goto(`${BASE}/register?child_of=PFTESTCHILD`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const childText = await page.locator('body').innerText().catch(() => '');
  check('register ?child_of banner', childBannerOk(childText), childText.includes('child panel') ? 'child wording found' : 'missing');
  await shot('04-register-child.png');

  /* ------------------------------------------------------------- Login */
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 60_000 });
  const forgotHref = await page.locator('a[href*="forgot-password"]').count();
  check('login has forgot-password link', forgotHref >= 1);
  await shot('05-login.png');

  await page.goto(`${BASE}/forgot-password`, { waitUntil: 'networkidle' });
  const resetInput = await page.locator('input[type="email"]').count();
  check('forgot-password email input', resetInput >= 1);

  /* ------------------------------------------------------- Route guards */
  const guards = ['/dashboard', '/dashboard/new-order', '/dashboard/referrals', '/admin/audit', '/admin/financial'];
  for (const route of guards) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(1200);
    const url = page.url();
    check(`guard ${route} redirects to login`, url.includes('/login'), url.replace(BASE, ''));
  }

  /* ------------------------------------------------------------- 404 */
  await page.goto(`${BASE}/this-route-does-not-exist`, { waitUntil: 'networkidle' });
  const notFoundOk = (await page.locator('body').innerText().catch('')).toLowerCase().includes('not found');
  check('unknown route shows not-found', notFoundOk);
} catch (err) {
  check('suite runtime', false, String(err).slice(0, 300));
} finally {
  /* -------------------------------------------------------- Diagnostics */
  const harnessNoise = (e) =>
    e.includes('vercel') ||
    e.includes('ERR_ABORTED') ||
    e.includes('ERR_FAILED') ||
    e.includes('ERR_CONNECTION_CLOSED') ||
    e.includes('404 (Not Found)'); // the unknown-route check intentionally navigates to a 404 document
  check('no uncaught page errors', diag.pageErrors.length === 0, diag.pageErrors.slice(0, 3).join(' | '));
  check(
    'no console errors',
    diag.consoleErrors.filter((e) => !harnessNoise(e)).length === 0,
    diag.consoleErrors.filter((e) => !harnessNoise(e)).slice(0, 3).join(' | ')
  );
  check(
    'no failed/5xx requests',
    diag.failedRequests.filter((e) => !harnessNoise(e)).length === 0,
    diag.failedRequests.filter((e) => !harnessNoise(e)).slice(0, 5).join(' | ')
  );

  await browser.close();
  await stopSharedStub();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  fs.writeFileSync(path.join(SHOTS, 'smoke-results.json'), JSON.stringify({ base: BASE, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

function childBannerOk(text) {
  return text.includes('PFTESTCHILD') && /child panel/i.test(text);
}
