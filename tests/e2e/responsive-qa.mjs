import { attachDiagnostics, launchBrowser } from './browser.mjs';
import { installMocks, seedSession, startSharedStub, stopSharedStub } from './mocks.mjs';

const BASE_URL = 'http://127.0.0.1:3000';
const VIEWPORTS = [
  { name: 'narrow-mobile', width: 320, height: 780 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];
const ROUTE_GROUPS = [
  { role: null, routes: ['/'] },
  {
    role: 'user',
    routes: [
      '/dashboard',
      '/dashboard/services',
      '/dashboard/new-order',
      '/dashboard/orders',
      '/dashboard/add-funds',
      '/dashboard/referrals',
      '/dashboard/child-panels',
      '/dashboard/live-chat',
      '/dashboard/support',
      '/dashboard/api',
      '/dashboard/settings',
    ],
  },
  {
    role: 'admin',
    routes: [
      '/admin',
      '/admin/orders',
      '/admin/services',
      '/admin/users',
      '/admin/financial',
      '/admin/audit',
      '/admin/settings',
      '/admin/live-chat',
      '/admin/support',
      '/admin/announcements',
      '/admin/margins',
      '/admin/payments',
      '/admin/providers',
    ],
  },
];

const failures = [];
let checked = 0;

await startSharedStub();
try {
  const browser = await launchBrowser();
  try {
    for (const group of ROUTE_GROUPS) {
      const context = await browser.newContext({ viewport: VIEWPORTS[0] });
      const page = await context.newPage();
      const diagnostics = attachDiagnostics(page);
      await installMocks(page);
      if (group.role) await seedSession(page, group.role);

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const route of group.routes) {
          const errorCount = diagnostics.pageErrors.length;
          try {
            await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(750);
            const layout = await page.evaluate(() => {
              const main = document.querySelector('main');
              const rect = main?.getBoundingClientRect();
              return {
                viewport: window.innerWidth,
                document: document.documentElement.scrollWidth,
                body: document.body.scrollWidth,
                main: rect
                  ? { left: Math.round(rect.left), right: Math.round(rect.right) }
                  : null,
              };
            });
            checked += 1;
            const pageOverflow = layout.document > viewport.width + 1 || layout.body > viewport.width + 1;
            if (pageOverflow) {
              failures.push({ role: group.role ?? 'public', viewport: viewport.name, route, type: 'horizontal overflow', layout });
            }
            if (layout.main && (layout.main.left < -1 || layout.main.right > viewport.width + 1)) {
              failures.push({ role: group.role ?? 'public', viewport: viewport.name, route, type: 'main outside viewport', layout });
            }
            const newPageErrors = diagnostics.pageErrors.slice(errorCount);
            if (newPageErrors.length) {
              failures.push({ role: group.role ?? 'public', viewport: viewport.name, route, type: 'browser error', error: newPageErrors[0] });
            }
          } catch (error) {
            failures.push({ role: group.role ?? 'public', viewport: viewport.name, route, type: 'navigation error', error: String(error) });
          }
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  await stopSharedStub();
}

console.log(`Responsive QA: ${checked} route/viewport combinations across 320px, 390px, and 1440px.`);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log('PASS: no horizontal overflow, main-content clipping, or page errors.');
}
