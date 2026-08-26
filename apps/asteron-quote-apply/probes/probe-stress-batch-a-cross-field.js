/**
 * Stress-test Batch A: cross-field combinations at extreme personas, and rules that are
 * documented but never actually tested anywhere in the suite. One fresh quote per check
 * (except the multi-life check, which needs 2 lives on one quote by definition).
 *
 * 1. KID-12: re-derive the exact current DOB min/max bounds for a kid (today=2026-08-26).
 * 2. KID-13: confirm Kids Cover is genuinely unavailable under a Business policy.
 * 3. Multi-life independence: Life 1 valid (age 35), Life 2 invalid (age 10) - does Life 2
 *    enforce its OWN age/TPD rules independently, or does something leak from Life 1?
 * 4. Cross-field: Age=17 exact (TPD boundary) + Female + Occupation=B + Business policy +
 *    Farmers Disability (age boundary x occupation x employment-status, never combined).
 * 5. Cross-field: Occupation=IC + Age=75 (max boundary) + TPD (referral warning + own cap
 *    + age boundary all at once).
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

    // === 1. KID-12: DOB min/max bounds ===
    console.log('\n=== 1. KID-12: kid DOB min/max bounds ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    const numKids = quote.locator('select').filter({ has: quote.locator('option', { hasText: /^0$/ }) }).filter({ has: quote.locator('option', { hasText: /^9$/ }) }).first();
    await numKids.selectOption('1');
    await waitForSettle(quote);
    const dobBounds = await quote.evaluate(() => {
      const dob = document.querySelector('input[type="date"]');
      return dob ? { min: dob.min, max: dob.max, id: dob.id } : null;
    });
    console.log('  DOB input min/max: ' + JSON.stringify(dobBounds));

    // === 2. KID-13: Kids Cover unavailable under Business policy ===
    console.log('\n=== 2. KID-13: Kids Cover under Business policy ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await clickButtonByLabel(quote, 'Business', 'Policy type button');
    await waitForSettle(quote);
    const kidsUnderBusiness = await quote.evaluate(() => {
      const bodyHasKidsHeading = document.body.innerText.includes('Kids Cover');
      const numKidsSelect = [...document.querySelectorAll('select')].find((s) => {
        const opts = [...s.options].map((o) => o.text);
        return opts.length === 10 && opts[0] === '0' && opts[9] === '9';
      });
      return { bodyHasKidsHeading, numKidsSelectPresent: !!numKidsSelect };
    });
    console.log('  Kids Cover under Business policy: ' + JSON.stringify(kidsUnderBusiness));

    // === 3. Multi-life independence: Life 1 valid, Life 2 invalid age ===
    console.log('\n=== 3. Multi-life independence (Life 1 age 35 valid, Life 2 age 10 invalid) ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35 });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    await clickButtonByLabel(quote, 'Add life', 'Add life button');
    await waitForSettle(quote, 1500);
    const life2Reachable = await quote.evaluate(() => document.body.innerText.includes('Life 2'));
    console.log('  Life 2 tab reachable after valid Life 1: ' + life2Reachable);
    if (life2Reachable) {
      await setAge(quote, 10);
      await setGender(quote, 'Male');
      await activateCover(quote, 'TPD');
      await fillCalcMask(sumInsuredInput(quote, 0), '100000');
      await clickApply(quote);
      const life2Errors = await getVisibleErrors(quote);
      console.log('  Life 2 (age 10) + TPD errors after Apply: ' + JSON.stringify(life2Errors));
    }

    // === 4. Age=17 exact + Female + Occupation=B + Business + Farmers Disability ===
    console.log('\n=== 4. Age=17 (TPD boundary) + Female + Occ=B + Business + Farmers Disability ===');
    quote = await openNewQuote(page);
    await setAge(quote, 17);
    await setGender(quote, 'Female');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'B' });
    await waitForSettle(quote, 1000);
    await clickButtonByLabel(quote, 'Business', 'Policy type button');
    await waitForSettle(quote, 1000);
    await quote.getByRole('combobox', { name: 'Employment status' }).selectOption({ label: 'Self-Employed' });
    await waitForSettle(quote, 1000);
    let farmersFound = await quote.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.innerText.trim().split('\n')[0] === 'Farmers Disability'));
    console.log('  Farmers Disability button present: ' + farmersFound);
    if (farmersFound) {
      await activateCover(quote, 'Farmers Disability');
      await fillCalcMask(sumInsuredInput(quote, 0), '9999');
      await clickApply(quote);
      console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));
    }

    // === 5. Occupation=IC + Age=75 (max) + TPD ===
    console.log('\n=== 5. Occupation=IC + Age=75 (max boundary) + TPD ===');
    quote = await openNewQuote(page);
    await setAge(quote, 75);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'IC' });
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000001'); // over the $5M cap
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
