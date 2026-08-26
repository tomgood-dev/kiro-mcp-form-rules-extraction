/**
 * Stress-test Batch C: unexplored combinations building directly on today's findings.
 *
 * 1. Needlestick's max-ANB-65 cap (PD-31/LSC-31b) - does it still fire even though
 *    Needlestick's OCCUPATION gate (LSC-02) is confirmed broken? Tests whether the
 *    breakage is narrow (occupation-check only) or broader (all Needlestick validation).
 * 2. Trauma's newly-found occupation gate (LSC-17b, Occ=U) under a BUSINESS policy
 *    (Business supports Trauma per POL-14) - does the gate still work there too?
 * 3. Multi-life + Kids Cover: does Life 2 get its own independent Kids Cover, separate
 *    from Life 1's?
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote,
  setAge,
  setGender,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  clickApply,
  getVisibleErrors,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

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

    // === 1. Needlestick max-ANB-65 cap, Age=70 (over cap), Occ=AA ===
    console.log('\n=== 1. Needlestick max ANB 65: Age=70, Occ=AA (companion: Life) ===');
    let quote = await openNewQuote(page);
    await setAge(quote, 70);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AA' });
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'Needlestick');
    await waitForSettle(quote, 1000);
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));

    // === 2. Trauma occupation gate (LSC-17b) under Business policy, Occ=U ===
    console.log('\n=== 2. Trauma occupation gate under Business policy: Occ=U ===');
    quote = await openNewQuote(page);
    await setAge(quote, 50);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'U' });
    await waitForSettle(quote, 1000);
    await clickButtonByLabel(quote, 'Business', 'Policy type button');
    await waitForSettle(quote, 1000);
    const traumaPresentUnderBusiness = await quote.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.innerText.trim().split('\n')[0] === 'Trauma'));
    console.log('  Trauma button present under Business: ' + traumaPresentUnderBusiness);
    if (traumaPresentUnderBusiness) {
      await activateCover(quote, 'Trauma');
      await fillCalcMask(sumInsuredInput(quote, 0), '20000');
      await clickApply(quote);
      console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));
    }

    // === 3. Multi-life + Kids Cover independence ===
    console.log('\n=== 3. Multi-life + Kids Cover independence ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35 });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    const numKidsLife1 = quote.locator('select').filter({ has: quote.locator('option', { hasText: /^0$/ }) }).filter({ has: quote.locator('option', { hasText: /^9$/ }) }).first();
    await numKidsLife1.selectOption('2');
    await waitForSettle(quote, 1500);
    console.log('  Life 1 kid count set to 2, current value: ' + await numKidsLife1.inputValue());
    await clickButtonByLabel(quote, 'Add life', 'Add life button');
    await waitForSettle(quote, 1500);
    const life2Reachable = await quote.evaluate(() => document.body.innerText.includes('Life 2'));
    console.log('  Life 2 reachable: ' + life2Reachable);
    if (life2Reachable) {
      await setMinimumPersonalDetails(quote, { age: 40 });
      await activateCover(quote, 'Life');
      await fillCalcMask(sumInsuredInput(quote, 0), '150000');
      const numKidsLife2 = quote.locator('select').filter({ has: quote.locator('option', { hasText: /^0$/ }) }).filter({ has: quote.locator('option', { hasText: /^9$/ }) }).first();
      const life2KidValueBeforeSet = await numKidsLife2.inputValue();
      console.log('  Life 2 kid count BEFORE setting (should be 0 if independent, 2 if leaked from Life 1): ' + life2KidValueBeforeSet);
    }
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
