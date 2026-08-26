/** Follow-up: does "This Occupation is not eligible" fire from Trauma alone at
 * Occupation=U, or only when Major Trauma is also active? Is it specific to U, or does
 * it fire at other codes too? Directly relevant to the earlier occupation-gating
 * investigation (LSC-02/03 confirmed universally broken for Needlestick/Cancer/Acc
 * Death/Specific Injury) - if Trauma has its own, still-functioning gate, that's an
 * important asymmetry. */
const { chromium } = require('@playwright/test');
const path = require('path');
const { openNewQuote, setAge, setGender, activateCover, fillCalcMask, sumInsuredInput, clickApply, getVisibleErrors, waitForSettle, removeAllCoverCards } = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

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

    // Trauma ALONE at Occupation=U
    console.log('\n=== Trauma alone, Occ=U ===');
    let quote = await openNewQuote(page);
    await setAge(quote, 50);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'U' });
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '20000');
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));

    // Trauma ALONE at Occupation=AA (control - known-good code)
    console.log('\n=== Trauma alone, Occ=AA (control) ===');
    quote = await openNewQuote(page);
    await setAge(quote, 50);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AA' });
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '20000');
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));

    // Major Trauma ALONE (with Trauma parent) at Occupation=U, to isolate which cover triggers it
    console.log('\n=== Trauma + Major Trauma, Occ=U (isolate which cover triggers "not eligible") ===');
    quote = await openNewQuote(page);
    await setAge(quote, 50);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'U' });
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '20000');
    await clickApply(quote);
    console.log('  Errors after Trauma only + Apply: ' + JSON.stringify(await getVisibleErrors(quote)));
    await activateCover(quote, 'Major Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '50000'); // within the 300% cap this time
    await clickApply(quote);
    console.log('  Errors after adding Major Trauma (within cap) + Apply: ' + JSON.stringify(await getVisibleErrors(quote)));
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
