// Logs in once and saves the authenticated session so every test can skip the login flow.
//
// The Asteron dev environment allows ONE active session per account. A login attempt while a
// prior session is still held server-side silently bounces back to the login page. This used to
// hang or fail hard. This setup now:
//   1) closes stray Edge sessions first (release any held login),
//   2) retries login with backoff (session conflict is a known, transient condition),
//   3) FAILS FAST with a clear message if all attempts fail — never hangs indefinitely.
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

// Login URL derives from BASE_URL so the environment (dev / qa / etc.) is switchable via one env var.
// Falls back to the dev host only when BASE_URL is unset, preserving prior behaviour.
const BASE_URL = process.env.BASE_URL || 'https://outsystems-dev.asteronlife.co.nz';
const LOGIN_URL = BASE_URL.replace(/\/+$/, '') + '/CentralPortalsLogin/NewLoginRLANZ';
const MAX_ATTEMPTS = 3;
const PER_ATTEMPT_TIMEOUT_MS = 45_000;
const BACKOFF_MS = [0, 30_000, 60_000]; // wait before attempt 1/2/3 (session needs ~60s to release)

function killStrayEdge() {
  // WARNING: this force-kills ALL msedge.exe on the machine. That is safe for a SINGLE serial run
  // (clears a stray held session before login) but FATAL under parallelism — it would kill sibling
  // parallel streams' browsers, producing "Target page/context/browser has been closed" at startup.
  // Parallel runners MUST set KILL_STRAY_EDGE=false so concurrent streams don't murder each other.
  if (String(process.env.KILL_STRAY_EDGE).toLowerCase() === 'false') return;
  try {
    require('child_process').execSync('taskkill /F /IM msedge.exe /T', { stdio: 'ignore' });
  } catch (_) { /* none running — fine */ }
}

async function attemptLogin(email, password, attempt) {
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(PER_ATTEMPT_TIMEOUT_MS);
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: PER_ATTEMPT_TIMEOUT_MS });
    await page.waitForTimeout(3000);

    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();

    // Wait for EITHER success (dashboard) OR a definitive bounce back to login — with a hard cap.
    const deadline = Date.now() + PER_ATTEMPT_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const url = page.url();
      if (url.includes('AdviserCentral_Uplift')) {
        // Success — save state.
        const authDir = path.join(__dirname, '.auth');
        if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
        const filename = process.env.AUTH_STATE_FILENAME || 'state.json';
        await page.context().storageState({ path: path.join(authDir, filename) });
        console.log(`[global-setup] login OK on attempt ${attempt}`);
        return true;
      }
      await page.waitForTimeout(1500);
    }
    // Timed out this attempt — treat as a (likely) session conflict, let caller retry.
    console.log(`[global-setup] attempt ${attempt} did not reach dashboard within ${PER_ATTEMPT_TIMEOUT_MS / 1000}s (likely session conflict).`);
    return false;
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = async function globalSetup() {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD (see .env.example) before running tests.');
  }

  // Staggered launch: parallel streams set a per-stream STARTUP_STAGGER_MS (e.g. 0 / 8000 / 16000)
  // so their chromium.launch calls don't all fire at the same instant, reducing launch contention.
  const stagger = Number(process.env.STARTUP_STAGGER_MS) || 0;
  if (stagger > 0) {
    console.log(`[global-setup] staggered start: waiting ${stagger / 1000}s before launch...`);
    await new Promise((r) => setTimeout(r, stagger));
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const wait = BACKOFF_MS[attempt - 1] || 60_000;
    if (wait > 0) {
      console.log(`[global-setup] waiting ${wait / 1000}s for any held session to release before attempt ${attempt}...`);
      await new Promise((r) => setTimeout(r, wait));
    }
    killStrayEdge();
    await new Promise((r) => setTimeout(r, 2000));
    const ok = await attemptLogin(email, password, attempt).catch((e) => {
      console.log(`[global-setup] attempt ${attempt} errored: ${e.message}`);
      return false;
    });
    if (ok) return;
  }

  // Fast, explicit failure — never leave the run hanging.
  throw new Error(
    `[global-setup] Login failed after ${MAX_ATTEMPTS} attempts — the account likely has an active ` +
    `session that hasn't released. Wait a couple of minutes, ensure no other run/browser is logged ` +
    `in as this account, then retry.`
  );
};
