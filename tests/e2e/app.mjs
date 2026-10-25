/**
 * Authenticated UI/UX suite — runs fully offline against the local production
 * build with Supabase fulfilled by tests/e2e/mocks.mjs.
 * Run: node tests/e2e/app.mjs  (expects http://127.0.0.1:3000)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, attachDiagnostics } from './browser.mjs';
import { installMocks, seedSession, startSharedStub, stopSharedStub, resetMutations } from './mocks.mjs';

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:3000';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'artifacts');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const assert = (name, cond, detail = '') => check(name, Boolean(cond), detail);

async function suite(role) {
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const diag = attachDiagnostics(page);
  const { mutations } = await installMocks(page);
  resetMutations();
  await seedSession(page, role);

  const goto = (p) => page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const shot = (n) => page.screenshot({ path: path.join(SHOTS, n), fullPage: true }).catch(() => {});
  const wait = (ms) => page.waitForTimeout(ms);
  // Poll the stub's mutation log instead of relying on fixed sleeps — page
  // load jitter under a full browser run can outlast a static wait.
  const waitForMutation = async (predicate, timeoutMs = 8000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const hit = mutations.find(predicate);
      if (hit) return hit;
      await wait(150);
    }
    return mutations.find(predicate);
  };

  try {
    if (role === 'user') {
      /* ----------------------------------------------------- Dashboard */
      await goto('/dashboard');
      await page.waitForSelector('text=hassan_tester', { timeout: 15_000 });
      assert('user dashboard renders identity', true);
      await wait(1500);
      await shot('10-user-dashboard.png');

      const bell = page.getByRole('button', { name: /notifications/i });
      await bell.waitFor({ state: 'visible' });
      const badgeText = await bell.locator('span.bg-primary-500').textContent().catch(() => '');
      assert('notification unread badge shows 2', badgeText?.trim() === '2', `badge="${badgeText?.trim()}"`);

      await bell.click();
      await page.waitForSelector('text=Order in progress');
      assert('bell dropdown lists notifications', await page.locator('text=Referral reward credited').count());
      await shot('11-notification-bell.png');
      await page.getByRole('button', { name: /mark all read/i }).click();
      await wait(400);
      const badgeAfter = await bell.locator('span.bg-primary-500').count();
      assert('mark-all-read clears badge', badgeAfter === 0, `count=${badgeAfter}`);
      await page.keyboard.press('Escape');

      // Balance trend must be a real curve, not a flat line (sparse-order
      // accounts previously collapsed every point to one Y coordinate).
      const trendShape = await page.evaluate(() => {
        const path = document.querySelector('.recharts-area-curve');
        const nums = (path?.getAttribute('d') || '').match(/-?\d+\.?\d*/g) || [];
        const ys = nums.slice(1).filter((_, i) => i % 2 === 1).map(Number);
        return { points: ys.length, distinct: new Set(ys.map((y) => Math.round(y))).size };
      });
      assert(
        'balance trend renders a shaped curve, not flat',
        trendShape.points >= 6 && trendShape.distinct >= 4,
        JSON.stringify(trendShape)
      );

      /* ------------------------------------------------------- Referrals */
      await goto('/dashboard/referrals');
      await page.waitForSelector('text=PFTEST001');
      const body1 = await page.locator('body').innerText();
      assert('referrals shows referred users', body1.includes('ref_one') && body1.includes('ref_two'));
      assert('referrals shows reward amount', /2\.00|\$2/.test(body1));
      await shot('12-referrals.png');

      /* ---------------------------------------------------- Child panels */
      await goto('/dashboard/child-panels');
      await page.waitForSelector('text=child_panel');
      const body2 = await page.locator('body').innerText();
      assert('child invite link carries child_of', body2.includes('child_of=PFTEST001'));
      assert('child balance visible', body2.includes('18.25'));
      await page.getByRole('button', { name: /fund/i }).first().click();
      await page.waitForSelector('text=Confirm transfer');
      await page.locator('input[type="number"]').last().fill('10');
      await page.getByRole('button', { name: 'Confirm transfer' }).click();
      const transfer = await waitForMutation((m) => m.rpc === 'transfer_to_child');
      assert('transfer_to_child RPC called with amount', transfer?.body?.p_amount === 10, JSON.stringify(transfer?.body));
      await shot('13-child-panels.png');

      /* -------------------------------------------------------- Live chat */
      await goto('/dashboard/live-chat');
      await page.waitForSelector('text=When will my drip order finish?');
      assert('user chat history renders', await page.locator('text=run 3 goes out').count());
      await page.locator('input[placeholder*="message" i]').fill('Thanks, that helps!');
      await page.getByRole('button', { name: /send/i }).click();
      const sent = await waitForMutation((m) => m.table === 'chat_messages');
      assert('chat insert carries user role', sent?.body?.sender_role === 'user', JSON.stringify(sent?.body));
      await shot('14-live-chat-user.png');

      /* -------------------------------------------------------- New order */
      await goto('/dashboard/new-order');
      await page.waitForSelector('text=Drip-feed delivery', { timeout: 15_000 });
      // Catalog loads async — pick a category first, then the first service.
      const categoryBox = page.locator('[role="combobox"]').nth(0);
      await categoryBox.click();
      await page.locator('[role="option"]').first().waitFor({ timeout: 10_000 });
      await page.locator('[role="option"]').first().click();
      await wait(300);
      await page.locator('[role="combobox"]').nth(1).click();
      await page.locator('[role="option"]').first().waitFor({ timeout: 10_000 });
      await page.locator('[role="option"]').first().click();
      await wait(300);
      await page.locator('#link').fill('https://instagram.com/p/test-post');
      await page.locator('#qty').fill('5000');
      // Enable drip
      await page.locator('button[role="switch"]').first().click();
      await page.locator('#runs').fill('5');
      await page.locator('#interval').fill('60');
      await wait(300);
      const orderText = await page.locator('body').innerText();
      assert('drip split preview renders', orderText.includes('5,000') && orderText.includes('5') && /runs?/i.test(orderText));
      assert('drip per-run math shown', orderText.includes('1,000'));
      await shot('15-new-order-drip.png');

      /* ----------------------------------------------------------- Orders */
      await goto('/dashboard/orders');
      await page.waitForSelector('text=ord-drip-0001'.replace('ord-drip-0001', 'Drip')).catch(() => {});
      await wait(800);
      const ordersText = await page.locator('body').innerText();
      assert('orders table shows drip progress', /Drip\s*·?\s*2\/5 runs/.test(ordersText.replace(/\n/g, ' ')));
      await shot('16-orders.png');
    } else {
      /* ------------------------------------------------------ Admin shell */
      await goto('/admin');
      await wait(1200);
      assert('admin area loads', page.url().includes('/admin'));
      // HEAD-count stats must resolve from the stub's content-range headers.
      const overviewStats = await page.evaluate(() => {
        const out = {};
        document.querySelectorAll('p').forEach((p) => {
          const title = p.textContent.trim().toUpperCase();
          if (['TOTAL USERS', 'TOTAL ORDERS', 'REVENUE', 'SERVICES'].includes(title)) {
            out[title] = p.parentElement.querySelector('p.tabular')?.textContent.trim();
          }
        });
        return out;
      });
      assert('admin overview counts resolve via head requests', overviewStats['TOTAL USERS'] === '3' && overviewStats['TOTAL ORDERS'] === '2' && overviewStats['SERVICES'] === '3', JSON.stringify(overviewStats));
      assert('admin overview revenue from completed payments', overviewStats['REVENUE'] === '$21.00', JSON.stringify(overviewStats));
      await shot('20-admin-overview.png');

      /* -------------------------------------------------------- Financial */
      await goto('/admin/financial');
      await page.waitForSelector('text=Daily revenue', { timeout: 15_000 });
      const finText = await page.locator('body').innerText();
      assert('financial totals computed (charges 369.95)', finText.includes('369.95'));
      assert('financial net profit computed (108.00)', finText.includes('108.00'));
      assert('earnings table populated', finText.includes('3.60'));
      // CSS bar chart: percentage heights must actually resolve to pixels
      // (regression guard — items-end once collapsed every bar to 0px).
      const barHeights = await page
        .locator('.flex.h-44 [style*="height"]')
        .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
      assert(
        'daily revenue bars render with non-zero height',
        barHeights.length >= 2 && barHeights.every((h) => h > 4),
        JSON.stringify(barHeights)
      );
      await shot('21-admin-financial.png');

      /* ------------------------------------------------------------- Audit */
      await goto('/admin/audit');
      await page.waitForSelector('text=app_settings.update');
      let auditText = await page.locator('body').innerText();
      assert('audit lists 3 events', auditText.includes('orders.update') && auditText.includes('provider_margin_rules.insert'));
      await page.locator('input[placeholder="Search actions, ids, metadata"]').fill('margin');
      await wait(400);
      auditText = await page.locator('body').innerText();
      assert('audit search filters rows', auditText.includes('provider_margin_rules.insert') && !auditText.includes('app_settings.update'));
      await shot('22-admin-audit.png');

      /* ---------------------------------------------------------- Settings */
      await goto('/admin/settings');
      // The topbar search is the page's first input, so match by value.
      // Poll explicitly (waitForFunction is unreliable on this Chromium build).
      let seeded = false;
      for (let i = 0; i < 24; i++) {
        const values = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map((x) => x.value));
        if (values.includes('PayFollows')) {
          seeded = true;
          break;
        }
        await wait(500);
      }
      // innerText never exposes input values, so assert on the polled values.
      assert('settings seeded from app_settings', seeded);
      // Toggle maintenance on, save
      const switches = page.locator('button[role="switch"]');
      await switches.nth(1).click(); // Maintenance mode is the 2nd toggle
      await page.getByRole('button', { name: /save settings/i }).click();
      const save = await waitForMutation((m) => m.table === 'app_settings');
      assert(
        'settings persist via app_settings write',
        save?.body?.config?.maintenance === true,
        (JSON.stringify(save?.body?.config) ?? 'no app_settings mutation').slice(0, 120)
      );
      // The audit RPC lands just after the settings upsert — poll for it.
      const auditWrite = await waitForMutation((m) => m.rpc === 'write_audit');
      assert('settings save writes audit entry', Boolean(auditWrite), 'write_audit RPC not observed');
      await shot('23-admin-settings.png');

      /* --------------------------------------------------------- Live chat */
      await goto('/admin/live-chat');
      await page.waitForSelector('text=child_panel');
      await page.locator('button', { hasText: 'child_panel' }).first().click();
      await wait(600);
      await page.locator('input[placeholder*="reply" i]').fill('Looking into it now.');
      await page.getByRole('button', { name: /reply/i }).click();
      const adminMsg = await waitForMutation((m) => m.table === 'chat_messages');
      assert('admin chat insert role=admin', adminMsg?.body?.sender_role === 'admin', JSON.stringify(adminMsg?.body));
      await page.getByRole('button', { name: /close/i }).click();
      const statusPatch = await waitForMutation((m) => m.table === 'chat_channels');
      assert('channel close persists status', statusPatch?.body?.status === 'closed', JSON.stringify(statusPatch?.body));
      await shot('24-admin-live-chat.png');

      /* ------------------------------------------------------ Admin orders */
      await goto('/admin/orders');
      await wait(1000);
      const adminOrders = await page.locator('body').innerText();
      assert('admin orders show drip interval', /every 60m/.test(adminOrders));
      assert('admin orders resolve embedded user', adminOrders.includes('hassan_tester'));
      await shot('25-admin-orders.png');
    }

    // Harness-induced noise: aborted analytics script and navigation-driven
    // request aborts (ERR_ABORTED) are not application defects.
    const realErrors = diag.consoleErrors.filter(
      (e) =>
        !e.includes('vercel') &&
        !e.includes('ERR_ABORTED') &&
        !e.includes('ERR_FAILED') &&
        !e.includes('ERR_CONNECTION_CLOSED')
    );
    check(`${role} no app console errors`, realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
    check(`${role} no uncaught page errors`, diag.pageErrors.length === 0, diag.pageErrors.slice(0, 2).join(' | '));
  } catch (err) {
    check(`${role} suite runtime`, false, String(err).slice(0, 300));
    await shot(`99-error-${role}.png`);
  } finally {
    await browser.close();
  }
}

await startSharedStub();
try {
  await suite('user');
  await suite('admin');
} finally {
  await stopSharedStub();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(path.join(SHOTS, 'app-results.json'), JSON.stringify({ results }, null, 2));
process.exit(failed.length ? 1 : 0);
