/**
 * Probe: triage 5 uncertain failures from the 2026-08-26 full-suite run (PD-20, PD-11/12,
 * KID-05, VAL-11, VAL-08/09/10). Each check is diagnostic-only (dumps full state) rather
 * than a pass/fail assertion, so the actual current behavior can be read directly instead
 * of guessed at. One fresh quote per check.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  setAge,
  setGender,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  clickApply,
  getVisibleErrors,
  waitForSettle,
  isOnClientSummary,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'https://outsystems-dev.asteronlife.co.nz', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    console.log('[login] Logging in...');
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    // ── PD-20: Employment Status vs Disability Covers visibility ──
    console.log('\n=== PD-20: Disability Covers visibility before/after Employment Status ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote); // no employmentStatus set
    const pd20Before = await quote.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Mortgage & Living');
      return {
        textPresent: document.body.innerText.includes('Mortgage & Living'),
        buttonInDom: !!btn,
        buttonVisible: btn ? btn.getBoundingClientRect().width > 0 : null,
        buttonDisabled: btn ? btn.disabled : null,
      };
    });
    console.log('  Before Employment Status set: ' + JSON.stringify(pd20Before));
    await quote.getByRole('combobox', { name: 'Employment status' }).selectOption({ label: 'Employed' });
    await waitForSettle(quote);
    const pd20After = await quote.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Mortgage & Living');
      return {
        textPresent: document.body.innerText.includes('Mortgage & Living'),
        buttonInDom: !!btn,
        buttonVisible: btn ? btn.getBoundingClientRect().width > 0 : null,
        buttonDisabled: btn ? btn.disabled : null,
      };
    });
    console.log('  After Employment Status set:  ' + JSON.stringify(pd20After));

    // ── PD-11/12: age out-of-range error text/timing ──
    console.log('\n=== PD-11/12: age=5 out-of-range, full diagnostic ===');
    quote = await openNewQuote(page);
    await setAge(quote, 5);
    await setGender(quote, 'Male');
    let errors = await getVisibleErrors(quote);
    console.log('  Errors immediately after age=5 + gender blur: ' + JSON.stringify(errors));
    await waitForSettle(quote, 2000);
    errors = await getVisibleErrors(quote);
    console.log('  Errors after extra 2s settle: ' + JSON.stringify(errors));
    // Try clicking Apply to see if the error only appears server-side on submit.
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    errors = await getVisibleErrors(quote);
    console.log('  Errors after activating Life + Apply: ' + JSON.stringify(errors));
    const fullBodyText = await quote.evaluate(() => document.body.innerText.slice(0, 2000));
    console.log('  Full body text (first 2000 chars): ' + JSON.stringify(fullBodyText));

    // ── KID-05: kid row with no DOB ──
    console.log('\n=== KID-05: kid added with no DOB, full diagnostic ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await quote.locator('select').filter({ has: quote.locator('option', { hasText: /^0$/ }) }).filter({ has: quote.locator('option', { hasText: /^9$/ }) }).first().selectOption('1');
    await waitForSettle(quote);
    await clickApply(quote);
    errors = await getVisibleErrors(quote);
    console.log('  Errors after Apply with kid + no DOB: ' + JSON.stringify(errors));
    console.log('  Navigated to client summary: ' + (await isOnClientSummary(quote)));

    // ── VAL-11: Apply blocked while Employment Status unset ──
    console.log('\n=== VAL-11: Apply with Employment Status unset, full diagnostic ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    errors = await getVisibleErrors(quote);
    console.log('  Errors after Apply with Employment Status unset: ' + JSON.stringify(errors));
    console.log('  Navigated to client summary: ' + (await isOnClientSummary(quote)));
    const val11Body = await quote.evaluate(() => document.body.innerText.slice(0, 2000));
    console.log('  Full body text (first 2000 chars): ' + JSON.stringify(val11Body));

    // ── VAL-08/09/10: fully valid config ──
    console.log('\n=== VAL-08/09/10: fully valid config, full diagnostic ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote);
    await clickApply(quote);
    errors = await getVisibleErrors(quote);
    console.log('  Errors after Apply (should be none if truly valid): ' + JSON.stringify(errors));
    console.log('  Navigated to client summary: ' + (await isOnClientSummary(quote)));
    const val08Body = await quote.evaluate(() => document.body.innerText.slice(0, 2000));
    console.log('  Full body text (first 2000 chars): ' + JSON.stringify(val08Body));
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
