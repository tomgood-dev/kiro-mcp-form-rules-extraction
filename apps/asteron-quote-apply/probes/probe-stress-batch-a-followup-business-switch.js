/** Follow-up: does the "fields appear missing" issue from Batch A check #4 persist with
 * generous settle time between each field change, or was it a timing race specifically
 * around switching Policy Type (Personal->Business)? */
const { chromium } = require('@playwright/test');
const path = require('path');
const { openNewQuote, setAge, setGender, activateCover, fillCalcMask, sumInsuredInput, clickApply, getVisibleErrors, waitForSettle } = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set env vars.');
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
    await setAge(quote, 17);
    await waitForSettle(quote, 2000);
    await setGender(quote, 'Female');
    await waitForSettle(quote, 2000);
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'B' });
    await waitForSettle(quote, 3000);
    console.log('  Occupation code value after settle: ' + await quote.evaluate(() => document.querySelector('select[id*="OccupationCode_Dropdown"]')?.value));
    await clickButtonByLabel(quote, 'Business', 'Policy type button');
    await waitForSettle(quote, 3000);
    console.log('  Occupation code value after Business switch: ' + await quote.evaluate(() => document.querySelector('select[id*="OccupationCode_Dropdown"]')?.value));
    await quote.getByRole('combobox', { name: 'Employment status' }).selectOption({ label: 'Self-Employed' });
    await waitForSettle(quote, 3000);
    console.log('  Employment status value after settle: ' + await quote.evaluate(() => document.querySelector('select[id*="EmploymentStatus_Dropdown"]')?.value));

    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '9999');
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
