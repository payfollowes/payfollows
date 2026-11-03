/**
 * Playwright browser bootstrap for sandboxed E2E runs.
 *
 * The sandbox cannot reach Playwright's browser CDN, so we run the npm-hosted
 * @sparticuz/chromium build (Brotli-compressed inside its package) with the
 * NSS/NSPR shims from its AL2023 bundle. Everything is extracted under
 * /tmp/chromium-pf — never committed, re-created on demand.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const RUNTIME = '/tmp/chromium-pf';
const PKG = path.join(process.cwd(), 'node_modules', '@sparticuz', 'chromium', 'bin');
const LIB_DIR = `${RUNTIME}/al2023/lib`;
const FONTS_DIR = `${RUNTIME}/fonts`;
const SS_DIR = `${RUNTIME}/swiftshader`;

function brotliToFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, zlib.brotliDecompressSync(fs.readFileSync(src)));
}

function untar(tarFile, dest) {
  fs.mkdirSync(dest, { recursive: true });
  execFileSync('tar', ['-xf', tarFile, '-C', dest], { stdio: 'inherit' });
}

export function ensureBrowser() {
  const chrome = `${RUNTIME}/chrome`;
  if (!fs.existsSync(chrome)) {
    fs.mkdirSync(RUNTIME, { recursive: true });
    brotliToFile(`${PKG}/chromium.br`, chrome);
    fs.chmodSync(chrome, 0o755);

    brotliToFile(`${PKG}/al2023.tar.br`, `${RUNTIME}/al2023.tar`);
    untar(`${RUNTIME}/al2023.tar`, `${RUNTIME}/al2023`);

    brotliToFile(`${PKG}/swiftshader.tar.br`, `${RUNTIME}/ss.tar`);
    untar(`${RUNTIME}/ss.tar`, SS_DIR);

    brotliToFile(`${PKG}/fonts.tar.br`, `${RUNTIME}/fonts.tar`);
    untar(`${RUNTIME}/fonts.tar`, FONTS_DIR);
  }
  return {
    executablePath: chrome,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: `${LIB_DIR}:${SS_DIR}`,
      // fontconfig scans $XDG_DATA_HOME/fonts — the archive ships fonts/fonts/…
      XDG_DATA_HOME: FONTS_DIR,
      HOME: '/tmp',
    },
  };
}

export async function launchBrowser() {
  const setup = ensureBrowser();
  return chromium.launch({
    executablePath: setup.executablePath,
    headless: true,
    env: setup.env,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
    ],
  });
}

/** Collect console errors, page crashes and failed HTTP requests for a page. */
export function attachDiagnostics(page) {
  const diagnostics = { consoleErrors: [], pageErrors: [], failedRequests: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') diagnostics.consoleErrors.push(msg.text().slice(0, 500));
  });
  page.on('pageerror', (err) => diagnostics.pageErrors.push(String(err).slice(0, 500)));
  page.on('requestfailed', (req) =>
    diagnostics.failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText ?? 'failed'}`)
  );
  page.on('response', (res) => {
    if (res.status() >= 500) diagnostics.failedRequests.push(`${res.status()} ${res.url()}`);
  });
  return diagnostics;
}
