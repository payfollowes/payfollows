/**
 * Authenticated route sweep — visits every dashboard/admin route and asserts
 * the page renders real content without console errors, uncaught exceptions
 * or failed network calls. Complements app.mjs, which deep-tests key flows.
 * Run: node tests/e2e/sweep.mjs  (expects http://127.0.0.1:3000)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, attachDiagnostics } from './browser.mjs';
import { installMocks, seedSession, startSharedStub, stopSharedStub } from './mocks.mjs';

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:3000';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'artifacts');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const USER_ROUTES = [
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
];

const ADMIN_ROUTES = [
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
];

const harnessNoise = (e) =>
  e.includes('vercel') ||
  e.includes('ERR_ABORTED') ||
  e.includes('ERR_FAILED') ||
  e.includes('ERR_CONNECTION_CLOSED') ||
  e.includes('404 (Not Found)');

async function sweep(role, routes) {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const diag = attachDiagnostics(page);
  await installMocks(page);
  await seedSession(page, role);

  for (const route of routes) {
    const errorsBefore = diag.consoleErrors.length;
    const pageErrorsBefore = diag.pageErrors.length;
    const failedBefore = diag.failedRequests.length;
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      // Give client data fetching + skeleton → content transitions time.
      await page.waitForTimeout(2200);

      const state = await page.evaluate(() => ({
        url: location.pathname,
        text: document.body.innerText.trim().length,
        bodyText: document.body.innerText,
        stuckLoading: /loading your workspace|loading\.\.\./i.test(document.body.innerText),
        hasMain: Boolean(document.querySelector('main, [role="main"], h1')),
      }));
      const nanLeak = /\$NaN|\bNaN\b|undefined\b/.test(state.bodyText) ? state.bodyText.match(/.{0,12}(\$?NaN|undefined).{0,12}/)?.[0] : '';

      const newConsole = diag.consoleErrors.slice(errorsBefore).filter((e) => !harnessNoise(e));
      const newPageErrors = diag.pageErrors.slice(pageErrorsBefore);
      const newFailed = diag.failedRequests.slice(failedBefore).filter((e) => !harnessNoise(e));

      const stayed = state.url.includes(route) || state.url.startsWith(route);
      // >=120 chars accommodates legitimate empty states ("No tickets" etc.)
      // while still catching crashed/blank routes (shell alone is ~100).
      check(
        `${role} ${route} renders content`,
        stayed && state.hasMain && state.text >= 120 && !state.stuckLoading,
        `url=${state.url} chars=${state.text} loading=${state.stuckLoading} main=${state.hasMain}`
      );
      check(`${role} ${route} clean runtime`, newConsole.length === 0 && newPageErrors.length === 0 && newFailed.length === 0,
        [...newConsole, ...newPageErrors, ...newFailed].slice(0, 2).join(' | '));
      check(`${role} ${route} no NaN/undefined leakage`, !nanLeak, nanLeak);
    } catch (err) {
      check(`${role} ${route} navigates`, false, String(err).slice(0, 160));
      await page.screenshot({ path: path.join(SHOTS, `sweep-fail-${role}-${route.replace(/\W/g, '-')}.png`) }).catch(() => {});
    }
  }

  await browser.close();
}

await startSharedStub();
try {
  await sweep('user', USER_ROUTES);
  await sweep('admin', ADMIN_ROUTES);
} finally {
  await stopSharedStub();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(path.join(SHOTS, 'sweep-results.json'), JSON.stringify({ results }, null, 2));
process.exit(failed.length ? 1 : 0);
