/** Test hypothesis: VAL-08/09/10's "fully valid" config never sets Annual Income (only
 * Employment Status). Does adding Income make Apply actually succeed? */
const { chromium } = require('@playwright/test');
const path = require('path');
const { openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput, clickApply, getVisibleErrors, isOnClientSummary, waitForSettle } = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

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

    console.log('\n=== Attempt A: Employment Status + Income both set ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed', income: 150000 });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));
    console.log('  isOnClientSummary: ' + (await isOnClientSummary(quote)));

    console.log('\n=== Attempt B: Employment Status unset, Income unset (baseline minimal) ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));
    console.log('  isOnClientSummary: ' + (await isOnClientSummary(quote)));
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
