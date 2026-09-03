/**
 * Focused boundary recon for commission spec (2026-09-03). The reopen-in-one-quote sweep proved
 * fragile (Adviser Use panel state carries over). This uses a FRESH quote per rate (only 3 rates,
 * within the safe session-load budget) to capture the Nil-Commission boundary + one un-sampled rate:
 *   - 27.5% (just below the 30% Nil-Comm boundary): should NOT show the Nil-Comm message; IC/RC row present.
 *   - 30.0% (at the boundary): SHOULD show the Nil-Comm message; no IC/RC row (per AC11).
 *   - 20.0% (un-sampled; story line 39 says multi-option): capture its exact IC/RC list.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput, waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { openAdviserUse, setFlexiRate, getIcRcSelectInfo } = require(path.join(__dirname, '..', 'helpers', 'adviser-use-helpers'));

async function primeQuote(page) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '500000');
  await waitForSettle(quote, 1000);
  return quote;
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL, password = process.env.ASTERON_LOGIN_PASSWORD;
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: 'https://outsystems-dev.asteronlife.co.nz' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  try {
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    for (const r of ['27.5%', '30.0%', '20.0%']) {
      const quote = await primeQuote(page);
      await setFlexiRate(quote, r);
      await waitForSettle(quote, 1000);
      await openAdviserUse(quote);
      const icRc = await getIcRcSelectInfo(quote);
      const nilMsg = await quote.evaluate(() => document.body.innerText.includes('Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected'));
      console.log(`FlexiRate ${r}: icRc=${icRc ? JSON.stringify(icRc.options) : 'null(no IC/RC row)'} | selected=${icRc ? JSON.stringify(icRc.options[icRc.selectedIndex]) : 'n/a'} | nilCommMsg=${nilMsg}`);
    }
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
