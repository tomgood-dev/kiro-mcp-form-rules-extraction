/** Probe: what error (if any) blocks Apply when a Disability cover is priced without
 * Employment Status set? Needed to correctly rewrite PD-20 and fix disability-covers/page.md,
 * which both currently claim (unconfirmed, now disproven for visibility) that Disability
 * Covers are hidden until Employment Status is set. */
const { chromium } = require('@playwright/test');
const path = require('path');
const { openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput, clickApply, getVisibleErrors } = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'https://outsystems-dev.asteronlife.co.nz', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote); // Employment Status left unset
    await activateCover(quote, 'Mortgage & Living');
    await fillCalcMask(sumInsuredInput(quote, 0), '1000');
    await clickApply(quote);
    const errors = await getVisibleErrors(quote);
    console.log('Errors after Apply (Disability cover, Employment Status unset): ' + JSON.stringify(errors, null, 2));
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
