/**
 * Boundary/coverage recon for hardening select-default-commission-category-v1 (2026-09-03).
 * The spec samples only Flexi Rates N/A, 2.5, 7.5, 12.5, 15, 30%. The story enumerates the full
 * ladder (2.5% step to 30%). This probe dumps, at EACH Flexi Rate, the Select IC/RC option list +
 * whether the Nil-Comm-30% message shows — so a coverage-sweep test can assert exact values for the
 * un-sampled rates (5, 10, 17.5, 20, 22.5, 25, 27.5%) instead of guessing.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput,
  getTotalYearlyPremium, waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { openAdviserUse, closeAdviserUse, setFlexiRate, getIcRcSelectInfo } = require(path.join(__dirname, '..', 'helpers', 'adviser-use-helpers'));

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

    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    await waitForSettle(quote, 1000);
    console.log('primed, premium=' + await getTotalYearlyPremium(quote));

    const rates = ['N/A', '2.5%', '5.0%', '7.5%', '10.0%', '12.5%', '15.0%', '17.5%', '20.0%', '22.5%', '25.0%', '27.5%', '30.0%'];
    for (const r of rates) {
      try {
        await setFlexiRate(quote, r);
        await waitForSettle(quote, 800);
        await openAdviserUse(quote);
        const icRc = await getIcRcSelectInfo(quote);
        const nilMsg = await quote.evaluate(() => document.body.innerText.includes('Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected'));
        const selected = icRc ? icRc.options[icRc.selectedIndex] : null;
        console.log(`FlexiRate ${r}: icRc=${icRc ? JSON.stringify(icRc.options) : 'null(no row)'} | selected=${JSON.stringify(selected)} | nilCommMsg=${nilMsg}`);
        await closeAdviserUse(quote);
      } catch (e) {
        console.log(`FlexiRate ${r}: ERROR ${e.message}`);
      }
    }
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
