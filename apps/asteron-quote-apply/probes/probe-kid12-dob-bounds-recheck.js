/**
 * One-shot disambiguation probe for KID-12: the fixed test in
 * policy-structure-and-kids-cover-rules-v1.spec.js reported the kid DOB field's min year
 * as 2005 (a 21-year window) instead of the documented 2026-08-26 correction (a 64-year
 * window, ~1962). Need to determine: has the app's actual behavior reverted, or is the
 * test's opaque-id-based selector (id.indexOf('b23-b14')) now stale/matching the wrong
 * element? This dumps EVERY date input on the page with its id/min/max, plus which one is
 * confirmed the ADULT's own DOB (via the known-stable 'Input_BirthDate' fingerprint) so the
 * kid field can be disambiguated by elimination, not by a possibly-stale opaque id.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const { execSync } = require('child_process');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

function killStrayEdge() {
  try { execSync('taskkill /F /IM msedge.exe /T', { stdio: 'ignore' }); } catch (_) {}
}

async function loginWithRetry(email, password) {
  const BACKOFF_MS = [0, 30_000, 60_000];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const wait = BACKOFF_MS[attempt - 1];
    if (wait > 0) { console.log(`[login] waiting ${wait / 1000}s before attempt ${attempt}...`); await new Promise((r) => setTimeout(r, wait)); }
    killStrayEdge();
    await new Promise((r) => setTimeout(r, 2000));
    const browser = await chromium.launch({ channel: 'msedge' });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: 'https://outsystems-dev.asteronlife.co.nz' });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    try {
      await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const form = page.locator('form.login-form');
      await form.locator('input[type="text"]').first().fill(email);
      await form.locator('input[type="password"]').first().fill(password);
      await form.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 45000 });
      console.log(`[login] OK on attempt ${attempt}`);
      return { browser, page };
    } catch (e) {
      console.log(`[login] attempt ${attempt} failed: ${e.message}`);
      await browser.close().catch(() => {});
    }
  }
  throw new Error('[login] failed after 3 attempts.');
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const { browser, page } = await loginWithRetry(email, password);
  try {
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);

    const numberOfKids = quote.locator('select')
      .filter({ has: quote.locator('option', { hasText: /^0$/ }) })
      .filter({ has: quote.locator('option', { hasText: /^9$/ }) })
      .first();
    await numberOfKids.selectOption('1');
    await waitForSettle(quote, 1500);

    const allDateInputs = await quote.evaluate(() => {
      return [...document.querySelectorAll('input[type="date"]')].map((i) => ({
        id: i.id,
        min: i.min,
        max: i.max,
        isKnownAdultDob: i.id === 'b15-Input_BirthDate',
      }));
    });
    console.log('All date inputs on page:', JSON.stringify(allDateInputs, null, 2));
    console.log('\n[probe complete]');
  } catch (err) {
    console.error('[probe error]', err);
  } finally {
    await browser.close();
  }
})();
