/**
 * Boundary/negative recon for hardening multi-lives-and-policies-v1 (2026-09-03).
 * Confirms behaviours before encoding boundary/negative tests (no guessing):
 *  1. AC02 ANB boundary ON AN ADDED LIFE (Life 2): does the ANB field on Life 2 enforce 11-75
 *     the same as Life 1 (PD-11)? Check 10/11/75/76.
 *  2. AC09 min-premium threshold: on age 35 / Male / OCC AA / Life cover, find an SI that prices
 *     JUST under $240/yr (min-premium error fires) vs one JUST at/over (no error). Report premiums.
 *  3. AC17 per-cover breakdown: with 2 covers on one policy, dump the right-panel lines to find the
 *     per-cover premium rows + the per-life / all-lives totals for an arithmetic-reconciliation test.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote, setAge, setGender, setMinimumPersonalDetails, activateCover,
  fillCalcMask, sumInsuredInput, getTotalYearlyPremium, getVisibleErrors, clickApply, waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

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

    // ===== 1. AC02 ANB boundary on Life 2 =====
    console.log('\n=== AC02: ANB boundary on an added life (Life 2) ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 800);
    await clickButtonByLabel(quote, 'Add life', 'Add life');
    await waitForSettle(quote, 1500);
    // Now on Life 2 (active). Its ANB field is the visible one.
    for (const age of [10, 11, 75, 76]) {
      await setAge(quote, age);
      await setGender(quote, 'Male');
      await waitForSettle(quote, 800);
      const errs = await getVisibleErrors(quote);
      const rangeErr = errs.some((e) => e.includes('between 11 and 75'));
      console.log(`  Life2 ANB=${age}: rangeError=${rangeErr} | errs=${JSON.stringify(errs).slice(0,160)}`);
    }

    // ===== 2. AC09 min-premium threshold on age35/M/OCC AA + Life =====
    console.log('\n=== AC09: min-premium threshold near $240 (age35/M/OCC AA/Life) ===');
    for (const si of ['1000', '5000', '10000', '20000', '30000', '50000']) {
      quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote);
      await activateCover(quote, 'Life');
      await fillCalcMask(sumInsuredInput(quote, 0), si);
      await waitForSettle(quote, 1200);
      const premium = await getTotalYearlyPremium(quote);
      await clickApply(quote);
      const errs = await getVisibleErrors(quote);
      const minErr = errs.some((e) => e.includes('minimum premium is $240'));
      console.log(`  SI=$${si}: yearlyPremium=${premium} minPremiumError=${minErr}`);
    }

    // ===== 3. AC17 per-cover breakdown DOM =====
    console.log('\n=== AC17: per-cover premium breakdown (2 covers on Personal 1) ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 800);
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '150000');
    await waitForSettle(quote, 1500);
    const panelLines = await quote.evaluate(() => {
      // grab the right-panel text lines that look like a cover name followed by a $ amount
      const lines = document.body.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
      const out = [];
      for (let i = 0; i < lines.length; i++) {
        if (/^(Life|TPD|Trauma|Cancer|Acd|Needlestick|Specific|Total|Premium|Personal|Business|Monthly|Yearly)/i.test(lines[i])) {
          out.push(lines[i] + (/\$/.test(lines[i+1]||'') ? '  =>  ' + lines[i+1] : ''));
        }
      }
      return [...new Set(out)].slice(0, 40);
    });
    console.log('  panel lines: ' + JSON.stringify(panelLines, null, 1));
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
