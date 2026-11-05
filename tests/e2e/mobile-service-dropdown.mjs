/**
 * Regression check for the New Order category/service menus on a phone-sized viewport.
 * Run the local Next production server (see tests/e2e/README.md), then:
 *   node tests/e2e/mobile-service-dropdown.mjs
 */
import { launchBrowser } from './browser.mjs';
import { installMocks, seedSession, stopSharedStub } from './mocks.mjs';

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:3000';
const viewport = { width: 360, height: 740 };
const longServiceName = 'Instagram Real Followers — High Quality';
const failures = [];
const assert = (name, condition, detail = '') => {
  const passed = Boolean(condition);
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!passed) failures.push(name);
};

const browser = await launchBrowser();
try {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await installMocks(page);
  await seedSession(page, 'user');
  await page.goto(`${BASE}/dashboard/new-order`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const categorySelect = page.getByRole('combobox').nth(0);
  await categorySelect.waitFor({ state: 'visible', timeout: 15_000 });
  await categorySelect.click();
  const categoryList = page.getByRole('listbox');
  await categoryList.waitFor({ timeout: 10_000 });
  const categoryBounds = await categoryList.boundingBox();
  assert(
    'category dropdown stays inside phone viewport',
    categoryBounds && categoryBounds.x >= 0 && categoryBounds.y >= 0 &&
      categoryBounds.x + categoryBounds.width <= viewport.width + 1 &&
      categoryBounds.y + categoryBounds.height <= viewport.height + 1,
    JSON.stringify(categoryBounds)
  );
  await page.getByRole('option').first().click();

  await page.getByRole('combobox').nth(1).click();
  const serviceList = page.getByRole('listbox');
  await serviceList.waitFor({ timeout: 10_000 });
  const serviceBounds = await serviceList.boundingBox();
  assert(
    'service dropdown stays inside phone viewport',
    serviceBounds && serviceBounds.x >= 0 && serviceBounds.y >= 0 &&
      serviceBounds.x + serviceBounds.width <= viewport.width + 1 &&
      serviceBounds.y + serviceBounds.height <= viewport.height + 1,
    JSON.stringify(serviceBounds)
  );

  const serviceOption = page.getByRole('option').filter({ hasText: longServiceName }).first();
  await serviceOption.waitFor({ timeout: 10_000 });
  const fullName = page.getByText(longServiceName, { exact: true }).first();
  const nameLayout = await fullName.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      text: element.textContent,
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    };
  });
  assert(
    'long service name is fully wrapped, not clipped',
    nameLayout.text === longServiceName && nameLayout.whiteSpace !== 'nowrap' &&
      nameLayout.textOverflow !== 'ellipsis' && nameLayout.scrollWidth <= nameLayout.clientWidth + 1 &&
      nameLayout.scrollHeight <= nameLayout.clientHeight + 1,
    JSON.stringify(nameLayout)
  );
  assert('New Order has no uncaught browser errors', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
} finally {
  await browser.close();
  await stopSharedStub();
}

if (failures.length) process.exit(1);
