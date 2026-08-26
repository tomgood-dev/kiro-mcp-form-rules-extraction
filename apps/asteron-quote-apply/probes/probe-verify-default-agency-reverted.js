/** Probe: confirm the shared "Default for Agency" commission setting is currently Upfront
 * (verifying select-default-commission-category-part-3.spec.js's cleanup step actually
 * reverted it after that test ran, rather than assuming from absence of a warning log). */
const { chromium } = require('@playwright/test');
const path = require('path');
const { openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput } = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { openAdviserUse, getDefaultAgencySelectInfo } = require(path.join(__dirname, '..', 'helpers', 'adviser-use-helpers'));

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

    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    await openAdviserUse(quote);
    const info = await getDefaultAgencySelectInfo(quote);
    const current = info ? info.options[info.selectedIndex] : null;
    console.log('Current Default for Agency value: ' + JSON.stringify(current));
    console.log(current === 'Upfront' ? 'OK: reverted correctly' : 'PROBLEM: NOT reverted to Upfront');
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
